from datetime import date

from pydantic import BaseModel, ConfigDict, Field

class GuestItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    full_name: str = Field(..., description="Nome completo do hóspede")
    birth_date: str = Field(..., description="Data de nascimento do hóspede")
    nationality: str = Field(..., description="Nacionalidade do hóspede")
    country_of_residence: str = Field(..., description="País de residência do hóspede")
    city_of_residence: str = Field(..., description="Cidade de residência do hóspede")
    id_type: str = Field(..., description="Tipo de documento de identificação")
    id_number: str = Field(..., description="Número do documento de identificação")
    country_of_issue: str = Field(..., description="País de emissão do documento de identificação")



class FormCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    guests: list[GuestItem] = Field(
        ...,
        min_length=1,
        description="Lista de hóspedes com seus respectivos dados"
    )


class FormsCreateResponse(BaseModel):
    pass