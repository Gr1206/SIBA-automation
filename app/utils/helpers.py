from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.reservations import Reservation
from app.models.submissionsSiba import Submission

def get_next_file_number(db: Session, user_id: int) -> int:
    last_number = db.query(func.max(Submission.file_number))\
                    .filter(Submission.user_id == user_id)\
                    .scalar()
    
    return (last_number or 0) + 1


def count_pendingReservations(db: Session, user_id: int) -> int:
    pending_count = db.query(func.count(Reservation.id)).where(
        Reservation.user_id == user_id,
        func.lower(Reservation.status).in_(("pending", "completed")),
    ).scalar()
    print("pending_count", pending_count)
    return pending_count

def count_errorReservations(db: Session, user_id: int) -> int:
    error_count = db.query(func.count(Reservation.id)).where(
        Reservation.user_id == user_id,
        func.lower(Reservation.status) == "error",
    ).scalar()
    print("error_count", error_count)
    return error_count