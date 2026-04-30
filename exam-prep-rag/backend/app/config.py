import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    chroma_persist_dir: str = os.getenv("CHROMA_PERSIST_DIR", "./chroma_db")
    upload_dir: str = os.getenv("UPLOAD_DIR", "./uploads")
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    embedding_model: str = os.getenv("EMBEDDING_MODEL", "gemini-embedding-001")
    chunk_size: int = int(os.getenv("CHUNK_SIZE", "1000"))
    chunk_overlap: int = int(os.getenv("CHUNK_OVERLAP", "200"))

    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./examprep.db")

    # JWT Auth
    jwt_secret_key: str = os.getenv("JWT_SECRET_KEY", "change-me-in-production-please")
    jwt_expiry_hours: int = int(os.getenv("JWT_EXPIRY_HOURS", "168"))  # 7 days

    class Config:
        env_file = ".env"


settings = Settings()
