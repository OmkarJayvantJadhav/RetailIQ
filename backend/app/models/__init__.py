"""
RetailIQ Backend System
File: __init__.py
Purpose: Provides backend business logic, API routing, or database models for the RetailIQ platform.
"""
from .database_models import (
    StateDemographics, User, Customer, Product, Warehouse, Order, OrderItem,
    Inventory, Return, Payment, Notification, AuditLog
)
