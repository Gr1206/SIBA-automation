""" 
import datetime
from datetime import datetime
from app.db.session import Base
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey

class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    file_number = Column(Integer, nullable=False)
    submission_date = Column(DateTime, default=datetime.utcnow)
    status = Column(String, default="pending")
    response_code = Column(String, nullable=True)

     """