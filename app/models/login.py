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

    #other SIBA INFO
    property_name = Column(String, nullable=True)
    property_number = Column(String, nullable=True) ##numero do alojamneot
    ##ou seja se owner tiver vários o siba atribui um numero a todos
    abbreviation = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    postal_zone = Column(String, nullable=True)

    telephone = Column(String, nullable=True)
    contact_name = Column(String, nullable=True)
    check_in_time = Column(String, nullable=True)
    check_out_time = Column(String, nullable=True)


    reservations = relationship("Reservation", back_populates="user")
