from datetime import date
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field, Field

#frontend no POST
class ReservationCreate(BaseModel):
    #code: int
    #id: int
    guest_name: str = Field(default="Pendente", alias="guestName")
    guest_count: int = Field(default=1, alias="guestCount")
    check_in: Optional[date] = Field(default=None, alias="checkIn")
    check_out: Optional[date] = Field(default=None, alias="checkOut")
    status: str = "Pending"

    model_config = ConfigDict(populate_by_name=True)

#frontend no GET
class ReservationResponse(BaseModel):
    id: int
    #code: int = "Pending"
    guest_name: str = "Pending"
    guest_count: int = 1
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    status: str

    model_config = ConfigDict(from_attributes=True)


class ReservationUpdate(BaseModel):
    guest_name: Optional[str] = Field(default=None, alias="guestName")
    guest_count: Optional[int] = Field(default=None, alias="guestCount")

    # isto faz: basicamente permite que o modelo aceite campos opcionais, e se algum campo não for fornecido, ele não será incluído no dicionário de saída. 
    # Isso é útil para atualizações parciais, onde você pode querer atualizar apenas alguns campos de um registro existente sem precisar fornecer todos os 
    # campos obrigatórios.

    model_config = ConfigDict(populate_by_name=True)   