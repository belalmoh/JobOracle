from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    JSON,
    Float,
    Boolean,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    resumes = relationship(
        "Resume", back_populates="user", cascade="all, delete-orphan"
    )
    keywords = relationship(
        "Keyword", back_populates="user", cascade="all, delete-orphan"
    )
    settings = relationship(
        "UserSettings",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    applications = relationship(
        "Application", back_populates="user", cascade="all, delete-orphan"
    )


class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_type = Column(String(10), nullable=False)
    file_path = Column(String(500), nullable=False)
    extracted_text = Column(Text, nullable=True)
    parsed_data = Column(JSON, nullable=True)
    status = Column(String(20), default="pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="resumes")


class Keyword(Base):
    __tablename__ = "keywords"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    keyword = Column(String(255), nullable=False)
    source = Column(String(20), default="manual")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="keywords")


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
    status = Column(String(20), default="active")  # active, expired, saved
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship for duplicate tracking
    duplicate_of = relationship("Job", remote_side=[id], foreign_keys=[duplicate_of_id])


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    job_title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    job_url = Column(String(500), nullable=True)
    status = Column(String(20), default="pending")
    notes = Column(Text, nullable=True)
    applied_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    user = relationship("User", back_populates="applications")
