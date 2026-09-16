from fastapi import APIRouter, Request, Depends, Response, HTTPException, status
from fastapi.responses import HTMLResponse
from app.core.templates import templates
from app.models.login import User
from app.db.session import get_db
from app.schemas.login import RegisterRequest
from app.utils.sec import get_password_hash
router = APIRouter(prefix="/register", tags=["Register"])

@router.get("/", response_class=HTMLResponse)
async def register(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="register.html",
        context={"titulo": "Registo"}
    )


@router.post("/")
def register_user(credentials: RegisterRequest, response: Response, request: Request, db = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()

    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Email already registered"
        )

    hashed_password = get_password_hash(credentials.password)

    new_user = User(
        full_name=credentials.full_name,
        email=credentials.email,
        hashed_password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    response.set_cookie(
        key="user_id",
        value=str(new_user.id),
        httponly=True,
        samesite="lax",
        path="/",
    )

    return {"message": "User registered successfully", "user": {"id": new_user.id}}