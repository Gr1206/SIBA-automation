from fastapi import APIRouter
from datetime import date
from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.db.session import Base


#router = APIRouter(prefix="/api/reservations", tags=["Reservations API"])

class Reservation(Base):
    __tablename__ = "reservations"

    id = Column(Integer, primary_key=True, index=True)
    #code = Column(Integer, unique=True, index=True)
    guest_name = Column(String, index=True)
    guest_count = Column(Integer)
    check_in = Column(Date)
    check_out = Column(Date)
    status = Column(String, default="Pending")
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="reservations")
#eventualmente vou ter de colocar um sitio para guardar os ficheiros enviados
#nao quero ficar com os dados específicos das pessoas