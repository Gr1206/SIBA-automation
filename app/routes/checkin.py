from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse
from requests import Session
from app.core.templates import templates
from app.db.session import get_db
from app.models.reservations import Reservation
from app.utils.sec import current_user

router = APIRouter(prefix="/checkin", tags=["Check-in"])

@router.get("/edit/{token}", response_class=HTMLResponse)
async def edit_checkin(request: Request, token: str,
                       user_id: int = Depends(current_user),
                       db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(
        Reservation.access_token == token,
        Reservation.user_id == user_id,
    ).first()

    if not reservation:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    return templates.TemplateResponse(
        request=request,
        name="checkin.html",
        context={
            "titulo": "Editar Check-in",
            "reserva_id": reservation.id,
            "host_allowed": reservation,
            "edit_mode": True,
        }
    )

