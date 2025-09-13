from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from .activity_views import UserActivityView

app_name = 'accounts'

urlpatterns = [
    # Authentification
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Profil utilisateur
    path('profile/', views.profile_view, name='profile'),
    path('preferences/', views.preferences_view, name='preferences'),
    path('change-password/', views.change_password_view, name='change_password'),
    path('permissions/', views.check_permissions_view, name='permissions'),
    path('check-permissions/', views.check_permissions_view, name='check_permissions'),
    
    # Gestion des utilisateurs
    path('users/', views.UserListCreateView.as_view(), name='user_list_create'),
    path('users/<int:pk>/', views.UserDetailView.as_view(), name='user_detail'),
    path('users/<int:pk>/reset-password/', views.reset_password_view, name='reset_password'),
    path('servers/', views.servers_list_view, name='servers_list'),
    
    # Activités
    path('activities/', views.UserActivityListView.as_view(), name='user_activities'),
    path('profile/activity/', UserActivityView.as_view(), name='profile_activity'),

    # Permissions
    path('permissions/list/', views.PermissionListView.as_view(), name='permissions_list'),
    path('users/<int:user_id>/permissions/', views.user_permissions_view, name='user_permissions'),
    path('users/<int:user_id>/assign-permissions/', views.assign_permissions_view, name='assign_permissions'),
]
