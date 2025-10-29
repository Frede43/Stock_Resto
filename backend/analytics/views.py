from django.shortcuts import render
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta

@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Temporairement public pour tests
def sales_chart(request):
    """
    Vue pour les données de graphique des ventes
    """
    try:
        # Import conditionnel pour éviter les erreurs si le module sales n'existe pas
        from sales.models import Sale
        
        # Données des 7 derniers jours
        today = timezone.now().date()
        sales_data = []
        
        for i in range(7):
            date = today - timedelta(days=i)
            daily_sales = Sale.objects.filter(
                created_at__date=date,
                status='paid'
            ).aggregate(
                total_sales=Count('id'),
                total_revenue=Sum('total_amount')
            )
            
            sales_data.append({
                'date': date.strftime('%Y-%m-%d'),
                'sales': daily_sales['total_sales'] or 0,
                'revenue': float(daily_sales['total_revenue'] or 0)
            })
        
        return Response({
            'sales_data': sales_data,
            'message': 'Données de ventes récupérées avec succès'
        })
        
    except ImportError:
        # Si le module sales n'existe pas, retourner des données vides
        return Response({
            'sales_data': [],
            'message': 'Module sales non disponible'
        })
    except Exception as e:
        return Response({
            'error': str(e),
            'sales_data': []
        }, status=500)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Temporairement public pour tests
def analytics_data(request):
    """
    Vue pour les données d'analytics complètes
    """
    try:
        from sales.models import Sale, SaleItem
        from products.models import Product
        from django.db.models import F, Q
        
        # Récupérer la période depuis les paramètres
        period = request.GET.get('period', 'month')
        
        # Calculer la date de début selon la période
        today = timezone.now().date()
        if period == 'today':
            start_date = today
        elif period == 'week':
            start_date = today - timedelta(days=7)
        elif period == 'month':
            start_date = today - timedelta(days=30)
        else:
            start_date = today - timedelta(days=30)
        
        print(f"📊 ANALYTICS DEBUG - Période: {period}, Date début: {start_date}")
        
        # Statistiques générales
        total_sales = Sale.objects.filter(
            created_at__date__gte=start_date,
            status='paid'
        ).count()
        
        total_revenue = Sale.objects.filter(
            created_at__date__gte=start_date,
            status='paid'
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Produits les plus vendus
        top_products = SaleItem.objects.filter(
            sale__created_at__date__gte=start_date,
            sale__status='paid'
        ).values(
            'product__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum(F('quantity') * F('unit_price'))
        ).order_by('-total_quantity')[:5]
        
        # Ventes par jour
        daily_sales = []
        for i in range(7):
            date = today - timedelta(days=i)
            daily_data = Sale.objects.filter(
                created_at__date=date,
                status='paid'
            ).aggregate(
                sales_count=Count('id'),
                revenue=Sum('total_amount')
            )
            
            daily_sales.append({
                'date': date.strftime('%Y-%m-%d'),
                'sales': daily_data['sales_count'] or 0,
                'revenue': float(daily_data['revenue'] or 0)
            })
        
        # Inverser pour avoir l'ordre chronologique
        daily_sales.reverse()
        
        print(f"📊 Statistiques calculées:")
        print(f"  - Total ventes: {total_sales}")
        print(f"  - Revenus totaux: {total_revenue}")
        print(f"  - Top produits: {len(top_products)}")
        print(f"  - Données quotidiennes: {len(daily_sales)}")
        
        return Response({
            'period': period,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'summary': {
                'total_sales': total_sales,
                'total_revenue': float(total_revenue),
                'average_sale': float(total_revenue / total_sales) if total_sales > 0 else 0
            },
            'top_products': list(top_products),
            'daily_sales': daily_sales,
            'message': 'Données analytics récupérées avec succès'
        })
        
    except Exception as e:
        print(f"❌ Erreur analytics: {e}")
        return Response({
            'error': str(e),
            'message': 'Erreur lors de la récupération des données analytics'
        }, status=500)
