from djoser.serializers import UserCreateSerializer as BaseUserCreateSerializer, UserSerializer as BaseUserSerializer
from rest_framework import serializers
from .models import Service, Enquiry, ServiceRequest, Report, UserAccount
from .encryption import encrypt

class UserCreateSerializer(BaseUserCreateSerializer):
    class Meta(BaseUserCreateSerializer.Meta):
        model = UserAccount
        fields = ('id', 'email', 'password', 'first_name', 'last_name')


class CustomUserSerializer(BaseUserSerializer):
    class Meta(BaseUserSerializer.Meta):
        model = UserAccount
        fields = ('id', 'email', 'first_name', 'last_name', 'is_staff')


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
        fields = ['id', 'report_file', 'uploaded_at']


class ServiceRequestReportUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = ('report_file',)


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAccount
        fields = ('first_name', 'last_name')


class ServiceRequestSerializer(serializers.ModelSerializer):
    # For read-only fields, we want to display human-readable names.
    client = serializers.StringRelatedField(read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)
    reports = ReportSerializer(many=True, read_only=True)

    # For write operations, we want to accept an ID.
    service_id = serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(), source='service', write_only=True
    )
    credentials = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = ServiceRequest
        fields = [
            'id', 'client', 'service_name', 'service_id', 'status', 'request_date', 'approved_at',
            'url', 'roles', 'notes', 'credentials', 'reports', 'report_file'
        ]
        read_only_fields = [
            'id', 'client', 'service_name', 'request_date', 'reports', 'report_file'
        ]

    def create(self, validated_data):
        """
        Encrypt credentials before saving.
        The client is associated in the ViewSet's perform_create method.
        """
        credentials_raw = validated_data.pop('credentials', None)
        if credentials_raw:
            validated_data['credentials'] = encrypt(credentials_raw)
        return super().create(validated_data)
