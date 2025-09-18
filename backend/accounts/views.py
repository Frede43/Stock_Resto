from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import login, logout
from django.utils import timezone
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.core.mail import send_mail
from django.conf import settings
import secrets
import string
from .models import User, UserActivity, Permission, UserPermission
from .serializers import (
    UserSerializer, UserLoginSerializer, UserActivitySerializer,
    ChangePasswordSerializer, UserProfileSerializer, UserWithPermissionsSerializer,
    CreateUserSerializer, PermissionSerializer, UserPermissionSerializer
)
from .permissions import (
    IsAuthenticated, IsAdminOrGerant, IsAdmin, IsOwnerOrAdminOrGerant,
    CanManageUsers, require_permission, require_role, admin_required
)

class UserListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des utilisateurs
    """
    queryset = User.objects.all()
    permission_classes = [CanManageUsers]

    def get_permissions(self):
        """
        Retourner les permissions selon le contexte
        """
        # Si c'est une requête GET pour récupérer les serveurs par un caissier, pas de permission spéciale
        if (self.request.method == 'GET' and
            self.request.query_params.get('role') == 'server' and
            self.request.user.is_authenticated and
            self.request.user.role == 'cashier'):
            return [permissions.IsAuthenticated()]

        # Sinon, utiliser les permissions normales
        return super().get_permissions()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateUserSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = User.objects.all()
        
        # Debug logs
        print(f"👤 UserListCreateView - User: {self.request.user} (role: {self.request.user.role})")
        print(f"👤 Query params: {dict(self.request.query_params)}")
        
        # Filtrer par statut actif si demandé
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            is_active_bool = is_active.lower() in ['true', '1', 'yes']
            queryset = queryset.filter(is_active=is_active_bool)
            print(f"👤 Filtré par is_active={is_active_bool}")
        
        # Filtrer par rôle si demandé
        role = self.request.query_params.get('role')
        if role:
            queryset = queryset.filter(role=role)
            print(f"👤 Filtré par role={role}")
        
        # Permissions d'accès selon le rôle de l'utilisateur connecté
        if self.request.user.is_admin:
            # Les admins voient tous les utilisateurs
            pass
        elif self.request.user.is_manager:
            # Les managers voient tous les utilisateurs
            pass
        elif self.request.user.role == 'cashier':
            # Les caissiers peuvent voir les serveurs (pour les assigner aux ventes)
            # ainsi que leur propre profil
            if role == 'server':
                # Permettre aux caissiers de voir les serveurs
                pass
            else:
                # Sinon, seulement leur propre profil
                queryset = queryset.filter(id=self.request.user.id)
        else:
            # Autres rôles ne voient que leur propre profil
            queryset = queryset.filter(id=self.request.user.id)
        
        print(f"👤 Queryset final: {queryset.count()} utilisateurs")
        [print(f"  - {u.username} ({u.role})") for u in queryset[:5]]
        
        return queryset

    def perform_create(self, serializer):
        # Seuls les admins peuvent créer des utilisateurs
        if not self.request.user.is_admin:
            raise PermissionDenied("Seuls les admins peuvent créer des utilisateurs.")

        user = serializer.save()

        # Enregistrer l'activité
        UserActivity.objects.create(
            user=self.request.user,
            action='create',
            description=f"Création de l'utilisateur {user.username}"
        )


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour récupérer, modifier ou supprimer un utilisateur
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [CanManageUsers]

    def get_object(self):
        obj = super().get_object()
        # Les utilisateurs ne peuvent modifier que leur propre profil, sauf les admins
        if not self.request.user.is_admin and obj != self.request.user:
            raise permissions.PermissionDenied("Vous ne pouvez modifier que votre propre profil.")
        return obj

    def perform_update(self, serializer):
        user = serializer.save()

        # Enregistrer l'activité
        UserActivity.objects.create(
            user=self.request.user,
            action='update',
            description=f"Modification de l'utilisateur {user.username}"
        )

    def perform_destroy(self, instance):
        # Seuls les admins peuvent supprimer des utilisateurs
        if not self.request.user.is_admin:
            raise permissions.PermissionDenied("Seuls les admins peuvent supprimer des utilisateurs.")

        # Enregistrer l'activité avant suppression
        UserActivity.objects.create(
            user=self.request.user,
            action='delete',
            description=f"Suppression de l'utilisateur {instance.username}"
        )

        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    """
    Endpoint de connexion pour les utilisateurs
    """
    # DEBUG: Log de la requête reçue
    print(f"🔐 LOGIN REQUEST - Method: {request.method}")
    print(f"🔐 LOGIN REQUEST - Headers: {dict(request.headers)}")
    print(f"🔐 LOGIN REQUEST - Data: {request.data}")
    print(f"🔐 LOGIN REQUEST - Content-Type: {request.content_type}")
    
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        print(f"✅ LOGIN SUCCESS - User: {user.username}, Role: {user.role}")

        # Générer les tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token

        # Mettre à jour le statut de session et last_login
        user.is_active_session = True
        user.last_activity = timezone.now()
        user.last_login = timezone.now()
        user.save()

        # Enregistrer l'activité de connexion
        UserActivity.objects.create(
            user=user,
            action='login',
            description='Connexion réussie',
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT')
        )

        return Response({
            'message': 'Connexion réussie',
            'user': UserSerializer(user).data,
            'tokens': {
                'access': str(access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_200_OK)
    else:
        print(f"❌ LOGIN FAILED - Serializer errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def logout_view(request):
    """
    Vue pour la déconnexion
    """
    user = request.user
    user.is_active_session = False
    user.save()

    # Enregistrer l'activité de déconnexion
    UserActivity.objects.create(
        user=user,
        action='logout',
        description='Déconnexion',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT')
    )

    return Response({'message': 'Déconnexion réussie'}, status=status.HTTP_200_OK)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """
    Vue pour récupérer et mettre à jour le profil de l'utilisateur connecté
    """
    if request.method == 'GET':
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        print(f"🔍 Profile update request: {request.data}")
        print(f"🔍 Files: {request.FILES}")
        
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            print(f"✅ Profile updated successfully. Avatar: {user.avatar}")
            
            # Enregistrer l'activité
            UserActivity.objects.create(
                user=request.user,
                action='update',
                description='Mise à jour du profil'
            )
            
            # Retourner les données avec le contexte pour les URLs complètes
            response_serializer = UserProfileSerializer(user, context={'request': request})
            return Response(response_serializer.data)
        else:
            print(f"❌ Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def preferences_view(request):
    """
    Vue pour gérer les préférences utilisateur
    """
    if request.method == 'GET':
        # Retourner les préférences actuelles (pour l'instant depuis le profil)
        preferences = {
            'language': 'fr',  # Valeur par défaut
            'timezone': 'Africa/Bujumbura'  # Valeur par défaut
        }
        return Response(preferences)
    
    elif request.method == 'PATCH':
        # Mettre à jour les préférences
        language = request.data.get('language')
        timezone = request.data.get('timezone')
        
        # Pour l'instant, on simule la sauvegarde
        # Dans une implémentation complète, on sauvegarderait dans un modèle UserPreferences
        
        # Enregistrer l'activité
        UserActivity.objects.create(
            user=request.user,
            action='update',
            description='Mise à jour des préférences'
        )
        
        updated_preferences = {
            'language': language or 'fr',
            'timezone': timezone or 'Africa/Bujumbura'
        }
        
        return Response(updated_preferences)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    """
    Vue pour changer le mot de passe
    """
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()

        # Enregistrer l'activité
        UserActivity.objects.create(
            user=user,
            action='update',
            description='Changement de mot de passe'
        )

        return Response({'message': 'Mot de passe changé avec succès'}, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserActivityListView(generics.ListAPIView):
    """
    Vue pour lister les activités des utilisateurs
    """
    serializer_class = UserActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Les admins voient toutes les activités, les autres seulement les leurs
        if self.request.user.is_admin:
            return UserActivity.objects.all()
        else:
            return UserActivity.objects.filter(user=self.request.user)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_permissions_view(request):
    """
    Vue pour vérifier les permissions de l'utilisateur connecté
    """
    user = request.user
    # Créer un dictionnaire de permissions pour un accès rapide
    user_permissions = user.get_permissions()
    permissions_dict = {perm.code: True for perm in user_permissions}

    # Ajouter les permissions spécifiques pour les menus
    if user.can_manage_users():
        permissions_dict['users_manage'] = True
        permissions_dict['users_view'] = True

    permissions_data = {
        'role': user.role,
        'permissions': permissions_dict,
        'permissions_by_category': user.get_permissions_by_category(),
        'legacy_permissions': {
            'can_manage_users': user.can_manage_users(),
            'can_manage_products': user.can_manage_products(),
            'can_make_sales': user.can_make_sales(),
            'can_view_sales_history': user.can_view_sales_history(),
            'can_manage_inventory': user.can_manage_inventory(),
            'can_view_stock_alerts': user.can_view_stock_alerts(),
            'can_generate_reports': user.can_generate_reports(),
            'can_manage_expenses': user.can_manage_expenses(),
            'can_delete_records': user.can_delete_records(),
            'can_manage_database': user.can_manage_database(),
        }
    }

    return Response(permissions_data)


class PermissionListView(generics.ListAPIView):
    """
    Vue pour lister toutes les permissions disponibles
    """
    queryset = Permission.objects.filter(is_active=True)
    serializer_class = PermissionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Permission.objects.filter(is_active=True)

        # Filtrer par catégorie si demandé
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)

        return queryset.order_by('category', 'name')


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def assign_permissions_view(request, user_id):
    """
    Vue pour attribuer des permissions à un utilisateur
    """
    # Seuls les admins peuvent attribuer des permissions
    if not request.user.is_admin:
        return Response(
            {'error': 'Seuls les administrateurs peuvent attribuer des permissions.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé.'},
            status=status.HTTP_404_NOT_FOUND
        )

    permission_codes = request.data.get('permissions', [])

    if not isinstance(permission_codes, list):
        return Response(
            {'error': 'Le champ permissions doit être une liste.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Supprimer les permissions existantes
    UserPermission.objects.filter(user=user).delete()

    # Ajouter les nouvelles permissions
    permissions = Permission.objects.filter(
        code__in=permission_codes,
        is_active=True
    )

    created_permissions = []
    for permission in permissions:
        user_permission = UserPermission.objects.create(
            user=user,
            permission=permission,
            granted_by=request.user
        )
        created_permissions.append(user_permission)

    # Enregistrer l'activité
    UserActivity.objects.create(
        user=request.user,
        action='update',
        description=f"Attribution de {len(created_permissions)} permissions à {user.username}"
    )

    return Response({
        'message': f'{len(created_permissions)} permissions attribuées avec succès.',
        'permissions': UserPermissionSerializer(created_permissions, many=True).data
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_permissions_view(request, user_id):
    """
    Vue pour récupérer les permissions d'un utilisateur
    """
    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Les utilisateurs ne peuvent voir que leurs propres permissions, sauf les admins
    if not request.user.is_admin and user != request.user:
        return Response(
            {'error': 'Vous ne pouvez voir que vos propres permissions.'},
            status=status.HTTP_403_FORBIDDEN
        )

    permissions_data = {
        'user': UserWithPermissionsSerializer(user).data,
        'permissions': user.get_permissions_by_category()
    }

    return Response(permissions_data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def servers_list_view(request):
    """
    Vue pour récupérer la liste des serveurs (accessible aux utilisateurs authentifiés)
    """
    servers = User.objects.filter(
        role='server',
        is_active=True
    ).values('id', 'username', 'first_name', 'last_name', 'email')

    return Response(list(servers))


@api_view(['POST'])
@permission_classes([CanManageUsers])
def reset_password_view(request, pk):
    """
    Vue pour réinitialiser le mot de passe d'un utilisateur
    Approche sans email : génération d'un mot de passe simple à communiquer oralement
    """
    # Seuls les admins peuvent réinitialiser les mots de passe
    if not request.user.is_admin:
        return Response(
            {'error': 'Seuls les admins peuvent réinitialiser les mots de passe.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        user = User.objects.get(pk=pk)
    except User.DoesNotExist:
        return Response(
            {'error': 'Utilisateur non trouvé.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Générer un mot de passe temporaire simple et mémorisable
    # Format: Mot + 4 chiffres (ex: "Cafe2024", "Menu1234")
    def generate_simple_password():
        words = ['Cafe', 'Menu', 'Chef', 'Plat', 'Boisson', 'Table', 'Service', 'Client']
        word = secrets.choice(words)
        numbers = ''.join([str(secrets.randbelow(10)) for _ in range(4)])
        return f"{word}{numbers}"

    temp_password = generate_simple_password()
    
    # Mettre à jour le mot de passe
    user.set_password(temp_password)
    
    # Marquer que l'utilisateur doit changer son mot de passe à la prochaine connexion
    # On peut utiliser un champ personnalisé ou les métadonnées utilisateur
    user.last_login = None  # Force une nouvelle connexion
    user.save()

    # Enregistrer l'activité avec le mot de passe temporaire pour référence admin
    UserActivity.objects.create(
        user=request.user,
        action='reset_password',
        description=f'Mot de passe réinitialisé pour {user.get_full_name()} - Mot de passe temporaire: {temp_password}',
        ip_address=request.META.get('REMOTE_ADDR'),
        user_agent=request.META.get('HTTP_USER_AGENT', '')
    )

    return Response({
        'success': True,
        'message': 'Mot de passe réinitialisé avec succès',
        'user': user.get_full_name(),
        'temp_password': temp_password,
        'instructions': 'Communiquez ce mot de passe temporaire à l\'utilisateur. Il devra le changer lors de sa prochaine connexion.',
        'format': 'Format simple: Mot + 4 chiffres (facile à retenir et communiquer oralement)'
    })
