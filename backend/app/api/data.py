"""
RetailIQ Backend System
File: data.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.dependencies import get_db, get_current_user

router = APIRouter()

ALLOWED_TABLES = [
    'customers', 
    'products', 
    'orders', 
    'order_items', 
    'inventory', 
    'warehouses', 
    'payments', 
    'state_demographics'
]

@router.get("/{table_name}")
def get_table_data(
    table_name: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Invalid table name")
    
    offset = (page - 1) * limit
    
    # Get total count
    count_q = text(f"SELECT COUNT(*) FROM {table_name}")
    total = db.execute(count_q).scalar()
    
    # Get rows
    data_q = text(f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset")
    rows = db.execute(data_q, {"limit": limit, "offset": offset}).fetchall()
    
    # Determine columns
    if len(rows) > 0:
        columns = list(rows[0]._mapping.keys())
        records = [dict(r._mapping) for r in rows]
    else:
        # Fallback to information_schema if table is empty
        col_q = text(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table_name}'")
        col_rows = db.execute(col_q).fetchall()
        columns = [r[0] for r in col_rows]
        records = []
        
    # Convert datetime objects to string for JSON serialization
    for record in records:
        for k, v in record.items():
            if hasattr(v, 'isoformat'):
                record[k] = v.isoformat()
            # Also convert Decimals to floats
            elif hasattr(v, 'quantize'):
                record[k] = float(v)
                
    return {
        "table": table_name,
        "total": total,
        "page": page,
        "limit": limit,
        "columns": columns,
        "records": records
    }
