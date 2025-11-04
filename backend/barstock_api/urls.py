"""
URL configuration for barstock_api project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from django.shortcuts import redirect
from django.template.response import TemplateResponse

def home_view(request):
    """Vue pour la page d'accueil"""
    # Si l'utilisateur est connecté, le rediriger vers l'admin
    if request.user.is_authenticated:
        return redirect('/admin/')
    
    # Sinon, afficher une page d'accueil simple
    context = {
        'title': 'BarStock Wise',
        'version': '1.0.0',
        'description': 'Système de gestion de stock pour bars et restaurants'
    }
    return TemplateResponse(request, 'home.html', context)

def api_root(request):
    """Vue racine de l'API"""
    return JsonResponse({
        'message': 'API BarStock',
        'version': '1.0',
        'endpoints': {
            'accounts': '/api/accounts/',
            'products': '/api/products/',
            'sales': '/api/sales/',
            'orders': '/api/orders/',
            'reports': '/api/reports/',
            'inventory': '/api/inventory/',
            'suppliers': '/api/suppliers/',
            'expenses': '/api/expenses/',
            'settings': '/api/settings/',
            'kitchen': '/api/kitchen/',
            'analytics': '/api/analytics/',
            'alerts': '/api/alerts/',
            'monitoring': '/api/monitoring/',
            'dashboard': '/api/dashboard/',
            'help': '/api/help/',
        }
    })

urlpatterns = [
    # Page d'accueil
    path('', home_view, name='home'),
    
    # Administration
    path('admin/', admin.site.urls),

    # API root
    path('api/', api_root, name='api_root'),

    # API endpoints
    path('api/accounts/', include('accounts.urls')),
    path('api/products/', include('products.urls')),
    path('api/products-enhanced/', include('products.urls_enhanced')),  # Nouvelle architecture
    path('api/sales/', include('sales.urls')),
    path('api/orders/', include('orders.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/inventory/', include('inventory.urls')),
    path('api/suppliers/', include('suppliers.urls')),
    path('api/expenses/', include('expenses.urls')),  # Gestion des dépenses
    path('api/settings/', include('settings.urls')),
    path('api/kitchen/', include('kitchen.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/alerts/', include('alerts.urls')),  # Ajout des alertes
    path('api/monitoring/', include('monitoring.urls')),  # Ajout du monitoring
    path('api/dashboard/', include('dashboard.urls')),  # Ajout du dashboard
    path('api/help/', include('help.urls')),  # Ajout du système d'aide
    path('api/credits/', include('credits.urls')),  # Gestion de crédit
]

# Servir les fichiers media et static en développement
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
