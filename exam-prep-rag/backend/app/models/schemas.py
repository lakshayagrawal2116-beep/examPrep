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


class QuizQuestionPublicResponse(BaseModel):
    """Question sent to client during an active quiz — no answers or explanations."""
    id: str
    question_text: str
    options: list[str]


class QuizCheckAnswerRequest(BaseModel):
    """Check a single answer during study mode (before final submit)."""
    user_answer: str


class QuizCheckAnswerResponse(BaseModel):
    """Immediate feedback only — no answer or explanation until quiz is submitted."""
    is_correct: bool


class QuizQuestionReview(BaseModel):
    """Full question breakdown — only after quiz is submitted or from history."""
    id: str
    question_text: str
    options: list[str]
    user_answer: str | None = None
    correct_answer: str
    explanation: str
    is_correct: bool | None = None


class QuizGenerateResponse(BaseModel):
    """Response model returning the generated questions and quiz ID."""
    quiz_id: str
    topic: str
    difficulty: str
    questions: list[QuizQuestionPublicResponse]


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
    review: list[QuizQuestionReview] = []


class QuizDetailResponse(BaseModel):
    """Completed quiz with full review (history / results screen)."""
    id: str
    topic: str
    difficulty: str
    score: int
    total_questions: int
    created_at: str
    questions: list[QuizQuestionReview]


class QuizHistoryItem(BaseModel):
    """A summary of a past quiz for the history list."""
    id: str
    topic: str
    difficulty: str
    score: int
    total_questions: int
    created_at: str
