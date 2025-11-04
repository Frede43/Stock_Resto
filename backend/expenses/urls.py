from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ExpenseCategoryViewSet, ExpenseViewSet, ExpenseBudgetViewSet

router = DefaultRouter()
router.register(r'categories', ExpenseCategoryViewSet, basename='expense-category')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'budgets', ExpenseBudgetViewSet, basename='expense-budget')

urlpatterns = [
    path('', include(router.urls)),
]
