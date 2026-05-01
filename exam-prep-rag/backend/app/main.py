"""FastAPI application entry point."""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import documents, chat, auth, history, quiz


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler — runs on startup and shutdown."""
    # Startup: ensure directories exist
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(settings.chroma_persist_dir, exist_ok=True)

    # Initialize database tables
    from app.database import init_db
    init_db()

    # Initialize vector store on startup
    from app.services.vector_service import get_vector_store, rebuild_from_postgres
    get_vector_store()

    # Rebuild ChromaDB from PostgreSQL if filesystem was wiped (Render deploys)
    rebuild_from_postgres()

    print("[OK] ExamPrep RAG backend started successfully!")
    print(f"[DB] Database connected")
    print(f"[UPLOAD] Upload dir: {settings.upload_dir}")
    print(f"[DB] ChromaDB dir: {settings.chroma_persist_dir}")
    print(f"[LLM] Model: {settings.gemini_model}")
    print(f"[EMB] Embedding model: {settings.embedding_model}")

    yield

    # Shutdown cleanup (if needed)
    print("[BYE] ExamPrep RAG backend shutting down.")


app = FastAPI(
    title="ExamPrep RAG API",
    description="AI-powered study companion that answers questions from your uploaded PDF notes.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — dynamic origins from env + dev defaults
_default_origins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
]
_env_origins = [o.strip() for o in os.getenv("CORS_ORIGINS", "").split(",") if o.strip()]
_all_origins = list(set(_default_origins + _env_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=_all_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(history.router)
app.include_router(quiz.router)


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "app": "ExamPrep RAG API",
        "version": "1.0.0",
    }


@app.get("/api/health")
async def health():
    """Detailed health check."""
    from app.services.vector_service import get_document_ids
    doc_count = len(get_document_ids())

    return {
        "status": "healthy",
        "model": settings.gemini_model,
        "embedding_model": settings.embedding_model,
        "documents_indexed": doc_count,
    }
