from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'metrics', views.SystemMetricViewSet)
router.register(r'alerts', views.SystemAlertViewSet)
router.register(r'performance', views.PerformanceLogViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('stats/', views.system_stats, name='system_stats'),
]
