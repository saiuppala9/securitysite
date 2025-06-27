import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from api.models import UserAccount
from django.contrib.auth import authenticate

def verify_password():
    # Try to authenticate with the provided credentials
    user = authenticate(email='admin@cyphex.in', password='Sai@1234')
    
    if user is not None:
        print(f"Authentication successful for {user.email}")
        print(f"User ID: {user.id}")
        print(f"Is staff: {user.is_staff}")
        print(f"Is active: {user.is_active}")
    else:
        print("Authentication failed. Invalid credentials.")
        
        # Check if user exists
        try:
            user = UserAccount.objects.get(email='admin@cyphex.in')
            print(f"User exists with ID: {user.id}")
            print(f"Is staff: {user.is_staff}")
            print(f"Is active: {user.is_active}")
            print("Password is incorrect or authentication backend issue.")
        except UserAccount.DoesNotExist:
            print("User does not exist.")

if __name__ == '__main__':
    verify_password() 