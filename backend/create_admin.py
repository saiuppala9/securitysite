from django.contrib.auth import get_user_model

User = get_user_model()

email = 'admin@cyphex.in'
password = 'admin'
first_name = 'Admin'
last_name = 'User'

if User.objects.filter(email=email).exists():
    print(f'User with email {email} already exists. Updating password and ensuring superuser status.')
    user = User.objects.get(email=email)
    user.set_password(password)
    user.is_staff = True
    user.is_superuser = True
    user.is_active = True
    user.save()
    print('Superuser updated successfully.')
else:
    print(f'Creating new superuser with email {email}.')
    User.objects.create_superuser(email=email, first_name=first_name, last_name=last_name, password=password)
    print('Superuser created successfully.')
