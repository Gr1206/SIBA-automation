from pydantic import BaseModel, Field, ConfigDict


class ProfileResponse(BaseModel):
    id: int
    full_name: str
    email: str | None = None
    siba_code: str | None = None
    nif: str | None = None
    property_name: str | None = None
    property_number: str | None = None
    abbreviation: str | None = None
    address: str | None = None
    city: str | None = None
    postal_code: str | None = None
    postal_zone: str | None = None
    telephone: str | None = None
    contact_name: str | None = None
    check_in_time: str | None = None
    check_out_time: str | None = None
    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    full_name: str | None = Field(default=None, alias="name")
    email: str | None = Field(default=None, alias="email")
    siba_code: str | None = Field(default=None, alias="siba_code")
    siba_key: str | None = Field(default=None, alias="siba_key")
    nif: str | None = Field(default=None, alias="nif")
    property_name: str | None = Field(default=None, alias="property_name")
    property_number: str | None = Field(default=None, alias="property_number")
    abbreviation: str | None = Field(default=None, alias="abbreviation")
    address: str | None = Field(default=None, alias="address")
    city: str | None = Field(default=None, alias="city")
    postal_code: str | None = Field(default=None, alias="postal_code")
    postal_zone: str | None = Field(default=None, alias="postal_zone")
    telephone: str | None = Field(default=None, alias="telephone")
    contact_name: str | None = Field(default=None, alias="contact_name")
    check_in_time: str | None = Field(default=None, alias="check_in_time")
    check_out_time: str | None = Field(default=None, alias="check_out_time")


    model_config = ConfigDict(populate_by_name=True)