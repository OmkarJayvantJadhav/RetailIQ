from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict
from datetime import datetime, date

from typing import Generic, TypeVar
T = TypeVar('T')

class PaginatedResponse(BaseModel, Generic[T]):
    total: int
    items: List[T]
    page: int
    size: int

class APIResponse(BaseModel):
    message: str
    data: Optional[Any] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    
class LoginRequest(BaseModel):
    username: str
    password: str

# Users
class UserBase(BaseModel):
    username: str
    email: str
    full_name: Optional[str] = None
    role: str = "viewer"
    is_active: bool = True

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

class UserResponse(UserBase):
    user_id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

# Products
class ProductBase(BaseModel):
    name: str
    category: str
    sub_category: Optional[str] = None
    brand: Optional[str] = None
    price: float
    cost_price: Optional[float] = None
    is_active: bool = True

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    sub_category: Optional[str] = None
    brand: Optional[str] = None
    price: Optional[float] = None
    cost_price: Optional[float] = None
    is_active: Optional[bool] = None

class ProductResponse(ProductBase):
    product_id: int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# Customers
class CustomerBase(BaseModel):
    first_name: str
    last_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    city: str
    state: str
    income_level: str
    join_date: date
    is_active: bool = True

class CustomerCreate(CustomerBase):
    pass

class CustomerUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    income_level: Optional[str] = None
    is_active: Optional[bool] = None

class CustomerResponse(CustomerBase):
    customer_id: int
    model_config = ConfigDict(from_attributes=True)

# Dashboards & Analytics
class DashboardStats(BaseModel):
    total_revenue: float
    total_profit: float
    total_orders: int
    total_customers: int
    revenue_growth: float
    profit_growth: float
    orders_growth: float
    customers_growth: float

class RevenueTrend(BaseModel):
    date: str
    revenue: float
    profit: float

class CategoryPerformance(BaseModel):
    category: str
    revenue: float
    orders: int

# Inventory
class InventoryBase(BaseModel):
    warehouse_id: str
    product_id: int
    stock_quantity: int
    reorder_level: int = 10
    safety_stock: int = 5
    last_restocked: Optional[date] = None

class InventoryCreate(InventoryBase):
    pass

class InventoryUpdate(BaseModel):
    stock_quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    safety_stock: Optional[int] = None
    last_restocked: Optional[date] = None

class InventoryResponse(InventoryBase):
    inventory_id: int
    product: Optional[ProductResponse] = None
    model_config = ConfigDict(from_attributes=True)

# Orders
class OrderBase(BaseModel):
    customer_id: int
    order_date: date
    status: str = "completed"
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    total_amount: float = 0.0

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = []

class OrderUpdate(BaseModel):
    status: Optional[str] = None
    shipping_city: Optional[str] = None
    shipping_state: Optional[str] = None
    total_amount: Optional[float] = None

class OrderResponse(OrderBase):
    order_id: int
    created_at: datetime
    customer: Optional[CustomerResponse] = None
    model_config = ConfigDict(from_attributes=True)
