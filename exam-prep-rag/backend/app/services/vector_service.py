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
    k: int = 5
) -> list[Document]:
    """
    Search the vector store for relevant chunks.

    Args:
        query: The search query.
        doc_ids: Optional list of document IDs to filter by.
        k: Number of results to return.

    Returns:
        List of relevant Document objects.
    """
    store = get_vector_store()

    search_kwargs = {"k": k}

    if doc_ids:
        search_kwargs["filter"] = {"doc_id": {"$in": doc_ids}}

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
