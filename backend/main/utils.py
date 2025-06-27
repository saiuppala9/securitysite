from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

def send_service_notification(subject, message, recipient_list):
    """
    Sends a service notification email using the branded template,
    including both HTML and plain-text versions for better deliverability.
    The 'message' argument should be an HTML string.
    """
    # Render the HTML part using the dedicated template
    html_message = render_to_string('email/service_notification.html', {'subject': subject, 'message': message})
    
    # Generate a plain-text version by stripping HTML tags from the message
    # and adding some context.
    plain_text_message = f"{subject}\n\n{strip_tags(message)}\n\nThanks,\nThe Cyphex Team"
    
    # Create the email with both versions
    email = EmailMultiAlternatives(
        subject=subject,
        body=plain_text_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=recipient_list
    )
    email.attach_alternative(html_message, "text/html")
    email.send(fail_silently=False)
