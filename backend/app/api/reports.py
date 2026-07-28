"""
RetailIQ Backend System
File: reports.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.dependencies import get_db, require_role
import io
import csv

router = APIRouter()

ALLOWED_TABLES = ["products", "customers", "orders", "inventory", "warehouses", "payments"]

@router.get("/export/csv/{table_name}")
def export_csv(
    table_name: str, 
    db: Session = Depends(get_db),
    current_user = Depends(require_role(["admin", "analyst"]))
):
    if table_name not in ALLOWED_TABLES:
        raise HTTPException(status_code=400, detail="Invalid table name for export")
        
    query = text(f"SELECT * FROM {table_name}")
    result = db.execute(query)
    
    stream = io.StringIO()
    writer = csv.writer(stream)
    
    # Write headers
    writer.writerow(result.keys())
    
    # Write rows
    for row in result:
        writer.writerow(row)
        
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = f"attachment; filename={table_name}_export.csv"
    
    return response
