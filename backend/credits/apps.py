from django.apps import AppConfig


class CreditsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'credits'
    verbose_name = 'Gestion de Crédit'
    
    def ready(self):
        import credits.signals  # Importer les signaux
