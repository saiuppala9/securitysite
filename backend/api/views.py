from django.shortcuts import render
from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.conf import settings
from django.core.mail import send_mail
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.http import JsonResponse
from django.contrib.auth import get_user_model
from django.db.models import Count
from django.contrib.auth.models import Group
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.exceptions import ValidationError
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework_simplejwt.views import TokenObtainPairView
from django.core.cache import cache
from .models import Service, Enquiry, ServiceRequest, Report, UserAccount
from .serializers import (
    ServiceSerializer, EnquirySerializer, ServiceRequestSerializer,
    ServiceRequestReportUploadSerializer, ServiceRequestAssignSerializer,
    UserDashboardStatsSerializer, AdminServiceRequestStatsSerializer,
    AdminStatusDistributionSerializer, AdminUserSerializer, ReportSerializer,
    SetInitialPasswordSerializer, AdminProfileUpdateSerializer,
    CustomTokenObtainPairSerializer, ProfileUpdateSerializer,
    PasswordResetSerializer, AdminProfileSerializer, CustomUserSerializer
)
from .utils import encrypt, decrypt
import json
import uuid
import hmac
import random
import logging
from datetime import timedelta

logger = logging.getLogger(__name__)
User = get_user_model()


class AdminProfileUpdateInitiateView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, *args, **kwargs):
        user = request.user
        update_type = request.data.get('update_type')  # 'details' or 'password'

        pending_data = {'update_type': update_type}

        if update_type == 'details':
            serializer = AdminProfileSerializer(instance=user, data=request.data, partial=True)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            pending_data.update(serializer.validated_data)
        
        elif update_type == 'password':
            serializer = PasswordResetSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            pending_data.update(serializer.validated_data)
        
        else:
            return Response({'error': 'Invalid update type specified.'}, status=status.HTTP_400_BAD_REQUEST)

        otp = str(random.randint(100000, 999999))
        cache.set(f'profile_update_{user.id}', {'otp': otp, 'data': pending_data}, timeout=300)  # 5 minutes expiry

        try:
            send_mail(
                'Your Profile Update OTP',
                f'Your OTP to update your profile is: {otp}. It is valid for 5 minutes.',
                settings.DEFAULT_FROM_EMAIL,
                [user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error(f"Failed to send profile update OTP email to {user.email}: {e}")
            return Response({'error': 'Failed to send OTP email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'detail': 'OTP has been sent to your email.'}, status=status.HTTP_200_OK)


class AdminProfileUpdateVerifyView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, *args, **kwargs):
        user = request.user
        otp_from_user = request.data.get('otp')

        if not otp_from_user:
            return Response({'error': 'OTP is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cached_info = cache.get(f'profile_update_{user.id}')

        if not cached_info:
            return Response({'error': 'OTP has expired or is invalid. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

        if cached_info['otp'] != otp_from_user:
            return Response({'error': 'The OTP you entered is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        pending_data = cached_info['data']
        update_type = pending_data['update_type']

        if update_type == 'details':
            user.first_name = pending_data.get('first_name', user.first_name)
            user.last_name = pending_data.get('last_name', user.last_name)
            user.save(update_fields=['first_name', 'last_name'])

        elif update_type == 'password':
            user.set_password(pending_data['new_password'])
            user.save(update_fields=['password'])

        cache.delete(f'profile_update_{user.id}')
        return Response({'detail': 'Your profile has been updated successfully.'}, status=status.HTTP_200_OK)


class ServiceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows services to be viewed or edited.
    """
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAdminUser]
        else:
            self.permission_classes = [permissions.AllowAny]
        return super().get_permissions()


class EnquiryViewSet(viewsets.ModelViewSet):
    """
    API endpoint for enquiries.
    """
    queryset = Enquiry.objects.all()
    serializer_class = EnquirySerializer

    def get_permissions(self):
        """
        Instantiates and returns the list of permissions that this view requires.
        """
        if self.action == 'create':
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [permissions.IsAdminUser]
        return [permission() for permission in permission_classes]


class ServiceRequestViewSet(viewsets.ModelViewSet):
    serializer_class = ServiceRequestSerializer

    def get_queryset(self):
        """
        Admins see requests based on their role.
        - Superuser, Main Admin, Full Access Admin: All requests.
        - Partial Access Admin: Only assigned requests.
        - Regular users: Only their own requests.
        - Other staff: No requests.
        """
        user = self.request.user
        if not user.is_authenticated:
            return ServiceRequest.objects.none()

        # Base queryset with optimizations to prevent N+1 query problems
        base_queryset = ServiceRequest.objects.select_related(
            'service', 'client', 'assigned_to'
        ).prefetch_related('reports')

        if user.is_staff:
            is_main_or_full_admin = user.is_superuser or \
                                    user.groups.filter(name__in=['Main Admin', 'Full Access Admin']).exists()

            if is_main_or_full_admin:
                return base_queryset.all().order_by('-request_date')

            if user.groups.filter(name='Partial Access Admin').exists():
                return base_queryset.filter(assigned_to=user).order_by('-request_date')
            
            # Staff user with no specific admin role (if any) sees nothing
            return ServiceRequest.objects.none()

        # Regular, non-staff user
        return base_queryset.filter(client=user).order_by('-request_date')

    def perform_create(self, serializer):
        """
        Associate the service request with the logged-in user.
        The status will default to 'pending_approval' from the model.
        """
        serializer.save(client=self.request.user)

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        """
        Allows a user to withdraw their own service request if it is pending approval.
        """
        service_request = self.get_object()
        if service_request.client != request.user:
            return Response(
                {'error': 'You do not have permission to withdraw this request.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if service_request.status != 'pending_approval':
            return Response(
                {'error': 'This request cannot be withdrawn because it is no longer pending approval.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        service_request.status = 'withdrawn'
        service_request.save()
        serializer = self.get_serializer(service_request)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def assign(self, request, pk=None):
        """
        Assigns a service request to an admin user.
        """
        service_request = self.get_object()
        serializer = ServiceRequestAssignSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        admin_id = serializer.validated_data['admin_id']

        try:
            admin_user = User.objects.get(id=admin_id, is_staff=True)
        except User.DoesNotExist:
            return Response({'error': 'Admin user not found.'}, status=status.HTTP_404_NOT_FOUND)

        service_request.assigned_to = admin_user
        service_request.save(update_fields=['assigned_to'])

        return Response(ServiceRequestSerializer(service_request, context={'request': request}).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser])
    def update_status(self, request, pk=None):
        service_request = self.get_object()
        status = request.data.get('status')
        if status not in ['awaiting_payment', 'rejected']:
            return Response({'error': 'Invalid status'}, status=400)

        update_fields = ['status']
        service_request.status = status

        if status == 'awaiting_payment':
            service_request.approved_at = timezone.now()
            update_fields.append('approved_at')

        service_request.save(update_fields=update_fields)

        # TODO: Send email notification to the client about the status update

        return Response(ServiceRequestSerializer(service_request).data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAdminUser], serializer_class=ServiceRequestReportUploadSerializer)
    def upload_report(self, request, pk=None):
        service_request = self.get_object()
        
        # Debug information
        print(f"Upload report request received for service_request {pk}")
        print(f"FILES: {request.FILES}")
        print(f"DATA: {request.data}")
        
        # Check if there's a file in the request
        if 'report_file' not in request.FILES:
            return Response({'error': 'No report file provided'}, status=400)
            
        file_obj = request.FILES['report_file']
        print(f"File received: {file_obj.name}, size: {file_obj.size}, content_type: {file_obj.content_type}")
        
        # Create a new Report instance
        try:
            report = Report.objects.create(
                service_request=service_request,
                report_file=file_obj
            )
            print(f"Report created with ID: {report.id}")
            
            # Update service request status
            service_request.status = 'completed'
            service_request.save()
            
            # Send email notification to user
            try:
                subject = f"Your Security Report for '{service_request.service.name}' is Ready"
                message = f"""
Dear {service_request.client.first_name or service_request.client.email},

Your security audit report for the service "{service_request.service.name}" is now complete and available for download.

You can view and download your report from your dashboard by visiting the following link:
{settings.FRONTEND_URL}/my-requests

Thank you for choosing our services.

Best regards,
The Cyphex Team
"""
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [service_request.client.email],
                    fail_silently=False,
                )
            except Exception as e:
                # Log the error, but don't fail the request because of it
                print(f"Error sending email notification for service request {service_request.id}: {e}")

            return Response(ServiceRequestSerializer(service_request, context={'request': request}).data)
            
        except Exception as e:
            print(f"Error saving report: {str(e)}")
            return Response({'error': f'Error saving report: {str(e)}'}, status=500)


class ReportViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows reports to be viewed or uploaded.
    """
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        """
        This view should return a list of all reports for the
        service requests of the currently authenticated user.
        """
        user = self.request.user
        if user.is_staff:
            return Report.objects.all()
        return Report.objects.filter(service_request__client=user)

    def get_permissions(self):
        """
        Allow admins to create reports, but clients can only view them.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAdminUser]
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]


@ensure_csrf_cookie
def csrf(request):
    """
    This view sends the CSRF cookie.
    """
    return JsonResponse({'detail': 'CSRF cookie set'})


class PayUResponseBaseView(APIView):
    permission_classes = []
    authentication_classes = []

    @csrf_exempt
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def verify_hash(self, data):
        key = settings.PAYU_MERCHANT_KEY
        salt = settings.PAYU_MERCHANT_SALT
        status = data.get('status')
        firstname = data.get('firstname')
        amount = data.get('amount')
        txnid = data.get('txnid')
        posted_hash = data.get('hash')
        productinfo = data.get('productinfo')
        email = data.get('email')

        if not all([key, salt, status, firstname, amount, txnid, posted_hash, productinfo, email]):
            return False

        # The response hash string format is specified by PayU
        hash_string = f"{salt}|{status}|||||||||||{email}|{firstname}|{productinfo}|{amount}|{txnid}|{key}"
        generated_hash = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()

        return posted_hash == generated_hash


class PayUSuccessView(PayUResponseBaseView):
    def post(self, request, *args, **kwargs):
        if not self.verify_hash(request.data):
            print("PayU Success hash verification failed.")
            return HttpResponseRedirect(settings.FRONTEND_URL + '/payment/failure/')

        txnid = request.data.get('txnid')
        try:
            service_request = ServiceRequest.objects.get(payment_gateway_txn_id=txnid)
            if service_request.status == 'awaiting_payment':
                service_request.status = 'in_progress'
                service_request.save()
            return HttpResponseRedirect(settings.FRONTEND_URL + '/payment/success/')
        except ServiceRequest.DoesNotExist:
            print(f"PayU Success callback for non-existent txnid: {txnid}")
            return HttpResponseRedirect(settings.FRONTEND_URL + '/payment/failure/')


class PayUFailureView(PayUResponseBaseView):
    def post(self, request, *args, **kwargs):
        # The user is redirected here if the payment fails or is cancelled.
        # We don't need to change the service request status, as it remains 'awaiting_payment'.
        print(f"PayU payment failed or was cancelled. Data: {request.data}")
        return HttpResponseRedirect(settings.FRONTEND_URL + '/payment/failure/')


class PayUInitiatePaymentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        # Extract service_request_id from URL or request data
        service_request_id = kwargs.get('pk') or request.data.get('service_request_id')
        
        if not service_request_id:
            return Response({'error': 'Service request ID is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            service_request = ServiceRequest.objects.get(id=service_request_id, client=request.user)
        except ServiceRequest.DoesNotExist:
            return Response({'error': 'Service request not found.'}, status=status.HTTP_404_NOT_FOUND)

        if service_request.status != 'awaiting_payment':
            return Response({'error': 'This request is not awaiting payment.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate a unique transaction ID
        txnid = str(uuid.uuid4()).replace('-', '')
        service_request.payment_gateway_txn_id = txnid
        service_request.save()

        key = settings.PAYU_MERCHANT_KEY
        salt = settings.PAYU_MERCHANT_SALT
        amount = "{:.1f}".format(service_request.service.price)
        productinfo = service_request.service.name
        firstname = request.user.first_name or request.user.email.split('@')[0]
        email = request.user.email

        # The hash string needs to be in a specific format
        hash_string = f"{key}|{txnid}|{amount}|{productinfo}|{firstname}|{email}|||||||||||{salt}"
        hash_ = hashlib.sha512(hash_string.encode('utf-8')).hexdigest()

        payment_data = {
            'key': key,
            'txnid': txnid,
            'amount': amount,
            'productinfo': productinfo,
            'firstname': firstname,
            'email': email,
            'phone': '9999999999',  # Placeholder phone number
            'surl': settings.BACKEND_URL + '/api/payu/success/',
            'furl': settings.BACKEND_URL + '/api/payu/failure/',
            'hash': hash_,
            'service_provider': 'payu_paisa',
            'payu_mode': settings.PAYU_MODE
        }

        return Response(payment_data)


class InitiateProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        pending_data = serializer.validated_data
        
        # Generate OTP
        otp = str(random.randint(100000, 999999))
        
        # Cache OTP and pending data for 5 minutes
        cache_key = f"profile_update_otp_{user.id}"
        cache.set(cache_key, {'otp': otp, 'data': pending_data}, timeout=300)
        
        # Send OTP via email
        try:
            subject = "Your Profile Update Verification Code"
            message = f"Your verification code is: {otp}. It is valid for 5 minutes."
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
        except Exception as e:
            print(f"Error sending OTP email: {e}")
            return Response({'error': 'Failed to send verification email.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'message': 'Verification OTP sent to your email.'}, status=status.HTTP_200_OK)


class ServiceRequestStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        stats = ServiceRequest.objects.filter(client=user).aggregate(
            total_requests_count=Count('pk'),
            completed_count=Count('pk', filter=Q(status='completed')),
            in_progress_count=Count('pk', filter=Q(status='in_progress')),
            pending_approval_count=Count('pk', filter=Q(status='pending_approval')),
            awaiting_payment_count=Count('pk', filter=Q(status='awaiting_payment')),
            rejected_count=Count('pk', filter=Q(status='rejected')),
            withdrawn_count=Count('pk', filter=Q(status='withdrawn')),
        )
        return Response(stats)


class VerifyProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        submitted_otp = request.data.get('otp')

        if not submitted_otp:
            return Response({'error': 'OTP is required.'}, status=status.HTTP_400_BAD_REQUEST)

        cache_key = f"profile_update_otp_{user.id}"
        cached_info = cache.get(cache_key)

        if not cached_info:
            return Response({'error': 'OTP has expired or is invalid. Please try again.'}, status=status.HTTP_400_BAD_REQUEST)

        if submitted_otp != cached_info.get('otp'):
            return Response({'error': 'The submitted OTP is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

        # OTP is correct, update user profile
        pending_data = cached_info.get('data', {})
        
        serializer = ProfileUpdateSerializer(user, data=pending_data, partial=True)
        if serializer.is_valid():
            serializer.save()
            # Clear the cache
            cache.delete(cache_key)
            # Return updated user data
            updated_user_serializer = CustomUserSerializer(user)
            return Response(updated_user_serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class IsSuperAdmin(permissions.BasePermission):
    """
    Custom permission to only allow super admins (Main or Full Access).
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and \
               (request.user.is_superuser or
                request.user.groups.filter(name__in=['Main Admin', 'Full Access Admin']).exists())


class SetInitialPasswordView(generics.GenericAPIView):
    permission_classes = [permissions.AllowAny]
    serializer_class = SetInitialPasswordSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        uidb64 = self.kwargs.get('uidb64')
        token = self.kwargs.get('token')
        logger.info(f"Attempting to set password with uidb64: {uidb64}, token: {token}")

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = UserAccount.objects.get(pk=uid)
            logger.info(f"Found user: {user.email} with pk: {uid}")
        except (TypeError, ValueError, OverflowError, UserAccount.DoesNotExist) as e:
            user = None
            logger.error(f"Error finding user from uidb64 {uidb64}: {e}")

        if user is not None:
            token_is_valid = default_token_generator.check_token(user, token)
            logger.info(f"Token validation result for user {user.email}: {token_is_valid}")
            if token_is_valid:
                new_password = serializer.validated_data['new_password']
                user.set_password(new_password)
                user.save()
                logger.info(f"Successfully set new password for {user.email}")
                return Response({"detail": "Password has been set successfully."}, status=status.HTTP_200_OK)
        
        logger.warning(f"Invalid token or user ID for uidb64: {uidb64}")
        return Response({"detail": "Invalid token or user ID."}, status=status.HTTP_400_BAD_REQUEST)


class AdminListForAssignmentView(APIView):
    """
    Provides a list of all designated admin users for assignment purposes.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        admin_group_names = ['Main Admin', 'Full Access Admin', 'Partial Access Admin']
        admins = UserAccount.objects.filter(groups__name__in=admin_group_names).distinct()
        serializer = CustomUserSerializer(admins, many=True)
        return Response(serializer.data)


class AdminUserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for main admins to manage other admin users.
    """
    serializer_class = AdminUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        """
        Returns all staff users who belong to one of the admin groups.
        This ensures that only explicitly designated admins appear in assignment lists,
        excluding any system or non-admin staff accounts.
        """
        admin_group_names = ['Main Admin', 'Full Access Admin', 'Partial Access Admin']
        return User.objects.filter(groups__name__in=admin_group_names).distinct()


class UserDashboardStatsView(APIView):
    """
    Provides statistics for the logged-in user's dashboard.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        # This endpoint is for non-admin clients.
        if request.user.is_staff:
            return Response(
                {"error": "This endpoint is for client users."},
                status=status.HTTP_403_FORBIDDEN
            )

        base_queryset = ServiceRequest.objects.filter(client=request.user)

        stats = base_queryset.aggregate(
            total_requests=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            in_progress=Count('id', filter=Q(status='in_progress')),
            pending_approval=Count('id', filter=Q(status='pending_approval')),
            awaiting_payment=Count('id', filter=Q(status='awaiting_payment')),
            rejected=Count('id', filter=Q(status='rejected')),
            withdrawn=Count('id', filter=Q(status='withdrawn')),
        )
        return Response(stats)


class AdminStatusDistributionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        user = request.user
        base_queryset = ServiceRequest.objects.all()

        if user.groups.filter(name='Partial Access Admin').exists():
            base_queryset = base_queryset.filter(assigned_to=user)

        status_distribution = base_queryset.values('status').annotate(count=Count('status')).order_by('status')
        return Response(list(status_distribution))


class AdminServiceRequestStatsView(APIView):
    """
    Provides statistics for the admin dashboard.
    - Total requests in the last 30 days.
    - Approved requests in the last 30 days.
    - Completed requests in the last 30 days.
    """
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        user = request.user
        thirty_days_ago = timezone.now() - timedelta(days=30)

        base_queryset = ServiceRequest.objects.filter(request_date__gte=thirty_days_ago)

        # Filter for partial admins
        if user.groups.filter(name='Partial Access Admin').exists():
            base_queryset = base_queryset.filter(assigned_to=user)

        stats = base_queryset.aggregate(
            total_requests=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            withdrawn=Count('id', filter=Q(status='withdrawn')),
            rejected=Count('id', filter=Q(status='rejected')),
        )

        if not user.groups.filter(name='Partial Access Admin').exists():
            stats['total_users'] = User.objects.filter(is_staff=False, is_active=True).count()
        else:
            stats['total_users'] = 0  # Partial admins don't see this, but API should be consistent

        return Response(stats)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer



