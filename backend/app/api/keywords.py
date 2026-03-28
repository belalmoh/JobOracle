from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import get_db
from app.models.models import Keyword
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class KeywordCreate(BaseModel):
    keyword: str


class KeywordUpdate(BaseModel):
    keywords: list[str]


class KeywordSearch(BaseModel):
    keyword: str
    create_if_not_exists: bool = False


@router.post("/keywords")
async def create_keyword(keyword: KeywordCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Keyword).where(
            Keyword.user_id == 1, Keyword.keyword.ilike(keyword.keyword)
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

    new_keyword = Keyword(user_id=1, keyword=keyword.keyword.strip(), source="manual")
    db.add(new_keyword)
    await db.commit()
    await db.refresh(new_keyword)

    return {
        "id": new_keyword.id,
        "keyword": new_keyword.keyword,
        "source": new_keyword.source,
        "already_exists": False,
    }


@router.get("/keywords")
async def get_keywords(
    search: Optional[str] = Query(None, description="Search keyword"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    query = select(Keyword).where(Keyword.user_id == 1)

    if search:
        query = query.where(Keyword.keyword.ilike(f"%{search}%"))

    query = query.order_by(Keyword.keyword).limit(limit)

    result = await db.execute(query)
    keywords = result.scalars().all()
    return [{"id": k.id, "keyword": k.keyword, "source": k.source} for k in keywords]


@router.get("/keywords/all")
async def get_all_keywords(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Keyword).where(Keyword.user_id == 1).order_by(Keyword.keyword)
    )
    keywords = result.scalars().all()
    return [{"id": k.id, "keyword": k.keyword, "source": k.source} for k in keywords]


@router.put("/keywords")
async def update_keywords(data: KeywordUpdate, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Keyword).where(Keyword.user_id == 1))

    for kw in data.keywords:
        if kw.strip():
            keyword = Keyword(user_id=1, keyword=kw.strip(), source="manual")
            db.add(keyword)

    await db.commit()
    return {"message": "Keywords updated", "count": len(data.keywords)}


@router.delete("/keywords/{keyword_id}")
async def delete_keyword(keyword_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Keyword).where(Keyword.id == keyword_id, Keyword.user_id == 1)
    )
    keyword = result.scalar_one_or_none()
    if not keyword:
        raise HTTPException(status_code=404, detail="Keyword not found")

    await db.delete(keyword)
    await db.commit()
    return {"message": "Keyword deleted"}


@router.post("/keywords/search-or-create")
async def search_or_create_keyword(
    data: KeywordSearch, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Keyword).where(Keyword.user_id == 1, Keyword.keyword.ilike(data.keyword))
    )
    existing = result.scalar_one_or_none()

    if existing:
        return {
            "id": existing.id,
            "keyword": existing.keyword,
            "source": existing.source,
            "created": False,
        }

    if data.create_if_not_exists:
        new_keyword = Keyword(user_id=1, keyword=data.keyword.strip(), source="manual")
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


@router.post("/keywords/generate")
async def generate_keywords(db: AsyncSession = Depends(get_db)):
    return {
        "message": "Keyword generation no longer needed - keywords are configured manually"
    }
