from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse

from app.core.templates import templates
from app.utils.sec import current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/", response_class=HTMLResponse) #fica como /dashboard/
async def dashboard(request: Request,
                    user_id: int = Depends(current_user)):  
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={"titulo": "DASHBOARD"}
    )