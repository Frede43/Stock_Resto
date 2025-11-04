from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CreditAccountViewSet, CreditTransactionViewSet, CreditReminderViewSet

router = DefaultRouter()
router.register(r'accounts', CreditAccountViewSet, basename='credit-account')
router.register(r'transactions', CreditTransactionViewSet, basename='credit-transaction')
router.register(r'reminders', CreditReminderViewSet, basename='credit-reminder')

urlpatterns = [
    path('', include(router.urls)),
]
