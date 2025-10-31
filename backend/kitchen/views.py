from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models, transaction
from django.db.models import Sum, Count, F, Q
from django.utils import timezone
from datetime import timedelta

from .models import Ingredient, IngredientMovement, Recipe, RecipeIngredient
from .serializers import (
    IngredientSerializer, IngredientListSerializer, IngredientMovementSerializer,
    RecipeSerializer, RecipeListSerializer, RecipeCreateSerializer, RecipeUpdateSerializer,
    IngredientStockUpdateSerializer
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def kitchen_dashboard(request):
    """Dashboard de la cuisine avec toutes les informations"""
    try:
        # Alertes stock
        stock_alerts = []
        try:
            low_stock_ingredients = Ingredient.objects.filter(
                quantite_restante__lte=F('seuil_alerte'),
                is_active=True
            )
            stock_alerts = [{
                'id': ing.id,
                'ingredient': ing.nom,
                'current_stock': float(ing.quantite_restante),
                'alert_threshold': float(ing.seuil_alerte),
                'unit': ing.unite,
                'supplier': ing.fournisseur.name if ing.fournisseur else None,
                'urgency': 'critical' if ing.quantite_restante <= ing.seuil_alerte * 0.5 else 'warning'
            } for ing in low_stock_ingredients]
        except Exception as e:
            print(f"Erreur ingrédients: {e}")
        
        # Commandes en cours
        try:
            from orders.models import Order
            pending_orders = Order.objects.filter(status='pending').count()
            preparing_orders = Order.objects.filter(status='preparing').count()
            ready_orders = Order.objects.filter(status='ready').count()
        except:
            pending_orders = preparing_orders = ready_orders = 0
        
        # Prévisions du jour
        today = timezone.now().date()
        try:
            from sales.models import Sale
            today_sales = Sale.objects.filter(date_created__date=today).count()
            today_revenue = Sale.objects.filter(
                date_created__date=today
            ).aggregate(total=Sum('total_amount'))['total'] or 0
        except:
            today_sales = 0
            today_revenue = 0
        
        # Produits populaires du jour
        try:
            from orders.models import OrderItem
            popular_products = OrderItem.objects.filter(
                order__created_at__date=today
            ).values('product__name').annotate(
                total_quantity=Sum('quantity')
            ).order_by('-total_quantity')[:5]
        except:
            popular_products = []
        
        dashboard_data = {
            'stock_alerts': stock_alerts,
            'alerts_count': len(stock_alerts),
            'critical_alerts': len([a for a in stock_alerts if a['urgency'] == 'critical']),
            'orders': {
                'pending': pending_orders,
                'preparing': preparing_orders,
                'ready': ready_orders,
                'total': pending_orders + preparing_orders + ready_orders
            },
            'today_stats': {
                'sales_count': today_sales,
                'revenue': float(today_revenue),
                'popular_products': list(popular_products)
            },
            'kitchen_status': 'operational' if len(stock_alerts) < 5 else 'warning',
            'last_updated': timezone.now().isoformat()
        }
        
        return Response(dashboard_data)
        
    except Exception as e:
        return Response({
            'error': f'Erreur dashboard cuisine: {str(e)}',
            'kitchen_status': 'error'
        }, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def production_forecast(request):
    """Prévisions de production"""
    try:
        from orders.models import Order, OrderItem
        from django.utils import timezone
        from datetime import timedelta
        
        # Analyser les commandes des 7 derniers jours
        week_ago = timezone.now().date() - timedelta(days=7)
        
        # Produits les plus commandés
        popular_items = OrderItem.objects.filter(
            order__created_at__date__gte=week_ago
        ).values('product__name', 'product__id').annotate(
            total_quantity=Sum('quantity'),
            avg_daily=Sum('quantity') / 7
        ).order_by('-total_quantity')[:10]
        
        # Prévisions pour demain
        tomorrow_forecast = []
        for item in popular_items:
            forecast_quantity = int(item['avg_daily'] * 1.2)  # +20% de marge
            tomorrow_forecast.append({
                'product_name': item['product__name'],
                'product_id': item['product__id'],
                'forecast_quantity': forecast_quantity,
                'historical_avg': float(item['avg_daily']),
                'confidence': 'high' if item['total_quantity'] > 10 else 'medium'
            })
        
        return Response({
            'forecast_date': (timezone.now().date() + timedelta(days=1)).isoformat(),
            'items': tomorrow_forecast,
            'total_items': len(tomorrow_forecast),
            'based_on_days': 7
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def shopping_list_generator(request):
    """Générateur de liste de courses intelligent"""
    try:
        shopping_list = []
        total_cost = 0
        
        # Ingrédients en stock bas
        try:
            low_stock_ingredients = Ingredient.objects.filter(
                quantite_restante__lte=F('seuil_alerte'),
                is_active=True
            ).order_by('quantite_restante')

            for ingredient in low_stock_ingredients:
                # Calculer la quantité recommandée
                current_stock = float(ingredient.quantite_restante)
                alert_threshold = float(ingredient.seuil_alerte)

                # Recommander 3x le seuil d'alerte
                recommended_quantity = alert_threshold * 3 - current_stock
                estimated_cost = recommended_quantity * float(ingredient.prix_unitaire)

                shopping_list.append({
                    'ingredient_id': ingredient.id,
                    'name': ingredient.nom,
                    'current_stock': current_stock,
                    'alert_threshold': alert_threshold,
                    'recommended_quantity': round(recommended_quantity, 2),
                    'unit': ingredient.unite,
                    'unit_price': float(ingredient.prix_unitaire),
                    'estimated_cost': round(estimated_cost, 2),
                    'supplier': (ingredient.fournisseur.name if hasattr(ingredient.fournisseur, 'name') else ingredient.fournisseur.nom) if ingredient.fournisseur else 'Non défini',
                    'urgency': 'critical' if current_stock <= alert_threshold * 0.3 else 'normal'
                })

                total_cost += estimated_cost

        except Exception as e:
            print(f"Erreur génération liste: {e}")
        
        # Grouper par fournisseur
        suppliers = {}
        for item in shopping_list:
            supplier = item['supplier']
            if supplier not in suppliers:
                suppliers[supplier] = []
            suppliers[supplier].append(item)
        
        return Response({
            'shopping_list': shopping_list,
            'by_supplier': suppliers,
            'summary': {
                'total_items': len(shopping_list),
                'estimated_total_cost': round(total_cost, 2),
                'critical_items': len([i for i in shopping_list if i['urgency'] == 'critical']),
                'suppliers_count': len(suppliers)
            },
            'generated_at': timezone.now().isoformat()
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recalculate_purchase_prices(request):
    """
    Recalcule automatiquement les prix d'achat des produits basés sur leurs recettes
    """
    try:
        from .models import Recipe
        from django.db import transaction

        updated_products = []
        total_recipes_processed = 0

        with transaction.atomic():
            # Récupérer toutes les recettes
            recipes = Recipe.objects.select_related('plat').prefetch_related('ingredients__ingredient').all()

            for recipe in recipes:
                if recipe.plat:  # S'assurer qu'il y a un produit lié
                    old_price = recipe.plat.purchase_price
                    new_price = recipe.total_cost

                    # Mettre à jour le prix d'achat
                    recipe.plat.purchase_price = new_price
                    recipe.plat.save(update_fields=['purchase_price'])

                    updated_products.append({
                        'product_name': recipe.plat.name,
                        'recipe_name': recipe.nom_recette,
                        'old_purchase_price': float(old_price),
                        'new_purchase_price': float(new_price),
                        'difference': float(new_price - old_price),
                        'ingredients_count': recipe.ingredients.count()
                    })

                    total_recipes_processed += 1

        return Response({
            'success': True,
            'message': 'Prix d\'achat recalculés avec succès',
            'summary': {
                'products_updated': len(updated_products),
                'total_recipes_processed': total_recipes_processed
            },
            'details': updated_products
        })

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


# ViewSets pour les ingrédients
class IngredientViewSet(viewsets.ModelViewSet):
    """
    ViewSet complet pour la gestion des ingrédients de cuisine
    """
    queryset = Ingredient.objects.all()
    serializer_class = IngredientSerializer
    permission_classes = [permissions.AllowAny]  # Temporairement public pour tests
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['unite', 'is_active', 'fournisseur']
    search_fields = ['nom', 'description']
    ordering_fields = ['nom', 'quantite_restante', 'prix_unitaire', 'date_maj']
    ordering = ['nom']

    def get_serializer_class(self):
        """Utiliser différents serializers selon l'action"""
        if self.action == 'list':
            return IngredientListSerializer
        return IngredientSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrer par stock bas
        low_stock = self.request.query_params.get('low_stock', None)
        if low_stock and low_stock.lower() == 'true':
            queryset = queryset.filter(quantite_restante__lte=F('seuil_alerte'))

        # Filtrer par stock épuisé
        out_of_stock = self.request.query_params.get('out_of_stock', None)
        if out_of_stock and out_of_stock.lower() == 'true':
            queryset = queryset.filter(quantite_restante=0)

        return queryset

    @action(detail=False, methods=['get'])
    def low_stock(self, request):
        """Obtenir les ingrédients en stock bas"""
        ingredients = self.get_queryset().filter(
            quantite_restante__lte=F('seuil_alerte'),
            is_active=True
        ).order_by('quantite_restante')

        serializer = IngredientListSerializer(ingredients, many=True)
        return Response({
            'count': ingredients.count(),
            'results': serializer.data
        })

    @action(detail=False, methods=['get'])
    def stock_value(self, request):
        """Calculer la valeur totale du stock"""
        ingredients = self.get_queryset().filter(is_active=True)

        total_value = 0
        low_stock_count = 0
        out_of_stock_count = 0

        for ingredient in ingredients:
            total_value += ingredient.stock_value
            if ingredient.is_low_stock:
                low_stock_count += 1
            if ingredient.is_out_of_stock:
                out_of_stock_count += 1

        return Response({
            'total_value': total_value,
            'ingredients_count': ingredients.count(),
            'low_stock_count': low_stock_count,
            'out_of_stock_count': out_of_stock_count,
            'currency': 'BIF'
        })

    @action(detail=False, methods=['get'])
    def shopping_list(self, request):
        """Générer une liste de courses intelligente"""
        low_stock_ingredients = self.get_queryset().filter(
            quantite_restante__lte=F('seuil_alerte'),
            is_active=True
        ).order_by('quantite_restante')

        shopping_list = []
        total_cost = 0

        for ingredient in low_stock_ingredients:
            # Calculer la quantité recommandée (3x le seuil d'alerte)
            current_stock = ingredient.quantite_restante
            alert_threshold = ingredient.seuil_alerte
            recommended_quantity = alert_threshold * 3 - current_stock

            if recommended_quantity > 0:
                estimated_cost = recommended_quantity * ingredient.prix_unitaire

                shopping_list.append({
                    'ingredient_id': ingredient.id,
                    'name': ingredient.nom,
                    'current_stock': float(current_stock),
                    'alert_threshold': float(alert_threshold),
                    'recommended_quantity': float(recommended_quantity),
                    'unit': ingredient.unite,
                    'unit_price': float(ingredient.prix_unitaire),
                    'estimated_cost': float(estimated_cost),
                    'supplier': ingredient.fournisseur.name if ingredient.fournisseur else 'Non défini',
                    'urgency': 'critical' if current_stock <= alert_threshold * 0.3 else 'normal'
                })

                total_cost += estimated_cost

        # Grouper par fournisseur
        suppliers = {}
        for item in shopping_list:
            supplier = item['supplier']
            if supplier not in suppliers:
                suppliers[supplier] = {
                    'supplier_name': supplier,
                    'items': [],
                    'total_cost': 0
                }
            suppliers[supplier]['items'].append(item)
            suppliers[supplier]['total_cost'] += item['estimated_cost']

        return Response({
            'shopping_list': shopping_list,
            'by_supplier': list(suppliers.values()),
            'summary': {
                'total_items': len(shopping_list),
                'estimated_total_cost': float(total_cost),
                'critical_items': len([i for i in shopping_list if i['urgency'] == 'critical']),
                'suppliers_count': len(suppliers),
                'currency': 'BIF'
            },
            'generated_at': timezone.now().isoformat()
        })

    @action(detail=True, methods=['post'])
    def update_stock(self, request, pk=None):
        """Mettre à jour le stock d'un ingrédient avec traçabilité"""
        ingredient = self.get_object()
        serializer = IngredientStockUpdateSerializer(
            data=request.data,
            context={'ingredient': ingredient}
        )

        if serializer.is_valid():
            try:
                with transaction.atomic():
                    # Créer le mouvement de stock
                    movement_data = serializer.validated_data
                    supplier = movement_data.get('supplier')

                    movement = IngredientMovement.objects.create(
                        ingredient=ingredient,
                        movement_type=movement_data['movement_type'],
                        reason=movement_data['reason'],
                        quantity=movement_data['quantity'],
                        unit_price=movement_data.get('unit_price', 0),
                        stock_before=ingredient.quantite_restante,
                        supplier=supplier,
                        user=request.user,
                        notes=movement_data.get('notes', ''),
                        reference=movement_data.get('reference', '')
                    )

                    # Mettre à jour le stock
                    if movement_data['movement_type'] == 'in':
                        ingredient.quantite_restante += movement_data['quantity']
                    else:  # out
                        ingredient.quantite_restante -= movement_data['quantity']

                    movement.stock_after = ingredient.quantite_restante
                    movement.total_amount = movement_data['quantity'] * movement_data.get('unit_price', 0)

                    ingredient.save()
                    movement.save()

                    return Response({
                        'message': 'Stock mis à jour avec succès',
                        'ingredient': IngredientSerializer(ingredient).data,
                        'movement': IngredientMovementSerializer(movement).data
                    })

            except Exception as e:
                return Response(
                    {'error': f'Erreur lors de la mise à jour: {str(e)}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ViewSet pour les recettes
class RecipeViewSet(viewsets.ModelViewSet):
    """
    ViewSet complet pour la gestion des recettes de cuisine
    """
    queryset = Recipe.objects.all()
    permission_classes = [permissions.AllowAny]  # Temporairement public pour tests
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'plat']
    search_fields = ['nom_recette', 'description', 'plat__name']
    ordering_fields = ['nom_recette', 'temps_preparation', 'created_at']
    ordering = ['nom_recette']

    def get_serializer_class(self):
        """Utiliser différents serializers selon l'action"""
        if self.action == 'create':
            return RecipeCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return RecipeUpdateSerializer
        elif self.action == 'list':
            return RecipeListSerializer
        return RecipeSerializer

    def get_queryset(self):
        queryset = super().get_queryset().select_related('plat').prefetch_related('ingredients__ingredient')

        # Filtrer par disponibilité
        available = self.request.query_params.get('available', None)
        if available and available.lower() == 'true':
            # Filtrer seulement les recettes qui peuvent être préparées
            available_recipes = []
            for recipe in queryset:
                if recipe.can_be_prepared:
                    available_recipes.append(recipe.id)
            queryset = queryset.filter(id__in=available_recipes)

        return queryset

    def perform_create(self, serializer):
        """Assigner l'utilisateur créateur"""
        print(f"🔧 CREATE RECIPE - Data received: {self.request.data}")
        print(f"🔧 CREATE RECIPE - Serializer valid: {serializer.is_valid()}")
        if not serializer.is_valid():
            print(f"❌ CREATE RECIPE - Validation errors: {serializer.errors}")
        serializer.save(created_by=self.request.user)

    def perform_update(self, serializer):
        """Logs pour la modification de recette"""
        print(f"🔧 UPDATE RECIPE - Data received: {self.request.data}")
        print(f"🔧 UPDATE RECIPE - Serializer valid: {serializer.is_valid()}")
        if not serializer.is_valid():
            print(f"❌ UPDATE RECIPE - Validation errors: {serializer.errors}")
        serializer.save()

    @action(detail=True, methods=['post'])
    def check_availability(self, request, pk=None):
        """Vérifier si une recette peut être préparée"""
        recipe = self.get_object()
        quantity = int(request.data.get('quantity', 1))

        validation_result = recipe.validate_ingredients_availability(quantity)

        return Response({
            'can_prepare': validation_result['can_prepare'],
            'quantity_requested': quantity,
            'missing_ingredients': validation_result['missing_ingredients'],
            'total_cost': float(recipe.total_cost * quantity),
            'recipe_name': recipe.nom_recette
        })

    @action(detail=True, methods=['post'])
    def prepare(self, request, pk=None):
        """Préparer une recette (consommer les ingrédients)"""
        recipe = self.get_object()
        quantity = int(request.data.get('quantity', 1))

        try:
            consumed_ingredients = recipe.consume_ingredients(
                quantity=quantity,
                user=request.user
            )

            return Response({
                'success': True,
                'message': f'{quantity}x {recipe.nom_recette} préparé avec succès',
                'consumed_ingredients': [
                    {
                        'ingredient': item['ingredient'].nom,
                        'quantity_consumed': float(item['quantity_consumed']),
                        'unit': item['ingredient'].unite,
                        'stock_after': float(item['stock_after'])
                    }
                    for item in consumed_ingredients
                ],
                'total_cost': float(recipe.total_cost * quantity)
            })

        except Exception as e:
            return Response({
                'success': False,
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
