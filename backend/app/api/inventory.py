from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from typing import Optional

from app.core.dependencies import get_db, require_role, get_pagination
from app.models import Inventory, Product, Warehouse
from app.schemas import PaginatedResponse, InventoryCreate, InventoryUpdate, InventoryResponse

router = APIRouter()

@router.get("", response_model=PaginatedResponse[InventoryResponse])
def get_inventory(
    db: Session = Depends(get_db),
    pagination: dict = Depends(get_pagination),
    warehouse_id: Optional[str] = None
):
    query = db.query(Inventory).options(joinedload(Inventory.product))
    
    if warehouse_id:
        query = query.filter(Inventory.warehouse_id == warehouse_id)
        
    total = query.count()
    items = query.order_by(Inventory.inventory_id.desc()).offset(pagination["skip"]).limit(pagination["limit"]).all()
    
    return {
        "total": total,
        "items": items,
        "page": pagination["skip"] // pagination["limit"] + 1,
        "size": pagination["limit"]
    }

@router.get("/{inventory_id}", response_model=InventoryResponse)
def get_inventory_item(inventory_id: int, db: Session = Depends(get_db)):
    item = db.query(Inventory).options(joinedload(Inventory.product)).filter(Inventory.inventory_id == inventory_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory record not found")
    return item

@router.post("", response_model=InventoryResponse)
def create_inventory_item(
    inventory_item: InventoryCreate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin", "analyst"]))
):
    # Verify product and warehouse exist
    if not db.query(Product).filter(Product.product_id == inventory_item.product_id).first():
        raise HTTPException(status_code=404, detail="Product not found")
    if not db.query(Warehouse).filter(Warehouse.warehouse_id == inventory_item.warehouse_id).first():
        raise HTTPException(status_code=404, detail="Warehouse not found")

    db_item = Inventory(**inventory_item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

@router.put("/{inventory_id}", response_model=InventoryResponse)
def update_inventory_item(
    inventory_id: int,
    inventory_update: InventoryUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin", "analyst"]))
):
    db_item = db.query(Inventory).filter(Inventory.inventory_id == inventory_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory record not found")
        
    update_data = inventory_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.delete("/{inventory_id}")
def delete_inventory_item(
    inventory_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    db_item = db.query(Inventory).filter(Inventory.inventory_id == inventory_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Inventory record not found")
        
    db.delete(db_item)
    db.commit()
    return {"message": "Inventory record deleted successfully"}
