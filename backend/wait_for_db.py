import asyncio
import os

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine


DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://ecommerce_user:ecommerce_password@localhost:5432/ecommerce_db",
)
MAX_ATTEMPTS = int(os.getenv("DB_WAIT_MAX_ATTEMPTS", "30"))
SLEEP_SECONDS = float(os.getenv("DB_WAIT_SLEEP_SECONDS", "2"))


async def wait_for_db() -> None:
    engine = create_async_engine(DATABASE_URL, pool_pre_ping=True)

    try:
        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                async with engine.connect() as connection:
                    await connection.execute(text("SELECT 1"))
                print("Database connection established.")
                return
            except Exception as exc:  # pragma: no cover - startup path
                print(f"Database unavailable (attempt {attempt}/{MAX_ATTEMPTS}): {exc}")
                if attempt == MAX_ATTEMPTS:
                    raise
                await asyncio.sleep(SLEEP_SECONDS)
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(wait_for_db())
