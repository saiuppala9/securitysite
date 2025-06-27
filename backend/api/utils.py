from cryptography.fernet import Fernet
from django.conf import settings

def get_encryption_key():
    """Get the encryption key from settings or use a default key."""
    return settings.ENCRYPTION_KEY

def encrypt(text):
    """
    Encrypts text using Fernet symmetric encryption.
    """
    if not text:
        return ""
    
    key = get_encryption_key()
    cipher_suite = Fernet(key)
    encrypted_text = cipher_suite.encrypt(text.encode('utf-8'))
    return encrypted_text.decode('utf-8')

def decrypt(encrypted_text):
    """
    Decrypts text that was encrypted using Fernet symmetric encryption.
    """
    if not encrypted_text:
        return ""
        
    key = get_encryption_key()
    cipher_suite = Fernet(key)
    decrypted_text = cipher_suite.decrypt(encrypted_text.encode('utf-8'))
    return decrypted_text.decode('utf-8') 