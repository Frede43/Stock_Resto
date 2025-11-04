from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from .models import ExpenseCategory, Expense, ExpenseBudget
from .serializers import (
    ExpenseCategorySerializer,
    ExpenseSerializer,
    ExpenseCreateSerializer,
    ExpenseApprovalSerializer,
    ExpenseBudgetSerializer,
    ExpenseStatsSerializer,
)


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les catégories de dépenses
    """
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at']
    ordering = ['name']
    
    def get_queryset(self):
        """Filtrer les catégories actives par défaut"""
        queryset = super().get_queryset()
        
        # Filtrer par statut actif
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Filtrer par type
        category_type = self.request.query_params.get('type', None)
        if category_type:
            queryset = queryset.filter(category_type=category_type)
        
        return queryset
    
    @action(detail=True, methods=['get'])
    def expenses(self, request, pk=None):
        """Obtenir toutes les dépenses d'une catégorie"""
        category = self.get_object()
        expenses = category.expenses.all()
        
        # Filtrer par statut
        status_filter = request.query_params.get('status', None)
        if status_filter:
            expenses = expenses.filter(status=status_filter)
        
        serializer = ExpenseSerializer(expenses, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def monthly_stats(self, request, pk=None):
        """Statistiques mensuelles d'une catégorie"""
        category = self.get_object()
        year = int(request.query_params.get('year', timezone.now().year))
        month = int(request.query_params.get('month', timezone.now().month))
        
        total = category.get_monthly_total(year, month)
        count = category.expenses.filter(
            expense_date__year=year,
            expense_date__month=month,
            status='approved'
        ).count()
        
        return Response({
            'category': category.name,
            'year': year,
            'month': month,
            'total_amount': total,
            'expense_count': count,
            'budget': category.budget_monthly or 0,
            'remaining': (category.budget_monthly or 0) - total,
        })


class ExpenseViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les dépenses
    """
    queryset = Expense.objects.select_related(
        'category',
        'created_by',
        'approved_by',
        'supplier'
    ).all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'receipt_number', 'payment_reference']
    ordering_fields = ['expense_date', 'amount', 'created_at']
    ordering = ['-expense_date', '-created_at']
    
    def get_serializer_class(self):
        """Utiliser différents serializers selon l'action"""
        if self.action == 'create':
            return ExpenseCreateSerializer
        return ExpenseSerializer
    
    def get_queryset(self):
        """Filtrer les dépenses selon les paramètres"""
        queryset = super().get_queryset()
        
        # Filtrer par statut
        status_filter = self.request.query_params.get('status', None)
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filtrer par catégorie
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        # Filtrer par fournisseur
        supplier = self.request.query_params.get('supplier', None)
        if supplier:
            queryset = queryset.filter(supplier_id=supplier)
        
        # Filtrer par méthode de paiement
        payment_method = self.request.query_params.get('payment_method', None)
        if payment_method:
            queryset = queryset.filter(payment_method=payment_method)
        
        # Filtrer par date
        start_date = self.request.query_params.get('start_date', None)
        end_date = self.request.query_params.get('end_date', None)
        
        if start_date:
            queryset = queryset.filter(expense_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(expense_date__lte=end_date)
        
        # Filtrer par créateur (mes dépenses)
        my_expenses = self.request.query_params.get('my_expenses', None)
        if my_expenses and my_expenses.lower() == 'true':
            queryset = queryset.filter(created_by=self.request.user)
        
        # Filtrer dépenses en retard
        overdue = self.request.query_params.get('overdue', None)
        if overdue and overdue.lower() == 'true':
            queryset = queryset.filter(
                due_date__lt=timezone.now().date(),
                status__in=['pending', 'approved']
            )
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approuver une dépense"""
        expense = self.get_object()
        
        # Vérifier les permissions
        if not request.user.can_manage_expenses():
            return Response(
                {'error': 'Vous n\'avez pas la permission d\'approuver des dépenses.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if expense.status != 'pending':
            return Response(
                {'error': 'Seules les dépenses en attente peuvent être approuvées.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.approve(request.user)
        serializer = self.get_serializer(expense)
        
        return Response({
            'message': 'Dépense approuvée avec succès.',
            'expense': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rejeter une dépense"""
        expense = self.get_object()
        
        # Vérifier les permissions
        if not request.user.can_manage_expenses():
            return Response(
                {'error': 'Vous n\'avez pas la permission de rejeter des dépenses.'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if expense.status != 'pending':
            return Response(
                {'error': 'Seules les dépenses en attente peuvent être rejetées.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = ExpenseApprovalSerializer(data=request.data)
        if serializer.is_valid():
            reason = serializer.validated_data.get('rejection_reason', '')
            expense.reject(request.user, reason)
            
            return Response({
                'message': 'Dépense rejetée.',
                'expense': ExpenseSerializer(expense).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Marquer une dépense comme payée"""
        expense = self.get_object()
        
        if expense.status != 'approved':
            return Response(
                {'error': 'Seules les dépenses approuvées peuvent être marquées comme payées.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        expense.mark_as_paid()
        serializer = self.get_serializer(expense)
        
        return Response({
            'message': 'Dépense marquée comme payée.',
            'expense': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Statistiques globales des dépenses"""
        # Période
        start_date = request.query_params.get('start_date', None)
        end_date = request.query_params.get('end_date', None)
        
        queryset = self.get_queryset()
        
        if start_date:
            queryset = queryset.filter(expense_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(expense_date__lte=end_date)
        
        # Totaux par statut
        stats = queryset.aggregate(
            total_expenses=Sum('amount'),
            total_pending=Sum('amount', filter=Q(status='pending')),
            total_approved=Sum('amount', filter=Q(status='approved')),
            total_rejected=Sum('amount', filter=Q(status='rejected')),
            count_pending=Count('id', filter=Q(status='pending')),
            count_approved=Count('id', filter=Q(status='approved')),
            count_rejected=Count('id', filter=Q(status='rejected')),
        )
        
        # Remplacer None par 0
        for key in stats:
            if stats[key] is None:
                stats[key] = 0 if 'count' in key else Decimal('0')
        
        # Par catégorie
        by_category = queryset.filter(status='approved').values(
            'category__name'
        ).annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')[:10]
        
        # Par méthode de paiement
        by_payment = queryset.filter(status='approved').values(
            'payment_method'
        ).annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')
        
        # Tendance mensuelle (6 derniers mois)
        monthly_trend = []
        for i in range(6):
            date = timezone.now().date() - timedelta(days=30 * i)
            month_total = queryset.filter(
                expense_date__year=date.year,
                expense_date__month=date.month,
                status='approved'
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            
            monthly_trend.append({
                'month': f"{date.year}-{date.month:02d}",
                'total': float(month_total)
            })
        
        monthly_trend.reverse()
        
        stats['by_category'] = list(by_category)
        stats['by_payment_method'] = list(by_payment)
        stats['monthly_trend'] = monthly_trend
        
        serializer = ExpenseStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def pending_approvals(self, request):
        """Dépenses en attente d'approbation"""
        expenses = self.get_queryset().filter(status='pending')
        serializer = self.get_serializer(expenses, many=True)
        
        return Response({
            'count': expenses.count(),
            'total_amount': expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0'),
            'expenses': serializer.data
        })


class ExpenseBudgetViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les budgets de dépenses
    """
    queryset = ExpenseBudget.objects.select_related('category').all()
    serializer_class = ExpenseBudgetSerializer
    permission_classes = [IsAuthenticated]
    ordering = ['-year', '-month']
    
    def get_queryset(self):
        """Filtrer les budgets"""
        queryset = super().get_queryset()
        
        # Filtrer par année
        year = self.request.query_params.get('year', None)
        if year:
            queryset = queryset.filter(year=year)
        
        # Filtrer par mois
        month = self.request.query_params.get('month', None)
        if month:
            queryset = queryset.filter(month=month)
        
        # Filtrer par catégorie
        category = self.request.query_params.get('category', None)
        if category:
            queryset = queryset.filter(category_id=category)
        
        return queryset
    
    @action(detail=True, methods=['post'])
    def update_actual(self, request, pk=None):
        """Mettre à jour le montant réel basé sur les dépenses"""
        budget = self.get_object()
        budget.update_actual_amount()
        serializer = self.get_serializer(budget)
        
        return Response({
            'message': 'Montant réel mis à jour.',
            'budget': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def current_month(self, request):
        """Budgets du mois en cours"""
        now = timezone.now()
        budgets = self.get_queryset().filter(
            year=now.year,
            month=now.month
        )
        serializer = self.get_serializer(budgets, many=True)
        
        return Response(serializer.data)
