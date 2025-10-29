from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, UserActivity, Permission, UserPermission

class UserSerializer(serializers.ModelSerializer):
    """
    Serializer pour le modèle User
    """
    
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'address', 'avatar', 'is_active', 'is_active_session',
            'last_activity', 'created_at', 'date_joined', 'last_login', 
            'is_staff', 'is_superuser', 'password'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'last_activity': {'read_only': True},
            'created_at': {'read_only': True},
        }
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        
        # Normaliser le nom d'utilisateur en minuscules pour cohérence avec le frontend
        if 'username' in validated_data:
            validated_data['username'] = validated_data['username'].lower()
            
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user
    
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if password:
            instance.set_password(password)
        
        instance.save()
        return instance


class UserLoginSerializer(serializers.Serializer):
    """
    Serializer pour l'authentification
    """
    
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('Compte utilisateur désactivé.')
            else:
                raise serializers.ValidationError('Nom d\'utilisateur ou mot de passe incorrect.')
        else:
            raise serializers.ValidationError('Nom d\'utilisateur et mot de passe requis.')
        
        return data


class UserActivitySerializer(serializers.ModelSerializer):
    """
    Serializer pour les activités utilisateur
    """
    
    user_username = serializers.CharField(source='user.username', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)
    
    class Meta:
        model = UserActivity
        fields = [
            'id', 'user', 'user_username', 'action', 'action_display',
            'description', 'ip_address', 'user_agent', 'timestamp'
        ]
        extra_kwargs = {
            'user': {'read_only': True},
            'timestamp': {'read_only': True},
        }


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer pour changer le mot de passe
    """
    
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError("Les nouveaux mots de passe ne correspondent pas.")
        return data
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Ancien mot de passe incorrect.")
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer pour le profil utilisateur (lecture et mise à jour)
    """
    avatar = serializers.SerializerMethodField()
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'phone', 'address', 'avatar', 'is_active_session',
            'last_activity', 'created_at'
        ]
        read_only_fields = ['username', 'role', 'last_activity', 'created_at']
    
    def get_avatar(self, obj):
        """Retourne l'URL complète de l'avatar"""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return obj.avatar.url
        return None
    
    def update(self, instance, validated_data):
        # Gérer l'upload d'avatar séparément
        avatar = validated_data.pop('avatar', None)
        
        # Mise à jour des autres champs
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Mise à jour de l'avatar si fourni
        if avatar is not None:
            instance.avatar = avatar
        
        instance.save()
        return instance


class PermissionSerializer(serializers.ModelSerializer):
    """
    Serializer pour les permissions
    """

    class Meta:
        model = Permission
        fields = [
            'id', 'code', 'name', 'description', 'category',
            'is_active', 'created_at'
        ]


class UserPermissionSerializer(serializers.ModelSerializer):
    """
    Serializer pour les permissions utilisateur
    """

    permission_details = PermissionSerializer(source='permission', read_only=True)
    granted_by_username = serializers.CharField(source='granted_by.username', read_only=True)

    class Meta:
        model = UserPermission
        fields = [
            'id', 'user', 'permission', 'permission_details',
            'granted_by', 'granted_by_username', 'granted_at', 'is_active'
        ]


class UserWithPermissionsSerializer(serializers.ModelSerializer):
    """
    Serializer pour les utilisateurs avec leurs permissions
    """

    password = serializers.CharField(write_only=True, required=False)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    permissions = serializers.SerializerMethodField()
    permissions_by_category = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'role_display', 'phone', 'address', 'avatar', 'is_active',
            'is_active_session', 'last_activity', 'created_at',
            'date_joined', 'last_login', 'is_staff', 'is_superuser',
            'password', 'permissions', 'permissions_by_category'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'last_activity': {'read_only': True},
            'created_at': {'read_only': True},
        }

    def get_permissions(self, obj):
        """Retourne la liste des permissions de l'utilisateur"""
        permissions = obj.get_permissions()
        return PermissionSerializer(permissions, many=True).data

    def get_permissions_by_category(self, obj):
        """Retourne les permissions groupées par catégorie"""
        return obj.get_permissions_by_category()

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        
        # Normaliser le nom d'utilisateur en minuscules pour cohérence avec le frontend
        if 'username' in validated_data:
            validated_data['username'] = validated_data['username'].lower()
            
        user = User.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class CreateUserSerializer(serializers.ModelSerializer):
    """
    Serializer pour créer un utilisateur avec permissions
    """

    password = serializers.CharField(write_only=True)
    permissions = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        help_text="Liste des codes de permissions à attribuer"
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'address', 'avatar', 'is_active', 'password', 'permissions'
        ]
        read_only_fields = ['id']

    def create(self, validated_data):
        permissions_codes = validated_data.pop('permissions', [])
        password = validated_data.pop('password')
        user_role = validated_data.get('role', 'server')

        # Permissions par défaut selon le rôle
        default_permissions_by_role = {
            'cashier': [
                'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
                'products_view',
                'tables_view', 'tables_manage',
                'orders_view', 'orders_create',
            ],
            'server': [
                'sales_view', 'sales_create',
                'products_view',
                'tables_view', 'tables_manage',
                'orders_view', 'orders_create',
            ],
            'manager': [
                'sales_manage', 'sales_history_view', 'sales_view', 'sales_create',
                'products_view', 'products_manage',
                'stocks_view', 'inventory_manage',
                'tables_view', 'tables_manage',
                'orders_view', 'orders_create', 'orders_manage',
                'reports_view', 'analytics_view',
            ]
        }

        # Utiliser les permissions par défaut du rôle si aucune permission spécifique n'est fournie
        if not permissions_codes and user_role in default_permissions_by_role:
            permissions_codes = default_permissions_by_role[user_role]

        print(f"🔍 Création utilisateur avec permissions:")
        print(f"   - Rôle: {user_role}")
        print(f"   - Permissions: {len(permissions_codes)} attribuées")

        # Normaliser le nom d'utilisateur en minuscules pour cohérence avec le frontend
        if 'username' in validated_data:
            validated_data['username'] = validated_data['username'].lower()

        # Créer l'utilisateur
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        # Assigner les permissions
        if permissions_codes:
            from .models import Permission, UserPermission

            assigned_count = 0
            for perm_code in permissions_codes:
                try:
                    permission = Permission.objects.get(code=perm_code, is_active=True)
                    UserPermission.objects.get_or_create(
                        user=user,
                        permission=permission,
                        defaults={'is_active': True}
                    )
                    assigned_count += 1
                except Permission.DoesNotExist:
                    print(f"⚠️ Permission non trouvée: {perm_code}")
                except Exception as e:
                    print(f"⚠️ Erreur assignation {perm_code}: {e}")

            print(f"   - {assigned_count}/{len(permissions_codes)} permissions assignées")

        print(f"   - Utilisateur créé: {user.username} (ID: {user.id})")
        return user
