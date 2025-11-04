from rest_framework import serializers
from decimal import Decimal
from .models import Table, TableReservation, Sale, SaleItem
from products.models import Product
from products.serializers import ProductListSerializer

class TableSerializer(serializers.ModelSerializer):
    """Serializer pour les tables"""

    is_occupied = serializers.ReadOnlyField()
    is_available = serializers.ReadOnlyField()
    occupation_duration = serializers.ReadOnlyField()
    current_sale = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = [
            'id', 'number', 'capacity', 'status', 'location',
            'is_active', 'is_occupied', 'is_available', 'occupation_duration',
            'occupied_since', 'last_cleaned', 'notes', 'current_sale',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at', 'occupied_since', 'last_cleaned']

    def get_current_sale(self, obj):
        """Retourne les informations de la vente en cours"""
        current_sale = obj.current_sale
        if current_sale:
            return {
                'id': current_sale.id,
                'reference': current_sale.reference,
                'customer_name': current_sale.customer_name,
                'total_amount': current_sale.total_amount,
                'status': current_sale.status,
                'created_at': current_sale.created_at
            }
        return None


class TableReservationSerializer(serializers.ModelSerializer):
    """Serializer pour les réservations de tables"""

    table_number = serializers.CharField(source='table.number', read_only=True)
    table_capacity = serializers.IntegerField(source='table.capacity', read_only=True)
    is_today = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_overdue = serializers.ReadOnlyField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)

    class Meta:
        model = TableReservation
        fields = [
            'id', 'table', 'table_number', 'table_capacity',
            'customer_name', 'customer_phone', 'customer_email', 'party_size',
            'reservation_date', 'reservation_time', 'duration_minutes',
            'status', 'special_requests', 'notes',
            'is_today', 'is_upcoming', 'is_overdue',
            'created_by', 'created_by_name', 'confirmed_by', 'seated_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'created_at', 'updated_at', 'seated_at', 'created_by',
            'confirmed_by', 'is_today', 'is_upcoming', 'is_overdue'
        ]

    def validate(self, data):
        """Validation des données de réservation"""
        table = data.get('table')
        party_size = data.get('party_size')
        reservation_date = data.get('reservation_date')
        reservation_time = data.get('reservation_time')

        # Vérifier la capacité de la table
        if table and party_size and party_size > table.capacity:
            raise serializers.ValidationError(
                f"La table {table.number} ne peut accueillir que {table.capacity} personnes."
            )

        # Vérifier les conflits de réservation (seulement pour les nouvelles réservations)
        if not self.instance and table and reservation_date and reservation_time:
            from datetime import datetime, timedelta

            existing_reservations = TableReservation.objects.filter(
                table=table,
                reservation_date=reservation_date,
                status__in=['confirmed', 'seated']
            )

            duration = data.get('duration_minutes', 120)
            new_start = reservation_time
            new_end = (datetime.combine(reservation_date, reservation_time) +
                      timedelta(minutes=duration)).time()

            for existing in existing_reservations:
                existing_start = existing.reservation_time
                existing_end = (datetime.combine(reservation_date, existing_start) +
                              timedelta(minutes=existing.duration_minutes)).time()

                # Vérifier le chevauchement
                if (existing_start <= new_start <= existing_end or
                    new_start <= existing_start <= new_end):
                    raise serializers.ValidationError(
                        f"Conflit avec une réservation existante à {existing_start}."
                    )

        return data


class TableListSerializer(serializers.ModelSerializer):
    """Serializer simplifié pour la liste des tables"""

    status_display = serializers.CharField(source='get_status_display', read_only=True)
    current_sale_reference = serializers.SerializerMethodField()
    next_reservation = serializers.SerializerMethodField()

    class Meta:
        model = Table
        fields = [
            'id', 'number', 'capacity', 'status', 'status_display',
            'location', 'is_occupied', 'is_available', 'occupation_duration',
            'current_sale_reference', 'next_reservation'
        ]

    def get_current_sale_reference(self, obj):
        """Référence de la vente en cours"""
        current_sale = obj.current_sale
        return current_sale.reference if current_sale else None

    def get_next_reservation(self, obj):
        """Prochaine réservation pour cette table"""
        from django.utils import timezone

        next_reservation = obj.reservations.filter(
            status='confirmed',
            reservation_date__gte=timezone.now().date()
        ).first()

        if next_reservation:
            return {
                'customer_name': next_reservation.customer_name,
                'reservation_date': next_reservation.reservation_date,
                'reservation_time': next_reservation.reservation_time,
                'party_size': next_reservation.party_size
            }
        return None

