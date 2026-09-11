from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/") #fica como /dashboard/
async def dashboard():  
    return {"message": "Bem-vindo ao Dashboard!"}