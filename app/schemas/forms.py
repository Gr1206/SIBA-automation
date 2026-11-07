from datetime import date

from pydantic import BaseModel, ConfigDict, Field

class GuestItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(..., description="Nome completo do hóspede")
    birth_date: str = Field(..., description="Data de nascimento do hóspede")
    nationality: str = Field(..., pattern=r"^[A-Z]{3}$", description="Código ISO 3166-1 alfa-3 da nacionalidade")
    country_of_residence: str = Field(..., pattern=r"^[A-Z]{3}$", description="Código ISO 3166-1 alfa-3 do país de residência")
    city_of_residence: str = Field(..., description="Cidade de residência do hóspede")
    id_type: str = Field(..., description="Tipo de documento de identificação")
    id_number: str = Field(..., description="Número do documento de identificação")
    country_of_issue: str = Field(..., pattern=r"^[A-Z]{3}$", description="Código ISO 3166-1 alfa-3 do país emissor")



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