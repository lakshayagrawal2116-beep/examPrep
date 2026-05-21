"""Document management router — upload, list, delete documents (user-scoped)."""

import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.config import settings, MAX_UPLOAD_BYTES
from app.services import document_service, vector_service
from app.services.auth_service import get_current_user
from app.database import get_db
from app.models.db_models import User, Document, DocumentChunk
from app.models.schemas import DocumentResponse, DocumentListResponse, UploadResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a document file, extract text, chunk it, and store embeddings."""

    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required.")

    # Validate file type
    if not document_service.is_supported(file.filename):
        supported = ", ".join(sorted(document_service.SUPPORTED_EXTENSIONS))
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Supported: {supported}")

    # Generate unique ID
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{file.filename}"
    file_path = os.path.join(settings.upload_dir, safe_filename)

    os.makedirs(settings.upload_dir, exist_ok=True)

    # Save file to disk
    try:
        content = await file.read()
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="File is empty.")
        if len(content) > MAX_UPLOAD_BYTES:
            size_mb = len(content) / (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail=f"File too large ({size_mb:.1f}MB). Maximum size is 50MB.",
            )
        with open(file_path, "wb") as f:
            f.write(content)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Extract text and chunk
    chunks = []
    page_count = 0
    chunk_count = 0
    try:
        pages = document_service.extract_text(file_path, file.filename)
        if not pages:
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from this file. It might be image-based or empty."
            )

        # Pass user_id in metadata so vectors are user-scoped
        chunks = document_service.chunk_pages(pages, doc_id, file.filename, user_id=current_user.id)
        page_count = len(pages)

        # Store in vector database
        chunk_count = vector_service.add_documents(chunks)

    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

    # Save document record and chunks — roll back vectors if DB write fails
    try:
        doc_record = Document(
            id=doc_id,
            user_id=current_user.id,
            name=file.filename,
            file_path=file_path,
            page_count=page_count,
            chunk_count=chunk_count,
        )
        db.add(doc_record)

        for chunk in chunks:
            db_chunk = DocumentChunk(
                document_id=doc_id,
                user_id=current_user.id,
                doc_name=file.filename,
                page_num=chunk.metadata.get("page_num", 0),
                content=chunk.page_content,
            )
            db.add(db_chunk)

        db.commit()
    except Exception as e:
        db.rollback()
        vector_service.delete_document(doc_id)
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to save document: {str(e)}")

    return UploadResponse(
        message=f"Successfully processed '{file.filename}' -- {chunk_count} chunks created from {page_count} pages.",
        document=DocumentResponse(
            id=doc_id,
            name=file.filename,
            page_count=page_count,
            chunk_count=chunk_count,
            uploaded_at=datetime.now(timezone.utc).isoformat(),
        )
    )


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all documents for the current user."""
    docs = db.query(Document).filter(Document.user_id == current_user.id).all()

    documents = [
        DocumentResponse(
            id=doc.id,
            name=doc.name,
            page_count=doc.page_count,
            chunk_count=doc.chunk_count,
            uploaded_at=doc.created_at.isoformat() if doc.created_at else None,
        )
        for doc in docs
    ]

    return DocumentListResponse(documents=documents)


@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a document and its vectors (user-scoped)."""
    doc = db.query(Document).filter(
        Document.id == doc_id,
        Document.user_id == current_user.id,
    ).first()

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    # Delete file from disk
    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    # Delete vectors from ChromaDB
    vector_service.delete_document(doc_id)

    # Remove chunks and document from database
    db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).delete()
    db.delete(doc)
    db.commit()

    return {"message": f"Document '{doc.name}' deleted successfully."}
