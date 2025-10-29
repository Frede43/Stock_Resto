from django.urls import path
from . import views

app_name = 'products'

urlpatterns = [
    # Catégories
    path('categories/', views.CategoryListCreateView.as_view(), name='category_list_create'),
    path('categories/<int:pk>/', views.CategoryDetailView.as_view(), name='category_detail'),
    
    # Produits
    path('', views.ProductListCreateView.as_view(), name='product_list_create'),
    path('<int:pk>/', views.ProductDetailView.as_view(), name='product_detail'),
    path('<int:pk>/update-stock/', views.update_product_stock, name='update_stock'),
    path('bulk-update/', views.bulk_update_products, name='bulk_update'),
    path('low-stock/', views.low_stock_products, name='low_stock'),
    path('out-of-stock/', views.out_of_stock_products, name='out_of_stock'),
]
