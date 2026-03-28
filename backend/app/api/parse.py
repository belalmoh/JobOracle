from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Resume
from app.services.parse_service import resume_parser_service

router = APIRouter()


class ParseRequest(BaseModel):
    resume_id: int


@router.post("/parse")
async def parse_resume(request: ParseRequest, db: AsyncSession = Depends(get_db)):
    resume_id = request.resume_id
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == 1)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.extracted_text:
        raise HTTPException(status_code=400, detail="No extracted text to parse")

    try:
        parsed_data = resume_parser_service.parse(resume.extracted_text)

        resume.parsed_data = parsed_data
        resume.status = "parsed"
        await db.commit()
        await db.refresh(resume)

        return {
            "resume_id": resume.id,
            "parsed_data": parsed_data,
            "status": resume.status,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parse failed: {str(e)}")


@router.get("/resumes/{resume_id}/parsed")
async def get_parsed_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == 1)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    return {
        "id": resume.id,
        "parsed_data": resume.parsed_data,
        "extracted_text": resume.extracted_text,
        "status": resume.status,
    }
