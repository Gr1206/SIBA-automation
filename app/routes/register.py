from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from app.core.templates import templates


router = APIRouter(prefix="/register", tags=["Register"])

@router.get("/", response_class=HTMLResponse)
async def register(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="register.html",
        context={"titulo": "Registo"}
    )