from app.models.login import User

def get_user_notifications(user: User) -> list[dict]:
    alerts = []

    if not user.nif:
        alerts.append({
            "code": "MISSING_NIF"
        })

    if not user.siba_code:
        alerts.append({
            "code": "MISSING_SIBA_CODE"
        })

    if not user.hashed_sibaKey:
        alerts.append({
            "code": "MISSING_SIBA_KEY"
        })

    if not user.property_name or not user.property_number\
            or not user.abbreviation or not user.address or not user.city or not user.postal_code\
            or not user.postal_zone or not user.telephone or not user.contact_name:
        alerts.append({
            "code": "MISSING_PROPERTY_INFO"
        })
    return alerts