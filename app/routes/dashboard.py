from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse

from app.core.templates import templates

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/", response_class=HTMLResponse) #fica como /dashboard/
async def dashboard(request: Request):  
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={"titulo": "DASHBOARD"}
    )