"""
RetailIQ Backend System
File: upload.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
import io
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert
from app.core.dependencies import get_db
from app.models.database_models import Product, Customer

router = APIRouter()

@router.post("/data")
async def upload_data(
    table_name: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if not file.filename.endswith(('.csv', '.xlsx')):
        raise HTTPException(status_code=400, detail="Only CSV or Excel files are allowed.")
    
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
            
        # Preprocessing: clean headers
        df.columns = [str(col).strip().lower().replace(" ", "_") for col in df.columns]
        
        # Preprocessing: strip strings
        df_obj = df.select_dtypes(['object'])
        df[df_obj.columns] = df_obj.apply(lambda x: x.str.strip())
        
        # Preprocessing: Replace NaN with None for SQLAlchemy
        df = df.where(pd.notnull(df), None)
        
        records = df.to_dict(orient='records')
        if not records:
            raise HTTPException(status_code=400, detail="The file is empty.")
            
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error parsing file: {str(e)}")

    try:
        if table_name.lower() == 'products':
            if 'product_id' in df.columns:
                stmt = insert(Product).values(records)
                update_dict = {c.name: c for c in stmt.excluded if c.name not in ['product_id', 'created_at']}
                stmt = stmt.on_conflict_do_update(
                    index_elements=['product_id'],
                    set_=update_dict
                )
            else:
                stmt = insert(Product).values(records)
                
            db.execute(stmt)
            db.commit()
            return {"message": f"Successfully imported {len(records)} products."}
            
        elif table_name.lower() == 'customers':
            if 'customer_id' in df.columns:
                stmt = insert(Customer).values(records)
                update_dict = {c.name: c for c in stmt.excluded if c.name not in ['customer_id', 'join_date']}
                stmt = stmt.on_conflict_do_update(
                    index_elements=['customer_id'],
                    set_=update_dict
                )
            else:
                stmt = insert(Customer).values(records)
                
            db.execute(stmt)
            db.commit()
            return {"message": f"Successfully imported {len(records)} customers."}
            
        else:
            raise HTTPException(status_code=400, detail="Unsupported table.")
            
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
