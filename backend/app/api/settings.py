from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models.models import UserSettings
from pydantic import BaseModel

router = APIRouter()


class SettingsUpdate(BaseModel):
    job_sources: list[str] = []
    default_keywords: list[str] = []
    default_location: str = None
    notification_email: bool = False
    notification_browser: bool = False
    notification_frequency: str = "instant"


@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == 1))
    settings = result.scalar_one_or_none()

    if not settings:
        return {
            "job_sources": [],
            "default_keywords": [],
            "default_location": None,
            "notification_email": False,
            "notification_browser": False,
            "notification_frequency": "instant",
        }

    return {
        "job_sources": settings.job_sources,
        "default_keywords": settings.default_keywords,
        "default_location": settings.default_location,
        "notification_email": settings.notification_email,
        "notification_browser": settings.notification_browser,
        "notification_frequency": settings.notification_frequency,
    }


@router.post("/settings")
async def update_settings(data: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserSettings).where(UserSettings.user_id == 1))
    settings = result.scalar_one_or_none()

    if settings:
        settings.job_sources = data.job_sources
        settings.default_keywords = data.default_keywords
        settings.default_location = data.default_location
        settings.notification_email = data.notification_email
        settings.notification_browser = data.notification_browser
        settings.notification_frequency = data.notification_frequency
    else:
        settings = UserSettings(
            user_id=1,
            job_sources=data.job_sources,
            default_keywords=data.default_keywords,
            default_location=data.default_location,
            notification_email=data.notification_email,
            notification_browser=data.notification_browser,
            notification_frequency=data.notification_frequency,
        )
        db.add(settings)

    await db.commit()
    return {"message": "Settings updated"}
