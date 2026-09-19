from fastapi import APIRouter
from datetime import date
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship
from app.db.session import Base



class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    nif = Column(String, unique=True, index=True, nullable=True)
    hashed_sibaKey = Column(String, index=True, nullable=True)
    siba_code = Column(String, unique=True, index=True, nullable=True)
    is_active = Column(Boolean, default=1)  # 1 for active, 0 for inactive
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    reservations = relationship("Reservation", back_populates="user")
