from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from app.core.dependencies import get_db, require_role, get_pagination
from app.models import Customer
from app.schemas import PaginatedResponse, CustomerCreate, CustomerUpdate, CustomerResponse

router = APIRouter()

@router.get("", response_model=PaginatedResponse[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    pagination: dict = Depends(get_pagination),
    search: Optional[str] = None
):
    query = db.query(Customer).filter(Customer.is_active == True)
    
    if search:
        query = query.filter(
            or_(
                Customer.first_name.ilike(f"%{search}%"),
                Customer.last_name.ilike(f"%{search}%"),
                Customer.email.ilike(f"%{search}%")
            )
        )
        
    total = query.count()
    items = query.order_by(Customer.customer_id.desc()).offset(pagination["skip"]).limit(pagination["limit"]).all()
    
    return {
        "total": total,
        "items": items,
        "page": pagination["skip"] // pagination["limit"] + 1,
        "size": pagination["limit"]
    }

@router.get("/{customer_id}", response_model=CustomerResponse)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id, Customer.is_active == True).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@router.post("", response_model=CustomerResponse)
def create_customer(
    customer: CustomerCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin", "analyst"]))
):
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin", "analyst"]))
):
    db_customer = db.query(Customer).filter(Customer.customer_id == customer_id, Customer.is_active == True).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    update_data = customer_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_customer, key, value)
        
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    db_customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    db_customer.is_active = False # soft delete
    db.commit()
    return {"message": "Customer deleted successfully"}
