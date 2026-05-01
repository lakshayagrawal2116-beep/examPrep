"""Quiz service using LangChain and Gemini for structured output."""

import json
import re
import traceback
from typing import List
from pydantic import BaseModel, Field
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.documents import Document
from app.config import settings
from app.services import vector_service
from app.utils.quiz_prompts import QUIZ_SYSTEM_PROMPT, QUIZ_HUMAN_PROMPT
from app.models.schemas import QuizQuestionModel


class QuizOutput(BaseModel):
    """Schema for forcing Gemini to output an array of questions."""
    questions: List[QuizQuestionModel] = Field(description="List of generated multiple choice questions")


def _get_llm():
    """Get the Gemini LLM instance."""
    return ChatGoogleGenerativeAI(
        model=settings.gemini_model,
        google_api_key=settings.google_api_key,
        temperature=0.3,
    )


def _format_docs(docs: list[Document]) -> str:
    """Format retrieved documents into a context string with source markers."""
    formatted = []
    for doc in docs:
        source = f"[Source: {doc.metadata.get('doc_name', 'Unknown')}, Page {doc.metadata.get('page_num', '?')}]"
        formatted.append(f"{source}\n{doc.page_content}")
    return "\n\n---\n\n".join(formatted)


def _escape_braces(text: str) -> str:
    """Escape curly braces in text so LangChain prompt templates don't interpret them."""
    return text.replace("{", "{{").replace("}", "}}")


async def generate_quiz(topic: str, difficulty: str, num_questions: int, doc_ids: list[str] = None, user_id: str = None) -> list[QuizQuestionModel]:
    """Generate a list of multiple choice questions."""
    
    # Step 1: Retrieve context (user-scoped)
    search_query = topic if topic else "key concepts and summaries"
    docs = vector_service.search(
        query=search_query,
        doc_ids=doc_ids,
        user_id=user_id,
        k=10
    )
    
    context = _format_docs(docs)
    if not context:
        context = "No relevant context found in the selected documents."

    # Escape curly braces in context to prevent prompt template errors
    safe_context = _escape_braces(context)

    # Step 2: Build the chain with structured output
    llm = _get_llm()
    structured_llm = llm.with_structured_output(QuizOutput)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", QUIZ_SYSTEM_PROMPT),
        ("human", QUIZ_HUMAN_PROMPT),
    ])

    chain = prompt | structured_llm
    
    # Step 3: Invoke the chain
    result = await chain.ainvoke({
        "context": safe_context,
        "topic": topic or "general topics from the documents",
        "difficulty": difficulty,
        "num_questions": num_questions
    })
    
    return result.questions
