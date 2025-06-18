from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings

def send_payment_success_emails(service_request):
    """
    Sends notification emails to the client and admin after a successful payment.
    """
    client = service_request.client
    service = service_request.service

    # Email to client
    client_subject = 'Your Service Request has been Received'
    client_context = {
        'client_name': client.get_full_name(),
        'service_name': service.name,
    }
    client_html_message = render_to_string('api/client_notification.html', client_context)
    send_mail(
        client_subject,
        '', # Plain text message (optional)
        settings.DEFAULT_FROM_EMAIL,
        [client.email],
        html_message=client_html_message,
        fail_silently=False,
    )

    # Email to admin
    admin_subject = f'New Service Request from {client.username}'
    admin_context = {
        'client_name': client.get_full_name(),
        'client_email': client.email,
        'service_name': service.name,
        'url': service_request.url,
        'roles': service_request.roles,
        'notes': service_request.notes,
    }
    admin_html_message = render_to_string('api/admin_notification.html', admin_context)
    send_mail(
        admin_subject,
        '', # Plain text message (optional)
        settings.DEFAULT_FROM_EMAIL,
        [settings.ADMIN_EMAIL],
        html_message=admin_html_message,
        fail_silently=False,
    )
