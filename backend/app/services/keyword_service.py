from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models.models import Keyword


class KeywordService:
    """Service for keyword-related business logic."""

    async def create_keyword(
        self, db: AsyncSession, keyword: str, user_id: int = 1
    ) -> Dict[str, Any]:
        """Create a new keyword or return existing one."""
        result = await db.execute(
            select(Keyword).where(
                Keyword.user_id == user_id, Keyword.keyword.ilike(keyword)
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            return {
                "id": existing.id,
                "keyword": existing.keyword,
                "source": existing.source,
                "already_exists": True,
            }

        new_keyword = Keyword(user_id=user_id, keyword=keyword.strip(), source="manual")
        db.add(new_keyword)
        await db.commit()
        await db.refresh(new_keyword)

        return {
            "id": new_keyword.id,
            "keyword": new_keyword.keyword,
            "source": new_keyword.source,
            "already_exists": False,
        }

    async def get_keywords(
        self,
        db: AsyncSession,
        search: Optional[str] = None,
        limit: int = 50,
        user_id: int = 1,
    ) -> List[Dict[str, Any]]:
        """Get keywords with optional search filter."""
        query = select(Keyword).where(Keyword.user_id == user_id)

        if search:
            query = query.where(Keyword.keyword.ilike(f"%{search}%"))

        query = query.order_by(Keyword.keyword).limit(limit)

        result = await db.execute(query)
        keywords = result.scalars().all()

        return [
            {"id": k.id, "keyword": k.keyword, "source": k.source} for k in keywords
        ]

    async def get_all_keywords(
        self, db: AsyncSession, user_id: int = 1
    ) -> List[Dict[str, Any]]:
        """Get all keywords for a user."""
        result = await db.execute(
            select(Keyword).where(Keyword.user_id == user_id).order_by(Keyword.keyword)
        )
        keywords = result.scalars().all()

        return [
            {"id": k.id, "keyword": k.keyword, "source": k.source} for k in keywords
        ]

    async def update_keywords(
        self, db: AsyncSession, keywords: List[str], user_id: int = 1
    ) -> Dict[str, Any]:
        """Replace all keywords for a user."""
        await db.execute(delete(Keyword).where(Keyword.user_id == user_id))

        for kw in keywords:
            if kw.strip():
                keyword = Keyword(user_id=user_id, keyword=kw.strip(), source="manual")
                db.add(keyword)

        await db.commit()
        return {"message": "Keywords updated", "count": len(keywords)}

    async def delete_keyword(
        self, db: AsyncSession, keyword_id: int, user_id: int = 1
    ) -> Dict[str, Any]:
        """Delete a single keyword."""
        result = await db.execute(
            select(Keyword).where(Keyword.id == keyword_id, Keyword.user_id == user_id)
        )
        keyword = result.scalar_one_or_none()
        if not keyword:
            raise ValueError("Keyword not found")

        await db.delete(keyword)
        await db.commit()
        return {"message": "Keyword deleted"}

    async def search_or_create_keyword(
        self,
        db: AsyncSession,
        keyword: str,
        create_if_not_exists: bool = False,
        user_id: int = 1,
    ) -> Optional[Dict[str, Any]]:
        """Search for a keyword or create it if it doesn't exist."""
        result = await db.execute(
            select(Keyword).where(
                Keyword.user_id == user_id, Keyword.keyword.ilike(keyword)
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            return {
                "id": existing.id,
                "keyword": existing.keyword,
                "source": existing.source,
                "created": False,
            }

        if create_if_not_exists:
            new_keyword = Keyword(
                user_id=user_id, keyword=keyword.strip(), source="manual"
            )
            db.add(new_keyword)
            await db.commit()
            await db.refresh(new_keyword)
            return {
                "id": new_keyword.id,
                "keyword": new_keyword.keyword,
                "source": new_keyword.source,
                "created": True,
            }

        return None


keyword_service = KeywordService()
