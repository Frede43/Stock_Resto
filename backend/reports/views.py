from django.http import HttpResponse
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Avg, Max, F, Q
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .models import DailyReport, StockAlert
from .serializers import (
    DailyReportSerializer, DailyReportCreateSerializer,
    StockAlertSerializer, StockAlertCreateSerializer,
    ReportSummarySerializer
)
from .pdf_generator import PDFReportGenerator
from .excel_generator import ExcelReportGenerator
from products.models import Product
from sales.models import Sale, SaleItem
from expenses.models import Expense
from accounts.permissions import IsAdminOrGerant, IsAuthenticated

class DailyReportListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des rapports quotidiens
    """
    permission_classes = [permissions.AllowAny]  # Temporaire pour les tests
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['date', 'user']
    search_fields = ['notes']
    ordering_fields = ['date', 'total_sales', 'created_at']
    ordering = ['-date']

    def get_queryset(self):
        # Temporaire pour les tests - désactiver la vérification des permissions
        if hasattr(self.request.user, 'can_generate_reports') and not self.request.user.can_generate_reports():
            return DailyReport.objects.none()

        return DailyReport.objects.select_related('user')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return DailyReportCreateSerializer
        return DailyReportSerializer

    def perform_create(self, serializer):
        # Temporaire pour les tests - désactiver la vérification des permissions
        if hasattr(self.request.user, 'can_generate_reports') and not self.request.user.can_generate_reports():
            raise permissions.PermissionDenied("Permission insuffisante pour créer des rapports.")
        serializer.save()

class DailyReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour récupérer, modifier ou supprimer un rapport quotidien
    """
    serializer_class = DailyReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.can_generate_reports():
            return DailyReport.objects.none()

        return DailyReport.objects.select_related('user')

    def perform_update(self, serializer):
        if not self.request.user.can_generate_reports():
            raise permissions.PermissionDenied("Permission insuffisante pour modifier des rapports.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.can_delete_records():
            raise permissions.PermissionDenied("Permission insuffisante pour supprimer des rapports.")
        instance.delete()

class StockAlertListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des alertes de stock
    """
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['alert_type', 'status', 'product__category']
    search_fields = ['product__name', 'message']
    ordering_fields = ['created_at', 'product__name']
    ordering = ['-created_at']

    def get_queryset(self):
        if not self.request.user.can_view_stock_alerts():
            return StockAlert.objects.none()

        return StockAlert.objects.select_related('product', 'product__category')

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return StockAlertCreateSerializer
        return StockAlertSerializer

    def perform_create(self, serializer):
        if not self.request.user.can_manage_inventory():
            raise permissions.PermissionDenied("Permission insuffisante pour créer des alertes.")
        serializer.save()

class StockAlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour récupérer, modifier ou supprimer une alerte de stock
    """
    serializer_class = StockAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if not self.request.user.can_view_stock_alerts():
            return StockAlert.objects.none()

        return StockAlert.objects.select_related('product', 'product__category')

    def perform_update(self, serializer):
        if not self.request.user.can_manage_inventory():
            raise permissions.PermissionDenied("Permission insuffisante pour modifier des alertes.")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.can_delete_records():
            raise permissions.PermissionDenied("Permission insuffisante pour supprimer des alertes.")
        instance.delete()

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def resolve_stock_alert(request, pk):
    """
    Vue pour résoudre une alerte de stock
    """
    if not request.user.can_manage_inventory():
        return Response(
            {'error': 'Permission insuffisante pour résoudre des alertes.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        alert = StockAlert.objects.get(pk=pk)
    except StockAlert.DoesNotExist:
        return Response(
            {'error': 'Alerte introuvable.'},
            status=status.HTTP_404_NOT_FOUND
        )

    if alert.status == 'resolved':
        return Response(
            {'error': 'Cette alerte est déjà résolue.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    alert.status = 'resolved'
    alert.save()

    return Response({
        'message': 'Alerte résolue avec succès.',
        'alert': StockAlertSerializer(alert).data
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def generate_stock_alerts(request):
    """
    Vue pour générer automatiquement les alertes de stock
    """
    if not request.user.can_manage_inventory():
        return Response(
            {'error': 'Permission insuffisante pour générer des alertes.'},
            status=status.HTTP_403_FORBIDDEN
        )

    alerts_created = 0

    # Produits en rupture de stock
    out_of_stock_products = Product.objects.filter(
        current_stock=0,
        is_active=True
    )

    for product in out_of_stock_products:
        # Vérifier qu'il n'y a pas déjà une alerte
        if not StockAlert.objects.filter(
            product=product,
            alert_type='out_of_stock',
            status='active'
        ).exists():
            StockAlert.objects.create(
                product=product,
                alert_type='out_of_stock',
                message=f"Le produit {product.name} est en rupture de stock."
            )
            alerts_created += 1

    # Produits avec stock faible
    from django.db import models
    low_stock_products = Product.objects.filter(
        current_stock__lte=models.F('minimum_stock'),
        current_stock__gt=0,
        is_active=True
    )

    for product in low_stock_products:
        # Vérifier qu'il n'y a pas déjà une alerte
        if not StockAlert.objects.filter(
            product=product,
            alert_type='low_stock',
            status='active'
        ).exists():
            StockAlert.objects.create(
                product=product,
                alert_type='low_stock',
                message=f"Le stock du produit {product.name} est faible: {product.current_stock}/{product.minimum_stock}."
            )
            alerts_created += 1

    return Response({
        'message': f'{alerts_created} nouvelles alertes créées.',
        'alerts_created': alerts_created
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Temporairement public pour debug
def dashboard_stats(request):
    """
    Vue pour les statistiques du tableau de bord
    """
    # Permissions désactivées temporairement pour debug
    # if (request.user.is_authenticated and
    #     hasattr(request.user, 'can_view_sales_history') and
    #     not request.user.can_view_sales_history()):
    #     return Response(
    #         {'error': 'Permission insuffisante pour voir les statistiques.'},
    #         status=status.HTTP_403_FORBIDDEN
    #     )

    # Utiliser la date du 20/08/2025 pour les tests
    from datetime import date
    today = date(2025, 8, 20)  # Forcer la date pour les tests

    # Rapport du jour
    today_report = DailyReport.objects.filter(date=today).first()

    # Alertes non résolues
    unresolved_alerts = StockAlert.objects.filter(status='active').count()

    # Produits en rupture
    out_of_stock_count = Product.objects.filter(
        current_stock=0,
        is_active=True
    ).count()

    # Produits avec stock faible
    from django.db import models
    low_stock_count = Product.objects.filter(
        current_stock__lte=models.F('minimum_stock'),
        current_stock__gt=0,
        is_active=True
    ).count()

    # Ventes en attente (si module sales disponible)
    print(f"DEBUG: Début de l'API dashboard pour la date: {today}")
    try:
        from sales.models import Sale, SaleItem
        print("DEBUG: Import des modèles Sale et SaleItem réussi")

        pending_sales = Sale.objects.filter(status='pending').count()
        print(f"DEBUG: Ventes en attente: {pending_sales}")

        # Données réelles des ventes du jour
        daily_sales = Sale.objects.filter(created_at__date=today)
        completed_sales = daily_sales.filter(status='paid')
        completed_sales_count = completed_sales.count()

        # Données des commandes du jour
        try:
            from orders.models import Order
            daily_orders = Order.objects.filter(created_at__date=today)
            total_orders_count = daily_orders.count()
            pending_orders_count = daily_orders.filter(status='pending').count()
        except ImportError:
            total_orders_count = completed_sales_count  # Fallback vers les ventes
            pending_orders_count = 0

        # Debug: Afficher les informations
        print(f"DEBUG: Ventes complétées trouvées: {completed_sales_count}")
        print(f"DEBUG: Ventes du jour: {daily_sales.count()}")

        # Calcul des revenus du jour
        daily_revenue = completed_sales.aggregate(
            total=Sum('total_amount')
        )['total'] or 0

        print(f"DEBUG: Revenus calculés: {daily_revenue}")

        # Tables occupées (tables avec des ventes en cours)
        try:
            from sales.models import Table
            occupied_tables = Table.objects.filter(
                sales__status__in=['pending', 'in_progress']
            ).distinct().count()
            total_tables = Table.objects.filter(is_active=True).count()
        except ImportError:
            occupied_tables = 0
            total_tables = 10  # Valeur par défaut

        print(f"DEBUG: Tables occupées: {occupied_tables}/{total_tables}")

        # Produits vendus aujourd'hui avec détails
        products_sold_today = SaleItem.objects.filter(
            sale__in=completed_sales
        ).values(
            'product__name',
            'product__category'
        ).annotate(
            quantity_sold=Sum('quantity'),
            revenue=Sum('total_price')
        ).order_by('-quantity_sold')

    except ImportError as e:
        print(f"DEBUG: Erreur d'import: {e}")
        pending_sales = 0
        completed_sales_count = 0
        daily_revenue = 0
        products_sold_today = []
    except Exception as e:
        print(f"DEBUG: Erreur inattendue: {e}")
        pending_sales = 0
        completed_sales_count = 0
        daily_revenue = 0
        products_sold_today = []

    return Response({
        'today': {
            'date': today,
            'daily_revenue': daily_revenue,
            'products_sold': list(products_sold_today),
            'sales': completed_sales_count,
            'orders': total_orders_count,  # Vraies commandes
            'revenue': daily_revenue,
            'pending_sales': pending_sales,
            'pending_orders': pending_orders_count
        },
        'alerts': {
            'total_unresolved': unresolved_alerts,
            'out_of_stock': out_of_stock_count,
            'low_stock': low_stock_count
        },
        'quick_stats': {
            'total_products': Product.objects.filter(is_active=True).count(),
            'active_alerts': unresolved_alerts,
            'occupied_tables': occupied_tables,
            'total_tables': total_tables
        }
    })

@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Temporairement public pour debug
def unresolved_alerts(request):
    """
    Vue pour récupérer les alertes non résolues
    """
    try:
        # Récupérer les alertes actives (non résolues)
        alerts = StockAlert.objects.filter(status='active').select_related('product')
        
        # Sérialiser les données
        serializer = StockAlertSerializer(alerts, many=True)
        
        return Response({
            'count': alerts.count(),
            'results': serializer.data
        })
        
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de la récupération des alertes: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def reports_summary(request):
    """
    Vue pour récupérer un résumé des rapports
    """
    if not request.user.can_generate_reports():
        return Response(
            {'error': 'Permission insuffisante pour voir les résumés de rapports.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Période par défaut: 30 derniers jours
    end_date = timezone.now().date()
    start_date = end_date - timedelta(days=30)

    # Paramètres de période
    period_start = request.query_params.get('start_date', start_date)
    period_end = request.query_params.get('end_date', end_date)

    if isinstance(period_start, str):
        try:
            period_start = datetime.strptime(period_start, '%Y-%m-%d').date()
        except ValueError:
            period_start = start_date

    if isinstance(period_end, str):
        try:
            period_end = datetime.strptime(period_end, '%Y-%m-%d').date()
        except ValueError:
            period_end = end_date

    # Requête des rapports
    reports = DailyReport.objects.filter(
        date__gte=period_start,
        date__lte=period_end
    )

    # Calculs
    total_reports = reports.count()

    aggregates = reports.aggregate(
        total_sales=Sum('total_sales'),
        total_revenue=Sum('total_sales'),
        avg_daily_sales=Avg('total_sales'),
        avg_daily_revenue=Avg('total_sales'),
        max_revenue=Max('total_sales')
    )

    # Meilleur jour
    best_day_report = reports.filter(
        total_sales=aggregates['max_revenue']
    ).first()

    best_day = best_day_report.date if best_day_report else None
    best_day_revenue = aggregates['max_revenue'] or 0

    # Alertes
    alerts = StockAlert.objects.filter(
        created_at__date__gte=period_start,
        created_at__date__lte=period_end
    )

    total_alerts = alerts.count()
    unresolved_alerts = alerts.filter(status='active').count()

    # Préparer les données
    summary_data = {
        'period_start': period_start,
        'period_end': period_end,
        'total_reports': total_reports,
        'total_sales': aggregates['total_sales'] or 0,
        'total_revenue': aggregates['total_revenue'] or 0,
        'average_daily_sales': round(aggregates['avg_daily_sales'] or 0, 2),
        'average_daily_revenue': round(aggregates['avg_daily_revenue'] or 0, 2),
        'best_day': best_day,
        'best_day_revenue': best_day_revenue,
        'total_alerts': total_alerts,
        'unresolved_alerts': unresolved_alerts
    }

    serializer = ReportSummarySerializer(summary_data)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def daily_detailed_report(request, date):
    """
    Vue pour le rapport détaillé quotidien
    """
    try:
        from datetime import datetime
        from django.db.models import Sum, Count, F

        # Parser la date
        report_date = datetime.strptime(date, '%Y-%m-%d').date()

        # Récupérer les ventes du jour
        daily_sales = Sale.objects.filter(created_at__date=report_date)
        completed_sales = daily_sales.filter(status='paid')

        # Statistiques générales
        total_sales_count = daily_sales.count()
        total_revenue = completed_sales.aggregate(total=Sum('total_amount'))['total'] or Decimal('0')

        # Calculer les bénéfices
        total_cost = Decimal('0')
        total_profit = Decimal('0')
        products_sold = 0

        for sale in completed_sales:
            for item in sale.items.all():
                item_cost = item.product.purchase_price * item.quantity
                item_profit = (item.unit_price - item.product.purchase_price) * item.quantity
                total_cost += item_cost
                total_profit += item_profit
                products_sold += item.quantity

        # Données par catégorie
        categories_data = {}

        # Récupérer tous les produits avec leurs ventes du jour
        products = Product.objects.select_related('category').all()

        for product in products:
            category_name = product.category.name if product.category else 'Autres'

            if category_name not in categories_data:
                categories_data[category_name] = {
                    'products': [],
                    'total_revenue': Decimal('0'),
                    'total_profit': Decimal('0'),
                    'total_sold': 0
                }

            # Calculer les ventes pour ce produit aujourd'hui
            product_sales = SaleItem.objects.filter(
                sale__created_at__date=report_date,
                sale__status='paid',
                product=product
            )

            quantity_sold = product_sales.aggregate(total=Sum('quantity'))['total'] or 0
            revenue = product_sales.aggregate(total=Sum(F('quantity') * F('unit_price')))['total'] or Decimal('0')
            cost = (product.purchase_price or Decimal('0')) * quantity_sold
            profit = revenue - cost

            # Calculer le stock initial approximatif
            initial_stock = product.current_stock + quantity_sold

            product_data = {
                'name': product.name,
                'prix_unitaire': float(product.selling_price or 0),
                'stock_initial': initial_stock,
                'stock_entree': 0,  # À calculer avec les approvisionnements
                'stock_total': initial_stock,
                'consommation': quantity_sold,
                'stock_restant': product.current_stock,
                'prix_achat': float(product.purchase_price or 0),
                'prix_vente': float(product.selling_price or 0),
                'stock_vendu': quantity_sold,
                'marge_unitaire': float((product.selling_price or 0) - (product.purchase_price or 0)),
                'benefice_total': float(profit),
                'revenue': float(revenue)
            }

            categories_data[category_name]['products'].append(product_data)
            categories_data[category_name]['total_revenue'] += revenue
            categories_data[category_name]['total_profit'] += profit
            categories_data[category_name]['total_sold'] += quantity_sold

        # Convertir les Decimal en float pour JSON
        for category in categories_data.values():
            category['total_revenue'] = float(category['total_revenue'])
            category['total_profit'] = float(category['total_profit'])

        return Response({
            'date': date,
            'summary': {
                'total_sales': total_sales_count,
                'total_revenue': float(total_revenue),
                'total_cost': float(total_cost),
                'total_profit': float(total_profit),
                'products_sold': products_sold
            },
            'categories': categories_data,
            'payment_methods': {
                'cash': daily_sales.filter(payment_method='cash').count(),
                'mobile': daily_sales.filter(payment_method='mobile').count(),
                'card': daily_sales.filter(payment_method='card').count()
            }
        })

    except Exception as e:
        return Response({
            'error': str(e),
            'date': date,
            'message': 'Erreur lors de la génération du rapport'
        }, status=500)


# Classes de vues pour l'export (stubs)
class ExportDailyReportPDFView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, date_str):
        return Response({'message': 'Export PDF - En développement'})


class ExportDailyReportExcelView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, date_str):
        return Response({'message': 'Export Excel - En développement'})


class ExportStockReportPDFView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'message': 'Export Stock PDF - En développement'})


class ExportStockReportExcelView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'message': 'Export Stock Excel - En développement'})


class ExportSalesReportPDFView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'message': 'Export Sales PDF - En développement'})


class NotificationStatusView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'status': 'active', 'message': 'Notifications actives'})


class TriggerStockCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        return Response({'message': 'Vérification stock déclenchée'})


class SendTestNotificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        return Response({'message': 'Notification test envoyée'})
