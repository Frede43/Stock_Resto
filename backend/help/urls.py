from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    HelpCategoryViewSet, FAQViewSet, TutorialViewSet, 
    SupportRequestViewSet, HelpStatsViewSet, HelpCategoriesListView
)

router = DefaultRouter()
router.register(r'categories', HelpCategoryViewSet)
router.register(r'faqs', FAQViewSet, basename='faq')
router.register(r'tutorials', TutorialViewSet, basename='tutorial')
router.register(r'support-requests', SupportRequestViewSet, basename='supportrequest')
router.register(r'stats', HelpStatsViewSet, basename='helpstats')

urlpatterns = [
    path('categories/', HelpCategoriesListView.as_view({'get': 'list'}), name='help-categories-list'),
    path('', include(router.urls)),
]
