from fastapi import APIRouter, Request, Depends
from fastapi.responses import HTMLResponse
from app.db.session import get_db
from app.models.reservations import Reservation
from app.models.login import User
from app.schemas.notifications import NotificationResponse
from app.utils.sec import current_user
from app.utils.notifications import get_user_notifications

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/", response_model=NotificationResponse)
async def notifications(request: Request, 
                        user_id: int = Depends(current_user), 
                        db = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return HTMLResponse(content="Usuário não encontrado", status_code=404)
    notifications = get_user_notifications(user)
    print("notifications", notifications)
    return NotificationResponse(notifications=notifications)