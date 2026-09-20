from pydantic import BaseModel, Field, ConfigDict

class NotificationResponse(BaseModel):
    notifications: list[dict] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)