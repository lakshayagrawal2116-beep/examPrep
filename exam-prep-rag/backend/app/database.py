"""Database engine and session management."""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import StaticPool
from app.config import settings


class Base(DeclarativeBase):
    pass


def _create_engine():
    url = settings.database_url
    if url.startswith("sqlite"):
        # SQLite: single connection, thread-safe for FastAPI dev server
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
    return create_engine(
        url,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
    )


engine = _create_engine()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency — yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables if they don't exist."""
    import app.models.db_models  # noqa: F401 — register ORM models with Base

    Base.metadata.create_all(bind=engine)
