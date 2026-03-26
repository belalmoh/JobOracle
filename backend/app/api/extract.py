from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Resume
import pymupdf as fitz
import docx

router = APIRouter()


class ExtractRequest(BaseModel):
    resume_id: int


@router.post("/extract")
async def extract_text(request: ExtractRequest, db: AsyncSession = Depends(get_db)):
    resume_id = request.resume_id
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == 1)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.file_path:
        raise HTTPException(status_code=400, detail="No file path for resume")

    try:
        if resume.file_type == "pdf":
            doc = fitz.open(resume.file_path)
            text = "\n".join([page.get_text() for page in doc])
            doc.close()
        elif resume.file_type == "docx":
            doc = docx.Document(resume.file_path)
            text = "\n".join([para.text for para in doc.paragraphs])
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")

        resume.extracted_text = text
        resume.status = "extracted"
        await db.commit()
        await db.refresh(resume)

        return {"resume_id": resume.id, "extracted_text": text, "status": resume.status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Extraction failed: {str(e)}")


@router.get("/resumes/{resume_id}")
async def get_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == 1)
    )
    resume = result.scalar_one_or_none()
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
