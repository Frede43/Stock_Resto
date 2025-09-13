from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'', views.SupplierViewSet, basename='supplier')

urlpatterns = [
    path('', include(router.urls)),
    path('<int:supplier_id>/purchases/', views.SupplierPurchasesView.as_view(), name='supplier-purchases'),
    path('<int:supplier_id>/statistics/', views.SupplierStatisticsView.as_view(), name='supplier-statistics'),
]
