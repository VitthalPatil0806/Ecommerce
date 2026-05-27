from enum import Enum
from pydantic import BaseModel, EmailStr, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserOut(UserBase):
    id: UUID
    is_admin: bool
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# --- Product Schemas ---
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal = Field(gt=0)
    stock: int = Field(default=0, ge=0)
    image_url: Optional[str] = None
    category: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    stock: Optional[int] = Field(default=None, ge=0)
    image_url: Optional[str] = None
    category: Optional[str] = None

class ProductOut(ProductBase):
    id: UUID
    model_config = ConfigDict(from_attributes=True)

# --- Cart Schemas ---
class CartItemBase(BaseModel):
    product_id: UUID
    quantity: int = Field(ge=1)

class CartItemCreate(CartItemBase):
    pass

class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=0)


class OrderStatus(str, Enum):
    PENDING = "Pending"
    ORDER_PLACED = "Order Placed"
    SHIPPED = "Shipped"
    DELIVERED = "Delivered"


class PaymentMethod(str, Enum):
    CARD = "Card"
    CASH_ON_DELIVERY = "Cash on Delivery"


class PaymentStatus(str, Enum):
    PENDING = "Pending"
    PAID = "Paid"
    FAILED = "Failed"


class CartItemOut(CartItemBase):
    id: UUID
    product: ProductOut
    model_config = ConfigDict(from_attributes=True)


class AdminCartItemOut(CartItemOut):
    user_id: UUID
    user_email: EmailStr
    user_full_name: Optional[str] = None

# --- Order Schemas ---
class CheckoutRequest(BaseModel):
    customer_name: str = Field(min_length=1)
    customer_email: EmailStr
    customer_phone: str = Field(min_length=1)
    address_line1: str = Field(min_length=1)
    address_line2: Optional[str] = None
    city: str = Field(min_length=1)
    state: str = Field(min_length=1)
    postal_code: str = Field(min_length=1)
    country: str = Field(min_length=1)
    payment_method: PaymentMethod
    card_holder_name: Optional[str] = None
    card_number: Optional[str] = None
    expiry_month: Optional[int] = Field(default=None, ge=1, le=12)
    expiry_year: Optional[int] = Field(default=None, ge=2000)
    cvv: Optional[str] = None


class OrderItemOut(BaseModel):
    id: UUID
    product_id: Optional[UUID]
    quantity: int
    price: Decimal
    product: Optional[ProductOut]
    model_config = ConfigDict(from_attributes=True)

class OrderOut(BaseModel):
    id: UUID
    user_id: Optional[UUID]
    total_amount: Decimal
    status: OrderStatus
    customer_name: Optional[str] = None
    customer_email: Optional[EmailStr] = None
    customer_phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    payment_method: Optional[PaymentMethod] = None
    payment_status: Optional[PaymentStatus] = None
    card_last4: Optional[str] = None
    created_at: datetime
    items: List[OrderItemOut]
    model_config = ConfigDict(from_attributes=True)


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class AdminNavbarSummary(BaseModel):
    total_orders: int
    total_cart_items: int
