from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.settings_service import settings_service
from pydantic import BaseModel
from typing import Optional, List


router = APIRouter()


class SettingsUpdate(BaseModel):
    job_sources: List[str] = []
    default_keywords: List[str] = []
    default_location: Optional[str] = None
    notification_email: bool = False
    notification_browser: bool = False
    notification_frequency: str = "instant"


@router.get("/settings")
async def get_settings(db: AsyncSession = Depends(get_db)):
    """Get user settings."""
    return await settings_service.get_settings(db)


@router.post("/settings")
async def update_settings(data: SettingsUpdate, db: AsyncSession = Depends(get_db)):
    """Update user settings."""
    return await settings_service.update_settings(
        db=db,
        job_sources=data.job_sources,
        default_keywords=data.default_keywords,
        default_location=data.default_location,
        notification_email=data.notification_email,
        notification_browser=data.notification_browser,
        notification_frequency=data.notification_frequency,
    )
