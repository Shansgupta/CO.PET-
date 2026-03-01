from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from fastapi import HTTPException, status

from app.core.config import settings

client: AsyncIOMotorClient | None = None
db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global client, db
    client = AsyncIOMotorClient(settings.mongo_url, serverSelectionTimeoutMS=5000)
    db = client[settings.mongo_db]
    await client.admin.command("ping")


async def close_mongo_connection() -> None:
    global client, db
    if client:
        client.close()
        client = None
        db = None


def get_db() -> AsyncIOMotorDatabase:
    global client, db
    if db is None:
        # Lazy init fallback for reload/lifespan edge cases.
        client = AsyncIOMotorClient(settings.mongo_url, serverSelectionTimeoutMS=5000)
        db = client[settings.mongo_db]
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not initialized. Check backend startup logs.",
        )
    return db
