"""
Vues pour le dashboard
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal

from products.models import Product
from sales.models import Sale, SaleItem
from inventory.models import StockMovement


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    """Statistiques principales du dashboard"""
    
    today = timezone.now().date()
    yesterday = today - timedelta(days=1)
    
    # Ventes du jour
    today_sales = Sale.objects.filter(
        created_at__date=today,
        status='completed'
    ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
    
    # Ventes d'hier pour comparaison
    yesterday_sales = Sale.objects.filter(
        created_at__date=yesterday,
        status='completed'
    ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
    
    # Calcul du changement
    if yesterday_sales > 0:
        sales_change = ((today_sales - yesterday_sales) / yesterday_sales * 100)
        sales_change_str = f"{sales_change:+.1f}%"
        sales_change_type = "positive" if sales_change > 0 else "negative" if sales_change < 0 else "neutral"
    else:
        sales_change_str = "+100%" if today_sales > 0 else "0%"
        sales_change_type = "positive" if today_sales > 0 else "neutral"
    
    # Commandes en cours
    pending_orders = Sale.objects.filter(status='pending').count()
    
    # Produits total
    total_products = Product.objects.filter(is_active=True).count()
    
    # Alertes stock bas
    low_stock_alerts = Product.objects.filter(
        current_stock__lte=F('minimum_stock'),
        is_active=True
    ).count()
    
    # Tables (simulation - à adapter selon votre modèle)
    total_tables = 20  # À remplacer par votre logique
    occupied_tables = Sale.objects.filter(
        status='pending',
        created_at__date=today
    ).count()
    
    occupancy_rate = f"{(occupied_tables/total_tables*100):.0f}%" if total_tables > 0 else "0%"
    
    return Response({
        'today_sales': float(today_sales),
        'sales_change': sales_change_str,
        'sales_change_type': sales_change_type,
        'pending_orders': pending_orders,
        'total_products': total_products,
        'low_stock_alerts': low_stock_alerts,
        'occupied_tables': occupied_tables,
        'total_tables': total_tables,
        'occupancy_rate': occupancy_rate,
        'quick_stats': {
            'total_products': total_products,
        },
        'alerts': {
            'low_stock': low_stock_alerts,
        }
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def sales_stats(request):
    """Statistiques de ventes détaillées"""
    
    today = timezone.now().date()
    
    # Ventes par heure aujourd'hui
    hourly_sales = []
    for hour in range(24):
        start_time = datetime.combine(today, datetime.min.time().replace(hour=hour))
        end_time = start_time + timedelta(hours=1)
        
        sales = Sale.objects.filter(
            created_at__range=[start_time, end_time],
            status='completed'
        ).aggregate(total=Sum('total_amount'))['total'] or Decimal('0')
        
        hourly_sales.append({
            'hour': hour,
            'total_amount': float(sales)
        })
    
    # Produits les plus vendus aujourd'hui
    top_products = SaleItem.objects.filter(
        sale__created_at__date=today,
        sale__status='completed'
    ).values(
        'product__name'
    ).annotate(
        quantity_sold=Sum('quantity'),
        sales=Sum('total_price')
    ).order_by('-quantity_sold')[:5]
    
    # Formater les données
    formatted_top_products = []
    for item in top_products:
        formatted_top_products.append({
            'product_name': item['product__name'],
            'quantity_sold': item['quantity_sold'],
            'sales': float(item['sales'])
        })
    
    return Response({
        'hourly_sales': hourly_sales,
        'top_products': formatted_top_products
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def low_stock_products(request):
    """Produits avec stock bas"""
    
    from django.db.models import F
    
    low_stock = Product.objects.filter(
        current_stock__lte=F('minimum_stock'),
        is_active=True
    ).values(
        'id', 'name', 'current_stock', 'minimum_stock', 'category__name'
    )
    
    return Response(list(low_stock))


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unresolved_alerts(request):
    """Alertes non résolues"""
    
    # Simulation d'alertes - à adapter selon votre modèle
    alerts = []
    
    # Alertes de stock bas
    low_stock_products = Product.objects.filter(
        current_stock__lte=F('minimum_stock'),
        is_active=True
    )
    
    for product in low_stock_products:
        alerts.append({
            'id': f"stock_{product.id}",
            'type': 'low_stock',
            'message': f"Stock bas pour {product.name}",
            'severity': 'warning',
            'created_at': timezone.now().isoformat()
        })
    
    return Response(alerts)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def alerts_count(request):
    """Nombre d'alertes actives"""
    
    from django.db.models import F
    
    low_stock_count = Product.objects.filter(
        current_stock__lte=F('minimum_stock'),
        is_active=True
    ).count()
    
    critical_count = Product.objects.filter(
        current_stock=0,
        is_active=True
    ).count()
    
    return Response({
        'total_active': low_stock_count,
        'critical_active': critical_count
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def monitoring_dashboard(request):
    """Données de monitoring système"""
    
    # Simulation de données de monitoring
    return Response({
        'api': {
            'status': 'healthy'
        },
        'server': {
            'cpu': 25  # Pourcentage d'utilisation CPU
        },
        'active_sessions': Sale.objects.filter(
            status='pending',
            created_at__date=timezone.now().date()
        ).count()
    })
