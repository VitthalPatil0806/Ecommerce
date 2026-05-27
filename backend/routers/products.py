from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from database import get_db
import schemas
import crud
import auth

router = APIRouter(prefix="/api", tags=["products"])

@router.get("/products", response_model=List[schemas.ProductOut])
async def read_products(db: AsyncSession = Depends(get_db)):
    return await crud.get_products(db)

@router.get("/products/{product_id}", response_model=schemas.ProductOut)
async def read_product(product_id: UUID, db: AsyncSession = Depends(get_db)):
    product = await crud.get_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/admin/products", response_model=schemas.ProductOut)
async def create_product(
    product: schemas.ProductCreate, 
    db: AsyncSession = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    return await crud.create_product(db=db, product=product)

@router.put("/admin/products/{product_id}", response_model=schemas.ProductOut)
async def update_product(
    product_id: UUID, 
    product: schemas.ProductUpdate, 
    db: AsyncSession = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    updated = await crud.update_product(db, product_id, product)
    if updated is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated

@router.delete("/admin/products/{product_id}")
async def delete_product(
    product_id: UUID, 
    db: AsyncSession = Depends(get_db),
    admin = Depends(auth.get_current_admin)
):
    deleted = await crud.delete_product(db, product_id)
    if deleted is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}
