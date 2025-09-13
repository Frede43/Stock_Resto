from rest_framework import serializers
from .models import StockMovement, Purchase, PurchaseItem
from products.models import Product
from suppliers.models import Supplier
from accounts.models import User

class StockMovementSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    movement_type_display = serializers.CharField(source='get_movement_type_display', read_only=True)
    reason_display = serializers.CharField(source='get_reason_display', read_only=True)

    class Meta:
        model = StockMovement
        fields = [
            'id', 'product', 'product_name', 'movement_type', 'movement_type_display',
            'reason', 'reason_display', 'quantity', 'unit_price', 'total_amount',
            'stock_before', 'stock_after', 'reference', 'notes',
            'user', 'user_name', 'created_at'
        ]
        read_only_fields = ['created_at', 'total_amount', 'stock_before', 'stock_after', 'user']
    
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("La quantité doit être positive.")
        return value
    
    def validate(self, data):
        product = data.get('product')
        movement_type = data.get('movement_type')
        quantity = data.get('quantity')

        # Vérifier le stock pour les sorties
        if movement_type == 'out' and product:
            if product.current_stock < quantity:
                raise serializers.ValidationError(
                    f"Stock insuffisant. Stock actuel: {product.current_stock}"
                )

        return data

    def create(self, validated_data):
        import logging
        logger = logging.getLogger(__name__)
        
        # Récupérer l'utilisateur depuis le contexte de la requête
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['user'] = request.user
        else:
            raise serializers.ValidationError({"user": ["Utilisateur non authentifié"]})

        # Récupérer le produit
        product = validated_data.get('product')
        if not product:
            raise serializers.ValidationError({"product": ["Produit requis"]})

        # DEBUG: Log initial state
        logger.warning(f"🔍 DEBUT StockMovementSerializer.create()")
        logger.warning(f"- Produit: {product.name} (ID: {product.id})")
        logger.warning(f"- Stock INITIAL: {product.current_stock}")
        logger.warning(f"- Quantité demandée: {validated_data['quantity']}")
        logger.warning(f"- Type mouvement: {validated_data['movement_type']}")

        # Calculer les stocks AVANT et APRÈS
        stock_before = product.current_stock
        quantity = validated_data['quantity']
        movement_type = validated_data['movement_type']

        # Calculer le nouveau stock selon le type de mouvement
        if movement_type == 'in':
            stock_after = stock_before + quantity
        elif movement_type == 'out':
            stock_after = max(0, stock_before - quantity)
        else:  # adjustment
            stock_after = quantity

        logger.warning(f"- Stock calculé APRÈS: {stock_after}")

        # Ajouter les stocks calculés aux données validées
        validated_data['stock_before'] = stock_before
        validated_data['stock_after'] = stock_after

        # Mettre à jour le stock du produit AVANT de créer le mouvement
        product.current_stock = stock_after
        product.save()
        
        logger.warning(f"- Stock SAUVEGARDÉ: {product.current_stock}")

        # Créer le mouvement avec les bonnes valeurs de stock
        movement = super().create(validated_data)
        
        # Vérifier le stock final après création du mouvement
        product.refresh_from_db()
        logger.warning(f"- Stock FINAL après création mouvement: {product.current_stock}")
        logger.warning(f"🏁 FIN StockMovementSerializer.create()")

        return movement

class PurchaseItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = PurchaseItem
        fields = [
            'id', 'product', 'product_name', 'quantity_ordered', 'quantity_received',
            'unit_price', 'total_price'
        ]

class PurchaseSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    user_name = serializers.CharField(source='user.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    items = PurchaseItemSerializer(many=True, read_only=True)
    items_count = serializers.IntegerField(source='items.count', read_only=True)

    class Meta:
        model = Purchase
        fields = [
            'id', 'supplier', 'supplier_name', 'order_date', 'delivery_date', 'reference',
            'status', 'status_display', 'total_amount', 'notes',
            'user', 'user_name', 'items', 'items_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'reference', 'user']

    def create(self, validated_data):
        # Générer automatiquement la référence
        import uuid
        from datetime import datetime

        if 'reference' not in validated_data or not validated_data['reference']:
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            validated_data['reference'] = f'PUR-{timestamp}-{str(uuid.uuid4())[:8].upper()}'

        # Utiliser un utilisateur par défaut si pas d'utilisateur authentifié
        if 'user' not in validated_data or not validated_data['user']:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            default_user = User.objects.first()
            if default_user:
                validated_data['user'] = default_user
            else:
                # Créer un utilisateur par défaut pour les tests
                validated_data['user'] = User.objects.create_user(
                    username='test_user',
                    email='test@example.com',
                    first_name='Test',
                    last_name='User'
                )

        return super().create(validated_data)


class PurchaseCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer un achat avec ses items"""
    items = serializers.ListField(write_only=True)

    class Meta:
        model = Purchase
        fields = [
            'supplier', 'delivery_date', 'notes', 'items'
        ]

    def create(self, validated_data):
        items_data = validated_data.pop('items', [])

        # Générer automatiquement la référence
        import uuid
        from datetime import datetime

        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        validated_data['reference'] = f'PUR-{timestamp}-{str(uuid.uuid4())[:8].upper()}'

        # Utiliser un utilisateur par défaut
        from django.contrib.auth import get_user_model
        User = get_user_model()
        default_user = User.objects.first()
        if default_user:
            validated_data['user'] = default_user
        else:
            validated_data['user'] = User.objects.create_user(
                username='test_user',
                email='test@example.com',
                first_name='Test',
                last_name='User'
            )

        # Créer l'achat avec statut 'pending' (workflow normal)
        validated_data['status'] = 'pending'
        purchase = Purchase.objects.create(**validated_data)

        # Créer les items sans mise à jour automatique du stock
        total_amount = 0
        for item_data in items_data:
            quantity_ordered = item_data['quantity_ordered']

            item = PurchaseItem.objects.create(
                purchase=purchase,
                product_id=item_data['product'],
                quantity_ordered=quantity_ordered,
                quantity_received=0,  # Pas de réception automatique
                unit_price=item_data['unit_price']
            )
            total_amount += quantity_ordered * item_data['unit_price']

        # Mettre à jour le montant total seulement
        purchase.total_amount = total_amount
        purchase.save()

        return purchase


class StockSummarySerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    product_name = serializers.CharField()
    category_name = serializers.CharField()
    current_stock = serializers.IntegerField()
    minimum_stock = serializers.IntegerField()
    stock_value = serializers.DecimalField(max_digits=12, decimal_places=2)
    last_movement_date = serializers.DateTimeField()
    needs_restock = serializers.BooleanField()


