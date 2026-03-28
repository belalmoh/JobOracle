from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.resume_service import (
    resume_service,
    MAX_FILE_SIZE,
    ALLOWED_EXTENSIONS,
)
from pathlib import Path


router = APIRouter()


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...), db: AsyncSession = Depends(get_db)
):
    """Upload a resume file."""
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, detail=f"Unsupported file type. Allowed: PDF, DOCX"
        )

    content = await file.read()
    return await resume_service.upload_resume(
        db=db, filename=file.filename, file_ext=file_ext, file_content=content
    )


@router.get("/resumes")
async def get_resumes(db: AsyncSession = Depends(get_db)):
    """Get all resumes."""
    return await resume_service.get_resumes(db)


@router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    """Delete a resume."""
    try:
        return await resume_service.delete_resume(db, resume_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
