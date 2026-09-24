import datetime
import unicodedata

from app.models.login import User
from app.utils.sec import decrypt_data
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


def getName(full_name: str) -> str:
    """
    Extracts the first name from a full name string.
    """
    if not full_name:
        return ""
    parts = full_name.split()
    return parts[0] if parts else ""

def getSurname(full_name: str) -> str:
    """
    Extracts the surname from a full name string.
    """
    if not full_name:
        return ""
    return full_name.split()[-1] if len(full_name.split()) > 1 else ""

def format_siba_datetime(d, default_time: str = "00:00:00") -> str:
    """Formata para o padrão xs:dateTime: AAAA-MM-DDTHH:MM:SS"""
    if not d:
        return ""

    # Se for datetime completo
    if hasattr(d, "strftime"):
        return d.strftime(f"%Y-%m-%dT{default_time}")

    # Se for string 'AAAA-MM-DD'
    clean_str = str(d).strip().replace("/", "-")
    if len(clean_str) >= 10:
        return f"{clean_str[:10]}T{default_time}"

    return clean_str
  

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
            "check_in_time": sanitize_text(user_data.check_in_time),
            "check_out_time": sanitize_text(user_data.check_out_time),
            "fax": "", ##never used by anyone
            "contact_name": sanitize_text(user_data.contact_name)
        }
    return None

def getReservationData(db: Session, reservation_id: int) -> str:
    pass

def getFormsData(db: Session, reservation_id: int) -> list[dict]:
    all_guests = db.query(Form).filter(Form.reservation_id == reservation_id).all()
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()

    ##PRECISO DE METER OS HH:MM:SS para as horas fixas de checkin e checkout da propriedade
    check_in_time = format_siba_datetime(reservation.check_in, "00:00:00") if reservation and reservation.check_in else ""
    check_out_time = format_siba_datetime(reservation.check_out, "00:00:00") if reservation and reservation and reservation.check_out else ""
    forms_data = []
    for guest in all_guests:
        birth_date = format_siba_datetime(decrypt_data(guest.birth_date), "00:00:00") if guest and guest.birth_date else ""
        first_name = sanitize_text(getName(decrypt_data(guest.full_name))) if guest and guest.full_name else ""
        surname = sanitize_text(getSurname(decrypt_data(guest.full_name))) if guest and guest.full_name else ""
        forms_data.append({
            "name": first_name if surname else "",
            "surname": surname if surname else first_name,  
            "birth_date": birth_date,
            "nationality": sanitize_text(decrypt_data(guest.nationality)),
            "country_of_residence": sanitize_text(decrypt_data(guest.country_of_residence)),
            "city_of_residence": sanitize_text(decrypt_data(guest.city_of_residence)),
            "id_type": sanitize_text(decrypt_data(guest.id_type)),
            "id_number": sanitize_text(decrypt_data(guest.id_number)),
            "country_of_issue": sanitize_text(decrypt_data(guest.country_of_issue)),
            "check_in": check_in_time,
            "check_out": check_out_time
        })
    return forms_data

def generateSendingData(db: Session) -> dict:
    
    return {
        "timestamp": datetime.now().strftime("%Y-%m-%dT%H:%M:%S")
    }


def generate_propertyXml(propertyData: str) -> str:
    pass

def generate_formsXml(formsData: list[dict]) -> str:
    pass

def generate_reservationXml(reservationData: str) -> str:
    pass

def generate_sibaXml(propertyData: str, reservationData: str, formsData: list[dict]) -> str:
    pass