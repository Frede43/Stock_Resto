"""
📊 Views pour l'activité utilisateur
"""

from rest_framework import generics, permissions
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from django.db.models import Q
from .models import User

class UserActivityView(generics.GenericAPIView):
    """Vue pour récupérer l'activité d'un utilisateur"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Récupère l'activité récente de l'utilisateur connecté"""
        user = request.user
        
        # Générer des données d'activité simulées basées sur l'utilisateur
        activities = []
        
        # Activité de connexion
        if user.last_login:
            activities.append({
                'action': 'Connexion',
                'description': f'Connexion réussie depuis {request.META.get("REMOTE_ADDR", "IP inconnue")}',
                'timestamp': user.last_login.isoformat(),
                'type': 'auth',
                'icon': 'login'
            })
        
        # Activité de création de compte
        activities.append({
            'action': 'Compte créé',
            'description': f'Compte utilisateur créé avec le rôle {user.role}',
            'timestamp': user.date_joined.isoformat(),
            'type': 'account',
            'icon': 'user-plus'
        })
        
        # Activités basées sur le rôle
        if user.role == 'admin':
            # Activités admin simulées
            now = timezone.now()
            activities.extend([
                {
                    'action': 'Gestion utilisateurs',
                    'description': 'Consultation de la liste des utilisateurs',
                    'timestamp': (now - timedelta(hours=2)).isoformat(),
                    'type': 'admin',
                    'icon': 'users'
                },
                {
                    'action': 'Configuration système',
                    'description': 'Modification des paramètres de l\'application',
                    'timestamp': (now - timedelta(days=1)).isoformat(),
                    'type': 'admin',
                    'icon': 'settings'
                },
                {
                    'action': 'Consultation rapports',
                    'description': 'Génération du rapport de ventes hebdomadaire',
                    'timestamp': (now - timedelta(days=2)).isoformat(),
                    'type': 'reports',
                    'icon': 'bar-chart'
                }
            ])
        
        elif user.role == 'cashier':
            # Activités caissier simulées
            now = timezone.now()
            activities.extend([
                {
                    'action': 'Vente enregistrée',
                    'description': 'Enregistrement d\'une vente de 15,000 BIF',
                    'timestamp': (now - timedelta(hours=1)).isoformat(),
                    'type': 'sales',
                    'icon': 'dollar-sign'
                },
                {
                    'action': 'Consultation produits',
                    'description': 'Consultation du catalogue des produits',
                    'timestamp': (now - timedelta(hours=3)).isoformat(),
                    'type': 'products',
                    'icon': 'package'
                },
                {
                    'action': 'Gestion tables',
                    'description': 'Mise à jour du statut des tables',
                    'timestamp': (now - timedelta(hours=4)).isoformat(),
                    'type': 'tables',
                    'icon': 'table'
                }
            ])
        
        # Trier par timestamp décroissant
        activities.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response({
            'results': activities[:20],  # Limiter à 20 activités récentes
            'count': len(activities),
            'user': {
                'username': user.username,
                'role': user.role,
                'last_login': user.last_login.isoformat() if user.last_login else None,
                'date_joined': user.date_joined.isoformat()
            }
        })

class UserStatsView(generics.GenericAPIView):
    """Vue pour les statistiques utilisateur"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Récupère les statistiques de l'utilisateur"""
        user = request.user
        
        # Statistiques basées sur le rôle
        stats = {
            'total_logins': 1 if user.last_login else 0,
            'account_age_days': (timezone.now() - user.date_joined).days,
            'role': user.role,
            'permissions_count': user.permissions.filter(is_active=True).count() if hasattr(user, 'permissions') else 0,
        }
        
        if user.role == 'admin':
            stats.update({
                'users_managed': User.objects.count(),
                'last_admin_action': user.last_login.isoformat() if user.last_login else None,
            })
        elif user.role == 'cashier':
            stats.update({
                'sales_access': True,
                'products_access': True,
                'tables_access': True,
            })
        
        return Response(stats)
