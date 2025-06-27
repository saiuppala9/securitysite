from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer, UserSerializer as BaseUserSerializer
from django.contrib.auth.models import User, Group
from rest_framework import serializers
from .models import Service, Enquiry, ServiceRequest, Report, UserAccount
from .utils import encrypt
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth import authenticate

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        # Authenticate user
        authenticate_kwargs = {
            'email': attrs['email'],
            'password': attrs['password']
        }
        user = authenticate(**authenticate_kwargs)
        
        if user is None:
            raise serializers.ValidationError('No active account found with the given credentials')

        if not user.is_active:
            raise serializers.ValidationError('Account is not active')

        refresh = self.get_token(user)
        data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
            }
        }
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims
        token['is_staff'] = user.is_staff
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token

class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'password', 'is_staff')


class UserSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'is_staff')


class CustomUserSerializer(BaseUserSerializer):
    group_name = serializers.SerializerMethodField()

    class Meta(BaseUserSerializer.Meta):
        model = UserAccount
        fields = ('id', 'email', 'first_name', 'last_name', 'is_staff', 'is_superuser', 'group_name')

    def get_group_name(self, obj):
        return obj.groups.first().name if obj.groups.exists() else None


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ('id', 'name', 'description', 'price', 'image')


class EnquirySerializer(serializers.ModelSerializer):
    class Meta:
        model = Enquiry
        fields = '__all__'


class ReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Report
        fields = '__all__'


class SetInitialPasswordSerializer(serializers.Serializer):
    """
    Serializer for setting the initial password. Does not require UID or Token
    as they are handled in the view from the URL.
    """
    new_password = serializers.CharField(style={'input_type': 'password'}, min_length=8)
    re_new_password = serializers.CharField(style={'input_type': 'password'})

    def validate(self, attrs):
        if attrs['new_password'] != attrs['re_new_password']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs


class ServiceRequestReportUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = ('report_file',)


class ServiceRequestAssignSerializer(serializers.Serializer):
    """
    Serializer for assigning a service request to an admin user.
    """
    admin_id = serializers.IntegerField(required=True)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ('first_name', 'last_name')


class AdminUserSerializer(serializers.ModelSerializer):
    group = serializers.CharField(write_only=True)
    group_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = UserAccount
        fields = ('id', 'email', 'first_name', 'last_name', 'group', 'group_name')

    def get_group_name(self, obj):
        return obj.groups.first().name if obj.groups.exists() else None

    def create(self, validated_data):
        group_name = validated_data.pop('group')
        user = UserAccount.objects.create_user(
            email=validated_data['email'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            is_staff=True,
            is_active=True
        )
        # Set an unusable password; user must reset it.
        user.set_unusable_password()
        user.save()

        group = Group.objects.get(name=group_name)
        user.groups.add(group)

        # Send password reset email
        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        reset_url = f"{settings.FRONTEND_URL}/set-initial-password/{uid}/{token}"
        
        context = {
            'user': user,
            'reset_url': reset_url,
        }
        
        subject = "Welcome to Cyphex - Set Your Password"
        message = render_to_string('emails/welcome_admin.txt', context)
        
        send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])

        return user


class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ('first_name', 'last_name', 'email')
        read_only_fields = ('email',)

class PasswordResetSerializer(serializers.Serializer):
    new_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    confirm_password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return data

class AdminProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ('first_name', 'last_name')

class UserDashboardStatsSerializer(serializers.Serializer):
    """
    Serializer for user dashboard statistics.
    """
    total_requests = serializers.IntegerField()
    pending_approval = serializers.IntegerField()
    awaiting_payment = serializers.IntegerField()
    in_progress = serializers.IntegerField()
    completed = serializers.IntegerField()
    rejected = serializers.IntegerField()

class AdminServiceRequestStatsSerializer(serializers.Serializer):
    """
    Serializer for admin dashboard statistics.
    """
    total_requests = serializers.IntegerField()
    approved_requests = serializers.IntegerField()
    completed_requests = serializers.IntegerField()
    
class AdminStatusDistributionSerializer(serializers.Serializer):
    """
    Serializer for admin dashboard status distribution.
    """
    status = serializers.CharField()
    count = serializers.IntegerField()

class ServiceRequestSerializer(serializers.ModelSerializer):
    # Read-only fields for display
    client = serializers.StringRelatedField(read_only=True)
    service_name = serializers.SerializerMethodField()
    service_image = serializers.SerializerMethodField()
    report_url = serializers.SerializerMethodField()
    assigned_to_email = serializers.SerializerMethodField()

    # Write-only fields for create/update
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), source='service', write_only=True
    )
    credentials = serializers.CharField(write_only=True, required=False)
    assigned_to = serializers.PrimaryKeyRelatedField(
        queryset=UserAccount.objects.filter(is_staff=True),
        required=False,
        allow_null=True
    )

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'client', 'service_name', 'service_image', 'status',
            'request_date', 'approved_at', 'url', 'roles', 'notes', 'credentials',
            'report_file', 'payment_gateway_txn_id', 'report_url',
            'assigned_to', 'assigned_to_email', 'service_id'
        ]
        read_only_fields = (
            'id', 'client', 'service_name', 'service_image', 'request_date',
            'approved_at', 'report_url', 'payment_gateway_txn_id',
            'assigned_to_email'
        )

    def get_service_name(self, obj):
        try:
            return obj.service.name if obj.service else None
        except Exception:
            return "[Error retrieving service name]"

    def get_service_image(self, obj):
        try:
            if obj.service and obj.service.image:
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(obj.service.image.url)
            return None
        except Exception:
            return None

    def get_assigned_to_email(self, obj):
        try:
            return obj.assigned_to.email if obj.assigned_to else None
        except Exception:
            return "[Error retrieving assignee]"

    def get_report_url(self, obj):
        try:
            request = self.context.get('request')
            if not request:
                return None
                
            # First, check the related Report model, which is the new standard
            report = obj.reports.order_by('-uploaded_at').first()
            if report and report.report_file:
                return request.build_absolute_uri(report.report_file.url)

            # Fallback to the old report_file field on ServiceRequest for backward compatibility
            if obj.report_file:
                return request.build_absolute_uri(obj.report_file.url)
                
            return None
        except Exception:
            return None

    def create(self, validated_data):
        """
        Encrypt credentials before saving.
        The client is associated in the ViewSet's perform_create method.
        """
        credentials_raw = validated_data.pop('credentials', None)
        if credentials_raw:
            validated_data['credentials'] = encrypt(credentials_raw)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """
        Custom logic to handle assignment and credential encryption.
        """
        if 'assigned_to' in validated_data:
            instance.assigned_to = validated_data.pop('assigned_to', instance.assigned_to)

        credentials_raw = validated_data.pop('credentials', None)
        if credentials_raw:
            instance.credentials = encrypt(credentials_raw)

        instance = super().update(instance, validated_data)
        return instance
