from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import User, Resume
import aiofiles
import os
from pathlib import Path

router = APIRouter()

ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024

UPLOAD_DIR = Path("backend/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...), db: AsyncSession = Depends(get_db)
):
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400, detail=f"Unsupported file type. Allowed: PDF, DOCX"
        )

    user_id = 1

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        user = User(id=user_id)
        db.add(user)
        await db.commit()

    file_path = UPLOAD_DIR / f"{user_id}_{file.filename}"
    async with aiofiles.open(file_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    resume = Resume(
        user_id=user_id,
        filename=file.filename,
        file_type=file_ext[1:],
        file_path=str(file_path),
        status="uploaded",
    )
    db.add(resume)
    await db.commit()
    await db.refresh(resume)

    return {
        "id": resume.id,
        "filename": resume.filename,
        "file_type": resume.file_type,
        "status": resume.status,
    }


@router.get("/resumes")
async def get_resumes(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Resume).where(Resume.user_id == 1).order_by(Resume.created_at.desc())
    )
    resumes = result.scalars().all()
    return [
        {
            "id": r.id,
            "filename": r.filename,
            "file_type": r.file_type,
            "status": r.status,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in resumes
    ]


@router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == 1)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if resume.file_path and os.path.exists(resume.file_path):
        os.remove(resume.file_path)

    await db.delete(resume)
    await db.commit()

    return {"message": "Resume deleted"}
