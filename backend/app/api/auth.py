"""
RetailIQ Backend System
File: auth.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from datetime import timedelta, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core import security, dependencies
from app.core.config import settings
from app.models import User
from app.schemas import Token, LoginRequest
from app.schemas import UserResponse

router = APIRouter()

class LoginJSON(BaseModel):
    username: str
    password: str

def _do_login(db: Session, username: str, password: str) -> dict:
    user = db.query(User).filter(User.username == username).first()
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    access_token_expires = timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    access_token = security.create_access_token(
        subject=user.user_id, role=user.role, expires_delta=access_token_expires
    )
    user.last_login = datetime.now(timezone.utc)
    db.commit()
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

# JSON login (used by the React frontend)
@router.post("/login", response_model=Token)
def login_json(body: LoginJSON, db: Session = Depends(dependencies.get_db)):
    return _do_login(db, body.username, body.password)

# Form-based login (kept for OAuth2 / Swagger UI compatibility)
@router.post("/token", response_model=Token)
def login_form(db: Session = Depends(dependencies.get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    return _do_login(db, form_data.username, form_data.password)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(dependencies.get_current_user)):
    return current_user
