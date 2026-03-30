from typing import Optional, List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models import UserSettings


class SettingsService:
    """Service for settings-related business logic."""

    async def get_settings(self, db: AsyncSession, user_id: int = 1) -> Dict[str, Any]:
        """Get user settings or return defaults."""
        result = await db.execute(
            select(UserSettings).where(UserSettings.user_id == user_id)
        )
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

    async def update_settings(
        self,
        db: AsyncSession,
        job_sources: List[str] = None,
        default_keywords: List[str] = None,
        default_location: Optional[str] = None,
        notification_email: bool = False,
        notification_browser: bool = False,
        notification_frequency: str = "instant",
        user_id: int = 1,
    ) -> Dict[str, Any]:
        """Update user settings."""
        if job_sources is None:
            job_sources = []
        if default_keywords is None:
            default_keywords = []

        result = await db.execute(
            select(UserSettings).where(UserSettings.user_id == user_id)
        )
        settings = result.scalar_one_or_none()

        if settings:
            settings.job_sources = job_sources
            settings.default_keywords = default_keywords
            settings.default_location = default_location
            settings.notification_email = notification_email
            settings.notification_browser = notification_browser
            settings.notification_frequency = notification_frequency
        else:
            settings = UserSettings(
                user_id=user_id,
                job_sources=job_sources,
                default_keywords=default_keywords,
                default_location=default_location,
                notification_email=notification_email,
                notification_browser=notification_browser,
                notification_frequency=notification_frequency,
            )
            db.add(settings)

        await db.commit()
        return {"message": "Settings updated"}


settings_service = SettingsService()
