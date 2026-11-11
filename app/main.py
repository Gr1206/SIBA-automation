from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routes import checkin, dashboard, reservations, profile, login, notifications, forms
from app.core.templates import templates
from app.db.session import engine, Base, ensure_user_profile_columns, SessionLocal
from app.exceptions.expiredSession import SessionExpiredException
from app.models.reservations import Reservation

Base.metadata.create_all(bind=engine) 
ensure_user_profile_columns()
app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)
BASE_DIR = Path(__file__).resolve().parent #base do proj

# Templates
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static") 

app.include_router(checkin.router)
app.include_router(dashboard.router)
app.include_router(reservations.router)
app.include_router(profile.router)
app.include_router(login.router)
#app.include_router(register.router)
app.include_router(notifications.router)
app.include_router(forms.router)
#app.include_router(submissionsSiba.router)

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="landing.html", 
        context={"titulo": "Bem-vindo ao SIBA"}
    )

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.get("/checkinSuccess/", response_class=HTMLResponse)
async def checkin_success(request: Request, token: str | None = None):
    contact_phone = "[inserir telefone do alojamento]"
    contact_email = "[inserir email do alojamento]"
    contact_address = "[inserir morada do alojamento]"

    if token:
        db = SessionLocal()
        try:
            reservation = db.query(Reservation).filter(Reservation.access_token == token).first()
            if reservation and reservation.user:
                contact_phone = reservation.user.telephone or contact_phone
                contact_email = reservation.user.email or contact_email
                contact_address = reservation.user.address or contact_address
        finally:
            db.close()

    return templates.TemplateResponse(
        request=request,
        name="checkinSuccess.html",
        context={
            "titulo": "Check-in concluído",
            "contact_phone": contact_phone,
            "contact_email": contact_email,
            "contact_address": contact_address,
        }
    )

@app.exception_handler(SessionExpiredException)
async def session_expired_exception_handler(request: Request, exc: SessionExpiredException):
    return templates.TemplateResponse(
        request=request,
        name="session_expired.html",
        context={"titulo": "Sessão Expirada", "message": "A sua sessão expirou. Por favor, faça login novamente."},
        status_code=401
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000)