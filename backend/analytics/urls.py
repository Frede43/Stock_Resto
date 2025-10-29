from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router pour les ViewSets
router = DefaultRouter()

urlpatterns = [
    # API ViewSets
    path('', include(router.urls)),

    # Vues spécifiques existantes
    path('sales-chart/', views.sales_chart, name='sales-chart'),
    path('analytics/', views.analytics_data, name='analytics-data'),
]
