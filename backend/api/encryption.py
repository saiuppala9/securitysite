from django.conf import settings
from cryptography.fernet import Fernet

# Initialize Fernet with the key from settings
fernet = Fernet(settings.ENCRYPTION_KEY)

def encrypt(text: str) -> str:
    """Encrypts a string."""
    if not text:
        return ''
    return fernet.encrypt(text.encode()).decode()

def decrypt(token: str) -> str:
    """Decrypts a token back to a string."""
    if not token:
        return ''
    try:
        return fernet.decrypt(token.encode()).decode()
    except Exception:
        # Handle cases where the token is invalid or tampered with
        return 'DECRYPTION_ERROR'
