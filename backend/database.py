import os
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

# Parameters that asyncpg does NOT support and must be removed from the URL
_UNSUPPORTED_PARAMS = {"channel_binding", "sslmode"}

def clean_database_url(url: str) -> str:
    """Clean a database URL to be compatible with asyncpg / SQLAlchemy async engine.

    - Rewrites postgresql:// or postgres:// → postgresql+asyncpg://
    - Converts sslmode=require → ssl=require
    - Strips parameters unsupported by asyncpg (e.g. channel_binding)
    """
    if not url:
        return url

    # Fix scheme
    if url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url[len("postgresql://"):]
    elif url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url[len("postgres://"):]

    # Parse the URL so we can cleanly manipulate query params
    parsed = urlparse(url)
    params = parse_qs(parsed.query, keep_blank_values=True)

    # Convert sslmode → ssl
    if "sslmode" in params:
        params["ssl"] = params.pop("sslmode")

    # Remove all unsupported parameters
    for key in _UNSUPPORTED_PARAMS:
        params.pop(key, None)

    # Rebuild the URL with cleaned query string
    # urlencode with doseq=True handles multi-value params correctly
    new_query = urlencode({k: v[0] for k, v in params.items()})
    cleaned = urlunparse(parsed._replace(query=new_query))
    return cleaned

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://ecommerce_user:ecommerce_password@localhost:5432/ecommerce_db")
DATABASE_URL = clean_database_url(DATABASE_URL)

engine = create_async_engine(DATABASE_URL, echo=True)
async_session_maker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()

async def get_db():
    async with async_session_maker() as session:
        yield session

