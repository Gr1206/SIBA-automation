from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.submissionsSiba import Submission

def get_next_file_number(db: Session, user_id: int) -> int:
    last_number = db.query(func.max(Submission.file_number))\
                    .filter(Submission.user_id == user_id)\
                    .scalar()
    
    return (last_number or 0) + 1