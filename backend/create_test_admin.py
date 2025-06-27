import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'main.settings')
django.setup()

from api.models import UserAccount

def create_admin_user():
    # Check if the user already exists
    if UserAccount.objects.filter(email='testadmin@example.com').exists():
        print("Test admin user already exists!")
        admin = UserAccount.objects.get(email='testadmin@example.com')
    else:
        # Create a new admin user
        admin = UserAccount.objects.create_user(
            email='testadmin@example.com',
            first_name='Test',
            last_name='Admin',
            password='testadmin123',
            is_staff=True,
            is_active=True
        )
        print("Created new test admin user!")
    
    # Print user details
    print(f"Email: {admin.email}")
    print(f"Password: testadmin123")
    print(f"Is staff: {admin.is_staff}")
    print(f"Is active: {admin.is_active}")

if __name__ == '__main__':
    create_admin_user() 