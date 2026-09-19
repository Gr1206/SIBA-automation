from pydantic import BaseModel, Field, ConfigDict


class ProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str | None = None
    siba_code: str | None = None
    #siba_key: str = Field(default="Pending", alias="siba_key")
    nif: str | None = None
    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    full_name: str = Field(default=None, alias="name")
    email: str = Field(default=None, alias="email")
    siba_code: str = Field(default=None, alias="siba_code")
    siba_key: str = Field(default=None, alias="siba_key")
    nif: str = Field(default=None, alias="nif")


    model_config = ConfigDict(populate_by_name=True)