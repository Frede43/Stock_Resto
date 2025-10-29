from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from calendar import monthrange

from .models import ExpenseCategory, Expense
from .serializers import (
    ExpenseCategorySerializer, ExpenseSerializer, ExpenseSummarySerializer,
    MonthlyExpenseReportSerializer, ExpenseByCategorySerializer
)
from accounts.permissions import IsAdminOrGerant, IsAuthenticated

class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    queryset = ExpenseCategory.objects.all()
    serializer_class = ExpenseCategorySerializer
    permission_classes = [IsAdminOrGerant]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'created_at', 'total_amount']
    ordering = ['name']

    def get_queryset(self):
        queryset = super().get_queryset()

        # Annoter avec les statistiques
        queryset = queryset.annotate(
            expenses_count=Count('expenses'),
            total_amount=Sum('expenses__amount')
        )

        return queryset

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Liste des catégories actives"""
        active_categories = self.get_queryset().filter(is_active=True)
        serializer = self.get_serializer(active_categories, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def toggle_status(self, request, pk=None):
        """Activer/désactiver une catégorie"""
        category = self.get_object()
        category.is_active = not category.is_active
        category.save()

        status_text = "activée" if category.is_active else "désactivée"
        return Response({
            'message': f'Catégorie {status_text} avec succès.',
            'is_active': category.is_active
        })

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAdminOrGerant]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'expense_date', 'user']
    search_fields = ['description', 'receipt_number', 'notes']
    ordering_fields = ['expense_date', 'amount', 'created_at']
    ordering = ['-expense_date']

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Dépenses récentes (7 derniers jours)"""
        week_ago = timezone.now().date() - timedelta(days=7)
        recent_expenses = self.get_queryset().filter(expense_date__gte=week_ago)
        serializer = self.get_serializer(recent_expenses, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def today(self, request):
        """Dépenses du jour"""
        today = timezone.now().date()
        today_expenses = self.get_queryset().filter(expense_date=today)
        serializer = self.get_serializer(today_expenses, many=True)
        return Response(serializer.data)

class ExpenseSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Résumé des dépenses"""
        today = timezone.now().date()
        week_start = today - timedelta(days=today.weekday())
        month_start = today.replace(day=1)
        year_start = today.replace(month=1, day=1)

        expenses = Expense.objects.all()

        # Totaux par période
        total_today = expenses.filter(expense_date=today).aggregate(
            total=Sum('amount'))['total'] or Decimal('0.00')

        total_this_week = expenses.filter(expense_date__gte=week_start).aggregate(
            total=Sum('amount'))['total'] or Decimal('0.00')

        total_this_month = expenses.filter(expense_date__gte=month_start).aggregate(
            total=Sum('amount'))['total'] or Decimal('0.00')

        total_this_year = expenses.filter(expense_date__gte=year_start).aggregate(
            total=Sum('amount'))['total'] or Decimal('0.00')

        # Compteurs
        expenses_count_today = expenses.filter(expense_date=today).count()
        expenses_count_this_month = expenses.filter(expense_date__gte=month_start).count()

        # Moyenne quotidienne du mois
        days_in_month = monthrange(today.year, today.month)[1]
        average_daily_expense = total_this_month / days_in_month if days_in_month > 0 else Decimal('0.00')

        # Catégorie avec le plus de dépenses ce mois
        top_category_data = expenses.filter(expense_date__gte=month_start).values(
            'category__name'
        ).annotate(
            total=Sum('amount')
        ).order_by('-total').first()

        top_category = top_category_data['category__name'] if top_category_data else 'Aucune'
        top_category_amount = top_category_data['total'] if top_category_data else Decimal('0.00')

        summary = {
            'total_today': total_today,
            'total_this_week': total_this_week,
            'total_this_month': total_this_month,
            'total_this_year': total_this_year,
            'expenses_count_today': expenses_count_today,
            'expenses_count_this_month': expenses_count_this_month,
            'average_daily_expense': average_daily_expense,
            'top_category': top_category,
            'top_category_amount': top_category_amount
        }

        serializer = ExpenseSummarySerializer(summary)
        return Response(serializer.data)

class MonthlyExpenseReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Rapport mensuel des dépenses"""
        # Paramètres de requête
        month = int(request.query_params.get('month', timezone.now().month))
        year = int(request.query_params.get('year', timezone.now().year))

        # Filtrer les dépenses du mois
        month_expenses = Expense.objects.filter(
            expense_date__year=year,
            expense_date__month=month
        )

        # Statistiques générales
        total_amount = month_expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        expenses_count = month_expenses.count()

        # Répartition par catégorie
        categories = month_expenses.values('category__name').annotate(
            total=Sum('amount'),
            count=Count('id')
        ).order_by('-total')

        # Répartition quotidienne
        daily_breakdown = []
        days_in_month = monthrange(year, month)[1]

        for day in range(1, days_in_month + 1):
            day_total = month_expenses.filter(expense_date__day=day).aggregate(
                total=Sum('amount'))['total'] or Decimal('0.00')
            daily_breakdown.append({
                'day': day,
                'total': day_total
            })

        report = {
            'month': f"{month:02d}",
            'year': year,
            'total_amount': total_amount,
            'expenses_count': expenses_count,
            'categories': list(categories),
            'daily_breakdown': daily_breakdown
        }

        serializer = MonthlyExpenseReportSerializer(report)
        return Response(serializer.data)

class ExpensesByCategoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Dépenses réparties par catégorie"""
        # Paramètres de période
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')

        expenses = Expense.objects.all()

        if start_date:
            expenses = expenses.filter(expense_date__gte=start_date)
        if end_date:
            expenses = expenses.filter(expense_date__lte=end_date)

        # Total général
        total_general = expenses.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')

        # Répartition par catégorie
        categories_data = expenses.values(
            'category__id', 'category__name'
        ).annotate(
            total_amount=Sum('amount'),
            expenses_count=Count('id'),
            average_amount=Avg('amount')
        ).order_by('-total_amount')

        # Calculer les pourcentages
        result = []
        for category in categories_data:
            percentage = (category['total_amount'] / total_general * 100) if total_general > 0 else 0
            result.append({
                'category_id': category['category__id'],
                'category_name': category['category__name'],
                'total_amount': category['total_amount'],
                'expenses_count': category['expenses_count'],
                'percentage': round(percentage, 2),
                'average_amount': category['average_amount'] or Decimal('0.00')
            })

        serializer = ExpenseByCategorySerializer(result, many=True)
        return Response(serializer.data)
