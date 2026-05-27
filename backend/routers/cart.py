from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from database import get_db
import schemas
import crud
import auth

router = APIRouter(prefix="/api/cart", tags=["cart"])
admin_router = APIRouter(prefix="/api/admin", tags=["admin-cart"])

@router.get("", response_model=List[schemas.CartItemOut])
async def get_cart(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    return await crud.get_cart(db, current_user.id)

@router.post("/items", response_model=schemas.CartItemOut)
async def add_to_cart(
    item: schemas.CartItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    return await crud.add_to_cart(db, current_user.id, item)

@router.put("/items/{product_id}", response_model=schemas.CartItemOut)
async def update_cart_item(
    product_id: UUID,
    item: schemas.CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    updated = await crud.update_cart_item(db, current_user.id, product_id, item.quantity)
    if not updated and item.quantity > 0:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    return updated

@router.delete("/items/{product_id}")
async def delete_cart_item(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    deleted = await crud.delete_cart_item(db, current_user.id, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Item not found in cart")
    return {"message": "Item removed"}

@router.delete("")
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(auth.get_current_user)
):
    await crud.clear_cart(db, current_user.id)
    return {"message": "Cart cleared"}


@admin_router.get("/cart", response_model=List[schemas.AdminCartItemOut])
async def get_admin_cart(
    db: AsyncSession = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    return await crud.get_all_cart_items(db)
