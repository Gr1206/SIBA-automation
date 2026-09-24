""" 
from typing import List
from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.submissions import Submission
#from app.schemas.

router = APIRouter(prefix="/submissions", tags=["Submissions"])


@app.post("/{reservation_id}/submit", response_model=SubmissionResponse, summary="Submit a reservation")
def storeSibaSubmission(db: Session = Depends(get_db)):

    ultimo_envio = db.query(func.max(Submission.file_number)).scalar()  
    next = ultimo_envio + 1 if ultimo_envio is not None else 1


    db.add(submission)
    db.commit()
    db.refresh(submission)

    return submission """