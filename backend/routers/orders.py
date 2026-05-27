from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from database import get_db
import schemas
import crud
import auth

router = APIRouter(prefix="/api/orders", tags=["orders"])

@router.post("", response_model=schemas.OrderOut)
async def checkout_cart(
    payload: schemas.CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    return await crud.checkout_cart_atomic(db, current_user.id, payload)

@router.get("", response_model=List[schemas.OrderOut])
async def get_user_orders(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    return await crud.get_user_orders(db, current_user.id)

@router.get("/all", response_model=List[schemas.OrderOut])
async def get_all_orders_admin(
    db: AsyncSession = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    return await crud.get_all_orders(db)


admin_router = APIRouter(prefix="/api/admin", tags=["admin-orders"])


@admin_router.get("/orders", response_model=List[schemas.OrderOut])
async def get_admin_orders(
    db: AsyncSession = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    return await crud.get_all_orders(db)


@admin_router.get("/navbar-summary", response_model=schemas.AdminNavbarSummary)
async def get_admin_navbar_summary(
    db: AsyncSession = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    return await crud.get_admin_navbar_summary(db)


@admin_router.patch("/orders/{order_id}", response_model=schemas.OrderOut)
async def update_admin_order_status(
    order_id: UUID,
    payload: schemas.OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    updated = await crud.update_order_status(db, order_id, payload.status)
    if updated is None:
        raise HTTPException(status_code=404, detail="Order not found")
    return updated
