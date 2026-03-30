from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    job_sources = Column(JSON, default=list)
    default_keywords = Column(JSON, default=list)
    default_location = Column(String(255), nullable=True)
    notification_email = Column(Boolean, default=False)
    notification_browser = Column(Boolean, default=False)
    notification_frequency = Column(String(20), default="instant")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="settings")