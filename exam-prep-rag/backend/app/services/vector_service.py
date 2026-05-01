"""ChromaDB vector store operations."""

import chromadb
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_core.documents import Document
from app.config import settings


# Initialize embedding model (singleton)
_embeddings = None


def get_embeddings():
    """Get or create the embedding model instance."""
    global _embeddings
    if _embeddings is None:
        _embeddings = GoogleGenerativeAIEmbeddings(
            model=f"models/{settings.embedding_model}",
            google_api_key=settings.google_api_key,
        )
    return _embeddings


# Initialize ChromaDB (singleton)
_vector_store = None


def get_vector_store() -> Chroma:
    """Get or create the ChromaDB vector store instance."""
    global _vector_store
    if _vector_store is None:
        _vector_store = Chroma(
            collection_name="exam_prep_docs",
            embedding_function=get_embeddings(),
            persist_directory=settings.chroma_persist_dir,
        )
    return _vector_store


def add_documents(chunks: list[Document]) -> int:
    """
    Add document chunks to the vector store.

    Args:
        chunks: List of LangChain Document objects with metadata.

    Returns:
        Number of chunks added.
    """
    store = get_vector_store()
    store.add_documents(chunks)
    return len(chunks)


def search(
    query: str,
    doc_ids: list[str] | None = None,
    user_id: str | None = None,
    k: int = 5
) -> list[Document]:
    """
    Search the vector store for relevant chunks.

    Args:
        query: The search query.
        doc_ids: Optional list of document IDs to filter by.
        user_id: Optional user ID to scope search to a specific user's documents.
        k: Number of results to return.

    Returns:
        List of relevant Document objects.
    """
    store = get_vector_store()

    search_kwargs = {"k": k}

    if doc_ids:
        # Filter by specific documents
        if user_id:
            search_kwargs["filter"] = {
                "$and": [
                    {"doc_id": {"$in": doc_ids}},
                    {"user_id": user_id},
                ]
            }
        else:
            search_kwargs["filter"] = {"doc_id": {"$in": doc_ids}}
    elif user_id:
        # No specific docs — filter by user only
        search_kwargs["filter"] = {"user_id": user_id}

    results = store.similarity_search(query, **search_kwargs)
    return results


def delete_document(doc_id: str) -> bool:
    """
    Delete all chunks for a specific document from the vector store.

    Args:
        doc_id: The document ID to delete.

    Returns:
        True if successful.
    """
    store = get_vector_store()

    # Get all chunk IDs for this document
    results = store.get(where={"doc_id": doc_id})

    if results and results["ids"]:
        store.delete(ids=results["ids"])

    return True


def get_document_ids() -> list[str]:
    """Get all unique document IDs in the vector store."""
    store = get_vector_store()
    results = store.get()

    if not results or not results["metadatas"]:
        return []

    doc_ids = set()
    for metadata in results["metadatas"]:
        if "doc_id" in metadata:
            doc_ids.add(metadata["doc_id"])

    return list(doc_ids)


def get_chunk_count(doc_id: str) -> int:
    """Get the number of chunks for a specific document."""
    store = get_vector_store()
    results = store.get(where={"doc_id": doc_id})
    return len(results["ids"]) if results and results["ids"] else 0


def is_empty() -> bool:
    """Check if the vector store has any documents."""
    store = get_vector_store()
    results = store.get(limit=1)
    return not results or not results["ids"]


def rebuild_from_postgres():
    """
    Rebuild ChromaDB from chunks stored in PostgreSQL.

    This runs on startup to handle Render's ephemeral filesystem —
    if ChromaDB is empty but PostgreSQL has chunks, re-index everything.
    """
    from app.database import SessionLocal
    from app.models.db_models import DocumentChunk

    if not is_empty():
        print("[REINDEX] ChromaDB already has data — skipping rebuild.")
        return

    db = SessionLocal()
    try:
        all_chunks = db.query(DocumentChunk).all()

        if not all_chunks:
            print("[REINDEX] No chunks in PostgreSQL — nothing to rebuild.")
            return

        print(f"[REINDEX] ChromaDB is empty! Rebuilding from {len(all_chunks)} chunks in PostgreSQL...")

        # Convert DB rows to LangChain Documents and batch-add
        batch_size = 50
        lc_docs = []
        for chunk in all_chunks:
            lc_doc = Document(
                page_content=chunk.content,
                metadata={
                    "doc_id": chunk.document_id,
                    "doc_name": chunk.doc_name,
                    "page_num": chunk.page_num,
                    "user_id": chunk.user_id,
                },
            )
            lc_docs.append(lc_doc)

        # Add in batches to avoid overwhelming the embedding API
        for i in range(0, len(lc_docs), batch_size):
            batch = lc_docs[i : i + batch_size]
            add_documents(batch)
            print(f"[REINDEX] Indexed batch {i // batch_size + 1} ({len(batch)} chunks)")

        print(f"[REINDEX] ✅ Successfully rebuilt ChromaDB with {len(lc_docs)} chunks!")

    except Exception as e:
        print(f"[REINDEX] ❌ Failed to rebuild ChromaDB: {e}")
    finally:
        db.close()

