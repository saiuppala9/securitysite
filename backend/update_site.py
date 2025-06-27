from django.contrib.sites.models import Site
from django.conf import settings

new_domain = 'cyphex.in'
new_name = 'Cyphex'

try:
    site = Site.objects.get(pk=settings.SITE_ID)
    if site.domain != new_domain or site.name != new_name:
        print(f"Updating site from '{site.name}' ({site.domain}) to '{new_name}' ({new_domain})")
        site.domain = new_domain
        site.name = new_name
        site.save()
        print("Site updated successfully.")
    else:
        print("Site is already up to date.")
except Site.DoesNotExist:
    print("Site not found, creating a new one.")
    Site.objects.create(domain=new_domain, name=new_name)
    print("New site created successfully.")
except Exception as e:
    print(f"An error occurred: {e}")
