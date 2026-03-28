from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.keyword_service import keyword_service
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
    """Create a new keyword."""
    result = await keyword_service.create_keyword(db, keyword.keyword)
    return result


@router.get("/keywords")
async def get_keywords(
    search: Optional[str] = Query(None, description="Search keyword"),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Get keywords with optional search filter."""
    return await keyword_service.get_keywords(db, search, limit)


@router.get("/keywords/all")
async def get_all_keywords(db: AsyncSession = Depends(get_db)):
    """Get all keywords."""
    return await keyword_service.get_all_keywords(db)


@router.put("/keywords")
async def update_keywords(data: KeywordUpdate, db: AsyncSession = Depends(get_db)):
    """Replace all keywords."""
    return await keyword_service.update_keywords(db, data.keywords)


@router.delete("/keywords/{keyword_id}")
async def delete_keyword(keyword_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a keyword."""
    try:
        return await keyword_service.delete_keyword(db, keyword_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/keywords/search-or-create")
async def search_or_create_keyword(
    data: KeywordSearch, db: AsyncSession = Depends(get_db)
):
    """Search for a keyword or create it."""
    result = await keyword_service.search_or_create_keyword(
        db, data.keyword, data.create_if_not_exists
    )
    return result


@router.post("/keywords/generate")
async def generate_keywords(db: AsyncSession = Depends(get_db)):
    """Generate keywords (placeholder)."""
    return {
        "message": "Keyword generation no longer needed - keywords are configured manually"
    }
