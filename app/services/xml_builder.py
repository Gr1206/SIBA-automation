"""
Geração do XML SIBA (MovimentoBAL) conforme o XSD SIBA1.XSD.
Este módulo apenas CRIA o XML. O envio (SOAP) é feito noutro sítio.
"""
import re
import unicodedata
import xml.etree.ElementTree as ET
from datetime import date, datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.models.forms import Form
from app.models.login import User
from app.models.reservations import Reservation
from app.utils.helpers import get_next_file_number
from app.utils.sec import decrypt_data

NAMESPACE = "http://sef.pt/BAws"
ET.register_namespace("", NAMESPACE)


class SibaValidationError(ValueError):
    """Erro de dados que tornariam o XML inválido ou incorreto para o SIBA."""


# ---------------------------------------------------------------------------
# Utilitários de texto
# ---------------------------------------------------------------------------
def sanitize_text(text) -> str:
    """Remove acentos, espaços extra e converte para MAIÚSCULAS (exigido pelo SIBA)."""
    if text is None:
        return ""
    text_str = " ".join(str(text).split())
    if not text_str:
        return ""
    normalized = unicodedata.normalize("NFKD", text_str)
    ascii_text = "".join(c for c in normalized if not unicodedata.combining(c))
    return ascii_text.upper()


def safe_decrypt(value) -> str:
    """Desencripta com segurança: devolve '' se o valor for None/vazio."""
    if value is None or value == "":
        return ""
    result = decrypt_data(value)
    return "" if result is None else str(result)


def split_full_name(full_name: str) -> tuple[str, str]:
    """
    Devolve (nome, apelido).
    Apelido = última palavra; Nome = todas as anteriores.
    Se só existir uma palavra, é usada como Apelido e o Nome fica vazio (opcional no XSD).
    """
    parts = sanitize_text(full_name).split()
    if not parts:
        return "", ""
    if len(parts) == 1:
        return "", parts[0]
    return " ".join(parts[:-1]), parts[-1]


def normalize_phone(phone: str) -> str:
    """Mantém só dígitos e remove o indicativo português (351 / 00351 / +351)."""
    digits = re.sub(r"\D", "", phone or "")
    if digits.startswith("00351"):
        digits = digits[5:]
    elif digits.startswith("351") and len(digits) > 9:
        digits = digits[3:]
    return digits


# ---------------------------------------------------------------------------
# Datas
# ---------------------------------------------------------------------------
_DATE_FORMATS = ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d", "%d.%m.%Y")


def format_siba_datetime(value, default_time: str = "00:00:00") -> str:
    """Converte date/datetime/string para xs:dateTime (AAAA-MM-DDTHH:MM:SS). '' se vazio."""
    if value is None or value == "":
        return ""

    if isinstance(value, datetime):
        return value.strftime(f"%Y-%m-%dT{default_time}")
    if isinstance(value, date):
        return value.strftime(f"%Y-%m-%dT{default_time}")

    text = str(value).strip()
    # Ignora a parte da hora, se existir ("2024-05-01 10:00:00" / "2024-05-01T10:00:00")
    text = re.split(r"[T ]", text)[0]

    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).strftime(f"%Y-%m-%dT{default_time}")
        except ValueError:
            continue
    raise SibaValidationError(f"Formato de data não reconhecido: '{value}'")


# ---------------------------------------------------------------------------
# Recolha de dados da BD
# ---------------------------------------------------------------------------
def getPropertyData(db: Session, user_id: int) -> dict | None:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    # Email de contacto é opcional no XSD; só é usado se o modelo tiver este campo.
    email = getattr(user, "contact_email", None)

    return {
        "nif": sanitize_text(user.nif),
        "property_number": sanitize_text(user.property_number),
        "property_name": sanitize_text(user.property_name),
        "abbreviation": sanitize_text(user.abbreviation),
        "address": sanitize_text(user.address),
        "city": sanitize_text(user.city),
        "postal_code": sanitize_text(user.postal_code),
        "postal_zone": sanitize_text(user.postal_zone),
        "telephone": normalize_phone(user.telephone),
        "fax": "",  # nunca usado
        "contact_name": sanitize_text(user.contact_name),
        "email": str(email).strip() if email else "",
    }


def getReservationData(db: Session, reservation_id: int) -> dict | None:
    """
    Se file_number for None, pede o próximo sequencial com get_next_file_number.
    Para testes, passa um file_number fixo (ex.: 1) para não consumir o sequencial real.
    """
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        return None

    file_number = get_next_file_number(db, reservation.user_id)

    return {
        "file_number": file_number,
        "date": datetime.now().strftime("%Y-%m-%dT%H:%M:%S"),
    }


