from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import User, UserActivity


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Administration des utilisateurs avec rôles personnalisés"""

    list_display = (
        'username', 'email', 'first_name', 'last_name',
        'role_badge', 'is_active_session', 'last_activity', 'is_active'
    )
    list_filter = ('role', 'is_active', 'is_active_session', 'date_joined', 'last_activity')
    search_fields = ('username', 'email', 'first_name', 'last_name', 'phone')
    ordering = ('-date_joined',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Informations supplémentaires', {
            'fields': ('role', 'phone', 'address', 'is_active_session', 'last_activity')
        }),
        ('Dates importantes', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('last_activity', 'created_at', 'updated_at', 'date_joined', 'last_login')

    def role_badge(self, obj):
        """Affiche le rôle avec un badge coloré"""
        colors = {
            'admin': '#dc3545',      # Rouge
            'gerant': '#fd7e14',     # Orange
            'serveur': '#198754',    # Vert
        }
        color = colors.get(obj.role, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_role_display()
        )
    role_badge.short_description = 'Rôle'

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related()

    actions = ['activate_users', 'deactivate_users', 'reset_sessions']

    def activate_users(self, request, queryset):
        """Active les utilisateurs sélectionnés"""
        updated = queryset.update(is_active=True)
        self.message_user(request, f'{updated} utilisateur(s) activé(s).')
    activate_users.short_description = "Activer les utilisateurs sélectionnés"

    def deactivate_users(self, request, queryset):
        """Désactive les utilisateurs sélectionnés"""
        updated = queryset.update(is_active=False)
        self.message_user(request, f'{updated} utilisateur(s) désactivé(s).')
    deactivate_users.short_description = "Désactiver les utilisateurs sélectionnés"

    def reset_sessions(self, request, queryset):
        """Remet à zéro les sessions actives"""
        updated = queryset.update(is_active_session=False)
        self.message_user(request, f'{updated} session(s) réinitialisée(s).')
    reset_sessions.short_description = "Réinitialiser les sessions actives"


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    """Administration des activités utilisateurs"""

    list_display = (
        'user', 'action_badge', 'description_short', 'ip_address', 'timestamp'
    )
    list_filter = ('action', 'timestamp', 'user__role')
    search_fields = ('user__username', 'description', 'ip_address')
    readonly_fields = ('user', 'action', 'description', 'ip_address', 'user_agent', 'timestamp')
    ordering = ('-timestamp',)

    def action_badge(self, obj):
        """Affiche l'action avec un badge coloré"""
        colors = {
            'login': '#198754',      # Vert
            'logout': '#6c757d',     # Gris
            'create': '#0d6efd',     # Bleu
            'update': '#fd7e14',     # Orange
            'delete': '#dc3545',     # Rouge
            'view': '#20c997',       # Teal
            'sale': '#6f42c1',       # Violet
            'inventory': '#d63384',  # Rose
            'report': '#ffc107',     # Jaune
        }
        color = colors.get(obj.action, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_action_display()
        )
    action_badge.short_description = 'Action'

    def description_short(self, obj):
        """Affiche une description tronquée"""
        if len(obj.description) > 50:
            return obj.description[:50] + '...'
        return obj.description
    description_short.short_description = 'Description'

    def has_add_permission(self, request):
        """Empêche l'ajout manuel d'activités"""
        return False

    def has_change_permission(self, request, obj=None):
        """Empêche la modification des activités"""
        return False

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related('user')
