from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.conf import settings

class UserAccountManager(BaseUserManager):
    def create_user(self, email, first_name, last_name, password=None, **extra_fields):
        if not email:
            raise ValueError('Users must have an email address')
        email = self.normalize_email(email)
        user = self.model(email=email, first_name=first_name, last_name=last_name, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, first_name, last_name, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, first_name, last_name, password, **extra_fields)

class UserAccount(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(max_length=255, unique=True)
    username = models.CharField(max_length=255, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    is_active = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)

    objects = UserAccountManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name']

    def get_full_name(self):
        return f'{self.first_name} {self.last_name}'

    def get_short_name(self):
        return self.first_name

    def __str__(self):
        return self.email

class Service(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    image = models.ImageField(upload_to='services/', blank=True, null=True)

    def __str__(self):
        return self.name

class Enquiry(models.Model):
    email = models.EmailField()
    subject = models.CharField(max_length=255)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Enquiry from {self.email} re: {self.subject}'

class ServiceRequest(models.Model):
    STATUS_CHOICES = [
        ('pending_approval', 'Pending Approval'),
        ('awaiting_payment', 'Awaiting Payment'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('rejected', 'Rejected'),
        ('withdrawn', 'Withdrawn'),
        ('cancelled', 'Cancelled'),
    ]
    service = models.ForeignKey(Service, on_delete=models.CASCADE)
    client = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='service_requests')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending_approval')
    approved_at = models.DateTimeField(null=True, blank=True)
    request_date = models.DateTimeField(auto_now_add=True)
    url = models.URLField(max_length=200, default='')
    roles = models.TextField(default='')
    credentials = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    report_file = models.FileField(upload_to='reports/', blank=True, null=True)
    payment_gateway_txn_id = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        service_name = self.service.name if self.service else "[Deleted Service]"
        client_email = self.client.email if self.client else "[Deleted Client]"
        return f'{service_name} request from {client_email}'

class Report(models.Model):
    service_request = models.ForeignKey(ServiceRequest, related_name='reports', on_delete=models.CASCADE)
    report_file = models.FileField(upload_to='reports/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f'Report for {self.service_request}'
