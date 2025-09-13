import os
import sys
import django

sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from help.models import Tutorial

tutorials = Tutorial.objects.all()
print(f'Total tutoriels: {len(tutorials)}')

for t in tutorials:
    print(f'ID {t.id}: {t.title}')
    print(f'  Video URL: {t.video_url or "None"}')
    print(f'  Active: {t.is_active}')
    print('---')
