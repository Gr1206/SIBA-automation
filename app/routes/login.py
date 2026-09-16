from fastapi import APIRouter, Depends, Response, Request, HTTPException, status
from fastapi.responses import HTMLResponse
from app.core.templates import templates
from app.models.login import User
from app.db.session import get_db
from app.schemas.login import LoginRequest
from app.utils.sec import verify_password
router = APIRouter(prefix="/login", tags=["Login"])

@router.get("/", response_class=HTMLResponse)
async def login(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={"titulo": "Login"}
    )

##route para ver se email existe na bd
@router.post("/login")
def login_user(credentials: LoginRequest, response: Response, db = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid email or password"
        )

    ##build cookie

    response.set_cookie(
        key="user_id", 
        value=str(user.id), 
        httponly=True,
        samesite="lax",
        path="/",
    )

    return {"message": "Login successful", "user": {"id": user.id}}