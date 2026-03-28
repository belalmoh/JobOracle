from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.resume_service import resume_service


router = APIRouter()


class ParseRequest(BaseModel):
    resume_id: int


@router.post("/parse")
async def parse_resume(request: ParseRequest, db: AsyncSession = Depends(get_db)):
    """Parse a resume."""
    try:
        return await resume_service.parse_resume(db, request.resume_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/resumes/{resume_id}/parsed")
async def get_parsed_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    """Get parsed resume data."""
    try:
        return await resume_service.get_parsed_resume(db, resume_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
