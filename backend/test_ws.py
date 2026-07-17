import asyncio
import sys
import os

sys.path.append(os.path.abspath("d:/RetailIQ/backend"))

from fastapi.testclient import TestClient
from main import app
from app.core.dependencies import require_role
from datetime import datetime

# Bypass auth for creating order
app.dependency_overrides[require_role(["admin", "analyst"])] = lambda: None

def test_websocket_notification():
    client = TestClient(app)
    
    print("Connecting to WebSocket...")
    with client.websocket_connect("/api/notifications/ws") as websocket:
        print("Connected! Sending POST request to create order...")
        
        # Create an order
        order_data = {
            "customer_id": 1,
            "order_date": datetime.now().date().isoformat(),
            "status": "pending",
            "shipping_city": "TestCity",
            "shipping_state": "MH",
            "total_amount": 99.99
        }
        from app.core.security import create_access_token
        from datetime import timedelta
        token = create_access_token(subject=1, role="admin", expires_delta=timedelta(minutes=5))
        
        response = client.post("/api/orders/", json=order_data, headers={"Authorization": f"Bearer {token}"})
        print("Create Order Status:", response.status_code)
        
        if response.status_code == 200:
            print("Order created successfully. Waiting for WebSocket message...")
            data = websocket.receive_json()
            print("Received WebSocket Message:", data)
        else:
            print("Failed to create order:", response.text)

if __name__ == "__main__":
    test_websocket_notification()
