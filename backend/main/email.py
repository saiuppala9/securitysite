from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from djoser import email
from django.contrib.auth.tokens import default_token_generator


class MultipartEmailMixin:
    def send(self, to, *args, **kwargs):
        context = self.get_context_data()
        context['domain'] = settings.DJOSER['DOMAIN']
        context['protocol'] = settings.DJOSER['PROTOCOL']
        context['site_name'] = settings.DJOSER['SITE_NAME']

        subject = render_to_string(self.subject_template_name, context)
        subject = "".join(subject.splitlines())

        html_content = render_to_string(self.template_name, context)
        text_template_name = self.template_name.replace(".html", ".txt")
        text_content = render_to_string(text_template_name, context)

        msg = EmailMultiAlternatives(
            subject, text_content, settings.DEFAULT_FROM_EMAIL, to
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()

    def get_context_data(self):
        context = super().get_context_data()
        return context


class ActivationEmail(MultipartEmailMixin, email.ActivationEmail):
    template_name = "email/activation.html"
    subject_template_name = "email/activation_subject.txt"


class ConfirmationEmail(MultipartEmailMixin, email.ConfirmationEmail):
    template_name = "email/confirmation.html"
    subject_template_name = "email/confirmation_subject.txt"


class PasswordResetEmail(MultipartEmailMixin, email.PasswordResetEmail):
    template_name = "email/password_reset.html"
    subject_template_name = "email/password_reset_subject.txt"


class PasswordChangedConfirmationEmail(
    MultipartEmailMixin, email.PasswordChangedConfirmationEmail
):
    template_name = "email/password_changed_confirmation.html"
    subject_template_name = "email/password_changed_confirmation_subject.txt"
