from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.forms import Form
from app.models.reservations import Reservation
from app.schemas.forms import FormCreateRequest

router = APIRouter(prefix="/forms", tags=["Forms"])

@router.post(
    "/submit/{reservation_token}",
    status_code=status.HTTP_201_CREATED,
    summary="Store new forms"
)
def store_forms(
                reservation_token: str,
                payload: FormCreateRequest,
                db: Session = Depends(get_db)):

    reservation = db.query(Reservation).filter(Reservation.access_token == reservation_token).first()

    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

    created_forms = [
        Form(reservation_id=reservation.id, **guest.model_dump())
        for guest in payload.guests
    ]
    db.add_all(created_forms)

    reservation.status = "Completed"
    reservation.guest_name = payload.guests[0].full_name
    reservation.guest_count = len(created_forms)
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"message": "Formulários armazenados com sucesso", "count": len(created_forms)}