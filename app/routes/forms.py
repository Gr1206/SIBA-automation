from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.forms import Form
from app.models.login import User
from app.models.reservations import Reservation
from app.schemas.forms import FormCreateRequest, FormsGetResponse
from app.utils.sec import decrypt_sibaKey, encrypt_data, decrypt_data
from app.services.xml_builder import generate_siba_xml_for_reservation, getFormsData, getPropertyData, getReservationData
from app.services.siba_comm import enviar_boletins
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

    db.query(Form).filter(Form.reservation_id == reservation.id).delete(
        synchronize_session=False
    )
    count = 0
    
    for guest in payload.guests:
        guest_data = guest.model_dump()
        print(guest_data["birth_date"])
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
    print(getFormsData(db, reservation.id)) 

    return {"message": "Formulários armazenados com sucesso", "count": count}



@router.get(
    "/get/{reservation_token}",
    status_code=status.HTTP_200_OK,
    response_model=FormsGetResponse,
    summary="Get forms by reservation token"
)
def get_forms(reservation_token: str, db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.access_token == reservation_token).first()

    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

    forms = db.query(Form).filter(Form.reservation_id == reservation.id).all()
    if not forms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formulários não encontrados para esta reserva")

    decrypted_forms = []
    for form in forms:
        decrypted_form = {
            "full_name": decrypt_data(form.full_name),
            "birth_date": decrypt_data(form.birth_date),
            "nationality": decrypt_data(form.nationality),
            "country_of_residence": decrypt_data(form.country_of_residence),
            "city_of_residence": decrypt_data(form.city_of_residence),
            "id_type": decrypt_data(form.id_type),
            "id_number": decrypt_data(form.id_number),
            "country_of_issue": decrypt_data(form.country_of_issue)
        }
        decrypted_forms.append(decrypted_form)

    return {"guests": decrypted_forms}


@router.post(
    "/get-xml/{reservation_token}",
    status_code=status.HTTP_200_OK,
    summary="Get forms XML by reservation token"
)
def get_forms_xml(reservation_token: str, db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.access_token == reservation_token).first()

    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

    forms = db.query(Form).filter(Form.reservation_id == reservation.id).all()
    if not forms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formulários não encontrados para esta reserva")

    property = db.query(User).filter(User.id == 1).first()
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Propriedade não encontrada")

    xml_data = generate_siba_xml_for_reservation(db, reservation.id)
    #para efeitos de teste para já 
    # É SUPOSTO ISTO DAR UM TRIGGER PARA ENVIAR AGORA
    prop_data = getPropertyData(db, user_id=reservation.user_id)
    resp = enviar_boletins(xml_data, prop_data["nif"], prop_data["property_number"], decrypt_sibaKey(property.hashed_sibaKey), ambiente="dev")
    print(resp)
    return {"xml": xml_data}