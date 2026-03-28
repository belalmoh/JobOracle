from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.job_service import job_service
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


router = APIRouter(prefix="/jobs")


class JobSearchRequest(BaseModel):
    keywords: str
    location: str
    job_sources: Optional[List[str]] = None


class JobScoreRequest(BaseModel):
    job_id: int


class JobScoreResponse(BaseModel):
    job_id: int
    score: float
    matched_keywords: List[str]
    explanation: str


class JobScoreAllRequest(BaseModel):
    job_ids: Optional[List[int]] = None


class JobScoreAllResponse(BaseModel):
    jobs: List[JobScoreResponse]
    total_scored: int


class JobResponse(BaseModel):
    id: int
    external_id: Optional[str]
    title: str
    company: str
    location: Optional[str]
    description: Optional[str]
    requirements: Optional[str]
    apply_url: Optional[str]
    source: str
    posted_date: Optional[datetime]
    salary: Optional[str]
    compatibility_score: Optional[float]
    match_keywords: List
    is_duplicate: bool
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/search")
async def search_jobs(
    request: JobSearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """Search jobs using jobspy library and save to database."""
    try:
        result = await job_service.search_and_save_jobs(
            db=db,
            keywords=request.keywords,
            location=request.location,
            job_sources=request.job_sources,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")


@router.get("", response_model=List[JobResponse])
async def get_jobs(
    source: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None, ge=0, le=100),
    sort: str = Query("score", description="Sort by: score, date, source"),
    db: AsyncSession = Depends(get_db),
):
    """List saved jobs with optional filters and sorting."""
    jobs = await job_service.get_jobs(
        db=db,
        source=source,
        location=location,
        date_from=date_from,
        min_score=min_score,
        sort=sort,
    )
    return jobs


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single job by ID."""
    job = await job_service.get_job_by_id(db, job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.post("/score", response_model=JobScoreResponse)
async def score_single_job(
    request: JobScoreRequest,
    db: AsyncSession = Depends(get_db),
):
    """Score a single job against user's keywords."""
    try:
        result = await job_service.score_job_and_save(db, request.job_id)
        return JobScoreResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scoring failed: {str(e)}")


@router.post("/score-all", response_model=JobScoreAllResponse)
async def score_all_jobs(
    request: JobScoreAllRequest,
    db: AsyncSession = Depends(get_db),
):
    """Score all jobs for the current user."""
    result = await job_service.score_all_jobs(db, request.job_ids)
    return JobScoreAllResponse(
        jobs=[JobScoreResponse(**job) for job in result["jobs"]],
        total_scored=result["total_scored"],
    )
