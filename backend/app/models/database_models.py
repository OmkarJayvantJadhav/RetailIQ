"""
RetailIQ Backend System
File: database_models.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from sqlalchemy import Column, Integer, String, Boolean, DECIMAL, Date, DateTime, ForeignKey, BigInteger, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy.types import JSON
from app.db.database import Base

class StateDemographics(Base):
    __tablename__ = "state_demographics"
    state = Column(String(100), primary_key=True)
    population = Column(BigInteger, nullable=False)
    literacy_rate = Column(DECIMAL(5, 2))
    per_capita_income = Column(DECIMAL(12, 2))
    region = Column(String(50), nullable=False)

class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(200))
    role = Column(String(20), nullable=False, default="viewer")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime)
    
    notifications = relationship("Notification", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Customer(Base):
    __tablename__ = "customers"
    customer_id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(255))
    phone = Column(String(20))
    age = Column(Integer)
    gender = Column(String(10))
    city = Column(String(100), nullable=False)
    state = Column(String(100), ForeignKey("state_demographics.state"), nullable=False)
    income_level = Column(String(20), nullable=False)
    join_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    
    orders = relationship("Order", back_populates="customer")

class Product(Base):
    __tablename__ = "products"
    product_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False, index=True)
    sub_category = Column(String(100))
    brand = Column(String(100), index=True)
    price = Column(DECIMAL(10, 2), nullable=False)
    cost_price = Column(DECIMAL(10, 2))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    
    inventory = relationship("Inventory", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")

class Warehouse(Base):
    __tablename__ = "warehouses"
    warehouse_id = Column(String(20), primary_key=True)
    name = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    state = Column(String(100), ForeignKey("state_demographics.state"), nullable=False)
    capacity = Column(Integer, nullable=False)
    manager_name = Column(String(200))
    is_active = Column(Boolean, default=True)
    
    inventory = relationship("Inventory", back_populates="warehouse")

class Order(Base):
    __tablename__ = "orders"
    order_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), nullable=False)
    order_date = Column(DateTime, nullable=False, index=True)
    status = Column(String(20), default="completed")
    shipping_city = Column(String(100))
    shipping_state = Column(String(100))
    total_amount = Column(DECIMAL(12, 2), default=0)
    created_at = Column(DateTime, server_default=func.now())
    
    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    returns = relationship("Return", back_populates="order")
    payments = relationship("Payment", back_populates="order")

class OrderItem(Base):
    __tablename__ = "order_items"
    order_item_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(DECIMAL(10, 2), nullable=False)
    discount_pct = Column(DECIMAL(5, 2), default=0)
    line_total = Column(DECIMAL(12, 2))
    
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")

class Inventory(Base):
    __tablename__ = "inventory"
    inventory_id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(String(20), ForeignKey("warehouses.warehouse_id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    stock_quantity = Column(Integer, nullable=False, default=0)
    reorder_level = Column(Integer, nullable=False, default=10)
    safety_stock = Column(Integer, default=5)
    last_restocked = Column(DateTime)
    
    warehouse = relationship("Warehouse", back_populates="inventory")
    product = relationship("Product", back_populates="inventory")

class Return(Base):
    __tablename__ = "returns"
    return_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.product_id"), nullable=False)
    return_date = Column(DateTime, nullable=False)
    reason = Column(String(100))
    refund_amount = Column(DECIMAL(10, 2))
    status = Column(String(20), default="pending")
    
    order = relationship("Order", back_populates="returns")
    product = relationship("Product")

class Payment(Base):
    __tablename__ = "payments"
    payment_id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.order_id"), nullable=False)
    payment_date = Column(DateTime, server_default=func.now())
    amount = Column(DECIMAL(12, 2), nullable=False)
    payment_method = Column(String(50), nullable=False)
    status = Column(String(20), default="completed")
    transaction_id = Column(String(100), unique=True)
    
    order = relationship("Order", back_populates="payments")

class Notification(Base):
    __tablename__ = "notifications"
    notification_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"))
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30))
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    related_entity = Column(String(50))
    related_entity_id = Column(Integer)
    
    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id", ondelete="SET NULL"))
    action = Column(String(50), nullable=False)
    table_name = Column(String(100), nullable=False)
    record_id = Column(Integer)
    old_values = Column(JSON)
    new_values = Column(JSON)
    ip_address = Column(String(45))
    timestamp = Column(DateTime, server_default=func.now())
    
    user = relationship("User", back_populates="audit_logs")
