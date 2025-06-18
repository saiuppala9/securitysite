from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceViewSet, EnquiryViewSet, ServiceRequestViewSet, ReportViewSet, csrf,
    PayUInitiatePaymentView, PayUSuccessView, PayUFailureView,
    InitiateProfileUpdateView, VerifyProfileUpdateView, ServiceRequestStatsView,
    AdminServiceRequestStatsView, AdminStatusDistributionView
)

# Create a router and register our viewsets with it.
router = DefaultRouter()
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'enquiries', EnquiryViewSet, basename='enquiry')
router.register(r'service-requests', ServiceRequestViewSet, basename='servicerequest')
router.register(r'reports', ReportViewSet, basename='report')

# The API URLs are now determined automatically by the router.
urlpatterns = [
    path('csrf/', csrf, name='csrf'),
    path('payu/initiate/', PayUInitiatePaymentView.as_view(), name='payu-initiate'),
    path('payu/success/', PayUSuccessView.as_view(), name='payu-success'),
    path('payu/failure/', PayUFailureView.as_view(), name='payu-failure'),
    path('profile/update/initiate/', InitiateProfileUpdateView.as_view(), name='profile-update-initiate'),
    path('profile/update/verify/', VerifyProfileUpdateView.as_view(), name='profile-update-verify'),
    path('service-requests/stats/', ServiceRequestStatsView.as_view(), name='service-request-stats'),
    path('admin/stats/', AdminServiceRequestStatsView.as_view(), name='admin-service-request-stats'),
    path('admin/status-distribution/', AdminStatusDistributionView.as_view(), name='admin-status-distribution'),
    path('', include(router.urls)),
]
