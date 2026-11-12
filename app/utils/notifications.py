from sqlalchemy.orm import Session

from app.models.login import User
from app.models.reservations import Reservation
from app.utils.helpers import count_pendingReservations, count_errorReservations

def get_user_notifications(user: User, db: Session) -> list[dict]:
    alerts = []

    pending = count_pendingReservations(db, user.id)
    error = count_errorReservations(db, user.id)
    print("pending", pending)
    print("error", error)

    if not user.nif:
        alerts.append({
            "code": "MISSING_NIF"
        })

    if not user.siba_code:
        alerts.append({
            "code": "MISSING_SIBA_CODE"
        })

    if not user.hashed_sibaKey:
        alerts.append({
            "code": "MISSING_SIBA_KEY"
        })

    if not user.property_name or not user.property_number\
            or not user.abbreviation or not user.address or not user.city or not user.postal_code\
            or not user.postal_zone or not user.telephone or not user.contact_name:
        alerts.append({
            "code": "MISSING_PROPERTY_INFO"
        })

    if pending > 0:
        alerts.append({
            "code": "PENDING_RESERVATIONS",
        })

    if error > 0:
        alerts.append({
            "code": "ERROR_RESERVATIONS",
        })
    return alerts