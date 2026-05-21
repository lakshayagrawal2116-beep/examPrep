from pathlib import Path
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Always resolve paths from the backend/ directory (not the shell cwd)
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def _default_sqlite_url() -> str:
    return f"sqlite:///{(BASE_DIR / 'examprep.db').as_posix()}"


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    google_api_key: str = ""
    chroma_persist_dir: str = str(BASE_DIR / "chroma_db")
    upload_dir: str = str(BASE_DIR / "uploads")
    gemini_model: str = "gemini-2.5-flash"
    embedding_model: str = "gemini-embedding-001"
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # Database (absolute path so login works regardless of uvicorn cwd)
    database_url: str = _default_sqlite_url()

    # JWT Auth
    jwt_secret_key: str = "change-me-in-production-please"
    jwt_expiry_hours: int = 168  # 7 days

    @field_validator("database_url", mode="before")
    @classmethod
    def resolve_sqlite_path(cls, value: str) -> str:
        """Turn relative sqlite:///./file.db into an absolute backend/ path."""
        if not isinstance(value, str) or not value.startswith("sqlite"):
            return value
        prefix = "sqlite:///"
        if not value.startswith(prefix):
            return value
        db_path = value[len(prefix) :]
        if db_path in (":memory:", "") or db_path.startswith("/") or len(db_path) > 1 and db_path[1] == ":":
            return value
        resolved = (BASE_DIR / db_path.lstrip("./")).resolve()
        return f"{prefix}{resolved.as_posix()}"

    @field_validator("upload_dir", "chroma_persist_dir", mode="before")
    @classmethod
    def resolve_relative_dir(cls, value: str) -> str:
        """Resolve ./uploads and ./chroma_db relative to backend/ (not shell cwd)."""
        if not isinstance(value, str):
            return value
        path = Path(value)
        if not path.is_absolute():
            path = (BASE_DIR / path).resolve()
        return str(path)


# Max upload size (50 MB) — must match frontend useDocuments.js
MAX_UPLOAD_BYTES = 50 * 1024 * 1024

settings = Settings()
