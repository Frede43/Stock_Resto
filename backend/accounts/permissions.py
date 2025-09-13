from rest_framework import permissions
from functools import wraps
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework import status

class IsAuthenticated(permissions.BasePermission):
    """
    Permission pour les utilisateurs authentifiés
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

class IsAdminOrGerant(permissions.BasePermission):
    """
    Permission pour les administrateurs et gérants uniquement
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role in ['admin', 'gerant']
        )

class IsAdmin(permissions.BasePermission):
    """
    Permission pour les administrateurs uniquement
    """
    def has_permission(self, request, view):
        return (
            request.user and 
            request.user.is_authenticated and 
            request.user.role == 'admin'
        )

class IsOwnerOrAdminOrGerant(permissions.BasePermission):
    """
    Permission pour le propriétaire de l'objet, les admins ou gérants
    """
    def has_object_permission(self, request, view, obj):
        # Lecture pour tous les utilisateurs authentifiés
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # Écriture pour le propriétaire, admin ou gérant
        return (
            request.user and 
            request.user.is_authenticated and 
            (obj.user == request.user or request.user.role in ['admin', 'gerant'])
        )


class HasPermission(permissions.BasePermission):
    """
    Permission personnalisée basée sur les codes de permission
    """
    def __init__(self, permission_code):
        self.permission_code = permission_code

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Les admins ont toutes les permissions
        if request.user.role == 'admin':
            return True

        # Vérifier la permission spécifique
        return request.user.has_permission(self.permission_code)


class RequireRole(permissions.BasePermission):
    """
    Permission basée sur le rôle utilisateur
    """
    def __init__(self, allowed_roles):
        if isinstance(allowed_roles, str):
            self.allowed_roles = [allowed_roles]
        else:
            self.allowed_roles = allowed_roles

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        return request.user.role in self.allowed_roles


class CanManageUsers(permissions.BasePermission):
    """
    Permission pour gérer les utilisateurs
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.can_manage_users()
        )


class CanManageSuppliers(permissions.BasePermission):
    """
    Permission pour gérer les fournisseurs
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['admin', 'manager'] or
             request.user.has_permission('suppliers_manage'))
        )


class CanViewSales(permissions.BasePermission):
    """
    Permission pour voir les ventes
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['admin', 'manager', 'cashier', 'server'] or
             request.user.has_permission('sales_view'))
        )


class CanCreateSales(permissions.BasePermission):
    """
    Permission pour créer des ventes
    """
    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            (request.user.role in ['admin', 'manager', 'cashier', 'server'] or
             request.user.has_permission('sales_create'))
        )


# Décorateurs pour les vues basées sur les fonctions
def require_permission(permission_code):
    """
    Décorateur pour vérifier une permission spécifique
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return JsonResponse(
                    {'error': 'Authentication required'},
                    status=401
                )

            if not (request.user.role == 'admin' or request.user.has_permission(permission_code)):
                return JsonResponse(
                    {'error': f'Permission denied. Required: {permission_code}'},
                    status=403
                )

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def require_role(*allowed_roles):
    """
    Décorateur pour vérifier le rôle utilisateur
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user or not request.user.is_authenticated:
                return JsonResponse(
                    {'error': 'Authentication required'},
                    status=401
                )

            if request.user.role not in allowed_roles:
                return JsonResponse(
                    {'error': f'Access denied. Required roles: {", ".join(allowed_roles)}'},
                    status=403
                )

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator


def admin_required(view_func):
    """
    Décorateur pour les vues réservées aux admins
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return JsonResponse(
                {'error': 'Authentication required'},
                status=401
            )

        if request.user.role != 'admin':
            return JsonResponse(
                {'error': 'Admin access required'},
                status=403
            )

        return view_func(request, *args, **kwargs)
    return wrapper
