from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Avg, Max
from django.utils import timezone
from decimal import Decimal

from .models import Supplier
from .serializers import SupplierSerializer, SupplierStatisticsSerializer
from inventory.models import Purchase
from inventory.serializers import PurchaseSerializer
from accounts.permissions import IsAdminOrGerant, IsAuthenticated, CanManageSuppliers

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer
    permission_classes = [permissions.AllowAny]  # Temporairement pour tests
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'city']
    search_fields = ['name', 'contact_person', 'phone', 'email', 'city']
    ordering_fields = ['name', 'created_at', 'updated_at']
    ordering = ['name']

    def get_queryset(self):
        """Retourner le queryset des fournisseurs"""
        return super().get_queryset()

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Liste des fournisseurs actifs"""
        active_suppliers = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_suppliers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Activer/désactiver un fournisseur"""
        supplier = self.get_object()
        supplier.is_active = not supplier.is_active
        supplier.save()

        status_text = "activé" if supplier.is_active else "désactivé"
        return Response({
            'message': f'Fournisseur {status_text} avec succès.',
            'is_active': supplier.is_active
        })

class SupplierPurchasesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, supplier_id):
        """Historique des achats d'un fournisseur"""
        try:
            supplier = Supplier.objects.get(id=supplier_id)
        except Supplier.DoesNotExist:
            return Response(
                {'error': 'Fournisseur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )

        purchases = Purchase.objects.filter(
            supplier=supplier
        ).order_by('-purchase_date')

        serializer = PurchaseSerializer(purchases, many=True)
        return Response({
            'supplier': {
                'id': supplier.id,
                'name': supplier.name,
                'contact_person': supplier.contact_person
            },
            'purchases': serializer.data
        })

class SupplierStatisticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, supplier_id):
        """Statistiques détaillées d'un fournisseur"""
        try:
            supplier = Supplier.objects.get(id=supplier_id)
        except Supplier.DoesNotExist:
            return Response(
                {'error': 'Fournisseur non trouvé.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Statistiques des achats
        purchases = Purchase.objects.filter(supplier=supplier)

        total_purchases = purchases.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')

        purchases_count = purchases.count()

        average_purchase = purchases.aggregate(
            avg=Avg('total_amount')
        )['avg'] or Decimal('0.00')

        last_purchase = purchases.order_by('-purchase_date').first()

        # Nombre de produits différents fournis
        products_supplied = purchases.values('items__product').distinct().count()

        # Évaluation de la fiabilité (basée sur le statut des achats)
        confirmed_purchases = purchases.filter(status='confirmed').count()
        if purchases_count > 0:
            reliability_rate = confirmed_purchases / purchases_count
            if reliability_rate >= 0.9:
                payment_reliability = 'excellent'
            elif reliability_rate >= 0.7:
                payment_reliability = 'good'
            elif reliability_rate >= 0.5:
                payment_reliability = 'average'
            else:
                payment_reliability = 'poor'
        else:
            payment_reliability = 'no_data'

        statistics = {
            'supplier_id': supplier.id,
            'supplier_name': supplier.name,
            'total_purchases': total_purchases,
            'purchases_count': purchases_count,
            'average_purchase_amount': average_purchase,
            'last_purchase_date': last_purchase.purchase_date if last_purchase else None,
            'products_supplied': products_supplied,
            'payment_reliability': payment_reliability
        }

        serializer = SupplierStatisticsSerializer(statistics)
        return Response(serializer.data)
