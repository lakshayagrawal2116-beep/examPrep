"""RAG chain service using LangChain LCEL with Gemini."""

import asyncio
from typing import AsyncGenerator
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from app.config import settings
from app.services import vector_service
from app.utils.prompts import RAG_SYSTEM_PROMPT, RAG_HUMAN_PROMPT


def _get_llm():
    """Get the Gemini LLM instance."""
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.3,
        streaming=True,
    )


def _format_docs(docs: list[Document]) -> str:
    """Format retrieved documents into a context string with source markers."""
    formatted = []
    for doc in docs:
        source = f"[Source: {doc.metadata.get('doc_name', 'Unknown')}, Page {doc.metadata.get('page_num', '?')}]"
        formatted.append(f"{source}\n{doc.page_content}")
    return "\n\n---\n\n".join(formatted)


def _format_chat_history(history: list[dict]) -> str:
    """Format chat history for the prompt."""
    if not history:
        return "No previous conversation."

    formatted = []
    for msg in history[-6:]:  # Keep last 6 messages to avoid token overflow
        role = "Student" if msg.get("role") == "user" else "Assistant"
        formatted.append(f"{role}: {msg.get('content', '')}")

    return "\n".join(formatted)


def _build_chain():
    """Build the RAG chain using LCEL."""
    llm = _get_llm()

    prompt = ChatPromptTemplate.from_messages([
        ("system", RAG_SYSTEM_PROMPT),
        ("human", RAG_HUMAN_PROMPT),
    ])

    chain = prompt | llm | StrOutputParser()
    return chain


async def query_stream(
    question: str,
    doc_ids: list[str] = None,
    chat_history: list[dict] = None,
) -> AsyncGenerator[dict, None]:
    """
    Stream a RAG response for the given question.

    Yields dicts with either:
    - {"type": "token", "content": "..."} for answer tokens
    - {"type": "sources", "sources": [...]} for source citations
    - {"type": "error", "content": "..."} for errors

    Args:
        question: The user's question.
        doc_ids: Optional document IDs to filter search.
        chat_history: Optional conversation history.
    """
    try:
        # Step 1: Retrieve relevant documents
        docs = vector_service.search(
            query=question,
            doc_ids=doc_ids if doc_ids else None,
            k=5
        )

        if not docs:
            yield {
                "type": "token",
                "content": "I couldn't find any relevant information in your uploaded documents. Please make sure you've uploaded relevant study materials."
            }
            yield {"type": "done"}
            return

        # Step 2: Format context and history
        context = _format_docs(docs)
        history_str = _format_chat_history(chat_history or [])

        # Step 3: Build and run the chain with streaming
        chain = _build_chain()

        async for chunk in chain.astream({
            "context": context,
            "chat_history": history_str,
            "question": question,
        }):
            yield {"type": "token", "content": chunk}

        # Step 4: Send source citations
        sources = []
        seen = set()
        for doc in docs:
            key = (doc.metadata.get("doc_name", ""), doc.metadata.get("page_num", 0))
            if key not in seen:
                seen.add(key)
                sources.append({
                    "doc_name": doc.metadata.get("doc_name", "Unknown"),
                    "page_num": doc.metadata.get("page_num", 0),
                    "content_preview": doc.page_content[:150] + "..." if len(doc.page_content) > 150 else doc.page_content,
                })

        yield {"type": "sources", "sources": sources}
        yield {"type": "done"}

    except Exception as e:
        yield {"type": "error", "content": f"An error occurred: {str(e)}"}
        yield {"type": "done"}
