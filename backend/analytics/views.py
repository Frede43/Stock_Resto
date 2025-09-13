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