class SaleItemSerializer(serializers.ModelSerializer):
    """Serializer pour les articles de vente"""

    product_name = serializers.CharField(source='product.name', read_only=True)
    product_price = serializers.DecimalField(source='product.selling_price', max_digits=10, decimal_places=2, read_only=True)
    subtotal = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()  # Ajout pour compatibilité frontend

    class Meta:
        model = SaleItem
        fields = [
            'id', 'product', 'product_name', 'product_price',
            'quantity', 'unit_price', 'subtotal', 'total_price', 'notes'
        ]

    def get_subtotal(self, obj):
        return obj.quantity * obj.unit_price

    def get_total_price(self, obj):
        return obj.quantity * obj.unit_price

class SaleItemCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer des articles de vente"""
    
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    
    class Meta:
        model = SaleItem
        fields = ['product', 'quantity', 'unit_price', 'notes']
    
    def validate(self, data):
        product = data['product']
        quantity = data['quantity']

        # Vérifier le stock disponible du produit fini
        if product.current_stock < quantity:
            raise serializers.ValidationError(
                f"Stock insuffisant pour {product.name}. "
                f"Stock disponible: {product.current_stock}, demandé: {quantity}"
            )

        # Si c'est un plat avec une recette, vérifier les ingrédients
        if hasattr(product, 'recipe') and product.recipe:
            recipe = product.recipe
            missing_ingredients = []

            for recipe_ingredient in recipe.ingredients.all():
                ingredient = recipe_ingredient.ingredient
                needed_quantity = recipe_ingredient.quantite_utilisee_par_plat * quantity

                if not ingredient.can_fulfill_quantity(needed_quantity):
                    missing_ingredients.append({
                        'ingredient': ingredient.nom,
                        'needed': needed_quantity,
                        'available': ingredient.quantite_restante,
                        'unit': ingredient.unite
                    })

            if missing_ingredients:
                error_msg = f"Ingrédients insuffisants pour préparer {quantity}x {product.name}:\n"
                for missing in missing_ingredients:
                    error_msg += f"- {missing['ingredient']}: besoin de {missing['needed']} {missing['unit']}, disponible: {missing['available']} {missing['unit']}\n"
                raise serializers.ValidationError(error_msg)

        return data

class SaleSerializer(serializers.ModelSerializer):
    """Serializer pour les ventes"""
    
    items = SaleItemSerializer(many=True, read_only=True)
    server_name = serializers.CharField(source='server.get_full_name', read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    items_count = serializers.SerializerMethodField()
    profit = serializers.SerializerMethodField()
    
    class Meta:
        model = Sale
        fields = [
            'id', 'reference', 'table', 'table_number', 'customer_name', 'server', 'server_name',
            'status', 'payment_method', 'subtotal', 'tax_amount', 'total_amount', 'discount_amount',
            'final_amount', 'items_count', 'profit', 'notes',
            'created_at', 'updated_at', 'items'
        ]
        read_only_fields = ['created_at', 'updated_at', 'total_amount', 'subtotal', 'tax_amount', 'reference']
    
    def get_items_count(self, obj):
        return obj.items.count()
    
    def get_profit(self, obj):
        return sum(
            (item.unit_price - item.product.purchase_price) * item.quantity
            for item in obj.items.all()
        )

class SaleCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer une vente"""
    
    items = SaleItemCreateSerializer(many=True)
    customer_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    server = serializers.IntegerField(required=False, allow_null=True)
    
    class Meta:
        model = Sale
        fields = [
            'table', 'customer_name', 'server', 'payment_method', 'credit_account', 'discount_amount', 'notes', 'items'
        ]
    
    def create(self, validated_data):
        items_data = validated_data.pop('items')

        # Générer automatiquement la référence
        import uuid
        from django.utils import timezone

        timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
        validated_data['reference'] = f'SALE-{timestamp}-{str(uuid.uuid4())[:8].upper()}'

        # Gérer le serveur et l'utilisateur qui crée la vente
        request = self.context.get('request')
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Toujours enregistrer qui a créé la vente
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['created_by'] = request.user
        
        # Gérer le serveur
        server_id = validated_data.pop('server', None)
        
        if server_id:
            # Si un ID serveur est fourni, récupérer l'objet User
            try:
                validated_data['server'] = User.objects.get(id=server_id)
            except User.DoesNotExist:
                # Si le serveur n'existe pas, utiliser l'utilisateur connecté
                validated_data['server'] = request.user if request and request.user.is_authenticated else User.objects.first()
        elif request and hasattr(request, 'user') and request.user.is_authenticated:
            # Sinon utiliser l'utilisateur connecté comme serveur
            validated_data['server'] = request.user
        else:
            # Fallback: utiliser un serveur par défaut
            default_user = User.objects.first()
            if default_user:
                validated_data['server'] = default_user
            else:
                validated_data['server'] = User.objects.create_user(
                    username='default_server',
                    email='server@example.com',
                    first_name='Serveur',
                    last_name='Par défaut'
                )

        # ✅ PRÉ-CALCULER le total AVANT de créer la vente
        total_amount = Decimal('0.00')
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            unit_price = item_data.get('unit_price', product.selling_price)
            total_amount += quantity * unit_price
        
        # Ajouter le total_amount aux données validées
        validated_data['subtotal'] = total_amount
        validated_data['tax_amount'] = Decimal('0.00')
        validated_data['total_amount'] = total_amount
        validated_data['status'] = 'pending'
        
        # Créer la vente AVEC le total_amount
        sale = Sale.objects.create(**validated_data)
        
        # Créer les articles de vente
        for item_data in items_data:
            product = item_data['product']
            quantity = item_data['quantity']
            
            # Vérifier le stock disponible (mais ne pas le décompter encore)
            if product.current_stock < quantity:
                sale.delete()  # Annuler la vente
                raise serializers.ValidationError(
                    f"Stock insuffisant pour {product.name}. Stock disponible: {product.current_stock}"
                )

            # Utiliser le unit_price fourni ou le prix du produit par défaut
            unit_price = item_data.get('unit_price', product.selling_price)
            
            # Créer l'article
            sale_item = SaleItem.objects.create(
                sale=sale,
                product=product,
                quantity=quantity,
                unit_price=unit_price,
                notes=item_data.get('notes', '')
            )

            # NE PAS mettre à jour le stock maintenant - sera fait lors du paiement

            # Les ingrédients seront décomptés lors du paiement
            # if hasattr(product, 'recipe') and product.recipe:
            #     try:
            #         recipe = product.recipe
            #         consumed_ingredients = recipe.consume_ingredients(
            #             quantity=quantity,
            #             user=self.context['request'].user
            #         )

            #         # Ajouter une note sur les ingrédients consommés
            #         ingredients_note = "Ingrédients consommés: " + ", ".join([
            #             f"{ci['ingredient'].nom}: {ci['quantity_consumed']} {ci['ingredient'].unite}"
            #             for ci in consumed_ingredients
            #         ])

            #         if sale_item.notes:
            #             sale_item.notes += f"\n{ingredients_note}"
            #         else:
            #             sale_item.notes = ingredients_note
            #         sale_item.save()

            #     except Exception as e:
            #         # En cas d'erreur, annuler la vente
            #         sale.delete()
            #         raise serializers.ValidationError(
            #             f"Erreur lors de la consommation des ingrédients: {str(e)}"
            #         )

            # Le total a déjà été calculé avant la création de la vente
        
        # ✅ MODIFIÉ: NE PAS mettre à jour le stock maintenant
        # Le stock sera mis à jour lors du paiement via mark-as-paid
        print(f"✅ Commande créée: {sale.reference} - Statut: {sale.status}")

        # Générer automatiquement la facture
        try:
            from .invoice_service import InvoiceService
            InvoiceService.auto_generate_invoice(sale)
        except Exception as e:
            print(f"⚠️ Erreur génération facture: {e}")

        return sale

