from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import delete, func
import models
import schemas
from auth import get_password_hash
from fastapi import HTTPException
from uuid import UUID

INVENTORY_TRACKED_ORDER_STATUSES = {
    schemas.OrderStatus.ORDER_PLACED.value,
    schemas.OrderStatus.SHIPPED.value,
    schemas.OrderStatus.DELIVERED.value,
}

async def get_user_by_email(db: AsyncSession, email: str):
    stmt = select(models.User).where(models.User.email == email)
    result = await db.execute(stmt)
    return result.scalars().first()

async def create_user(db: AsyncSession, user: schemas.UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = models.User(email=user.email, hashed_password=hashed_password, full_name=user.full_name)
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def get_products(db: AsyncSession):
    stmt = select(models.Product)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_product(db: AsyncSession, product_id: UUID):
    stmt = select(models.Product).where(models.Product.id == product_id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def create_product(db: AsyncSession, product: schemas.ProductCreate):
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

async def update_product(db: AsyncSession, product_id: UUID, product: schemas.ProductUpdate):
    db_product = await get_product(db, product_id)
    if not db_product:
        return None
    for key, value in product.model_dump(exclude_unset=True).items():
        setattr(db_product, key, value)
    await db.commit()
    await db.refresh(db_product)
    return db_product

async def delete_product(db: AsyncSession, product_id: UUID):
    db_product = await get_product(db, product_id)
    if db_product:
        await db.delete(db_product)
        await db.commit()
    return db_product

async def get_cart(db: AsyncSession, user_id: UUID):
    stmt = select(models.Cart).options(selectinload(models.Cart.product)).where(models.Cart.user_id == user_id)
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_all_cart_items(db: AsyncSession):
    stmt = (
        select(models.Cart)
        .options(selectinload(models.Cart.product), selectinload(models.Cart.user))
        .order_by(models.Cart.user_id)
    )
    result = await db.execute(stmt)
    cart_items = result.scalars().all()

    return [
        schemas.AdminCartItemOut(
            id=item.id,
            user_id=item.user_id,
            user_email=item.user.email,
            user_full_name=item.user.full_name,
            product_id=item.product_id,
            quantity=item.quantity,
            product=item.product,
        )
        for item in cart_items
        if item.user is not None and item.product is not None
    ]

async def add_to_cart(db: AsyncSession, user_id: UUID, item: schemas.CartItemCreate):
    product = await get_product(db, item.product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < item.quantity:
        raise HTTPException(status_code=400, detail="Requested quantity exceeds stock")

    # Check if item exists in cart
    stmt = select(models.Cart).where(models.Cart.user_id == user_id, models.Cart.product_id == item.product_id)
    result = await db.execute(stmt)
    cart_item = result.scalars().first()

    if cart_item:
        new_quantity = cart_item.quantity + item.quantity
        if product.stock < new_quantity:
            raise HTTPException(status_code=400, detail="Requested quantity exceeds stock")
        cart_item.quantity = new_quantity
    else:
        cart_item = models.Cart(user_id=user_id, product_id=item.product_id, quantity=item.quantity)
        db.add(cart_item)
    await db.commit()
    
    # Reload with product details
    stmt = select(models.Cart).options(selectinload(models.Cart.product)).where(models.Cart.id == cart_item.id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def update_cart_item(db: AsyncSession, user_id: UUID, product_id: UUID, quantity: int):
    stmt = select(models.Cart).where(models.Cart.user_id == user_id, models.Cart.product_id == product_id)
    result = await db.execute(stmt)
    cart_item = result.scalars().first()
    
    if cart_item:
        if quantity <= 0:
            await db.delete(cart_item)
            await db.commit()
            return None
        else:
            product = await get_product(db, product_id)
            if product is None:
                raise HTTPException(status_code=404, detail="Product not found")
            if product.stock < quantity:
                raise HTTPException(status_code=400, detail="Requested quantity exceeds stock")
            cart_item.quantity = quantity
            await db.commit()
            
            stmt = select(models.Cart).options(selectinload(models.Cart.product)).where(models.Cart.id == cart_item.id)
            result = await db.execute(stmt)
            return result.scalars().first()
    return None

async def delete_cart_item(db: AsyncSession, user_id: UUID, product_id: UUID):
    stmt = select(models.Cart).where(models.Cart.user_id == user_id, models.Cart.product_id == product_id)
    result = await db.execute(stmt)
    cart_item = result.scalars().first()
    if cart_item:
        await db.delete(cart_item)
        await db.commit()
    return cart_item

async def clear_cart(db: AsyncSession, user_id: UUID):
    stmt = delete(models.Cart).where(models.Cart.user_id == user_id)
    await db.execute(stmt)
    await db.commit()

def _resolve_payment_status(payload: schemas.CheckoutRequest) -> tuple[schemas.PaymentStatus, str | None]:
    if payload.payment_method == schemas.PaymentMethod.CASH_ON_DELIVERY:
        return schemas.PaymentStatus.PENDING, None

    card_number = "".join(character for character in (payload.card_number or "") if character.isdigit())
    cvv = "".join(character for character in (payload.cvv or "") if character.isdigit())
    holder_name = (payload.card_holder_name or "").strip()
    current_time = datetime.utcnow()
    expiry_month = payload.expiry_month
    expiry_year = payload.expiry_year
    valid_expiry = (
        expiry_month is not None
        and expiry_year is not None
        and (
            expiry_year > current_time.year
            or (expiry_year == current_time.year and expiry_month >= current_time.month)
        )
    )
    payment_succeeded = bool(holder_name) and 12 <= len(card_number) <= 19 and len(cvv) in {3, 4} and valid_expiry

    if payment_succeeded:
        return schemas.PaymentStatus.PAID, card_number[-4:]

    return schemas.PaymentStatus.FAILED, card_number[-4:] or None


def _status_affects_inventory(status: str) -> bool:
    return status in INVENTORY_TRACKED_ORDER_STATUSES


async def checkout_cart_atomic(db: AsyncSession, user_id: UUID, payload: schemas.CheckoutRequest):
    try:
        cart_stmt = (
            select(models.Cart)
            .where(models.Cart.user_id == user_id)
            .with_for_update()
        )
        cart_result = await db.execute(cart_stmt)
        cart_items = cart_result.scalars().all()

        if not cart_items:
            raise HTTPException(status_code=400, detail="Cart is empty")

        product_ids = [item.product_id for item in cart_items]
        products_stmt = (
            select(models.Product)
            .where(models.Product.id.in_(product_ids))
            .with_for_update()
        )
        products_result = await db.execute(products_stmt)
        locked_products = {product.id: product for product in products_result.scalars().all()}

        total_amount = Decimal("0.00")
        payment_status, card_last4 = _resolve_payment_status(payload)
        order_status = (
            schemas.OrderStatus.ORDER_PLACED.value
            if payment_status == schemas.PaymentStatus.PAID
            else schemas.OrderStatus.PENDING.value
        )
        new_order = models.Order(
            user_id=user_id,
            total_amount=Decimal("0.00"),
            status=order_status,
            customer_name=payload.customer_name.strip(),
            customer_email=payload.customer_email,
            customer_phone=payload.customer_phone.strip(),
            address_line1=payload.address_line1.strip(),
            address_line2=(payload.address_line2 or "").strip() or None,
            city=payload.city.strip(),
            state=payload.state.strip(),
            postal_code=payload.postal_code.strip(),
            country=payload.country.strip(),
            payment_method=payload.payment_method.value,
            payment_status=payment_status.value,
            card_last4=card_last4,
        )
        db.add(new_order)
        await db.flush()

        for item in cart_items:
            product = locked_products.get(item.product_id)
            if product is None:
                raise HTTPException(status_code=404, detail="One or more products no longer exist")
            if _status_affects_inventory(order_status) and product.stock < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Not enough stock for product {product.name}",
                )

            total_amount += product.price * item.quantity
            db.add(
                models.OrderItem(
                    order_id=new_order.id,
                    product_id=product.id,
                    quantity=item.quantity,
                    price=product.price,
                )
            )
            if _status_affects_inventory(order_status):
                product.stock -= item.quantity

        new_order.total_amount = total_amount
        await db.execute(delete(models.Cart).where(models.Cart.user_id == user_id))
        await db.commit()
    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        raise

    stmt = select(models.Order).options(selectinload(models.Order.items).selectinload(models.OrderItem.product)).where(models.Order.id == new_order.id)
    result = await db.execute(stmt)
    return result.scalars().first()

async def get_user_orders(db: AsyncSession, user_id: UUID):
    stmt = select(models.Order).options(selectinload(models.Order.items).selectinload(models.OrderItem.product)).where(models.Order.user_id == user_id).order_by(models.Order.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()

async def get_all_orders(db: AsyncSession):
    stmt = select(models.Order).options(selectinload(models.Order.items).selectinload(models.OrderItem.product)).order_by(models.Order.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


async def get_admin_navbar_summary(db: AsyncSession):
    total_orders_result = await db.execute(select(func.count(models.Order.id)))
    total_cart_items_result = await db.execute(select(func.coalesce(func.sum(models.Cart.quantity), 0)))

    return schemas.AdminNavbarSummary(
        total_orders=int(total_orders_result.scalar_one() or 0),
        total_cart_items=int(total_cart_items_result.scalar_one() or 0),
    )


async def update_order_status(db: AsyncSession, order_id: UUID, status: schemas.OrderStatus):
    stmt = (
        select(models.Order)
        .options(selectinload(models.Order.items).selectinload(models.OrderItem.product))
        .where(models.Order.id == order_id)
    )
    result = await db.execute(stmt)
    order = result.scalars().first()
    if order is None:
        return None

    previous_status = order.status
    next_status = status.value

    if previous_status != next_status:
        was_tracking_inventory = _status_affects_inventory(previous_status)
        will_track_inventory = _status_affects_inventory(next_status)

        if not was_tracking_inventory and will_track_inventory:
            for item in order.items:
                if item.product is None:
                    raise HTTPException(status_code=404, detail="One or more products no longer exist")
                if item.product.stock < item.quantity:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Not enough stock for product {item.product.name}",
                    )
            for item in order.items:
                item.product.stock -= item.quantity

        if was_tracking_inventory and not will_track_inventory:
            for item in order.items:
                if item.product is not None:
                    item.product.stock += item.quantity

    order.status = next_status
    await db.commit()
    stmt = (
        select(models.Order)
        .options(selectinload(models.Order.items).selectinload(models.OrderItem.product))
        .where(models.Order.id == order_id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()
