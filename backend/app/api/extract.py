from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.resume_service import resume_service


router = APIRouter()


class ExtractRequest(BaseModel):
    resume_id: int


@router.post("/extract")
async def extract_text(request: ExtractRequest, db: AsyncSession = Depends(get_db)):
    """Extract text from a resume."""
    try:
        return await resume_service.extract_text(db, request.resume_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/resumes/{resume_id}")
async def get_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    """Get a resume by ID."""
    try:
        resume = await resume_service.get_resume(db, resume_id)
        if not resume:
            raise HTTPException(status_code=404, detail="Resume not found")
        return {
            "id": resume.id,
            "filename": resume.filename,
            "file_type": resume.file_type,
            "extracted_text": resume.extracted_text,
            "parsed_data": resume.parsed_data,
            "status": resume.status,
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
