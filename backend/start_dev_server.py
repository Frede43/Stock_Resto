#!/usr/bin/env python
"""
Script de démarrage pour le serveur de développement.
Utilise la configuration de développement sans Redis.
"""

import os
import sys
import django
from django.core.management import execute_from_command_line

def main():
    """Démarre le serveur de développement avec la configuration appropriée"""
    
    # Ajouter le répertoire du projet au path Python
    project_dir = os.path.dirname(os.path.abspath(__file__))
    sys.path.insert(0, project_dir)
    
    # Configurer Django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'barstock_api.settings_dev')
    django.setup()
    
    # Arguments par défaut pour le serveur de développement
    if len(sys.argv) == 1:
        sys.argv = [
            'manage.py',
            'runserver',
            '0.0.0.0:8000',
            '--noreload'
        ]
    
    # Exécuter la commande Django
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main() 