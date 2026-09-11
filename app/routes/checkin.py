from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from app.core.templates import templates

router = APIRouter(prefix="/checkin", tags=["Check-in"])

@router.get("/{reserva_id}/", response_class=HTMLResponse) #fica como /checkin/
async def checkin(request: Request, reserva_id: str):  
    return templates.TemplateResponse(
        request=request,
        name="checkin.html",
        context={"reserva_id": reserva_id}
    )