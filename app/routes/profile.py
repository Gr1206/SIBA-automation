from fastapi import APIRouter, Cookie, HTTPException, Request, status, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.core.templates import templates
from app.utils.sec import current_user


from app.db.session import get_db
from app.models.login import User
from app.schemas.profile import ProfileResponse, ProfileUpdate

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("", response_class=HTMLResponse) #fica como /profile
async def get_profile_page(
    request: Request, 
    user_id: int = Depends(current_user), 
    db: Session = Depends(get_db)):
    
    profile = db.query(User).filter(User.id == int(user_id)).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return templates.TemplateResponse(
        request=request,
        name="profile.html",
        context={"titulo": "Profile", "profile": profile},
    )


@router.patch(
    "",
    response_model=ProfileResponse,
    summary="Update host profile"
)
def update_profile(
    payload: ProfileUpdate, 
    user_id: int = Depends(current_user),
    db: Session = Depends(get_db)):
    profile = db.query(User).filter(User.id == int(user_id)).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    
    return profile

