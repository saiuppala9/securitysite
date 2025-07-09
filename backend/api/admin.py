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
    list_display = ('id', 'client', 'service', 'status', 'request_date', 'assigned_to')
    list_filter = ('status', 'service', 'assigned_to')
    search_fields = ('client__email', 'service__name')
    inlines = [ReportInline]

    fieldsets = (
        ('Request Details', {
            'fields': ('client', 'service', 'status', 'request_date', 'assigned_to')
        }),
        ('Submitted Information', {
            'fields': ('url', 'roles', 'credentials', 'notes')
        }),
        ('Payment Information', {
            'fields': ('payment_gateway_txn_id',)
        }),
    )

    readonly_fields = ('client', 'service', 'request_date', 'url', 'roles', 'credentials', 'notes', 'payment_gateway_txn_id')

    def get_readonly_fields(self, request, obj=None):
        readonly = list(self.readonly_fields)
        if obj and obj.status in ['completed', 'cancelled']:
            readonly.append('status')
        
        # Make all fields readonly for non-superusers except 'status' and 'assigned_to'
        if not request.user.is_superuser:
            # Get all model fields
            all_fields = [f.name for f in self.model._meta.get_fields() if f.name not in ['reports']]
            # Allow only 'status' and 'assigned_to' to be editable
            editable_fields = ['status', 'assigned_to']
            # Add all other fields to readonly
            for field in all_fields:
                if field not in editable_fields and field not in readonly:
                    readonly.append(field)

        return readonly

from django.utils.html import format_html

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ('id', 'service_request', 'download_report_link', 'uploaded_at')
    search_fields = ('service_request__client__email',)
    readonly_fields = ('uploaded_at',)

    def download_report_link(self, obj):
        if obj.report_file:
            return format_html('<a href="{url}" target="_blank">Download</a>', url=obj.report_file.url)
        return "No file"
    download_report_link.short_description = "Report File"
