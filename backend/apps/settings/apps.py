from django.apps import AppConfig


class SettingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.settings'
    verbose_name = 'Paramètres Système'
    
    def ready(self):
        """
        Code à exécuter quand l'app est prête
        """
        # Importer les signaux si nécessaire
        try:
            from . import signals
        except ImportError:
            pass
