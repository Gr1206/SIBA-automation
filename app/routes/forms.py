from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.forms import Form
from app.models.login import User
from app.models.reservations import Reservation
from app.models.submissionsSiba import Submission
from app.schemas.forms import FormCreateRequest, FormsGetResponse
from app.schemas.submissionsSiba import SubmissionResolutionRequest
from app.utils.sec import current_user, decrypt_sibaKey, encrypt_data, decrypt_data
from app.services.xml_builder import (
    SibaValidationError,
    generate_siba_xml_for_reservation,
    getPropertyData,
)
from app.services.siba_comm import SibaSendError, enviar_boletins
from app.utils.helpers import get_next_file_number
from app.core.config import settings

router = APIRouter(prefix="/forms", tags=["Forms"])

GUEST_FIELDS = (
    "full_name",
    "birth_date",
    "nationality",
    "country_of_residence",
    "city_of_residence",
    "id_type",
    "id_number",
    "country_of_issue",
)
EMPTY_DRAFT_FULL_NAME = "\x00"


@router.post(
    "/submit/{reservation_token}",
    status_code=status.HTTP_201_CREATED,
    summary="Store new forms"
)
def store_forms(
    reservation_token: str,
    payload: FormCreateRequest,
    user_id: int = Depends(current_user),
    db: Session = Depends(get_db),
):
    reservation = db.query(Reservation).filter(
        Reservation.access_token == reservation_token,
        Reservation.user_id == user_id,
    ).first()

    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

    existing_forms = (
        db.query(Form)
        .filter(Form.reservation_id == reservation.id)
        .order_by(Form.id)
        .all()
    )
    incoming_guests = [guest.model_dump() for guest in payload.guests]
    existing_guests = []
    for form in existing_forms:
        existing_guest = {}
        for field in GUEST_FIELDS:
            value = decrypt_data(getattr(form, field))
            if field == "full_name" and value == EMPTY_DRAFT_FULL_NAME:
                value = None
            existing_guest[field] = value or None
        existing_guests.append(existing_guest)

    if existing_guests == incoming_guests:
        return {
            "message": "Os formulários não foram alterados",
            "count": len(existing_guests),
        }

    submission = db.query(Submission).filter(
        Submission.user_id == user_id,
        Submission.reservation_id == reservation.id,
    ).order_by(Submission.id.desc()).first()
    if submission and submission.status in {"Sending", "Unknown"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O envio tem resultado incerto. Confirme o estado no SIBA antes de alterar os dados.",
        )

    for existing_form in existing_forms:
        db.delete(existing_form)
    for guest_data in incoming_guests:
        for field in GUEST_FIELDS:
            value = guest_data[field]
            if field == "full_name" and value is None:
                value = EMPTY_DRAFT_FULL_NAME
            guest_data[field] = encrypt_data(value)

        new_form = Form (
            reservation_id = reservation.id,
            **guest_data
        )
        db.add(new_form)

    complete = all(
        all(guest.get(field) for field in GUEST_FIELDS)
        for guest in incoming_guests
    )
    reservation.status = "Completed" if complete else "Pending"
    reservation.guest_count = len(incoming_guests)
    if submission and submission.status == "Sent":
        submission.status = "Superseded"

    db.commit()

    return {"message": "Formulários armazenados com sucesso", "count": len(incoming_guests)}



@router.get(
    "/get/{reservation_token}",
    status_code=status.HTTP_200_OK,
    response_model=FormsGetResponse,
    summary="Get forms by reservation token"
)
def get_forms(
    reservation_token: str,
    user_id: int = Depends(current_user),
    db: Session = Depends(get_db),
):
    reservation = db.query(Reservation).filter(
        Reservation.access_token == reservation_token,
        Reservation.user_id == user_id,
    ).first()

    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

    forms = db.query(Form).filter(Form.reservation_id == reservation.id).all()
    if not forms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formulários não encontrados para esta reserva")

    decrypted_forms = []
    for form in forms:
        decrypted_form = {
            field: decrypt_data(getattr(form, field))
            for field in GUEST_FIELDS
        }
        if decrypted_form["full_name"] == EMPTY_DRAFT_FULL_NAME:
            decrypted_form["full_name"] = None
        decrypted_forms.append(decrypted_form)

    return {"guests": decrypted_forms}


