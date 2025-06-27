from django.conf import settings

def email_logo(request):
    """
    Adds the Base64 encoded email logo to the template context.
    """
    return {'EMAIL_LOGO_BASE64': settings.EMAIL_LOGO_BASE64}
