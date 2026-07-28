"""
RetailIQ Backend System
File: users.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, require_role, get_pagination
from app.schemas import PaginatedResponse, UserCreate, UserUpdate, UserResponse
from app.models import User
from app.core import security

router = APIRouter()

@router.get("", response_model=PaginatedResponse[UserResponse])
def get_users(db: Session = Depends(get_db), pagination: dict = Depends(get_pagination), current_user = Depends(require_role(["admin"]))):
    query = db.query(User)
    total = query.count()
    items = query.order_by(User.user_id.desc()).offset(pagination["skip"]).limit(pagination["limit"]).all()
    
    return {
        "total": total,
        "items": items,
        "page": pagination["skip"] // pagination["limit"] + 1,
        "size": pagination["limit"]
    }

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.post("", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = security.get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active,
        hashed_password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_update.model_dump(exclude_unset=True)
    if "email" in update_data:
        existing = db.query(User).filter(User.email == update_data["email"], User.user_id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already taken")
            
    if "password" in update_data:
        db_user.hashed_password = security.get_password_hash(update_data.pop("password"))
            
    for key, value in update_data.items():
        setattr(db_user, key, value)
        
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db), current_user = Depends(require_role(["admin"]))):
    db_user = db.query(User).filter(User.user_id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    if db_user.username == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete super admin")
        
    db_user.is_active = False # soft delete
    db.commit()
    return {"message": "User deactivated successfully"}
