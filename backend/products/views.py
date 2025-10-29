from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db import models
from .models import Category, Product
from .serializers import (
    CategorySerializer, ProductSerializer, ProductListSerializer,
    ProductStockUpdateSerializer, ProductBulkUpdateSerializer
)
from accounts.permissions import IsAuthenticated, IsAdminOrGerant

class CategoryListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des catégories
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['type', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']

    def perform_create(self, serializer):
        # Seuls les admins et gérants peuvent créer des catégories
        if not self.request.user.can_manage_products():
            raise PermissionDenied("Permission insuffisante pour créer des catégories.")
        serializer.save()


class CategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour récupérer, modifier ou supprimer une catégorie
    """
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        if not self.request.user.can_manage_products():
            raise PermissionDenied("Permission insuffisante pour modifier des catégories.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.can_delete_records():
            raise PermissionDenied("Permission insuffisante pour supprimer des catégories.")
        instance.delete()


class ProductListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des produits
    """
    queryset = Product.objects.all()
    permission_classes = [permissions.AllowAny]  # Temporairement public pour tests
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'is_active', 'is_available']
    search_fields = ['name', 'code', 'description']
    ordering_fields = ['name', 'selling_price', 'current_stock', 'created_at']
    ordering = ['name']

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ProductListSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.select_related('category')

        # Filtres spéciaux
        low_stock = self.request.query_params.get('low_stock')
        out_of_stock = self.request.query_params.get('out_of_stock')

        if low_stock == 'true':
            queryset = queryset.filter(current_stock__lte=models.F('minimum_stock'))

        if out_of_stock == 'true':
            queryset = queryset.filter(current_stock=0)

        return queryset

    def perform_create(self, serializer):
        if not self.request.user.can_manage_products():
            raise PermissionDenied("Permission insuffisante pour créer des produits.")

        # Log des données reçues pour débogage
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Création produit - Données reçues: {self.request.data}")

        serializer.save()


class ProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour récupérer, modifier ou supprimer un produit
    """
    queryset = Product.objects.select_related('category')
    serializer_class = ProductSerializer
    permission_classes = [permissions.AllowAny]  # Temporairement public pour tests

    def perform_update(self, serializer):
        if not self.request.user.can_edit_products():
            raise PermissionDenied("Permission insuffisante pour modifier des produits.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.can_delete_records():
            raise PermissionDenied("Permission insuffisante pour supprimer des produits.")
        instance.delete()


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_product_stock(request, pk):
    """
    Vue pour mettre à jour le stock d'un produit
    """
    if not request.user.can_manage_inventory():
        return Response(
            {'error': 'Permission insuffisante pour gérer les stocks.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response(
            {'error': 'Produit introuvable.'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = ProductStockUpdateSerializer(data=request.data)
    if serializer.is_valid():
        quantity = serializer.validated_data['quantity']
        operation = serializer.validated_data['operation']
        reason = serializer.validated_data.get('reason', '')

        old_stock = product.current_stock

        if operation == 'add':
            product.current_stock += quantity
        elif operation == 'subtract':
            if product.current_stock >= quantity:
                product.current_stock -= quantity
            else:
                return Response(
                    {'error': 'Stock insuffisant pour cette opération.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        elif operation == 'set':
            product.current_stock = quantity

        product.save()

        # Créer un mouvement de stock (à implémenter dans inventory)
        # StockMovement.objects.create(...)

        return Response({
            'message': 'Stock mis à jour avec succès.',
            'old_stock': old_stock,
            'new_stock': product.current_stock,
            'product': ProductSerializer(product).data
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bulk_update_products(request):
    """
    Vue pour mettre à jour plusieurs produits en lot
    """
    if not request.user.can_manage_products():
        return Response(
            {'error': 'Permission insuffisante pour modifier des produits.'},
            status=status.HTTP_403_FORBIDDEN
        )

    serializer = ProductBulkUpdateSerializer(data=request.data)
    if serializer.is_valid():
        products_data = serializer.validated_data['products']
        updated_products = []

        for product_data in products_data:
            try:
                product = Product.objects.get(id=product_data['id'])

                # Mettre à jour les champs fournis
                for field, value in product_data.items():
                    if field != 'id' and hasattr(product, field):
                        setattr(product, field, value)

                product.save()
                updated_products.append(ProductSerializer(product).data)

            except Product.DoesNotExist:
                continue

        return Response({
            'message': f'{len(updated_products)} produits mis à jour avec succès.',
            'updated_products': updated_products
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def low_stock_products(request):
    """
    Vue pour récupérer les produits avec stock faible
    """
    if not request.user.can_view_stock_alerts():
        return Response(
            {'error': 'Permission insuffisante pour voir les alertes de stock.'},
            status=status.HTTP_403_FORBIDDEN
        )

    products = Product.objects.filter(
        current_stock__lte=models.F('minimum_stock'),
        is_active=True
    ).select_related('category')

    serializer = ProductListSerializer(products, many=True)
    return Response({
        'count': products.count(),
        'products': serializer.data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def out_of_stock_products(request):
    """
    Vue pour récupérer les produits en rupture de stock
    """
    if not request.user.can_view_stock_alerts():
        return Response(
            {'error': 'Permission insuffisante pour voir les alertes de stock.'},
            status=status.HTTP_403_FORBIDDEN
        )

    products = Product.objects.filter(
        current_stock=0,
        is_active=True
    ).select_related('category')

    serializer = ProductListSerializer(products, many=True)
    return Response({
        'count': products.count(),
        'products': serializer.data
    })
