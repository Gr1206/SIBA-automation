import random
import string
from typing import List
from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.reservations import Reservation
from app.schemas.reservations import ReservationCreate, ReservationResponse, ReservationUpdate
from app.utils.sec import current_user

router = APIRouter(prefix="/api/reservations", tags=["Reservations"])

@router.get(
    "/",
    response_model=List[ReservationResponse],
    summary="Listar todas as reservas"
)
def get_reservations(
    user_id: int = Depends(current_user),
    db: Session = Depends(get_db)):
    
    return (
        db.query(Reservation).filter(Reservation.user_id == int(user_id)).all()
    )

@router.patch(
    "/{reservation_id}",
    response_model=ReservationResponse,
    summary="Atualizar uma reserva existente"
)
def update_reservation(reservation_id: int, 
                       payload: ReservationUpdate, 
                       db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

    data = payload.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(reservation, key, value)

    db.commit()
    db.refresh(reservation)
    
    return reservation

@router.delete(
    "/{reservation_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deletar uma reserva existente"
)
def delete_reservation(reservation_id: int, 
                       user_id: int = Depends(current_user),
                       db: Session = Depends(get_db)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id , Reservation.user_id == user_id).first()
    if not reservation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reserva não encontrada")

    db.delete(reservation)
    db.commit()
    return None

@router.post(
    "/",
    response_model=ReservationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar uma nova reserva pendente"
)
def create_reservation(
    payload: ReservationCreate, 
    user_id: int = Depends(current_user),
    db: Session = Depends(get_db)):

    new = Reservation(
        #code=payload.code,
        guest_name=payload.guest_name,
        guest_count=payload.guest_count,
        check_in=payload.check_in,
        check_out=payload.check_out,
        status=payload.status,
        user_id=int(user_id) 
    )

    db.add(new)
    db.commit()
    db.refresh(new) 

    return new


#maias tarde construir funcoes para gets
        