@router.post(
    "/get-xml/{reservation_token}",
    status_code=status.HTTP_200_OK,
    summary="Get forms XML by reservation token"
)
def get_forms_xml(
    reservation_token: str,
    user_id: int = Depends(current_user),
    db: Session = Depends(get_db),
):
    reservation = db.query(Reservation).filter(
        Reservation.access_token == reservation_token,
        Reservation.user_id == user_id,
    ).first()

    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

    forms = db.query(Form).filter(Form.reservation_id == reservation.id).all()
    if not forms:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Formulários não encontrados para esta reserva")

    property = db.query(User).filter(User.id == reservation.user_id).first()
    if not property:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Propriedade não encontrada")

    prop_data = getPropertyData(db, user_id=reservation.user_id)
    submission = db.query(Submission).filter(
        Submission.user_id == user_id,
        Submission.reservation_id == reservation.id,
    ).order_by(Submission.id.desc()).first()

    if submission and submission.status == "Sent":
        return {
            "success": True,
            "status": reservation.status,
            "code": submission.response_code or "0",
            "description": "",
        }

    if submission and submission.status == "Sending":
        is_stale = (
            submission.submission_date is None
            or submission.submission_date
            < datetime.now(UTC).replace(tzinfo=None) - timedelta(minutes=2)
        )
        if is_stale:
            submission.status = "Unknown"
            submission.response_code = "UNKNOWN"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="O envio anterior foi interrompido sem confirmação. Verifique o estado no SIBA antes de decidir se deve reenviar.",
            )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="O envio ainda está em curso. Aguarde antes de tentar novamente.",
        )

    if submission and submission.status == "Unknown":
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="O resultado do último envio é incerto. Confirme no portal do SIBA antes de decidir se deve reenviar.",
        )

    if submission and submission.status not in {"Error", "Superseded"}:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Já existe uma tentativa de envio sem resultado confirmado. Confirme o estado no SIBA antes de repetir.",
        )

    for form in forms:
        for field in GUEST_FIELDS:
            value = decrypt_data(getattr(form, field))
            if (
                not value
                or not value.strip()
                or (field == "full_name" and value == EMPTY_DRAFT_FULL_NAME)
            ):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="Preencha todos os dados dos hóspedes antes de enviar para o SIBA.",
                )

    file_number = get_next_file_number(db, user_id)
    try:
        xml_data = generate_siba_xml_for_reservation(
            db,
            reservation.id,
            file_number=file_number,
        )
    except SibaValidationError as exc:
        reservation.status = "Error"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    submission = Submission(
        user_id=user_id,
        reservation_id=reservation.id,
        file_number=file_number,
        status="Sending",
    )
    db.add(submission)

    reservation.status = "Sending"

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Outra submissão foi iniciada em simultâneo. Atualize o estado antes de tentar novamente.",
        ) from exc

    try:
        resp = enviar_boletins(
            xml_data,
            prop_data["nif"],
            prop_data["property_number"],
            decrypt_sibaKey(property.hashed_sibaKey),
            ambiente=settings.SIBA_ENV,
        )
    except SibaSendError as exc:
        submission.status = "Unknown"
        submission.response_code = "UNKNOWN"
        reservation.status = "Error"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Não foi possível confirmar o resultado do envio. Verifique no SIBA antes de tentar novamente.",
        ) from exc
    except ValueError as exc:
        submission.status = "Error"
        submission.response_code = "VALIDATION_ERROR"
        reservation.status = "Error"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    if resp.success:
        submission.status = "Sent"
        submission.response_code = resp.code
        reservation.status = "Sent"
    else:
        submission.status = "Error"
        submission.response_code = resp.code
        reservation.status = "Error"
    db.commit()

    return {
        "success": resp.success,
        "status": reservation.status,
        "code": resp.code,
        "description": resp.description,
    }


@router.post(
    "/resolve/{reservation_token}",
    status_code=status.HTTP_200_OK,
    summary="Manually reconcile an uncertain SIBA submission",
)
def resolve_uncertain_submission(
    reservation_token: str,
    payload: SubmissionResolutionRequest,
    user_id: int = Depends(current_user),
    db: Session = Depends(get_db),
):
    reservation = db.query(Reservation).filter(
        Reservation.access_token == reservation_token,
        Reservation.user_id == user_id,
    ).first()
    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

    submission = db.query(Submission).filter(
        Submission.user_id == user_id,
        Submission.reservation_id == reservation.id,
    ).order_by(Submission.id.desc()).first()
    if not submission or submission.status != "Unknown":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Não existe um envio com resultado incerto para reconciliar.",
        )

    if payload.decision == "accepted":
        submission.status = "Sent"
        submission.response_code = "MANUALLY_CONFIRMED"
        reservation.status = "Sent"
    else:
        submission.status = "Error"
        submission.response_code = "MANUALLY_CONFIRMED_NOT_RECEIVED"
        reservation.status = "Error"

    db.commit()
    return {"status": reservation.status, "decision": payload.decision}
