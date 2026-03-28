import os
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, AsyncEngine
from sqlalchemy.orm import sessionmaker, declarative_base
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool
from sqlalchemy import text

logger = logging.getLogger(__name__)

Base = declarative_base()

DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://joboracle:joboracle@localhost:5432/joboracle"
)

USE_FALLBACK = os.getenv("USE_SQLITE_FALLBACK", "false").lower() == "true"


class DatabaseManager:
    def __init__(self):
        self._engine: Optional[AsyncEngine] = None
        self._session_factory = None
        self._is_fallback = False

    async def initialize(self) -> bool:
        """Initialize database with PostgreSQL, fallback to SQLite on failure."""

        # Try PostgreSQL first (unless explicitly disabled)
        if not USE_FALLBACK:
            pg_success = await self._try_postgresql()
            if pg_success:
                logger.info("PostgreSQL connection established")
                return True

        # Fallback to SQLite
        logger.warning("Falling back to SQLite database")
        return await self._try_sqlite()

    async def _try_postgresql(self) -> bool:
        """Attempt to connect to PostgreSQL."""
        try:
            engine = create_async_engine(
                DATABASE_URL,
                echo=False,
                poolclass=AsyncAdaptedQueuePool,
                pool_pre_ping=True,
            )

            # Test connection
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))

            self._engine = engine
            self._session_factory = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            self._is_fallback = False
            return True

        except Exception as e:
            logger.warning(f"PostgreSQL connection failed: {e}")
            if self._engine:
                await self._engine.dispose()
            return False

    async def _try_sqlite(self) -> bool:
        """Initialize SQLite fallback."""
        try:
            sqlite_url = "sqlite+aiosqlite:///./joboracle.db"
            engine = create_async_engine(sqlite_url, echo=False, poolclass=NullPool)

            # Create tables
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)

            self._engine = engine
            self._session_factory = sessionmaker(
                engine, class_=AsyncSession, expire_on_commit=False
            )
            self._is_fallback = True
            logger.info("SQLite fallback initialized")
            return True

        except Exception as e:
            logger.error(f"SQLite fallback also failed: {e}")
            raise RuntimeError("Neither PostgreSQL nor SQLite could be initialized")

    @property
    def is_fallback(self) -> bool:
        return self._is_fallback

    @property
    def engine(self) -> AsyncEngine:
        if not self._engine:
            raise RuntimeError("Database not initialized. Call initialize() first.")
        return self._engine

    @property
    def session_factory(self):
        if not self._session_factory:
            raise RuntimeError("Database not initialized. Call initialize() first.")
        return self._session_factory

    async def close(self):
        if self._engine:
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None


# Global database manager instance
db_manager = DatabaseManager()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection for FastAPI endpoints."""
    async with db_manager.session_factory() as session:
        yield session


async def init_db():
    """Initialize database on application startup."""
    await db_manager.initialize()


async def close_db():
    """Close database on application shutdown."""
    await db_manager.close()


async def get_db_info() -> dict:
    """Get database status info."""
    return {
        "database_type": "sqlite" if db_manager.is_fallback else "postgresql",
        "is_fallback": db_manager.is_fallback,
    }
