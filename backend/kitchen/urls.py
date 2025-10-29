from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'ingredients', views.IngredientViewSet)
router.register(r'recipes', views.RecipeViewSet)

urlpatterns = [
    # API ViewSets
    path('', include(router.urls)),

    # Vues spécifiques
    path('dashboard/', views.kitchen_dashboard, name='kitchen-dashboard'),
    path('forecast/', views.production_forecast, name='production-forecast'),
    path('shopping-list/', views.shopping_list_generator, name='shopping-list'),
    path('recalculate-purchase-prices/', views.recalculate_purchase_prices, name='recalculate-purchase-prices'),
]
