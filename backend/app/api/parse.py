from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import Resume, Keyword
import json

router = APIRouter()

PARSED_SCHEMA = {
    "contact": {"name": "", "email": "", "phone": "", "location": ""},
    "summary": "",
    "skills": [],
    "experience": [],
    "education": [],
}


class ParseRequest(BaseModel):
    resume_id: int


class ParseResponse(BaseModel):
    resume_id: int
    parsed_data: dict
    status: str


@router.post("/parse")
async def parse_resume(request: ParseRequest, db: AsyncSession = Depends(get_db)):
    resume_id = request.resume_id
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == 1)
    )
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == 1)
    )
    resume = result.scalar_one_or_none()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.extracted_text:
        raise HTTPException(status_code=400, detail="No extracted text to parse")

    try:
        parsed_data = json.loads(json.dumps(PARSED_SCHEMA))

        text = resume.extracted_text.lower()

        skills_list = []
        tech_keywords = [
            "python",
            "javascript",
            "typescript",
            "react",
            "node",
            "sql",
            "aws",
            "docker",
            "kubernetes",
            "git",
            "html",
            "css",
            "java",
            "c++",
            "golang",
            "rust",
            "php",
            "ruby",
            "swift",
            "kotlin",
            "scala",
            "r",
            "matlab",
            "pandas",
            "numpy",
            "scikit",
            "tensorflow",
            "pytorch",
            "keras",
            "sqlalchemy",
            "fastapi",
            "flask",
            "django",
            "spring",
            "express",
            "angular",
            "vue",
            "svelte",
            "nextjs",
            "graphql",
            "rest",
            "api",
            "microservices",
            "linux",
            "bash",
            "shell",
            "jenkins",
            "ci/cd",
            "agile",
            "scrum",
            "jira",
            "confluence",
        ]

        for skill in tech_keywords:
            if skill in text:
                skills_list.append(skill)

        parsed_data["skills"] = list(set(skills_list))
        parsed_data["summary"] = "Experienced professional with technical expertise."
        parsed_data["experience"] = []
        parsed_data["education"] = []

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
