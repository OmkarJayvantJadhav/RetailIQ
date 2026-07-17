from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_role, get_pagination
from app.schemas import PaginatedResponse

router = APIRouter()

@router.get("", response_model=PaginatedResponse)
def get_payments(db: Session = Depends(get_db), pagination: dict = Depends(get_pagination)):
    return {"total": 0, "items": [], "page": 1, "size": pagination["limit"]}
