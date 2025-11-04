from celery import shared_task
from django.utils import timezone
from datetime import datetime, timedelta
from .notifications import NotificationService
from .models import DailyReport, StockAlert
from products.models import Product
from sales.models import Sale, SaleItem
from django.db.models import Sum, Count, Avg
from decimal import Decimal

@shared_task
def check_stock_levels():
    """Tâche périodique pour vérifier les niveaux de stock"""
    try:
        NotificationService.check_and_send_stock_alerts()
        NotificationService.update_dashboard_stats()
        return "Vérification des stocks effectuée avec succès"
    except Exception as e:
        return f"Erreur lors de la vérification des stocks: {str(e)}"

@shared_task
def generate_daily_report():
    """Générer automatiquement le rapport quotidien"""
    try:
        today = timezone.now().date()
        
        # Vérifier si le rapport existe déjà
        existing_report = DailyReport.objects.filter(date=today).first()
        if existing_report:
            return f"Rapport quotidien pour {today} existe déjà"
        
        # Calculer les statistiques du jour
        today_sales = Sale.objects.filter(
            created_at__date=today,
            status='completed'
        )
        
        total_sales_count = today_sales.count()
        total_sales = today_sales.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')
        
        # Calculer le bénéfice (approximatif basé sur les prix d'achat)
        total_profit = Decimal('0.00')
        for sale in today_sales:
            for item in sale.items.all():
                profit_per_item = (item.unit_price - item.product.purchase_price) * item.quantity
                total_profit += profit_per_item
        
        # Ticket moyen
        average_sale = total_sales / total_sales_count if total_sales_count > 0 else Decimal('0.00')
        
        # Dépenses du jour (approuvées uniquement)
        try:
            from expenses.models import Expense
            today_expenses = Expense.objects.filter(
                expense_date=today,
                status='approved'
            ).aggregate(
                total=Sum('amount')
            )['total'] or Decimal('0.00')
        except Exception:
            # Si le module expenses n'est pas encore migré
            today_expenses = Decimal('0.00')
        
        # Résultat net
        net_result = total_profit - today_expenses
        
        # Créer le rapport
        daily_report = DailyReport.objects.create(
            date=today,
            total_sales_count=total_sales_count,
            total_sales=total_sales,
            total_profit=total_profit,
            average_sale=average_sale,
            total_expenses=today_expenses,
            net_result=net_result
        )
        
        # Envoyer une notification aux admins et gérants
        NotificationService.send_system_notification(
            message=f"Rapport quotidien généré pour {today.strftime('%d/%m/%Y')}",
            level='info',
            target_roles=['admin', 'gerant']
        )
        
        return f"Rapport quotidien généré avec succès pour {today}"
        
    except Exception as e:
        return f"Erreur lors de la génération du rapport quotidien: {str(e)}"

@shared_task
def cleanup_old_alerts():
    """Nettoyer les anciennes alertes résolues"""
    try:
        # Supprimer les alertes résolues de plus de 30 jours
        cutoff_date = timezone.now() - timedelta(days=30)
        
        deleted_count = StockAlert.objects.filter(
            status='resolved',
            created_at__lt=cutoff_date
        ).delete()[0]
        
        return f"Nettoyage effectué: {deleted_count} alertes supprimées"
        
    except Exception as e:
        return f"Erreur lors du nettoyage: {str(e)}"

@shared_task
def send_daily_summary():
    """Envoyer un résumé quotidien aux gestionnaires"""
    try:
        today = timezone.now().date()
        yesterday = today - timedelta(days=1)
        
        # Statistiques d'hier
        yesterday_sales = Sale.objects.filter(
            created_at__date=yesterday,
            status='completed'
        )
        
        sales_count = yesterday_sales.count()
        total_revenue = yesterday_sales.aggregate(
            total=Sum('total_amount')
        )['total'] or Decimal('0.00')
        
        # Produits les plus vendus
        top_products = SaleItem.objects.filter(
            sale__created_at__date=yesterday
        ).values(
            'product__name'
        ).annotate(
            total_quantity=Sum('quantity'),
            total_revenue=Sum('total_price')
        ).order_by('-total_quantity')[:5]
        
        # Alertes actives
        active_alerts = StockAlert.objects.filter(status='active').count()
        
        # Composer le message
        message = f"""
        Résumé quotidien - {yesterday.strftime('%d/%m/%Y')}:
        • {sales_count} ventes réalisées
        • {total_revenue:,.0f} BIF de chiffre d'affaires
        • {active_alerts} alertes actives
        """
        
        if top_products:
            message += "\nProduits les plus vendus:"
            for product in top_products:
                message += f"\n• {product['product__name']}: {product['total_quantity']} unités"
        
        # Envoyer aux admins et gérants
        NotificationService.send_system_notification(
            message=message,
            level='info',
            target_roles=['admin', 'gerant']
        )
        
        return f"Résumé quotidien envoyé pour {yesterday}"
        
    except Exception as e:
        return f"Erreur lors de l'envoi du résumé: {str(e)}"

@shared_task
def update_dashboard_stats_periodic():
    """Mettre à jour périodiquement les statistiques du tableau de bord"""
    try:
        NotificationService.update_dashboard_stats()
        return "Statistiques du tableau de bord mises à jour"
    except Exception as e:
        return f"Erreur lors de la mise à jour des statistiques: {str(e)}"
