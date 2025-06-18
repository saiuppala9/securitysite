from django.contrib import admin
from .models import UserAccount, Service, ServiceRequest, Report

class ReportInline(admin.TabularInline):
    model = Report
    extra = 1

@admin.register(UserAccount)
class UserAccountAdmin(admin.ModelAdmin):
    list_display = ('email', 'first_name', 'last_name', 'is_staff')
    search_fields = ('email',)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'price')

@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'service', 'status', 'request_date')
    list_filter = ('status', 'service')
    search_fields = ('client__email', 'service__name')
    inlines = [ReportInline]
    readonly_fields = ('client', 'service', 'url', 'roles', 'credentials', 'notes', 'payment_gateway_txn_id')

    def get_readonly_fields(self, request, obj=None):
        # Allow status to be changed until the request is completed or cancelled
        if obj and obj.status in ['completed', 'cancelled']:
            return self.readonly_fields + ('status',)
        return self.readonly_fields

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'service_request', 'uploaded_at')
    search_fields = ('service_request__client__email',)
