"""
RetailIQ Backend System
File: products.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.core.dependencies import get_db, require_role, get_pagination
from app.models import Product
from app.schemas import ProductCreate, ProductUpdate, ProductResponse
from app.schemas import PaginatedResponse

router = APIRouter()

@router.get("", response_model=PaginatedResponse[ProductResponse])
def get_products(
    db: Session = Depends(get_db),
    pagination: dict = Depends(get_pagination),
    search: Optional[str] = None,
    category: Optional[str] = None
):
    query = db.query(Product).filter(Product.is_active == True)
    
    if search:
        query = query.filter(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.brand.ilike(f"%{search}%")
            )
        )
    if category:
        query = query.filter(Product.category == category)
        
    total = query.count()
    items = query.order_by(Product.product_id.desc()).offset(pagination["skip"]).limit(pagination["limit"]).all()
    
    return {
        "total": total,
        "items": items,
        "page": pagination["skip"] // pagination["limit"] + 1,
        "size": pagination["limit"]
    }

@router.post("", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int, 
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    db_product = db.query(Product).filter(Product.product_id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = product_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_product, key, value)
        
    db.commit()
    db.refresh(db_product)
    return db_product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    db_product = db.query(Product).filter(Product.product_id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    db_product.is_active = False # soft delete
    db.commit()
    return {"message": "Product deleted successfully"}
