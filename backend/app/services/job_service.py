from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
import pandas as pd

from app.models import Job, Keyword, UserSettings


JOBSPY_SOURCES = {
    "linkedin": "linkedin",
    "indeed": "indeed",
    "ziprecruiter": "ziprecruiter",
    "glassdoor": "glassdoor",
    "google": "google",
}


class JobService:
    """Service for job-related business logic."""

    async def get_user_settings(self, db: AsyncSession) -> dict:
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
        self, db: AsyncSession, title: str, company: str, location: str
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

    async def get_user_keywords(self, db: AsyncSession) -> List[str]:
        """Fetch all keywords for the current user."""
        result = await db.execute(select(Keyword).where(Keyword.user_id == 1))
        keywords = result.scalars().all()
        return [str(k.keyword) for k in keywords]

    def calculate_keyword_overlap(
        self, job_text: str, user_keywords: List[str]
    ) -> tuple[List[str], float]:
        """Calculate keyword overlap between job text and user keywords."""
        if not user_keywords:
            return [], 0.0

        job_text_lower = job_text.lower()
        matched = [kw for kw in user_keywords if kw.lower() in job_text_lower]

        keyword_score = (len(matched) / len(user_keywords)) * 100
        return matched, round(keyword_score, 2)

    async def calculate_semantic_similarity(
        self, job_text: str, user_keywords: List[str]
    ) -> float:
        """Calculate semantic similarity using Ollama LLM."""
        if not user_keywords:
            return 0.0

        truncated_job = job_text[:1000] if len(job_text) > 1000 else job_text
        keywords_str = ", ".join(user_keywords[:20])

        prompt = f"""Rate how well this job matches the resume keywords from 0-100.

Job description:
{truncated_job}

Resume keywords: {keywords_str}

Respond with ONLY a number from 0-100. No explanation."""

        try:
            import urllib.request
            import urllib.error
            import json

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

                import re

                match = re.search(r"\d+", content)
                if match:
                    score = float(match.group())
                    return min(100.0, max(0.0, score))
        except Exception as e:
            print(f"Semantic similarity calculation failed: {e}")

        return 50.0

    async def score_job(self, db: AsyncSession, job: Job) -> dict:
        """Score a single job against user's keywords."""
        user_keywords = await self.get_user_keywords(db)

        if not user_keywords:
            return {
                "score": 0.0,
                "matched_keywords": [],
                "explanation": "No keywords configured. Add keywords to see match scores.",
            }

        job_text = f"{job.title} {job.description or ''} {job.requirements or ''}"

        matched_keywords, keyword_score = self.calculate_keyword_overlap(
            job_text, user_keywords
        )

        semantic_score = await self.calculate_semantic_similarity(
            job_text, user_keywords
        )

        final_score = round((keyword_score * 0.3) + (semantic_score * 0.7), 2)

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

    def scrape_jobs_from_source(
        self, source: str, keywords: str, location: str, results_wanted: int = 20
    ) -> List[Dict[str, Any]]:
        """Scrape jobs from a single source using jobspy."""
        from jobspy import scrape_jobs

        jobspy_source = JOBSPY_SOURCES.get(source.lower())
        if not jobspy_source:
            return []

        try:
            jobs = scrape_jobs(
                site_name=[jobspy_source],
                search_term=keywords,
                location=location,
                results_wanted=results_wanted,
            )

            if jobs is None or jobs.empty:
                return []

            scraped_jobs = []
            for _, row in jobs.iterrows():
                if pd.isna(row.get("title")) or pd.isna(row.get("company")):
                    continue

                salary = None
                if pd.notna(row.get("min_amount")) and pd.notna(row.get("max_amount")):
                    interval = row.get("interval", "")
                    salary = (
                        f"{row.get('min_amount')}-{row.get('max_amount')} {interval}"
                    )
                elif pd.notna(row.get("min_amount")):
                    salary = str(row.get("min_amount"))

                job_location = row.get("location")
                if pd.isna(job_location):
                    job_location = None

                job_data = {
                    "title": str(row.get("title", "")),
                    "company": str(row.get("company", "")),
                    "location": str(job_location) if job_location else None,
                    "description": str(row.get("description", ""))
                    if pd.notna(row.get("description"))
                    else None,
                    "requirements": str(row.get("skills", ""))
                    if pd.notna(row.get("skills"))
                    else None,
                    "apply_url": str(row.get("job_url", ""))
                    if pd.notna(row.get("job_url"))
                    else None,
                    "source": source,
                    "salary": salary,
                    "external_id": str(row.get("id", ""))
                    if pd.notna(row.get("id"))
                    else None,
                }

                posted_date = row.get("date_posted")
                if pd.notna(posted_date):
                    try:
                        job_data["posted_date"] = pd.to_datetime(posted_date)
                    except:
                        job_data["posted_date"] = None

                scraped_jobs.append(job_data)

            return scraped_jobs

        except Exception as e:
            print(f"Error scraping {source}: {e}")
            return []

    async def search_and_save_jobs(
        self,
        db: AsyncSession,
        keywords: str,
        location: str,
        job_sources: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Search jobs from multiple sources and save to database."""
        settings = await self.get_user_settings(db)

        if not job_sources:
            job_sources = settings.get("job_sources", [])

        if not job_sources:
            job_sources = list(JOBSPY_SOURCES.keys())

        if not keywords and settings.get("default_keywords"):
            keywords = " ".join(settings["default_keywords"])

        if not location and settings.get("default_location"):
            location = settings["default_location"]

        if not keywords or not location:
            raise ValueError("Keywords and location are required")

        all_jobs = []
        for source in job_sources:
            scraped = self.scrape_jobs_from_source(source, keywords, location)
            all_jobs.extend(scraped)

        saved_jobs = []
        for job_data in all_jobs:
            existing = await self.is_duplicate(
                db,
                job_data["title"],
                job_data["company"],
                job_data["location"],
            )

            if existing:
                existing.is_duplicate = True
                saved_jobs.append(existing)
            else:
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

        for job in saved_jobs:
            await db.refresh(job)

        return {
            "jobs": saved_jobs,
            "total": len(saved_jobs),
            "sources_searched": job_sources,
        }

    async def get_jobs(
        self,
        db: AsyncSession,
        source: Optional[str] = None,
        location: Optional[str] = None,
        date_from: Optional[str] = None,
        min_score: Optional[float] = None,
        sort: str = "score",
    ) -> List[Job]:
        """Get jobs with optional filters and sorting."""
        if sort == "score":
            query = select(Job).order_by(Job.compatibility_score.desc().nullslast())
        elif sort == "source":
            query = select(Job).order_by(Job.source, Job.created_at.desc())
        else:
            query = select(Job).order_by(
                Job.posted_date.desc().nullslast(), Job.created_at.desc()
            )

        if source:
            query = query.where(Job.source == source)
        if location:
            query = query.where(Job.location.ilike(f"%{location}%"))
        if date_from:
            try:
                from_date = datetime.fromisoformat(date_from)
                query = query.where(Job.posted_date >= from_date)
            except ValueError:
                pass
        if min_score is not None:
            query = query.where(Job.compatibility_score >= min_score)

        result = await db.execute(query)
        jobs = result.scalars().all()

        return list(jobs)

    async def get_job_by_id(self, db: AsyncSession, job_id: int) -> Optional[Job]:
        """Get a single job by ID."""
        result = await db.execute(select(Job).where(Job.id == job_id))
        return result.scalar_one_or_none()

    async def score_job_and_save(self, db: AsyncSession, job_id: int) -> Dict[str, Any]:
        """Score a single job and save to database."""
        job = await self.get_job_by_id(db, job_id)
        if not job:
            raise ValueError("Job not found")

        score_result = await self.score_job(db, job)

        job.compatibility_score = score_result["score"]
        job.match_keywords = score_result["matched_keywords"]
        await db.commit()
        await db.refresh(job)

        return {
            "job_id": int(job.id),
            "score": score_result["score"],
            "matched_keywords": score_result["matched_keywords"],
            "explanation": score_result["explanation"],
        }

    async def score_all_jobs(
        self, db: AsyncSession, job_ids: Optional[List[int]] = None
    ) -> Dict[str, Any]:
        """Score all jobs for the current user."""
        if job_ids:
            query = select(Job).where(Job.id.in_(job_ids))
        else:
            query = select(Job).where(Job.status == "active")

        result = await db.execute(query)
        jobs = result.scalars().all()

        if not jobs:
            return {"jobs": [], "total_scored": 0}

        scored_jobs = []
        for job in jobs:
            score_result = await self.score_job(db, job)

            job.compatibility_score = score_result["score"]
            job.match_keywords = score_result["matched_keywords"]

            scored_jobs.append(
                {
                    "job_id": int(job.id),
                    "score": score_result["score"],
                    "matched_keywords": score_result["matched_keywords"],
                    "explanation": score_result["explanation"],
                }
            )

        await db.commit()

        scored_jobs.sort(key=lambda x: x["score"], reverse=True)

        return {"jobs": scored_jobs, "total_scored": len(scored_jobs)}


job_service = JobService()
