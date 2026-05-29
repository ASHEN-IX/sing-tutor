import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient

logger = logging.getLogger(__name__)

MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
DB_NAME = "singing_tutor"

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    def connect(cls):
        if not cls.client:
            logger.info(f"Connecting to MongoDB at {MONGODB_URL}")
            cls.client = AsyncIOMotorClient(MONGODB_URL)
            cls.db = cls.client[DB_NAME]
            logger.info("Connected to MongoDB successfully.")

    @classmethod
    def disconnect(cls):
        if cls.client:
            cls.client.close()
            cls.client = None
            logger.info("Disconnected from MongoDB.")

    @classmethod
    def get_db(cls):
        if not cls.client:
            cls.connect()
        return cls.db

db_manager = DatabaseManager()

async def get_database():
    return db_manager.get_db()
