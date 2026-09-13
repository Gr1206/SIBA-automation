from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routes import checkin, dashboard, reservations, profile, login, register
from app.core.templates import templates
from app.db.session import engine, Base

Base.metadata.create_all(bind=engine) 
app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)
BASE_DIR = Path(__file__).resolve().parent #base do proj

# Templates
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static") 

app.include_router(checkin.router)
app.include_router(dashboard.router)
app.include_router(reservations.router)
app.include_router(profile.router)
app.include_router(login.router)
app.include_router(register.router)

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="landing.html", 
        context={"titulo": "Bem-vindo ao SIBA"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000)