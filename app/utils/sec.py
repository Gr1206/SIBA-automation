from fastapi import HTTPException
from fastapi.params import Cookie
from app.exceptions.expiredSession import SessionExpiredException
from pwdlib import PasswordHash
from itsdangerous import BadSignature, URLSafeSerializer
import os 
from dotenv import load_dotenv
from cryptography.fernet import Fernet

load_dotenv()  

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY is not set in the environment variables.")

SIBA_ENCRYPT_KEY = os.getenv("SIBA_ENCRYPT_KEY")
if not SIBA_ENCRYPT_KEY:
    raise ValueError("SIBA_ENCRYPT_KEY is not set in the environment variables.")

ENCRYPTION_KEY = os.getenv("ENCRYPTION_KEY")
if not ENCRYPTION_KEY:
    raise ValueError("ENCRYPTION_KEY is not set in the environment variables.")

signer = URLSafeSerializer(SECRET_KEY)

fernet = Fernet(SIBA_ENCRYPT_KEY.encode() if isinstance(SIBA_ENCRYPT_KEY, str) else SIBA_ENCRYPT_KEY)

fernet_encryptor = Fernet(ENCRYPTION_KEY.encode() if isinstance(ENCRYPTION_KEY, str) else ENCRYPTION_KEY)

password_hasher = PasswordHash.recommended()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    """
    return password_hasher.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """
    Hash a plain password.
    """
    return password_hasher.hash(password)


def gen_sesh_cookie(user_id: int) -> str:
    """
    Generate a signed token for the given data.
    """
    return signer.dumps(user_id)

def current_user(user_id: str | None = Cookie(default=None)) -> int:
    """
    Verify and load the signed token to retrieve the original data.
    """
    if not user_id:
        raise SessionExpiredException()
    try:
        real_user_id = signer.loads(user_id)
        return int(real_user_id)
    except BadSignature:
        raise SessionExpiredException()


def encrypt_sibaKey(key: str) -> str:
    """
    Encrypt the given key using Fernet symmetric encryption.
    """
    if not key:
        return None
    return fernet.encrypt(key.encode("utf-8")).decode("utf-8")

def decrypt_sibaKey(encrypted_key: str) -> str:
    """
    Decrypt the given encrypted key using Fernet symmetric encryption.
    """
    if not encrypted_key:
        return None
    return fernet.decrypt(encrypted_key.encode("utf-8")).decode("utf-8")


def encrypt_data(data: str) -> str:
    """
    Encrypt the given data using Fernet symmetric encryption.
    """
    if not data:
        return None
    return fernet_encryptor.encrypt(data.encode("utf-8")).decode("utf-8")

def decrypt_data(encrypted_data: str) -> str:
    """
    Decrypt the given encrypted data using Fernet symmetric encryption.
    """
    if not encrypted_data:
        return None
    return fernet_encryptor.decrypt(encrypted_data.encode("utf-8")).decode("utf-8")

def decrypt_dataList(ency_dataList : list[str]) -> list[str]:
    """
    Decrypt a list of encrypted data using Fernet symmetric encryption.
    """
    if not ency_dataList:
        return None
    decrypted_list = []
    for ency_data in ency_dataList:
        decrypted_list.append(fernet_encryptor.decrypt(ency_data.encode("utf-8")).decode("utf-8"))
    return decrypted_list