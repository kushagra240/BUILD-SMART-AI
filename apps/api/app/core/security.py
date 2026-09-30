from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()


def hash_password(password: str) -> str:
    """Hash password using Argon2id algorithm."""
    return ph.hash(password)


def verify_password(hash_str: str, password: str) -> bool:
    """Verify password against Argon2id hash in constant time."""
    try:
        return ph.verify(hash_str, password)
    except VerifyMismatchError:
        return False
