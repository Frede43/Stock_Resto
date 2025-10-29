"""
URLs pour le dashboard
"""

from django.urls import path
from . import views

urlpatterns = [
    path('stats/', views.dashboard_stats, name='dashboard_stats'),
    path('sales-stats/', views.sales_stats, name='sales_stats'),
    path('low-stock/', views.low_stock_products, name='low_stock_products'),
    path('alerts/unresolved/', views.unresolved_alerts, name='unresolved_alerts'),
    path('alerts/count/', views.alerts_count, name='alerts_count'),
    path('monitoring/', views.monitoring_dashboard, name='monitoring_dashboard'),
]
