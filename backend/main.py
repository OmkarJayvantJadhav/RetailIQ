from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.audit import setup_audit_logging
from app.api import auth, dashboard, products, customers, orders, inventory, warehouses, returns, payments, analytics, forecast, recommendations, notifications, users, reports, upload

setup_audit_logging()

app = FastAPI(title=settings.PROJECT_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
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
    (warehouses.router, "/warehouses", "warehouses"),
    (returns.router, "/returns", "returns"),
    (payments.router, "/payments", "payments"),
    (analytics.router, "/analytics", "analytics"),
    (forecast.router, "/forecast", "forecast"),
    (recommendations.router, "/recommendations", "recommendations"),
    (notifications.router, "/notifications", "notifications"),
    (notifications.router, "/alerts", "alerts"),
    (users.router, "/users", "users"),
    (reports.router, "/reports", "reports"),
    (upload.router, "/upload", "upload"),
]:
    app.include_router(router, prefix=f"{settings.API_V1_STR}{prefix}", tags=[tag])

@app.get("/health")
def health_check(): return {"status": "ok"}