def getFormsData(db: Session, reservation_id: int) -> list[dict]:
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        return []

    check_in = format_siba_datetime(reservation.check_in)
    check_out = format_siba_datetime(reservation.check_out) if reservation.check_out else ""

    guests = db.query(Form).filter(Form.reservation_id == reservation_id).all()
    forms_data = []
    for guest in guests:
        first_name, surname = split_full_name(safe_decrypt(guest.full_name))
        forms_data.append({
            "name": first_name,
            "surname": surname,
            "birth_date": format_siba_datetime(safe_decrypt(guest.birth_date)),
            "nationality": sanitize_text(safe_decrypt(guest.nationality)),
            "country_of_residence": sanitize_text(safe_decrypt(guest.country_of_residence)),
            "city_of_residence": sanitize_text(safe_decrypt(guest.city_of_residence)),
            "id_type": sanitize_text(safe_decrypt(guest.id_type)),
            "id_number": sanitize_text(safe_decrypt(guest.id_number)),
            "country_of_issue": sanitize_text(safe_decrypt(guest.country_of_issue)),
            "check_in": check_in,
            "check_out": check_out,
        })
    return forms_data


# ---------------------------------------------------------------------------
# Construção do XML
# ---------------------------------------------------------------------------
def _tag(name: str) -> str:
    return f"{{{NAMESPACE}}}{name}"


def _add_element(
    parent: ET.Element,
    tag_name: str,
    value,
    max_len: int | None = None,
    required: bool = True,
    context: str = "",
) -> ET.Element | None:
    """
    Cria um subelemento. Nunca trunca: se exceder max_len ou faltar um valor
    obrigatório, levanta SibaValidationError.
    """
    text = "" if value is None else str(value).strip()
    where = f" ({context})" if context else ""

    if not text:
        if required:
            raise SibaValidationError(f"Campo obrigatório vazio: {tag_name}{where}")
        return None

    if max_len is not None and len(text) > max_len:
        raise SibaValidationError(
            f"{tag_name}{where} excede {max_len} caracteres ({len(text)}): '{text}'"
        )

    elem = ET.SubElement(parent, _tag(tag_name))
    elem.text = text
    return elem


def append_property_xml(parent: ET.Element, data: dict) -> None:
    node = ET.SubElement(parent, _tag("Unidade_Hoteleira"))
    ctx = "Unidade_Hoteleira"

    _add_element(node, "Codigo_Unidade_Hoteleira", data.get("nif"), 9, context=ctx)
    _add_element(node, "Estabelecimento", data.get("property_number"), 2, context=ctx)
    _add_element(node, "Nome", data.get("property_name"), 40, context=ctx)
    _add_element(node, "Abreviatura", data.get("abbreviation"), 15, context=ctx)
    _add_element(node, "Morada", data.get("address"), 40, context=ctx)
    _add_element(node, "Localidade", data.get("city"), 30, context=ctx)
    _add_element(node, "Codigo_Postal", data.get("postal_code"), 4, context=ctx)
    _add_element(node, "Zona_Postal", data.get("postal_zone"), 3, context=ctx)
    _add_element(node, "Telefone", data.get("telephone"), 10, context=ctx)

    # Fax é obrigatório no XSD mas pode ir vazio (elemento presente, sem texto)
    ET.SubElement(node, _tag("Fax")).text = (data.get("fax") or "")[:10]

    _add_element(node, "Nome_Contacto", data.get("contact_name"), 40, context=ctx)
    _add_element(node, "Email_Contacto", data.get("email"), 140, required=False, context=ctx)


def append_forms_xml(parent: ET.Element, forms_data: list[dict]) -> None:
    for index, guest in enumerate(forms_data, start=1):
        node = ET.SubElement(parent, _tag("Boletim_Alojamento"))
        ctx = f"hóspede {index}"

        _add_element(node, "Apelido", guest.get("surname"), 40, context=ctx)
        _add_element(node, "Nome", guest.get("name"), 40, required=False, context=ctx)
        _add_element(node, "Nacionalidade", guest.get("nationality"), 3, context=ctx)
        _add_element(node, "Data_Nascimento", guest.get("birth_date"), context=ctx)
        _add_element(node, "Local_Nascimento", guest.get("birth_place"), 30, required=False, context=ctx)
        _add_element(node, "Documento_Identificacao", guest.get("id_number"), 16, context=ctx)
        _add_element(node, "Pais_Emissor_Documento", guest.get("country_of_issue"), 3, context=ctx)
        _add_element(node, "Tipo_Documento", guest.get("id_type"), 3, context=ctx)
        _add_element(node, "Data_Entrada", guest.get("check_in"), context=ctx)
        _add_element(node, "Data_Saida", guest.get("check_out"), required=False, context=ctx)
        _add_element(node, "Pais_Residencia_Origem", guest.get("country_of_residence"), 3, context=ctx)
        _add_element(node, "Local_Residencia_Origem", guest.get("city_of_residence"), 30, context=ctx)


