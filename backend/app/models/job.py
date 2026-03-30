from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    external_id = Column(String(255), nullable=True)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=True)
    description = Column(Text, nullable=True)
    requirements = Column(Text, nullable=True)
    apply_url = Column(String(500), nullable=True)
    source = Column(String(50), nullable=False)
    posted_date = Column(DateTime(timezone=True), nullable=True)
    salary = Column(String(100), nullable=True)
    compatibility_score = Column(Float, nullable=True)
    match_keywords = Column(JSON, default=list)
    is_duplicate = Column(Boolean, default=False)
    duplicate_of_id = Column(Integer, ForeignKey("jobs.id"), nullable=True)
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    duplicate_of = relationship("Job", remote_side=[id], foreign_keys=[duplicate_of_id])