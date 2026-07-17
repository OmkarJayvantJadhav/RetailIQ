from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from typing import Optional
import asyncio

from app.core.dependencies import get_db, require_role, get_pagination
from app.models import Order, Customer, OrderItem, Product
from app.schemas import PaginatedResponse, OrderCreate, OrderUpdate, OrderResponse
from app.core.websockets import manager

router = APIRouter()

def send_ws_notification(message: dict):
    asyncio.run(manager.broadcast(message))

@router.get("", response_model=PaginatedResponse[OrderResponse])
def get_orders(
    db: Session = Depends(get_db),
    pagination: dict = Depends(get_pagination),
    status: Optional[str] = None
):
    query = db.query(Order).options(joinedload(Order.customer))
    
    if status:
        query = query.filter(Order.status == status)
        
    total = query.count()
    items = query.order_by(Order.order_id.desc()).offset(pagination["skip"]).limit(pagination["limit"]).all()
    
    return {
        "total": total,
        "items": items,
        "page": pagination["skip"] // pagination["limit"] + 1,
        "size": pagination["limit"]
    }

@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.customer)).filter(Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.post("", response_model=OrderResponse)
def create_order(
    order: OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin", "analyst"]))
):
    # Verify customer exists
    customer = db.query(Customer).filter(Customer.customer_id == order.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db_order = Order(**order.model_dump(exclude={"items"}))
    db.add(db_order)
    db.flush() # get order_id
    
    total_amount = 0.0
    for item in order.items:
        product = db.query(Product).filter(Product.product_id == item.product_id).first()
        if not product:
            raise HTTPException(status_code=400, detail=f"Product {item.product_id} not found")
        
        line_total = float(product.price) * item.quantity
        total_amount += line_total
        
        db_item = OrderItem(
            order_id=db_order.order_id,
            product_id=product.product_id,
            quantity=item.quantity,
            unit_price=product.price,
            line_total=line_total
        )
        db.add(db_item)
        
    db_order.total_amount = total_amount
    db.commit()
    db.refresh(db_order)
    
    background_tasks.add_task(send_ws_notification, {
        "type": "new_order",
        "message": f"New order #{db_order.order_id} placed by {customer.first_name} {customer.last_name}."
    })
    return db_order

@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    order_update: OrderUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin", "analyst"]))
):
    db_order = db.query(Order).filter(Order.order_id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    update_data = order_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)
        
    db.commit()
    db.refresh(db_order)
    return db_order

@router.delete("/{order_id}")
def delete_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin"]))
):
    db_order = db.query(Order).filter(Order.order_id == order_id).first()
    if not db_order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    db.delete(db_order)
    db.commit()
    return {"message": "Order deleted successfully"}
