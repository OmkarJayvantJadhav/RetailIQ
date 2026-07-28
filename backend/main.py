"""
RetailIQ Backend System
File: main.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.audit import setup_audit_logging
from app.api import auth, dashboard, products, customers, orders, inventory, analytics, forecast, recommendations, notifications, users, reports, upload, data

setup_audit_logging()

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["dashboard"])

for router, prefix, tag in [
    (products.router, "/products", "products"),
    (customers.router, "/customers", "customers"),
    (orders.router, "/orders", "orders"),
    (inventory.router, "/inventory", "inventory"),
    (analytics.router, "/analytics", "analytics"),
    (forecast.router, "/forecast", "forecast"),
    (recommendations.router, "/recommendations", "recommendations"),
    (notifications.router, "/notifications", "notifications"),
    (notifications.router, "/alerts", "alerts"),
    (users.router, "/users", "users"),
    (reports.router, "/reports", "reports"),
    (upload.router, "/upload", "upload"),
    (data.router, "/data", "data"),
]:
    app.include_router(router, prefix=f"{settings.API_V1_STR}{prefix}", tags=[tag])

@app.get("/health")
def health_check(): return {"status": "ok"}
