from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.forms import Form
from app.models.reservations import Reservation
from app.schemas.forms import FormCreateRequest
from app.utils.sec import encrypt_data, decrypt_data

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

    forms = db.query(Form).filter(Form.reservation_id == reservation.id).all()
    if forms:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Formulários já foram submetidos para esta reserva")

    count = 0
    for guest in payload.guests:
        guest_data = guest.model_dump()

        guest_data["full_name"] = encrypt_data(guest_data["full_name"])
        guest_data["birth_date"] = encrypt_data(guest_data["birth_date"])
        guest_data["nationality"] = encrypt_data(guest_data["nationality"])
        guest_data["country_of_residence"] = encrypt_data(guest_data["country_of_residence"])
        guest_data["city_of_residence"] = encrypt_data(guest_data["city_of_residence"])
        guest_data["id_type"] = encrypt_data(guest_data["id_type"])
        guest_data["id_number"] = encrypt_data(guest_data["id_number"])
        guest_data["country_of_issue"] = encrypt_data(guest_data["country_of_issue"])

        new_form = Form (
            reservation_id = reservation.id,
            **guest_data
        )
        db.add(new_form)
        count += 1

    reservation.status = "Completed"
    reservation.guest_name = payload.guests[0].full_name
    reservation.guest_count = count
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    return {"message": "Formulários armazenados com sucesso", "count": {count}}