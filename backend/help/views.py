from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from datetime import timedelta
from .models import HelpCategory, FAQ, Tutorial, SupportRequest, FAQHelpful, ViewTracking
from .serializers import (
    HelpCategorySerializer, FAQSerializer, TutorialSerializer, 
    SupportRequestSerializer, SupportRequestCreateSerializer, HelpStatsSerializer
)

class HelpCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HelpCategory.objects.all()
    serializer_class = HelpCategorySerializer
    permission_classes = [IsAuthenticated]

class FAQViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = FAQSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = FAQ.objects.filter(is_active=True)
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        
        if search:
            queryset = queryset.filter(
                Q(question__icontains=search) | Q(answer__icontains=search)
            )
        
        if category:
            queryset = queryset.filter(category__name=category)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def helpful(self, request, pk=None):
        faq = self.get_object()
        user = request.user
        
        helpful_vote, created = FAQHelpful.objects.get_or_create(
            faq=faq, user=user
        )
        
        if created:
            # Increment helpful count
            faq.helpful_count += 1
            faq.save()
            return Response({'message': 'Marqué comme utile'}, status=status.HTTP_201_CREATED)
        else:
            return Response({'message': 'Déjà marqué comme utile'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        faq = self.get_object()
        user = request.user
        ip_address = self.get_client_ip(request)
        
        # Track view
        ViewTracking.objects.create(
            content_type='faq',
            object_id=faq.id,
            user=user,
            ip_address=ip_address
        )
        
        # Increment view count
        faq.views += 1
        faq.save()
        
        return Response({'message': 'Vue enregistrée'}, status=status.HTTP_200_OK)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class TutorialViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = TutorialSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Tutorial.objects.filter(is_active=True)
        search = self.request.query_params.get('search')
        category = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')
        
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | Q(description__icontains=search)
            )
        
        if category:
            queryset = queryset.filter(category__name=category)
            
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def view(self, request, pk=None):
        tutorial = self.get_object()
        user = request.user
        ip_address = self.get_client_ip(request)
        
        # Track view
        ViewTracking.objects.create(
            content_type='tutorial',
            object_id=tutorial.id,
            user=user,
            ip_address=ip_address
        )
        
        # Increment view count
        tutorial.views += 1
        tutorial.save()
        
        return Response({'message': 'Vue enregistrée'}, status=status.HTTP_200_OK)
    
    def get_client_ip(self, request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

class SupportRequestViewSet(viewsets.ModelViewSet):
    serializer_class = SupportRequestSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Users can only see their own support requests
        return SupportRequest.objects.filter(created_by=self.request.user)
    
    def get_serializer_class(self):
        if self.action == 'create':
            return SupportRequestCreateSerializer
        return SupportRequestSerializer

class HelpStatsViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        # Calculate statistics
        total_faqs = FAQ.objects.filter(is_active=True).count()
        total_tutorials = Tutorial.objects.filter(is_active=True).count()
        total_support_requests = SupportRequest.objects.count()
        
        # Calculate average resolution time
        resolved_requests = SupportRequest.objects.filter(
            status='resolved',
            resolved_at__isnull=False
        )
        
        if resolved_requests.exists():
            avg_resolution = resolved_requests.aggregate(
                avg_time=Avg('resolved_at') - Avg('created_at')
            )['avg_time']
            avg_resolution_time = f"{avg_resolution.days} jours" if avg_resolution else "N/A"
        else:
            avg_resolution_time = "N/A"
        
        # Popular categories
        popular_categories = list(
            HelpCategory.objects.annotate(
                faq_count=Count('faqs', filter=Q(faqs__is_active=True)),
                tutorial_count=Count('tutorials', filter=Q(tutorials__is_active=True))
            ).annotate(
                total_count=F('faq_count') + F('tutorial_count')
            ).filter(total_count__gt=0).order_by('-total_count')[:5].values('name', 'total_count')
        )
        
        # Rename fields for frontend
        popular_categories = [
            {'category': item['name'], 'count': item['total_count']} 
            for item in popular_categories
        ]
        
        stats_data = {
            'total_faqs': total_faqs,
            'total_tutorials': total_tutorials,
            'total_support_requests': total_support_requests,
            'avg_resolution_time': avg_resolution_time,
            'popular_categories': popular_categories
        }
        
        serializer = HelpStatsSerializer(stats_data)
        return Response(serializer.data)

class HelpCategoriesListView(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        categories = HelpCategory.objects.values_list('name', flat=True)
        return Response(list(categories))
