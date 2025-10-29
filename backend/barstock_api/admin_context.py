"""
Contexte personnalisé pour l'administration Django
Ajoute des statistiques et données personnalisées à l'interface admin
"""

from django.contrib import admin
from django.contrib.admin import AdminSite
from django.template.response import TemplateResponse
from django.urls import path
from django.db.models import Count, Sum
from django.utils import timezone
from datetime import datetime, timedelta

# Import des modèles
from accounts.models import User
from products.models import Product
from sales.models import Sale
from expenses.models import Expense


class BarStockWiseAdminSite(AdminSite):
    """Site d'administration personnalisé pour BarStockWise"""
    
    site_header = "BarStockWise Administration"
    site_title = "BarStockWise Admin"
    index_title = "Tableau de bord administrateur"
    
    def index(self, request, extra_context=None):
        """
        Page d'accueil personnalisée avec statistiques
        """
        extra_context = extra_context or {}
        
        # Calcul des statistiques
        today = timezone.now().date()
        
        try:
            # Statistiques utilisateurs
            users_count = User.objects.filter(is_active=True).count()
            
            # Statistiques produits
            products_count = Product.objects.filter(is_active=True).count()
            
            # Statistiques ventes aujourd'hui
            sales_today = Sale.objects.filter(
                created_at__date=today,
                status='paid'
            ).count()
            
            # Statistiques dépenses aujourd'hui
            expenses_today = Expense.objects.filter(
                date=today
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            stats = {
                'users_count': users_count,
                'products_count': products_count,
                'sales_today': sales_today,
                'expenses_today': f"{expenses_today:.2f}€" if expenses_today else "0€",
            }
            
        except Exception as e:
            # En cas d'erreur, utiliser des valeurs par défaut
            stats = {
                'users_count': 0,
                'products_count': 0,
                'sales_today': 0,
                'expenses_today': "0€",
            }
            print(f"Erreur lors du calcul des statistiques admin: {e}")
        
        extra_context['stats'] = stats
        
        return super().index(request, extra_context)
    
    def get_urls(self):
        """URLs personnalisées pour l'admin"""
        urls = super().get_urls()
        custom_urls = [
            path('dashboard/', self.admin_view(self.dashboard_view), name='dashboard'),
        ]
        return custom_urls + urls
    
    def dashboard_view(self, request):
        """Vue personnalisée pour le tableau de bord"""
        context = {
            'title': 'Tableau de bord avancé',
            'site_title': self.site_title,
            'site_header': self.site_header,
        }
        
        # Ajouter des données supplémentaires pour le dashboard
        try:
            # Ventes des 7 derniers jours
            week_ago = timezone.now().date() - timedelta(days=7)
            recent_sales = Sale.objects.filter(
                created_at__date__gte=week_ago,
                status='paid'
            ).values('created_at__date').annotate(
                count=Count('id'),
                total=Sum('total_amount')
            ).order_by('created_at__date')
            
            # Produits les plus vendus
            top_products = Product.objects.annotate(
                sales_count=Count('saleitem')
            ).filter(sales_count__gt=0).order_by('-sales_count')[:5]
            
            context.update({
                'recent_sales': list(recent_sales),
                'top_products': top_products,
            })
            
        except Exception as e:
            print(f"Erreur dashboard admin: {e}")
        
        return TemplateResponse(request, 'admin/dashboard.html', context)


# Instance du site admin personnalisé
admin_site = BarStockWiseAdminSite(name='barstockwise_admin')

# Fonction pour enregistrer tous les modèles existants
def register_all_models():
    """Enregistre tous les modèles dans le site admin personnalisé"""
    from django.apps import apps
    
    # Obtenir tous les modèles de l'application
    for model in apps.get_models():
        try:
            # Vérifier si le modèle est déjà enregistré dans l'admin par défaut
            if model in admin.site._registry:
                admin_class = admin.site._registry[model]
                # Enregistrer dans notre site personnalisé
                admin_site.register(model, admin_class.__class__)
        except Exception as e:
            # Enregistrer avec l'admin par défaut si pas de classe spécifique
            try:
                admin_site.register(model)
            except Exception:
                pass  # Ignorer les erreurs d'enregistrement
