from sqlalchemy import Column, Date, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.db.session import Base



class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True, index=True)
    reservation_id = Column(Integer, ForeignKey("reservations.id"), nullable=False) 
    full_name = Column(String, nullable=False)
    birth_date = Column(String, nullable=True)
    nationality = Column(String, nullable=True)
    country_of_residence = Column(String, nullable=True)
    city_of_residence = Column(String, nullable=True)
    id_type = Column(String, nullable=True)
    id_number = Column(String, nullable=True)
    country_of_issue = Column(String, nullable=True)

    reservation = relationship("Reservation", back_populates="forms")