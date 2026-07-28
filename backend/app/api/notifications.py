"""
RetailIQ Backend System
File: notifications.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.dependencies import get_db, get_current_user
from app.models import Notification

router = APIRouter()

@router.get("")
def get_notifications(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    # Get stockout alerts from inventory
    stockout_q = text("""
        SELECT p.name, p.category, i.warehouse_id, i.stock_quantity, i.reorder_level,
               i.product_id, i.inventory_id
        FROM inventory i
        JOIN products p ON i.product_id = p.product_id
        WHERE i.stock_quantity <= i.reorder_level
        ORDER BY i.stock_quantity ASC
        LIMIT 20
    """)
    stockout_rows = db.execute(stockout_q).fetchall()

    notifications = []
    for r in stockout_rows:
        severity = "critical" if r.stock_quantity == 0 else "warning"
        notifications.append({
            "id": r.inventory_id,
            "type": severity,
            "title": f"{'OUT OF STOCK' if r.stock_quantity == 0 else 'Low Stock'}: {r.name[:30]}",
            "message": f"Product '{r.name[:30]}' in warehouse {r.warehouse_id} has {r.stock_quantity} units remaining (reorder level: {r.reorder_level})",
            "product_id": r.product_id,
            "warehouse_id": r.warehouse_id,
            "stock_quantity": r.stock_quantity,
            "reorder_level": r.reorder_level,
            "status": "ACTIVE",
            "is_read": False,
            "created_at": "2024-01-01T00:00:00Z"
        })

    return {
        "total": len(notifications),
        "items": notifications,
        "page": 1,
        "size": len(notifications)
    }

@router.get("/alerts")
def get_alerts(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    return get_notifications(db, current_user)
