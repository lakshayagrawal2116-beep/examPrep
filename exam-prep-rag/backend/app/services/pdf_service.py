"""PDF extraction and text chunking service."""

import fitz  # PyMuPDF
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from app.config import settings


def extract_text_from_pdf(pdf_path: str) -> list[dict]:
    """
    Extract text from a PDF file, page by page.

    Args:
        pdf_path: Path to the PDF file.

    Returns:
        List of dicts with 'page_num' and 'text' keys.
    """
    pages = []
    doc = fitz.open(pdf_path)

    for page_num in range(len(doc)):
        page = doc[page_num]
        text = page.get_text("text")

        if text.strip():  # Only include pages with actual text
            pages.append({
                "page_num": page_num + 1,  # 1-indexed
                "text": text.strip()
            })

    doc.close()
    return pages


def chunk_pages(
    pages: list[dict],
    doc_id: str,
    doc_name: str,
    user_id: str = None,
) -> list[Document]:
    """
    Split extracted pages into smaller chunks for embedding.

    Each chunk preserves metadata about its source document and page number,
    which is critical for source citations.

    Args:
        pages: List of page dicts from extract_text_from_pdf.
        doc_id: Unique ID for this document.
        doc_name: Human-readable document name.
        user_id: Owner user ID for scoping.

    Returns:
        List of LangChain Document objects with metadata.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
        separators=["\n\n", "\n", ". ", " ", ""],
        length_function=len,
    )

    all_chunks = []

    for page in pages:
        metadata = {
            "doc_id": doc_id,
            "doc_name": doc_name,
            "page_num": page["page_num"],
        }
        if user_id:
            metadata["user_id"] = user_id

        chunks = splitter.create_documents(
            texts=[page["text"]],
            metadatas=[metadata]
        )
        all_chunks.extend(chunks)

    return all_chunks


def get_page_count(pdf_path: str) -> int:
    """Get the total number of pages in a PDF."""
    doc = fitz.open(pdf_path)
    count = len(doc)
    doc.close()
    return count
