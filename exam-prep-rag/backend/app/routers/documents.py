"""Document management router — upload, list, delete PDFs (user-scoped)."""

import os
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from app.config import settings
from app.services import pdf_service, vector_service
from app.services.auth_service import get_current_user
from app.database import get_db
from app.models.db_models import User, Document
from app.models.schemas import DocumentResponse, DocumentListResponse, UploadResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload a PDF file, extract text, chunk it, and store embeddings."""

    # Validate file type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    # Generate unique ID
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{file.filename}"
    file_path = os.path.join(settings.upload_dir, safe_filename)

    os.makedirs(settings.upload_dir, exist_ok=True)

    # Save file to disk
    try:
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")

    # Extract text and chunk
    try:
        pages = pdf_service.extract_text_from_pdf(file_path)
        if not pages:
            os.remove(file_path)
            raise HTTPException(
                status_code=400,
                detail="Could not extract any text from this PDF. It might be image-based or empty."
            )

        # Pass user_id in metadata so vectors are user-scoped
        chunks = pdf_service.chunk_pages(pages, doc_id, file.filename, user_id=current_user.id)
        page_count = pdf_service.get_page_count(file_path)

        # Store in vector database
        chunk_count = vector_service.add_documents(chunks)

    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")

    # Save to database
    doc_record = Document(
        id=doc_id,
        user_id=current_user.id,
        name=file.filename,
        file_path=file_path,
        page_count=page_count,
        chunk_count=chunk_count,
    )
    db.add(doc_record)
    db.commit()

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

    # Remove from database
    db.delete(doc)
    db.commit()

    return {"message": f"Document '{doc.name}' deleted successfully."}
