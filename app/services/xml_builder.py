import unicodedata

from app.models.login import User
from app.utils.sec import decrypt_dataList
from app.db.session import get_db
from app.models.forms import Form
from app.models.reservations import Reservation
from sqlalchemy.orm import Session

def sanitize_text(text: str) -> str:
    """
    Sanitize the given text by removing special characters and extra spaces.
    """
    if not text:
        return ""
    text_str = str(text).strip()
    if not text_str:
        return ""

    # Decompõe caracteres acentuados (ex: 'ã' vira 'a' + til) e filtra
    normalized = unicodedata.normalize("NFKD", text_str)
    ascii_text = "".join(c for c in normalized if not unicodedata.combining(c))

    # O SIBA exige texto em MAIÚSCULAS
    return ascii_text.upper()


def format_date(data_str: str) -> str:
    pass

def getPropertyData(db: Session, user_id: int) -> str:
    user_data = db.query(User).filter(User.id == user_id).first()
    if user_data:
      
        return {
            "nif": sanitize_text(user_data.nif),
            "property_number": sanitize_text(user_data.property_number),
            "property_name": sanitize_text(user_data.property_name),
            "abbreviation": sanitize_text(user_data.abbreviation),
            "address": sanitize_text(user_data.address),
            "city": sanitize_text(user_data.city),
            "postal_code": sanitize_text(user_data.postal_code),
            "postal_zone": sanitize_text(user_data.postal_zone),
            "telephone": sanitize_text(user_data.telephone),
            "fax": "", ##never used by anyone
            "contact_name": sanitize_text(user_data.contact_name)
        }
    return None

def getReservationData(db: Session, reservation_id: int) -> str:
    pass


def generate_propertyXml(propertyData: str) -> str:
    pass

def generate_formsXml(formsData: list[dict]) -> str:
    pass

def generate_reservationXml(reservationData: str) -> str:
    pass

def generate_sibaXml(propertyData: str, reservationData: str, formsData: list[dict]) -> str:
    pass