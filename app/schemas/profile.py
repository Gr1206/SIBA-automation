from pydantic import BaseModel, Field, ConfigDict


class ProfileResponse(BaseModel):
    id: int
    name: str = Field(default="Pending", alias="name")
    email: str = Field(default="Pending", alias="email")

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    full_name: str = Field(default=None, alias="name")
    email: str = Field(default=None, alias="email")

    model_config = ConfigDict(populate_by_name=True)