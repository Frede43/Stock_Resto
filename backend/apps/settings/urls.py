from django.urls import path
from . import views

app_name = 'settings'

urlpatterns = [
    # API des paramètres système
    path('', views.system_settings_view, name='system_settings'),
    path('system-info/', views.system_info_view, name='system_info'),
    path('user-preferences/', views.user_preferences_view, name='user_preferences'),
    path('reset/', views.reset_settings_view, name='reset_settings'),
    path('health/', views.settings_health_check, name='health_check'),
    
    # Support CORS
    path('options/', views.settings_options_view, name='options'),
]
