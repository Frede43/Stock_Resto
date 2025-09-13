from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'movements', views.StockMovementViewSet)
router.register(r'purchases', views.PurchaseViewSet, basename='purchase')
router.register(r'purchase-items', views.PurchaseItemViewSet)
router.register(r'supplies', views.SupplyViewSet, basename='supply')

urlpatterns = [
    path('', include(router.urls)),
    path('stock-summary/', views.StockSummaryView.as_view(), name='stock-summary'),
    path('low-stock/', views.LowStockView.as_view(), name='low-stock'),
    path('movements/by-product/<int:product_id>/', views.ProductMovementsView.as_view(), name='product-movements'),
]
