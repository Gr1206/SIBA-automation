from datetime import date

from pydantic import BaseModel, ConfigDict, Field, field_validator

class GuestItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str | None = Field(default=None, description="Nome completo do hóspede")
    birth_date: str | None = Field(default=None, description="Data de nascimento do hóspede")
    nationality: str | None = Field(default=None, pattern=r"^[A-Z]{3}$", description="Código ISO 3166-1 alfa-3 da nacionalidade")
    country_of_residence: str | None = Field(default=None, pattern=r"^[A-Z]{3}$", description="Código ISO 3166-1 alfa-3 do país de residência")
    city_of_residence: str | None = Field(default=None, description="Cidade de residência do hóspede")
    id_type: str | None = Field(default=None, description="Tipo de documento de identificação")
    id_number: str | None = Field(default=None, description="Número do documento de identificação")
    country_of_issue: str | None = Field(default=None, pattern=r"^[A-Z]{3}$", description="Código ISO 3166-1 alfa-3 do país emissor")

    @field_validator("*", mode="before")
    @classmethod
    def empty_strings_are_missing(cls, value):
        if isinstance(value, str) and not value.strip():
            return None
        return value



class FormCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    guests: list[GuestItem] = Field(
        ...,
        min_length=1,
        description="Lista de hóspedes com seus respectivos dados"
    )


class FormsCreateResponse(BaseModel):
    pass


class FormsGetResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    guests: list[GuestItem] = Field(
        ...,
        min_length=1,
        description="Lista de hóspedes com seus respectivos dados"
    )