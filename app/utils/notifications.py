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
    return alerts