from typing import Optional, List, Dict, Any
from pathlib import Path
import os
import aiofiles

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete

from app.models import Application, Keyword, Resume, User, UserSettings
from app.services.parse_service import resume_parser_service


ALLOWED_EXTENSIONS = {".pdf", ".docx"}
MAX_FILE_SIZE = 10 * 1024 * 1024
UPLOAD_DIR = Path("backend/uploads")


class ResumeService:
    """Service for resume-related business logic."""

    def __init__(self):
        UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    async def ensure_user_exists(self, db: AsyncSession, user_id: int = 1) -> User:
        """Ensure user exists, create if not."""
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if not user:
            user = User(id=user_id)
            db.add(user)
            await db.commit()
        return user

    async def upload_resume(
        self,
        db: AsyncSession,
        filename: str,
        file_ext: str,
        file_content: bytes,
        user_id: int = 1,
    ) -> Dict[str, Any]:
        """Upload and save a resume file."""
        await self.ensure_user_exists(db, user_id)

        file_path = UPLOAD_DIR / f"{user_id}_{filename}"
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(file_content)

        resume = Resume(
            user_id=user_id,
            filename=filename,
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

    async def get_resumes(
        self, db: AsyncSession, user_id: int = 1
    ) -> List[Dict[str, Any]]:
        """Get all resumes for a user."""
        result = await db.execute(
            select(Resume)
            .where(Resume.user_id == user_id)
            .order_by(Resume.created_at.desc())
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

    async def get_resume(
        self, db: AsyncSession, resume_id: int, user_id: int = 1
    ) -> Optional[Resume]:
        """Get a single resume by ID."""
        result = await db.execute(
            select(Resume).where(Resume.id == resume_id, Resume.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def extract_text(
        self, db: AsyncSession, resume_id: int, user_id: int = 1
    ) -> Dict[str, Any]:
        """Extract text from a resume file."""
        resume = await self.get_resume(db, resume_id, user_id)
        if not resume:
            raise ValueError("Resume not found")

        if not resume.file_path:
            raise ValueError("No file path for resume")

        try:
            if resume.file_type == "pdf":
                import fitz

                doc = fitz.open(resume.file_path)
                text = "\n".join([page.get_text() for page in doc])
                doc.close()
            elif resume.file_type == "docx":
                import docx

                doc = docx.Document(resume.file_path)
                text = "\n".join([para.text for para in doc.paragraphs])
            else:
                raise ValueError("Unsupported file type")

            resume.extracted_text = text
            resume.status = "extracted"
            await db.commit()
            await db.refresh(resume)

            return {
                "resume_id": resume.id,
                "extracted_text": text,
                "status": resume.status,
            }
        except Exception as e:
            raise ValueError(f"Extraction failed: {str(e)}")

    async def parse_resume(
        self, db: AsyncSession, resume_id: int, user_id: int = 1
    ) -> Dict[str, Any]:
        """Parse a resume using the parser service."""
        resume = await self.get_resume(db, resume_id, user_id)
        if not resume:
            raise ValueError("Resume not found")

        if not resume.extracted_text:
            raise ValueError("No extracted text to parse")

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
            raise ValueError(f"Parse failed: {str(e)}")

    async def get_parsed_resume(
        self, db: AsyncSession, resume_id: int, user_id: int = 1
    ) -> Dict[str, Any]:
        """Get parsed data for a resume."""
        resume = await self.get_resume(db, resume_id, user_id)
        if not resume:
            raise ValueError("Resume not found")

        return {
            "id": resume.id,
            "parsed_data": resume.parsed_data,
            "extracted_text": resume.extracted_text,
            "status": resume.status,
        }

    async def delete_resume(
        self, db: AsyncSession, resume_id: int, user_id: int = 1
    ) -> Dict[str, Any]:
        """Delete a resume and optionally clear user data if no resumes left."""
        resume = await self.get_resume(db, resume_id, user_id)
        if not resume:
            raise ValueError("Resume not found")

        if resume.file_path and os.path.exists(resume.file_path):
            os.remove(resume.file_path)

        await db.delete(resume)

        result = await db.execute(select(Resume).where(Resume.user_id == user_id))
        remaining_resumes = result.scalars().all()

        if not remaining_resumes:
            await db.execute(delete(Keyword).where(Keyword.user_id == user_id))
            await db.execute(
                delete(UserSettings).where(UserSettings.user_id == user_id)
            )
            await db.execute(delete(Application).where(Application.user_id == user_id))

        await db.commit()

        return {"message": "Resume deleted", "cleared_user_data": not remaining_resumes}


resume_service = ResumeService()
