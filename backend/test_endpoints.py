import sys
import os

# Add backend dir to path
sys.path.append(os.path.abspath("d:/RetailIQ/backend"))

from fastapi.testclient import TestClient
from main import app
from app.core.dependencies import get_db

client = TestClient(app)

print("Testing /api/customers...")
response = client.get("/api/customers")
print("Customers status:", response.status_code)
if response.status_code == 200:
    print("Customers total:", response.json().get("total"))

print("\nTesting /api/inventory...")
response = client.get("/api/inventory")
print("Inventory status:", response.status_code)
if response.status_code == 200:
    print("Inventory total:", response.json().get("total"))
    if response.json().get("items"):
        print("First inventory item:", response.json()["items"][0])

print("\nTesting /api/orders...")
response = client.get("/api/orders")
print("Orders status:", response.status_code)
if response.status_code == 200:
    print("Orders total:", response.json().get("total"))