class SaleListSerializer(serializers.ModelSerializer):
    """Serializer pour la liste des ventes"""

    items = SaleItemSerializer(many=True, read_only=True)
    server_name = serializers.CharField(source='server.get_full_name', read_only=True)
    table_number = serializers.CharField(source='table.number', read_only=True)
    table = TableListSerializer(read_only=True)  # Objet table complet pour le mobile
    items_count = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = Sale
        fields = [
            'id', 'reference', 'customer_name', 'table', 'table_number', 'server_name',
            'status', 'status_display', 'payment_method', 'payment_method_display',
            'total_amount', 'discount_amount', 'final_amount', 'items_count',
            'items', 'notes', 'created_at'
        ]

    def get_items_count(self, obj):
        return obj.items.count()

class SaleUpdateStatusSerializer(serializers.ModelSerializer):
    """
    Serializer pour mettre à jour uniquement le statut d'une vente
    """
    class Meta:
        model = Sale
        fields = ['status']

    def validate_status(self, value):
        """
        Valide le changement de statut
        """
        instance = self.instance
        if instance and instance.status == 'paid' and value != 'paid':
            raise serializers.ValidationError(
                "Impossible de modifier le statut d'une vente déjà payée."
            )
        
        # Permettre le passage de pending à completed (validation)
        if instance and instance.status == 'pending' and value == 'completed':
            return value
            
        # Permettre le passage de pending à served
        if instance and instance.status == 'pending' and value == 'served':
            return value
            
        return value
