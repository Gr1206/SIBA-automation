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
                       db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(
        Reservation.access_token == token
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

@router.get("/{token}", response_class=HTMLResponse) #fica como /checkin/
async def checkin(request: Request, token: str, 
                  db: Session = Depends(get_db)):

    host_allowed = db.query(Reservation).filter(Reservation.access_token == token).first()
    print("host_allowed", host_allowed)

    if not host_allowed:
        raise HTTPException(status_code=403, detail="Acesso negado.")

    if host_allowed.status == "Completed":
        raise HTTPException(
            status_code=410,
            detail="Este link de formulário já não está ativo."
        )

    return templates.TemplateResponse(
        request=request,
        name="checkin.html",
        context={
            "titulo": "Boletim de Alojamento (SIBA)",
            "reserva_id": host_allowed.id,
            "host_allowed": host_allowed,
            "edit_mode": False,
        }
    )