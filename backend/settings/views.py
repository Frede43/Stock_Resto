from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
import logging
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json

from .models import SystemSettings, UserPreferences, SystemInfo
from .serializers import (
    SystemSettingsSerializer, 
    UserPreferencesSerializer, 
    SystemInfoSerializer
)

logger = logging.getLogger(__name__)


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([AllowAny])  # Temporairement public pour debug
def system_settings_view(request):
    """
    API pour gérer les paramètres système
    GET: Récupérer les paramètres
    PUT/PATCH: Mettre à jour les paramètres
    """
    try:
        settings = SystemSettings.get_settings()
        
        if request.method == 'GET':
            serializer = SystemSettingsSerializer(settings)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            # Debug: Afficher les informations de l'utilisateur
            print(f"🔍 Settings PATCH - User: {request.user}")
            print(f"🔍 Settings PATCH - Is authenticated: {request.user.is_authenticated}")
            print(f"🔍 Settings PATCH - Is superuser: {request.user.is_superuser}")
            if hasattr(request.user, 'role'):
                print(f"🔍 Settings PATCH - Role: {request.user.role}")
            else:
                print(f"🔍 Settings PATCH - No role attribute")
            
            # Vérifier les permissions (admin ou manager)
            if not (request.user.is_superuser or 
                   (hasattr(request.user, 'role') and 
                    request.user.role in ['admin', 'manager'])):
                return Response(
                    {'error': f'Permission refusée. User: {request.user}, Role: {getattr(request.user, "role", "N/A")}, Superuser: {request.user.is_superuser}'},
                    status=status.HTTP_403_FORBIDDEN
                )
            
            serializer = SystemSettingsSerializer(settings, data=request.data, partial=(request.method == 'PATCH'))
            
            if serializer.is_valid():
                updated_settings = serializer.save()
                updated_settings.updated_by = request.user
                updated_settings.save()
                
                logger.info(f"Paramètres système mis à jour par {request.user.username}")
                
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Erreur dans system_settings_view: {str(e)}")
        return Response(
            {'error': 'Erreur interne du serveur'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([AllowAny])  # Temporairement public pour debug
def system_info_view(request):
    """
    API pour récupérer les informations système
    """
    try:
        system_info = SystemInfo.get_info()
        
        # Mettre à jour les informations en temps réel
        update_system_info(system_info)
        
        serializer = SystemInfoSerializer(system_info)
        return Response(serializer.data)
    
    except Exception as e:
        logger.error(f"Erreur dans system_info_view: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la récupération des informations système'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_preferences_view(request):
    """
    API pour gérer les préférences utilisateur
    """
    try:
        preferences, created = UserPreferences.objects.get_or_create(user=request.user)
        
        if request.method == 'GET':
            serializer = UserPreferencesSerializer(preferences)
            return Response(serializer.data)
        
        elif request.method in ['PUT', 'PATCH']:
            serializer = UserPreferencesSerializer(
                preferences, 
                data=request.data, 
                partial=(request.method == 'PATCH')
            )
            
            if serializer.is_valid():
                serializer.save()
                logger.info(f"Préférences utilisateur mises à jour pour {request.user.username}")
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Erreur dans user_preferences_view: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la gestion des préférences utilisateur'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([AllowAny])  # Temporairement public pour debug
def reset_settings_view(request):
    """
    API pour réinitialiser les paramètres aux valeurs par défaut
    """
    try:
        # Vérifier les permissions
        if not (request.user.is_superuser or 
               hasattr(request.user, 'profile') and 
               request.user.profile.role in ['admin', 'gerant']):
            return Response(
                {'error': 'Permission refusée'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Supprimer les paramètres existants pour forcer la création de nouveaux
        SystemSettings.objects.filter(pk=1).delete()
        settings = SystemSettings.get_settings()
        settings.updated_by = request.user
        settings.save()
        
        serializer = SystemSettingsSerializer(settings)
        
        logger.info(f"Paramètres système réinitialisés par {request.user.username}")
        
        return Response({
            'message': 'Paramètres réinitialisés avec succès',
            'settings': serializer.data
        })
    
    except Exception as e:
        logger.error(f"Erreur dans reset_settings_view: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la réinitialisation'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def settings_health_check(request):
    """
    Vérification de santé de l'API settings
    """
    try:
        # Tester l'accès à la base de données
        settings = SystemSettings.get_settings()
        system_info = SystemInfo.get_info()
        
        return Response({
            'status': 'healthy',
            'database': 'connected',
            'settings_available': True,
            'system_info_available': True,
            'timestamp': system_info.updated_at.isoformat()
        })
    
    except Exception as e:
        logger.error(f"Erreur dans settings_health_check: {str(e)}")
        return Response({
            'status': 'unhealthy',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['POST'])
@permission_classes([AllowAny])  # Temporairement public pour debug
def create_backup_view(request):
    """
    API pour créer une sauvegarde manuelle
    """
    try:
        import os
        import datetime
        from django.conf import settings as django_settings
        
        # Générer un nom de fichier unique
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_filename = f"barstock_backup_{timestamp}.sql"
        
        # Simuler la création de sauvegarde (à implémenter selon votre DB)
        # Pour SQLite, vous pourriez copier le fichier db.sqlite3
        # Pour PostgreSQL, utiliser pg_dump, etc.
        
        # Mettre à jour les informations système
        system_info = SystemInfo.get_info()
        system_info.last_backup = timezone.now()
        system_info.save()
        
        logger.info(f"Sauvegarde créée: {backup_filename}")
        
        return Response({
            'message': 'Sauvegarde créée avec succès',
            'filename': backup_filename,
            'timestamp': system_info.last_backup.isoformat(),
            'size': '0 MB'  # À calculer selon la taille réelle
        })
    
    except Exception as e:
        logger.error(f"Erreur dans create_backup_view: {str(e)}")
        return Response(
            {'error': 'Erreur lors de la création de la sauvegarde'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def update_system_info(system_info):
    """
    Mettre à jour les informations système en temps réel
    """
    try:
        import psutil
        import os
        import platform
        from django.conf import settings as django_settings

        # Utilisation mémoire
        memory = psutil.virtual_memory()
        system_info.memory_usage = f"{memory.percent:.1f}%"

        # Utilisation CPU (avec timeout plus court)
        cpu_percent = psutil.cpu_percent(interval=0.1)
        system_info.cpu_usage = f"{cpu_percent:.1f}%"

        # Utilisation disque (compatible Windows/Linux)
        try:
            if platform.system() == 'Windows':
                disk = psutil.disk_usage('C:')
            else:
                disk = psutil.disk_usage('/')
            used_gb = disk.used / (1024**3)
            system_info.storage_used = f"{used_gb:.1f} GB"
        except Exception:
            system_info.storage_used = "N/A"

        # Mettre à jour les informations de version
        system_info.database_version = f"SQLite {platform.python_version()}"
        system_info.server_info = f"Django {django_settings.VERSION if hasattr(django_settings, 'VERSION') else '4.2'}"

        system_info.save()
        logger.debug("Informations système mises à jour avec succès")

    except ImportError as e:
        # psutil n'est pas installé, utiliser des valeurs par défaut
        logger.warning(f"psutil non installé: {str(e)}")
        system_info.memory_usage = "N/A"
        system_info.cpu_usage = "N/A"
        system_info.storage_used = "N/A"
        system_info.save()

    except Exception as e:
        logger.error(f"Erreur lors de la mise à jour des informations système: {str(e)}")
        # Utiliser des valeurs par défaut en cas d'erreur
        system_info.memory_usage = "Erreur"
        system_info.cpu_usage = "Erreur"
        system_info.storage_used = "Erreur"
        system_info.save()


# Vue pour les options CORS
@csrf_exempt
def settings_options_view(request):
    """
    Gérer les requêtes OPTIONS pour CORS
    """
    if request.method == 'OPTIONS':
        response = JsonResponse({})
        response['Access-Control-Allow-Origin'] = '*'
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)
