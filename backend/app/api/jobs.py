from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.database import get_db
from app.models.models import Job, UserSettings, Keyword
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import pandas as pd
import json
import subprocess

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


async def get_user_keywords(db: AsyncSession) -> List[str]:
    """Fetch all keywords for the current user."""
    result = await db.execute(select(Keyword).where(Keyword.user_id == 1))
    keywords = result.scalars().all()
    return [str(k.keyword) for k in keywords]


def calculate_keyword_overlap(
    job_text: str, user_keywords: List[str]
) -> tuple[List[str], float]:
    """
    Calculate keyword overlap between job text and user keywords.
    Returns matched keywords and score (0-100).
    """
    if not user_keywords:
        return [], 0.0

    job_text_lower = job_text.lower()
    matched = [kw for kw in user_keywords if kw.lower() in job_text_lower]

    keyword_score = (len(matched) / len(user_keywords)) * 100
    return matched, round(keyword_score, 2)


async def calculate_semantic_similarity(
    job_text: str, user_keywords: List[str]
) -> float:
    """
    Calculate semantic similarity using Ollama LLM.
    Returns score (0-100).
    """
    if not user_keywords:
        return 0.0

    # Truncate job text to avoid overly long prompts
    truncated_job = job_text[:1000] if len(job_text) > 1000 else job_text
    keywords_str = ", ".join(user_keywords[:20])  # Limit to 20 keywords

    prompt = f"""Rate how well this job matches the resume keywords from 0-100.

Job description:
{truncated_job}

Resume keywords: {keywords_str}

Respond with ONLY a number from 0-100. No explanation."""

    try:
        # Use Ollama REST API via curl
        import urllib.request
        import urllib.error

        data = json.dumps(
            {
                "model": "llama3.2",
                "messages": [{"role": "user", "content": prompt}],
                "stream": False,
            }
        ).encode("utf-8")

        req = urllib.request.Request(
            "http://localhost:11434/api/chat",
            data=data,
            headers={"Content-Type": "application/json"},
        )

        with urllib.request.urlopen(req, timeout=60) as response:
            result = json.loads(response.read().decode("utf-8"))
            content = result.get("message", {}).get("content", "")

            # Extract numeric score from response
            import re

            match = re.search(r"\d+", content)
            if match:
                score = float(match.group())
                return min(100.0, max(0.0, score))
    except Exception as e:
        print(f"Semantic similarity calculation failed: {e}")

    return 50.0  # Default middle score if Ollama fails


async def score_job(db: AsyncSession, job: Job) -> dict:
    """
    Score a single job against user's keywords.
    Returns dict with score, matched_keywords, and explanation.
    """
    # Get user keywords
    user_keywords = await get_user_keywords(db)

    if not user_keywords:
        return {
            "score": 0.0,
            "matched_keywords": [],
            "explanation": "No keywords configured. Add keywords to see match scores.",
        }

    # Prepare job text for analysis
    job_text = f"{job.title} {job.description or ''} {job.requirements or ''}"

    # Calculate keyword overlap (30% weight)
    matched_keywords, keyword_score = calculate_keyword_overlap(job_text, user_keywords)

    # Calculate semantic similarity (70% weight)
    semantic_score = await calculate_semantic_similarity(job_text, user_keywords)

    # Combine scores
    final_score = round((keyword_score * 0.3) + (semantic_score * 0.7), 2)

    # Generate explanation
    if matched_keywords:
        keywords_str = ", ".join(matched_keywords[:5])
        if len(matched_keywords) > 5:
            keywords_str += f" and {len(matched_keywords) - 5} more"
        explanation = f"Your keywords '{keywords_str}' match this job. Overall match: {final_score}%"
    else:
        explanation = f"No keyword matches found. Overall match: {final_score}%"

    return {
        "score": final_score,
        "matched_keywords": matched_keywords,
        "explanation": explanation,
    }


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
    min_score: Optional[float] = Query(None, ge=0, le=100),
    sort: Optional[str] = Query("score", description="Sort by: score, date, source"),
    db: AsyncSession = Depends(get_db),
):
    """
    List saved jobs with optional filters and sorting.

    - source: filter by job source
    - location: filter by location
    - date_from: filter by posted date (ISO format)
    - min_score: filter by minimum compatibility score (0-100)
    - sort: sort order - "score" (default, descending), "date" (newest first), "source"
    """
    # Determine sort order
    if sort == "score":
        # Score descending, nulls last
        query = select(Job).order_by(Job.compatibility_score.desc().nullslast())
    elif sort == "source":
        query = select(Job).order_by(Job.source, Job.created_at.desc())
    else:  # date or default
        query = select(Job).order_by(
            Job.posted_date.desc().nullslast(), Job.created_at.desc()
        )

    # Apply filters
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
    if min_score is not None:
        query = query.where(Job.compatibility_score >= min_score)

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


@router.post("/score", response_model=JobScoreResponse)
async def score_single_job(
    request: JobScoreRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Score a single job against user's keywords.

    - Calculates keyword overlap (30% weight)
    - Calculates semantic similarity using Ollama (70% weight)
    - Updates job with compatibility_score and match_keywords
    """
    # Fetch the job
    result = await db.execute(select(Job).where(Job.id == request.job_id))
    job = result.scalar_one_or_none()

    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Calculate score
    score_result = await score_job(db, job)

    # Update job in database
    job.compatibility_score = score_result["score"]
    job.match_keywords = score_result["matched_keywords"]
    await db.commit()
    await db.refresh(job)

    return JobScoreResponse(
        job_id=int(job.id),
        score=score_result["score"],
        matched_keywords=score_result["matched_keywords"],
        explanation=score_result["explanation"],
    )


@router.post("/score-all", response_model=JobScoreAllResponse)
async def score_all_jobs(
    request: JobScoreAllRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Score all jobs for the current user.

    - If job_ids provided, scores only those jobs
    - Otherwise scores all active jobs
    - Returns results sorted by score descending
    - Updates all jobs in database with scores
    """
    # Build query
    if request.job_ids:
        query = select(Job).where(Job.id.in_(request.job_ids))
    else:
        query = select(Job).where(Job.status == "active")

    result = await db.execute(query)
    jobs = result.scalars().all()

    if not jobs:
        return JobScoreAllResponse(jobs=[], total_scored=0)

    # Score each job
    scored_jobs = []
    for job in jobs:
        score_result = await score_job(db, job)

        # Update job in database
        job.compatibility_score = score_result["score"]
        job.match_keywords = score_result["matched_keywords"]

        scored_jobs.append(
            JobScoreResponse(
                job_id=int(job.id),
                score=score_result["score"],
                matched_keywords=score_result["matched_keywords"],
                explanation=score_result["explanation"],
            )
        )

    # Save all updates
    await db.commit()

    # Sort by score descending
    scored_jobs.sort(key=lambda x: x.score, reverse=True)

    return JobScoreAllResponse(jobs=scored_jobs, total_scored=len(scored_jobs))
