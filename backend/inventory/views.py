from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, F, Q
from django.utils import timezone
from decimal import Decimal

from .models import StockMovement, Purchase, PurchaseItem
from rest_framework import permissions
from .serializers import (
    StockMovementSerializer, PurchaseSerializer, PurchaseItemSerializer,
    StockSummarySerializer, PurchaseCreateSerializer
)
from rest_framework.decorators import action
from products.models import Product
from accounts.permissions import IsAdminOrGerant, IsAuthenticated

# Vue pour les approvisionnements (supplies)
class SupplyViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les approvisionnements"""
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    permission_classes = [permissions.AllowAny]  # Temporairement public pour tests
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'supplier']
    search_fields = ['reference', 'supplier__name']
    ordering_fields = ['created_at', 'total_amount', 'delivery_date']
    ordering = ['-created_at']

    def get_serializer_class(self):
        """Utiliser le bon serializer selon l'action"""
        if self.action == 'create':
            return PurchaseCreateSerializer
        return PurchaseSerializer

    @action(detail=False, methods=['post'])
    def adjust_stock(self, request):
        """Ajuster le stock d'un produit"""
        from products.models import Product
        from rest_framework import status

        product_id = request.data.get('product')
        quantity = request.data.get('quantity')
        reason = request.data.get('reason', 'Ajustement manuel')

        if not product_id or quantity is None:
            return Response(
                {'error': 'product et quantity sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            product = Product.objects.get(id=product_id)
            old_stock = product.current_stock

            # Calculer le nouveau stock
            new_stock = old_stock + int(quantity)
            if new_stock < 0:
                new_stock = 0

            # Mettre à jour le stock
            product.current_stock = new_stock
            product.save()

            # Créer un mouvement de stock avec stock_before et stock_after
            movement_type = 'in' if int(quantity) > 0 else 'out'
            StockMovement.objects.create(
                product=product,
                movement_type=movement_type,
                quantity=abs(int(quantity)),
                reason=reason,
                user=request.user,
                stock_before=old_stock,
                stock_after=new_stock
            )

            return Response({
                'success': True,
                'message': f'Stock ajusté pour {product.name}',
                'old_stock': old_stock,
                'new_stock': product.current_stock,
                'adjustment': quantity
            })

        except Product.DoesNotExist:
            return Response(
                {'error': 'Produit non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


    def get_queryset(self):
        """Filtrer les achats pour ne montrer que les approvisionnements"""
        return Purchase.objects.select_related('supplier').prefetch_related('items__product')
    
    @action(detail=True, methods=['patch', 'post'])
    def validate(self, request, pk=None):
        """Valider une livraison et mettre à jour le stock"""
        supply = self.get_object()
        
        if supply.status not in ['received', 'pending']:
            return Response(
                {'error': 'Seules les livraisons en attente ou reçues peuvent être validées.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Mettre à jour le stock pour chaque produit
        for item in supply.items.all():
            # Si quantity_received est 0, utiliser quantity_ordered (validation automatique)
            quantity_to_receive = item.quantity_received if item.quantity_received > 0 else item.quantity_ordered
            
            # Mettre à jour quantity_received si elle était à 0
            if item.quantity_received == 0:
                item.quantity_received = item.quantity_ordered
                item.save()
            
            product = item.product
            old_stock = product.current_stock
            product.current_stock += quantity_to_receive
            product.save()
            
            # Créer un mouvement de stock
            StockMovement.objects.create(
                product=product,
                movement_type='in',
                reason='purchase',
                quantity=quantity_to_receive,
                unit_price=item.unit_price,
                total_amount=quantity_to_receive * item.unit_price,
                stock_before=old_stock,
                stock_after=product.current_stock,
                supplier=supply.supplier,
                user=request.user,
                reference=supply.reference,
                notes=f"Validation approvisionnement {supply.reference}"
            )
        
        # Changer le statut à validé
        supply.status = 'validated'
        supply.save()
        
        return Response({'message': 'Livraison validée et stock mis à jour.'})
    
    @action(detail=True, methods=['patch', 'post'])
    def reject(self, request, pk=None):
        """Rejeter une livraison"""
        supply = self.get_object()
        
        if supply.status not in ['received', 'pending']:
            return Response(
                {'error': 'Seules les livraisons en attente ou reçues peuvent être rejetées.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        supply.status = 'cancelled'
        supply.save()
        
        return Response({'message': 'Livraison rejetée.'})

class StockMovementViewSet(viewsets.ModelViewSet):
    queryset = StockMovement.objects.all()
    serializer_class = StockMovementSerializer
    permission_classes = [IsAdminOrGerant]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['movement_type', 'product', 'product__category']
    search_fields = ['reference', 'notes', 'product__name']
    ordering_fields = ['created_at', 'quantity', 'total_amount']
    ordering = ['-created_at']

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        import logging
        logger = logging.getLogger(__name__)
        
        logger.warning("=" * 60)
        logger.warning("🔍 StockMovementViewSet.create() - DÉBUT")
        logger.warning("=" * 60)
        logger.warning(f"📦 Données reçues: {request.data}")
        logger.warning(f"👤 Utilisateur: {request.user}")
        logger.warning(f"🔐 Authentifié: {request.user.is_authenticated}")
        
        try:
            response = super().create(request, *args, **kwargs)
            logger.warning(f"✅ Mouvement créé avec succès: {response.status_code}")
            logger.warning("=" * 60)
            return response
        except Exception as e:
            logger.error(f"❌ ERREUR lors de la création: {str(e)}")
            logger.error(f"❌ Type d'erreur: {type(e).__name__}")
            if hasattr(e, 'detail'):
                logger.error(f"❌ Détails: {e.detail}")
            logger.warning("=" * 60)
            raise

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Résumé des mouvements de stock"""
        today = timezone.now().date()

        # Mouvements du jour
        today_movements = self.get_queryset().filter(created_at__date=today)

        # Statistiques
        stats = {
            'total_movements_today': today_movements.count(),
            'entries_today': today_movements.filter(movement_type='in').count(),
            'exits_today': today_movements.filter(movement_type='out').count(),
            'total_value_in': today_movements.filter(movement_type='in').aggregate(
                total=Sum('total_amount'))['total'] or Decimal('0.00'),
            'total_value_out': today_movements.filter(movement_type='out').aggregate(
                total=Sum('total_amount'))['total'] or Decimal('0.00'),
        }

        return Response(stats)

class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer
    permission_classes = [permissions.AllowAny]  # Temporairement public pour tests
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'supplier', 'order_date']
    search_fields = ['reference', 'notes', 'supplier__name']
    ordering_fields = ['order_date', 'total_amount', 'created_at']
    ordering = ['-created_at']

    def get_serializer_class(self):
        if self.action == 'create':
            from .serializers import PurchaseCreateSerializer
            return PurchaseCreateSerializer
        return PurchaseSerializer

    @action(detail=True, methods=['post'])
    def mark_as_received(self, request, pk=None):
        """
        Marque l'achat comme reçu et met à jour automatiquement les stocks
        Endpoint similaire à mark-as-paid pour les ventes
        """
        purchase = self.get_object()
        
        # Vérifications
        if purchase.status == 'received':
            return Response(
                {'error': 'Cet achat est déjà marqué comme reçu.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if purchase.status == 'cancelled':
            return Response(
                {'error': 'Impossible de recevoir un achat annulé.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Appeler la méthode mark_as_received du modèle
            purchase.mark_as_received(request.user)
            
            # Sérialiser l'achat mis à jour
            serializer = PurchaseSerializer(purchase)
            
            return Response({
                'message': 'Achat marqué comme reçu et stocks mis à jour avec succès',
                'purchase': serializer.data
            })
        
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la réception: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Annuler un achat"""
        purchase = self.get_object()
        
        if purchase.status == 'cancelled':
            return Response(
                {'error': 'Cet achat est déjà annulé.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', 'Annulation manuelle')
        
        try:
            purchase.cancel_purchase(reason)
            
            return Response({
                'message': 'Achat annulé avec succès',
                'purchase': PurchaseSerializer(purchase).data
            })
        
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'annulation: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Confirmer un achat et mettre à jour le stock"""
        purchase = self.get_object()

        if purchase.status != 'pending':
            return Response(
                {'error': 'Seuls les achats en attente peuvent être confirmés.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Confirmer l'achat
        purchase.status = 'confirmed'
        purchase.save()

        # Créer les mouvements de stock pour chaque item
        for item in purchase.items.all():
            StockMovement.objects.create(
                product=item.product,
                movement_type='in',
                reason='purchase',
                quantity=item.quantity,
                unit_price=item.unit_cost,
                stock_before=item.product.current_stock,
                stock_after=item.product.current_stock + item.quantity,
                reference=f"Achat #{purchase.reference}",
                notes=f"Confirmation achat du {purchase.purchase_date}",
                user=request.user
            )

            # Mettre à jour le stock du produit
            item.product.current_stock += item.quantity
            item.product.save()

        return Response({'message': 'Achat confirmé avec succès.'})

class PurchaseItemViewSet(viewsets.ModelViewSet):
    queryset = PurchaseItem.objects.all()
    serializer_class = PurchaseItemSerializer
    permission_classes = [permissions.AllowAny]  # Temporairement public pour tests
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['purchase', 'product']

class StockSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Résumé complet du stock"""
        products = Product.objects.select_related('category').annotate(
            stock_value=F('current_stock') * F('purchase_price'),
            needs_restock=Q(current_stock__lte=F('minimum_stock'))
        )

        summary_data = []
        for product in products:
            # Dernier mouvement
            last_movement = StockMovement.objects.filter(
                product=product
            ).order_by('-created_at').first()

            summary_data.append({
                'product_id': product.id,
                'product_name': product.name,
                'category_name': product.category.name,
                'current_stock': product.current_stock,
                'minimum_stock': product.minimum_stock,
                'stock_value': product.stock_value,
                'last_movement_date': last_movement.created_at if last_movement else None,
                'needs_restock': product.current_stock <= product.minimum_stock
            })

        serializer = StockSummarySerializer(summary_data, many=True)
        return Response(serializer.data)

class LowStockView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Produits avec stock faible"""
        low_stock_products = Product.objects.filter(
            current_stock__lte=F('minimum_stock')
        ).select_related('category')

        data = []
        for product in low_stock_products:
            data.append({
                'product_id': product.id,
                'product_name': product.name,
                'category_name': product.category.name,
                'current_stock': product.current_stock,
                'minimum_stock': product.minimum_stock,
                'shortage': product.minimum_stock - product.current_stock
            })

        return Response(data)

class ProductMovementsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        """Historique des mouvements pour un produit"""
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response(
                {'error': 'Produit non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )

        movements = StockMovement.objects.filter(
            product=product
        ).order_by('-created_at')

        serializer = StockMovementSerializer(movements, many=True)
        return Response({
            'product': {
                'id': product.id,
                'name': product.name,
                'current_stock': product.current_stock
            },
            'movements': serializer.data
        })


