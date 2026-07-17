import sys
import os
import json

sys.path.append(os.path.abspath("d:/RetailIQ/backend"))

from app.db.database import SessionLocal
from app.models.all import Customer, AuditLog
from app.core.audit import current_user_id
from fastapi.testclient import TestClient
from main import app

# 1. Test Audit Log
def test_audit():
    db = SessionLocal()
    # Mock user id
    current_user_id.set(999)
    
    print("Testing Audit Log via DB Session...")
    # Create a mock customer to trigger INSERT
    from datetime import datetime
    cust = Customer(
        first_name="Test",
        last_name="User",
        city="TestCity",
        state="MH",
        income_level="Medium",
        join_date=datetime.now()
    )
    db.add(cust)
    db.commit()
    db.refresh(cust)
    
    # Update to trigger UPDATE
    cust.first_name = "UpdatedTest"
    db.commit()
    
    # Delete to trigger DELETE
    cust_id = cust.customer_id
    db.delete(cust)
    db.commit()
    
    # Verify Audit Logs
    logs = db.query(AuditLog).filter(AuditLog.user_id == 999).order_by(AuditLog.log_id.desc()).limit(3).all()
    print(f"Found {len(logs)} audit logs for user 999.")
    for log in logs:
        print(f"Action: {log.action}, Table: {log.table_name}, ID: {log.record_id}")
        
    db.close()

# 2. Test Export API
def test_export():
    print("\nTesting Export API via TestClient...")
    client = TestClient(app)
    
    from app.core.security import create_access_token
    from datetime import timedelta
    token = create_access_token(subject=1, role="admin", expires_delta=timedelta(minutes=5))
    
    response = client.get("/api/reports/export/csv/products", headers={"Authorization": f"Bearer {token}"})
    print("Export /products Status:", response.status_code)
    print("Headers:", response.headers.get("content-disposition"))
    print("Preview of CSV (first 100 chars):")
    print(response.text[:100])

if __name__ == "__main__":
    test_audit()
    test_export()
