import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from database import engine, async_session_maker, Base
import models
from auth import get_password_hash

async def seed_db():
    async with async_session_maker() as session:
        # Check if admin exists
        stmt = select(models.User).where(models.User.email == "admin@example.com")
        result = await session.execute(stmt)
        admin = result.scalars().first()

        if not admin:
            print("Creating default admin user...")
            admin = models.User(
                email="admin@example.com",
                hashed_password=get_password_hash("AdminSecurePassword123!"),
                full_name="System Administrator",
                is_admin=True
            )
            session.add(admin)
            await session.commit()
            print("Admin created: admin@example.com / AdminSecurePassword123!")

        # Check products
        stmt = select(models.Product)
        result = await session.execute(stmt)
        products = result.scalars().all()

        if not products:
            print("Seeding products...")
            mock_products = [
                {"name": "Wireless Noise-Canceling Headphones", "description": "Premium over-ear headphones with active noise cancellation and 30-hour battery life.", "price": 299.99, "stock": 100, "image_url": "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80", "category": "Electronics"},
                {"name": "Minimalist Smartwatch", "description": "Sleek smartwatch tracking fitness, sleep, and notifications. Water-resistant up to 50m.", "price": 199.50, "stock": 75, "image_url": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80", "category": "Electronics"},
                {"name": "Mechanical Gaming Keyboard", "description": "RGB backlit mechanical keyboard with tactile switches for precision gaming.", "price": 129.99, "stock": 150, "image_url": "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&q=80", "category": "Electronics"},
                {"name": "Ergonomic Office Chair", "description": "Adjustable lumbar support office chair designed for long hours of comfortable work.", "price": 249.00, "stock": 60, "image_url": "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=500&q=80", "category": "Furniture"},
                {"name": "Ceramic Coffee Mug", "description": "Handcrafted ceramic mug, perfect for your morning coffee or tea. Microwave safe.", "price": 18.00, "stock": 200, "image_url": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=500&q=80", "category": "Home"},
                {"name": "Leather Messenger Bag", "description": "Genuine leather bag with laptop compartment and adjustable strap. Vintage aesthetic.", "price": 145.00, "stock": 55, "image_url": "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&q=80", "category": "Fashion"},
                {"name": "Stainless Steel Water Bottle", "description": "Double-wall vacuum insulated water bottle. Keeps drinks cold for 24 hours.", "price": 35.00, "stock": 300, "image_url": "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500&q=80", "category": "Accessories"},
                {"name": "Yoga Mat with Alignment Lines", "description": "Eco-friendly, non-slip yoga mat with body alignment system.", "price": 45.00, "stock": 120, "image_url": "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500&q=80", "category": "Fitness"},
                {"name": "Portable Bluetooth Speaker", "description": "Compact, waterproof speaker with 360-degree sound and rich bass.", "price": 59.99, "stock": 80, "image_url": "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&q=80", "category": "Electronics"},
                {"name": "Organic Cotton T-Shirt", "description": "Classic fit, ultra-soft organic cotton t-shirt. Ethically sourced and manufactured.", "price": 25.00, "stock": 250, "image_url": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80", "category": "Fashion"}
            ]
            for p_data in mock_products:
                session.add(models.Product(**p_data))
            await session.commit()
            print("Products seeded.")
        else:
            print("Database already seeded.")

if __name__ == "__main__":
    asyncio.run(seed_db())
