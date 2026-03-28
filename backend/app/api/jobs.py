from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.database import get_db
from app.models.models import Job, UserSettings
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import pandas as pd

router = APIRouter()


# Pydantic models for request/response
class JobSearchRequest(BaseModel):
    keywords: str
    location: str
    job_sources: Optional[List[str]] = None


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


# Job source mapping for jobspy
JOBSPY_SOURCES = {
    "linkedin": "linkedin",
    "indeed": "indeed",
    "ziprecruiter": "ziprecruiter",
    "glassdoor": "glassdoor",
    "google": "google",
}


async def get_user_settings(db: AsyncSession) -> dict:
    """Fetch user settings, return defaults if not set."""
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == 1))
    settings = result.scalar_one_or_none()

    if not settings:
        return {
            "job_sources": [],
            "default_keywords": [],
            "default_location": None,
        }

    return {
        "job_sources": settings.job_sources or [],
        "default_keywords": settings.default_keywords or [],
        "default_location": settings.default_location,
    }


async def is_duplicate(
    db: AsyncSession, title: str, company: str, location: str
) -> Optional[Job]:
    """Check if a job already exists (duplicate by title + company + location)."""
    result = await db.execute(
        select(Job).where(
            and_(
                Job.title == title,
                Job.company == company,
                Job.location == location,
            )
        )
    )
    return result.scalar_one_or_none()


@router.post("/search")
async def search_jobs(
    request: JobSearchRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Search jobs using jobspy library.

    - Uses user's saved job_sources from settings if not provided
    - Uses user's default_keywords and default_location from settings
    - Saves results to database
    - Marks duplicates
    """
    # Get user settings
    settings = await get_user_settings(db)

    # Determine job sources to search
    job_sources = request.job_sources
    if not job_sources:
        job_sources = settings.get("job_sources", [])

    if not job_sources:
        # Default to all supported sources if none configured
        job_sources = list(JOBSPY_SOURCES.keys())

    # Determine search parameters
    keywords = request.keywords
    location = request.location

    if not keywords and settings.get("default_keywords"):
        keywords = " ".join(settings["default_keywords"])

    if not location and settings.get("default_location"):
        location = settings["default_location"]

    if not keywords or not location:
        raise HTTPException(
            status_code=400,
            detail="Keywords and location are required. Provide them in request or set defaults in settings.",
        )

    # Import jobspy
    try:
        from jobspy import scrape_jobs
    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="jobspy not installed. Run: pip install jobspy",
        )

    # Scrape jobs from each source
    all_jobs = []
    for source in job_sources:
        jobspy_source = JOBSPY_SOURCES.get(source.lower())
        if not jobspy_source:
            continue

        try:
            jobs = scrape_jobs(
                site_name=[jobspy_source],
                search_term=keywords,
                location=location,
                results_wanted=20,
            )

            if jobs is not None and not jobs.empty:
                for _, row in jobs.iterrows():
                    job_data = {
                        "title": row.get("title", ""),
                        "company": row.get("company", ""),
                        "location": row.get("location", ""),
                        "description": row.get("description", ""),
                        "requirements": row.get("requirements", ""),
                        "apply_url": row.get("url", ""),
                        "source": source,
                        "salary": str(row.get("salary", ""))
                        if pd.notna(row.get("salary"))
                        else None,
                        "external_id": str(row.get("job_id", ""))
                        if pd.notna(row.get("job_id"))
                        else None,
                    }

                    # Parse posted_date
                    posted_date = row.get("date_posted")
                    if posted_date is not None:
                        try:
                            job_data["posted_date"] = pd.to_datetime(posted_date)
                        except:
                            job_data["posted_date"] = None

                    all_jobs.append(job_data)
        except Exception as e:
            # Log error but continue with other sources
            print(f"Error scraping {source}: {e}")
            continue

    # Save jobs to database with duplicate detection
    saved_jobs = []
    for job_data in all_jobs:
        # Check for duplicate
        existing = await is_duplicate(
            db,
            job_data["title"],
            job_data["company"],
            job_data["location"],
        )

        if existing:
            # Mark as duplicate
            existing.is_duplicate = True
            saved_jobs.append(existing)
        else:
            # Create new job
            job = Job(
                title=job_data["title"],
                company=job_data["company"],
                location=job_data["location"],
                description=job_data.get("description"),
                requirements=job_data.get("requirements"),
                apply_url=job_data.get("apply_url"),
                source=job_data["source"],
                posted_date=job_data.get("posted_date"),
                salary=job_data.get("salary"),
                external_id=job_data.get("external_id"),
                status="active",
                is_duplicate=False,
            )
            db.add(job)
            saved_jobs.append(job)

    await db.commit()

    # Refresh to get IDs
    for job in saved_jobs:
        await db.refresh(job)

    return {
        "jobs": saved_jobs,
        "total": len(saved_jobs),
        "sources_searched": job_sources,
    }


@router.get("", response_model=List[JobResponse])
async def get_jobs(
    source: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    date_from: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """
    List saved jobs with optional filters.

    - source: filter by job source
    - location: filter by location
    - date_from: filter by posted date (ISO format)
    """
    query = select(Job).order_by(Job.created_at.desc())

    if source:
        query = query.where(Job.source == source)
    if location:
        query = query.where(Job.location.ilike(f"%{location}%"))
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from)
            query = query.where(Job.posted_date >= from_date)
        except ValueError:
            pass  # Ignore invalid date format

    result = await db.execute(query)
    jobs = result.scalars().all()

    return jobs


@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single job by ID."""
    result = await db.execute(select(Job).where(Job.id == job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    return job
