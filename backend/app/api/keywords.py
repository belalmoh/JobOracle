from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from app.database import get_db
from app.models.models import Keyword
from pydantic import BaseModel

router = APIRouter()


class KeywordCreate(BaseModel):
    keyword: str


class KeywordUpdate(BaseModel):
    keywords: list[str]


@router.post("/keywords")
async def create_keyword(keyword: KeywordCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Keyword).where(Keyword.user_id == 1, Keyword.keyword == keyword.keyword)
    )
    existing = result.scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail="Keyword already exists")

    new_keyword = Keyword(user_id=1, keyword=keyword.keyword, source="manual")
    db.add(new_keyword)
    await db.commit()
    await db.refresh(new_keyword)

    return {
        "id": new_keyword.id,
        "keyword": new_keyword.keyword,
        "source": new_keyword.source,
    }


@router.get("/keywords")
async def get_keywords(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Keyword).where(Keyword.user_id == 1))
    keywords = result.scalars().all()
    return [{"id": k.id, "keyword": k.keyword, "source": k.source} for k in keywords]


@router.put("/keywords")
async def update_keywords(data: KeywordUpdate, db: AsyncSession = Depends(get_db)):
    await db.execute(delete(Keyword).where(Keyword.user_id == 1))

    for kw in data.keywords:
        keyword = Keyword(user_id=1, keyword=kw, source="manual")
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


@router.post("/keywords/generate")
async def generate_keywords(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models.models import Resume

    result = await db.execute(
        select(Resume)
        .where(Resume.user_id == 1, Resume.status == "parsed")
        .order_by(Resume.created_at.desc())
    )
    resume = result.scalar_one_or_none()

    if not resume or not resume.parsed_data:
        raise HTTPException(status_code=400, detail="No parsed resume found")

    skills = resume.parsed_data.get("skills", [])
    new_keywords = []

    for skill in skills:
        result = await db.execute(
            select(Keyword).where(Keyword.user_id == 1, Keyword.keyword == skill)
        )
        existing = result.scalar_one_or_none()
        if not existing:
            keyword = Keyword(user_id=1, keyword=skill, source="auto")
            db.add(keyword)
            new_keywords.append(skill)

    await db.commit()
    return {"keywords": new_keywords, "count": len(new_keywords)}
