from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routes import checkin, dashboard
from app.core.templates import templates


app = FastAPI(title=settings.PROJECT_NAME, version=settings.PROJECT_VERSION)
BASE_DIR = Path(__file__).resolve().parent #base do proj

# Templates
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static") 

app.include_router(checkin.router)
app.include_router(dashboard.router)

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="index.html", 
        context={"titulo": "Bem-vindo ao SIBA"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000)