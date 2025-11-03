from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'categories', views.ExpenseCategoryViewSet, basename='expense-category')
router.register(r'expenses', views.ExpenseViewSet, basename='expense')
router.register(r'budgets', views.BudgetSettingViewSet, basename='budget-setting')

urlpatterns = [
    path('', include(router.urls)),
    path('summary/', views.ExpenseSummaryView.as_view(), name='expense-summary'),
    path('monthly-report/', views.MonthlyExpenseReportView.as_view(), name='monthly-expense-report'),
    path('by-category/', views.ExpensesByCategoryView.as_view(), name='expenses-by-category'),
    path('analytics/', views.ExpenseAnalyticsView.as_view(), name='expense-analytics'),
]
