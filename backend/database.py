import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

def clean_database_url(url: str) -> str:
    if not url:
        return url
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]
    elif url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]
    if "sslmode=" in url:
        url = url.replace("sslmode=", "ssl=")
    return url

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://ecommerce_user:ecommerce_password@localhost:5432/ecommerce_db")
DATABASE_URL = clean_database_url(DATABASE_URL)

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with async_session_maker() as session:
        yield session

