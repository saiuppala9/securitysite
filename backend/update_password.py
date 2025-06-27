import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from api.models import UserAccount

def update_password():
    try:
        user = UserAccount.objects.get(email='admin@cyphex.in')
        print(f"Found user: {user.email} (ID: {user.id})")
        
        # Set the new password
        user.set_password('Sai@1234')
        user.save()
        
        print("Password updated successfully!")
        print(f"Email: admin@cyphex.in")
        print(f"Password: Sai@1234")
        print(f"Is staff: {user.is_staff}")
        print(f"Is active: {user.is_active}")
    except UserAccount.DoesNotExist:
        print("User admin@cyphex.in does not exist.")

if __name__ == '__main__':
    update_password() 