def append_envio_xml(parent: ET.Element, reservation_data: dict) -> None:
    node = ET.SubElement(parent, _tag("Envio"))
    _add_element(node, "Numero_Ficheiro", reservation_data.get("file_number"), context="Envio")
    _add_element(node, "Data_Movimento", reservation_data.get("date"), context="Envio")


def generate_sibaXml(property_data: dict, reservation_data: dict, forms_data: list[dict]) -> str:
    """Monta <MovimentoBAL> e devolve o XML completo (UTF-8, indentado)."""
    if not forms_data:
        raise SibaValidationError("A reserva não tem hóspedes (formulários) associados.")

    root = ET.Element(_tag("MovimentoBAL"))
    append_property_xml(root, property_data)
    append_forms_xml(root, forms_data)
    append_envio_xml(root, reservation_data)

    ET.indent(root, space="  ")  # Python 3.9+
    xml_bytes = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    return xml_bytes.decode("utf-8")


def validate_against_xsd(xml_string: str, xsd_path: str | Path) -> list[str]:
    """Valida o XML contra o XSD (requer lxml). Devolve lista de erros (vazia = válido)."""
    from lxml import etree

    schema = etree.XMLSchema(etree.parse(str(xsd_path)))
    doc = etree.fromstring(xml_string.encode("utf-8"))
    if schema.validate(doc):
        return []
    return [f"linha {e.line}: {e.message}" for e in schema.error_log]


def save_xml(xml_string: str, directory: str | Path | None = None, filename: str | None = None) -> Path:
    """Guarda o XML no diretório indicado (por omissão, o diretório atual)."""
    directory = Path(directory) if directory else Path.cwd()
    directory.mkdir(parents=True, exist_ok=True)
    if not filename:
        filename = f"siba_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xml"
    path = directory / filename
    path.write_text(xml_string, encoding="utf-8")
    return path



def generate_siba_xml_for_reservation(db: Session, reservation_id: int) -> str:
    """
    Gera o XML SIBA para uma reserva específica.
    Se file_number for None, pede o próximo sequencial com get_next_file_number.
    Para testes, passa um file_number fixo (ex.: 1) para não consumir o sequencial real.
    """
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise SibaValidationError("Reserva não encontrada.")

    res_data = getReservationData(db, reservation_id=reservation_id)
    forms_data = getFormsData(db, reservation_id=reservation_id)

    if not res_data:
        raise SibaValidationError("Reserva não encontrada.")
    if not forms_data:
        raise SibaValidationError("A reserva não tem hóspedes (formulários) associados.")

    prop_data = getPropertyData(db, user_id=reservation.user_id)
    if not prop_data:
        raise SibaValidationError("Propriedade não encontrada.")

    xml_final = generate_sibaXml(prop_data, res_data, forms_data)
    print(f"\nXML guardado em: {save_xml(xml_final, filename='teste_siba2.xml')}")
    return xml_final
# ---------------------------------------------------------------------------
# Teste local
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from app.db.session import SessionLocal

    RESERVATION_ID_TESTE = 2  # id de uma reserva existente
    USER_ID_TESTE = 1         # user_id correspondente
    XSD_PATH = Path("SIBA1.XSD")

    db = SessionLocal()
    try:
        prop_data = getPropertyData(db, user_id=USER_ID_TESTE)
        # file_number fixo para não consumir o sequencial real durante os testes
        res_data = getReservationData(db, reservation_id=RESERVATION_ID_TESTE)
        forms_data = getFormsData(db, reservation_id=RESERVATION_ID_TESTE)

        if not prop_data:
            raise SystemExit("Erro: propriedade não encontrada.")
        if not res_data:
            raise SystemExit("Erro: reserva não encontrada.")

        try:
            xml_final = generate_sibaXml(prop_data, res_data, forms_data)
        except SibaValidationError as exc:
            raise SystemExit(f"Dados inválidos para o SIBA: {exc}")

        print(xml_final)

        if XSD_PATH.exists():
            errors = validate_against_xsd(xml_final, XSD_PATH)
            print("XML válido contra o XSD." if not errors else "Erros XSD:\n" + "\n".join(errors))
        else:
            print(f"(XSD '{XSD_PATH}' não encontrado, validação ignorada.)")

        print(f"\nXML guardado em: {save_xml(xml_final, filename='teste_siba.xml')}")
    finally:
        db.close()