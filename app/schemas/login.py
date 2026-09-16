from pydantic import BaseModel, Field, ConfigDict, EmailStr


class LoginRequest(BaseModel):
    email: str 
    password: str


class RegisterRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    full_name: str = Field(..., min_length=1, max_length=100)
    email: str  
    password: str = Field(..., min_length=8, max_length=100)