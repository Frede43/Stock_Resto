#!/usr/bin/env python
import os
import sys
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings')
django.setup()

from help.models import Tutorial

def check_tutorials():
    tutorials = Tutorial.objects.all()
    print(f"Total tutoriels: {len(tutorials)}")
    print("\nDétails des tutoriels:")
    print("-" * 80)
    
    for t in tutorials:
        print(f"ID: {t.id}")
        print(f"Titre: {t.title}")
        print(f"URL vidéo: {t.video_url or 'None'}")
        print(f"Actif: {t.is_active}")
        print("-" * 40)

if __name__ == "__main__":
    check_tutorials()
