from pydantic import BaseModel
from typing import Optional


class DocumentResponse(BaseModel):
    """Response model for a single uploaded document."""
    id: str
    name: str
    page_count: int
    chunk_count: int
    uploaded_at: str


class DocumentListResponse(BaseModel):
    """Response model for listing all documents."""
    documents: list[DocumentResponse]


class ChatRequest(BaseModel):
    """Request model for a chat query."""
    question: str
    doc_ids: list[str] = []
    chat_history: list[dict] = []


class SourceInfo(BaseModel):
    """Source citation info returned with chat responses."""
    doc_name: str
    page_num: int
    content_preview: str


class ChatResponse(BaseModel):
    """Non-streaming chat response (for fallback)."""
    answer: str
    sources: list[SourceInfo]


class UploadResponse(BaseModel):
    """Response after uploading a document."""
    message: str
    document: DocumentResponse


class ErrorResponse(BaseModel):
    """Standard error response."""
    detail: str


class QuizGenerateRequest(BaseModel):
    """Request model for generating a new quiz."""
    topic: Optional[str] = None
    difficulty: str = "Medium"
    num_questions: int = 5
    doc_ids: list[str] = []


class QuizQuestionModel(BaseModel):
    """A single multiple choice question with explanation."""
    question_text: str
    options: list[str]
    correct_answer: str
    explanation: str


class QuizQuestionResponse(QuizQuestionModel):
    """Question model returned to frontend — includes the database ID."""
    id: str


class QuizGenerateResponse(BaseModel):
    """Response model returning the generated questions and quiz ID."""
    quiz_id: str
    topic: str
    difficulty: str
    questions: list[QuizQuestionResponse]


class QuizSubmitAnswer(BaseModel):
    """A single submitted answer."""
    question_id: str
    user_answer: str


class QuizSubmitRequest(BaseModel):
    """Request model for submitting an entire quiz."""
    answers: list[QuizSubmitAnswer]


class QuizSubmitResponse(BaseModel):
    """Response model after submitting a quiz."""
    score: int
    total_questions: int
    message: str


class QuizHistoryItem(BaseModel):
    """A summary of a past quiz for the history list."""
    id: str
    topic: str
    difficulty: str
    score: int
    total_questions: int
    created_at: str
