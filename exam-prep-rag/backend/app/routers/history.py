"""Chat history router — CRUD for sessions and messages."""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from pydantic import BaseModel
from app.database import get_db
from app.models.db_models import User, ChatSession, ChatMessage
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/sessions", tags=["history"])


class SessionCreate(BaseModel):
    title: str = "New Chat"


class SessionRename(BaseModel):
    title: str


class MessageCreate(BaseModel):
    role: str
    content: str
    sources_json: list | None = None


@router.get("/")
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all chat sessions for the current user, newest first."""
    sessions = (
        db.query(ChatSession)
        .filter(ChatSession.user_id == current_user.id)
        .order_by(desc(ChatSession.updated_at))
        .all()
    )

    return {
        "sessions": [
            {
                "id": s.id,
                "title": s.title,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "updated_at": s.updated_at.isoformat() if s.updated_at else None,
                "message_count": len(s.messages),
            }
            for s in sessions
        ]
    }


@router.post("/")
def create_session(
    req: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new chat session."""
    session = ChatSession(
        user_id=current_user.id,
        title=req.title,
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "id": session.id,
        "title": session.title,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "messages": [],
    }


@router.get("/{session_id}")
def get_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a session with all its messages."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "id": session.id,
        "title": session.title,
        "created_at": session.created_at.isoformat() if session.created_at else None,
        "messages": [
            {
                "id": m.id,
                "role": m.role,
                "content": m.content,
                "sources": m.sources_json or [],
                "timestamp": m.created_at.isoformat() if m.created_at else None,
            }
            for m in session.messages
        ],
    }


@router.delete("/{session_id}")
def delete_session(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a chat session and all its messages."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.delete(session)
    db.commit()

    return {"message": "Session deleted"}


@router.patch("/{session_id}")
def rename_session(
    session_id: str,
    req: SessionRename,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Rename a chat session."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.title = req.title.strip()
    db.commit()

    return {"id": session.id, "title": session.title}


@router.post("/{session_id}/messages")
def add_message(
    session_id: str,
    req: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a message to a session (used to persist after streaming)."""
    session = (
        db.query(ChatSession)
        .filter(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .first()
    )

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if req.role not in ("user", "ai"):
        raise HTTPException(status_code=400, detail="Role must be 'user' or 'ai'.")

    msg = ChatMessage(
        session_id=session_id,
        role=req.role,
        content=req.content,
        sources_json=req.sources_json,
    )
    db.add(msg)

    # Auto-title from first user message
    if req.role == "user" and session.title == "New Chat":
        session.title = req.content[:50] + ("..." if len(req.content) > 50 else "")

    session.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(msg)

    return {
        "id": msg.id,
        "role": msg.role,
        "content": msg.content,
        "sources": msg.sources_json or [],
    }
