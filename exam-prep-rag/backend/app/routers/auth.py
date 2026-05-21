"""Auth router — signup, login, and user profile."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import get_db
from app.models.db_models import User
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SignupRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    token: str
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    name: str


@router.post("/signup", response_model=AuthResponse)
def signup(req: SignupRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    password = req.password.strip()

    # Check if email already exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )

    user = User(
        email=email,
        password_hash=hash_password(password),
        name=req.name.strip(),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user.id, user.email)

    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name},
    }


@router.post("/login", response_model=AuthResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    email = req.email.lower().strip()
    password = req.password.strip()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found for this email. Please sign up first.",
        )
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Check for extra spaces or create a new account if the database was reset.",
        )

    token = create_access_token(user.id, user.email)

    return {
        "token": token,
        "user": {"id": user.id, "email": user.email, "name": user.name},
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "email": current_user.email, "name": current_user.name}
