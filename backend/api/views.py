from rest_framework import viewsets, permissions
from .models import Service, Enquiry, ServiceRequest, Report
from .serializers import ServiceSerializer, EnquirySerializer, ServiceRequestSerializer, ReportSerializer, ServiceRequestReportUploadSerializer
from django.http import JsonResponse, HttpResponseRedirect
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_exempt
from django.conf import settings
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import action
from rest_framework.views import APIView
from django.db.models import Count
import hashlib
import uuid
from django.core.mail import send_mail
from django.core.cache import cache
import random
from .serializers import ProfileUpdateSerializer, CustomUserSerializer
from django.contrib.auth import get_user_model
from django.db.models import Count, Q

User = get_user_model()


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
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        Admins can see all requests.
        Regular users can only see their own requests.
        """
        user = self.request.user
        if user.is_staff:
            return ServiceRequest.objects.all().order_by('-request_date')
        return ServiceRequest.objects.filter(client=user).order_by('-request_date')

    def perform_create(self, serializer):
        """
        Associate the service request with the logged-in user.
        The status will default to 'pending_approval' from the model.
        """
        serializer.save(client=self.request.user)

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
        serializer = self.get_serializer(service_request, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

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

        return Response(ServiceRequestSerializer(service_request).data)


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
        service_request_id = request.data.get('service_request_id')
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
            total_requests=Count('id'),
            completed=Count('id', filter=Q(status='completed')),
            in_progress=Count('id', filter=Q(status='in_progress')),
            pending_approval=Count('id', filter=Q(status='pending_approval')),
            awaiting_payment=Count('id', filter=Q(status='awaiting_payment')),
            rejected=Count('id', filter=Q(status='rejected')),
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


class AdminStatusDistributionView(APIView):
    permission_classes = [permissions.IsAdminUser]

    def get(self, request, *args, **kwargs):
        status_distribution = ServiceRequest.objects.values('status').annotate(count=Count('status')).order_by('status')
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
        thirty_days_ago = timezone.now() - timedelta(days=30)

        # Note: 'approved' here means any status past 'pending_approval' and not rejected/cancelled.
        approved_statuses = ['awaiting_payment', 'in_progress', 'completed']

        stats = ServiceRequest.objects.filter(request_date__gte=thirty_days_ago).aggregate(
            total_requests=Count('id'),
            approved=Count('id', filter=Q(status__in=approved_statuses)),
            completed=Count('id', filter=Q(status='completed')),
        )
        stats['total_users'] = User.objects.count()
        return Response(stats)



