from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Q, Count
from django.utils import timezone
from datetime import timedelta
from .models import CreditAccount, CreditTransaction, CreditReminder
from .serializers import (
    CreditAccountSerializer,
    CreditAccountDetailSerializer,
    CreditTransactionSerializer,
    CreditReminderSerializer
)


class CreditAccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les comptes crédit
    """
    queryset = CreditAccount.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CreditAccountDetailSerializer
        return CreditAccountSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtres
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(customer_name__icontains=search) |
                Q(phone__icontains=search) |
                Q(email__icontains=search)
            )
        
        # Filtrer par solde > 0
        has_debt = self.request.query_params.get('has_debt')
        if has_debt == 'true':
            queryset = queryset.filter(current_balance__gt=0)
        
        return queryset.select_related('created_by').prefetch_related('transactions')
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """
        Ajouter un paiement à un compte crédit
        
        Cette méthode :
        1. Crée une transaction de paiement
        2. Met à jour le solde du compte
        3. ✅ NOUVEAU : Marque automatiquement les ventes associées comme payées
        
        Gère intelligemment les paiements partiels.
        """
        from decimal import Decimal
        from django.db import transaction as db_transaction
        
        account = self.get_object()
        amount = request.data.get('amount')
        payment_method = request.data.get('payment_method', 'cash')
        notes = request.data.get('notes', '')
        
        # Validation
        if not amount:
            return Response(
                {'error': 'Le montant est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = Decimal(str(amount))
            if amount <= 0:
                return Response(
                    {'error': 'Le montant doit être positif'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError, Exception):
            return Response(
                {'error': 'Montant invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que le paiement ne dépasse pas la dette
        if amount > account.current_balance:
            return Response(
                {'error': f'Le paiement ne peut pas dépasser la dette actuelle ({account.current_balance} FBu)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Utiliser une transaction atomique pour garantir la cohérence
        with db_transaction.atomic():
            # 1. Créer la transaction de paiement
            payment_transaction = CreditTransaction.objects.create(
                credit_account=account,
                transaction_type='payment',
                amount=amount,
                payment_method=payment_method,
                notes=notes,
                created_by=request.user
            )
            
            # 2. ✅ NOUVEAU : Marquer les ventes associées comme payées
            # Importer le modèle Sale
            from sales.models import Sale
            
            # Récupérer toutes les ventes non payées de ce compte, par ordre chronologique
            unpaid_sales = Sale.objects.filter(
                credit_account=account,
                status='completed',  # Ventes non encore marquées comme payées
                payment_method='credit'
            ).order_by('created_at')
            
            remaining_amount = amount
            sales_marked_paid = []
            sales_partially_paid = []
            
            for sale in unpaid_sales:
                if remaining_amount <= 0:
                    break
                
                sale_amount = Decimal(str(sale.total_amount))
                
                if remaining_amount >= sale_amount:
                    # Paiement complet de cette vente
                    sale.status = 'paid'
                    sale.save()
                    sales_marked_paid.append({
                        'id': sale.id,
                        'reference': sale.reference or f'SALE-{sale.id}',
                        'amount': float(sale_amount),
                        'customer': sale.customer_name
                    })
                    remaining_amount -= sale_amount
                else:
                    # Paiement partiel (on ne marque pas comme payée)
                    sales_partially_paid.append({
                        'id': sale.id,
                        'reference': sale.reference or f'SALE-{sale.id}',
                        'amount_paid': float(remaining_amount),
                        'amount_remaining': float(sale_amount - remaining_amount),
                        'customer': sale.customer_name
                    })
                    remaining_amount = Decimal('0')
            
            # 3. Recharger le compte pour avoir le nouveau solde
            account.refresh_from_db()
        
        # Préparer la réponse détaillée
        return Response({
            'success': True,
            'message': 'Paiement enregistré avec succès',
            'transaction': CreditTransactionSerializer(payment_transaction).data,
            'account': {
                'new_balance': float(account.current_balance),
                'available_credit': float(account.available_credit)
            },
            'sales_updated': {
                'marked_paid': sales_marked_paid,
                'partially_paid': sales_partially_paid,
                'total_marked_paid': len(sales_marked_paid)
            }
        })
    
    @action(detail=True, methods=['post'])
    def add_adjustment(self, request, pk=None):
        """
        Ajouter un ajustement au compte
        """
        account = self.get_object()
        amount = request.data.get('amount')
        notes = request.data.get('notes', '')
        
        if not amount:
            return Response(
                {'error': 'Le montant est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from decimal import Decimal
            amount = Decimal(str(amount))
        except (ValueError, TypeError, Exception):
            return Response(
                {'error': 'Montant invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer l'ajustement
        transaction = CreditTransaction.objects.create(
            credit_account=account,
            transaction_type='adjustment',
            amount=amount,
            notes=notes,
            created_by=request.user
        )
        
        account.refresh_from_db()
        
        return Response({
            'message': 'Ajustement enregistré avec succès',
            'transaction': CreditTransactionSerializer(transaction).data,
            'new_balance': float(account.current_balance)
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Statistiques globales des crédits
        """
        total_accounts = CreditAccount.objects.count()
        active_accounts = CreditAccount.objects.filter(status='active').count()
        
        total_debt = CreditAccount.objects.aggregate(
            total=Sum('current_balance')
        )['total'] or 0
        
        accounts_with_debt = CreditAccount.objects.filter(
            status='active',
            current_balance__gt=0
        ).count()
        
        # Paiements ce mois
        first_day_of_month = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        payments_this_month = CreditTransaction.objects.filter(
            transaction_type='payment',
            transaction_date__gte=first_day_of_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        # Top 5 clients avec dette
        top_debtors = CreditAccount.objects.filter(
            current_balance__gt=0
        ).order_by('-current_balance')[:5].values(
            'id', 'customer_name', 'current_balance', 'phone'
        )
        
        return Response({
            'total_accounts': total_accounts,
            'active_accounts': active_accounts,
            'total_debt': float(total_debt),
            'accounts_with_debt': accounts_with_debt,
            'payments_this_month': float(payments_this_month),
            'top_debtors': list(top_debtors)
        })


class CreditTransactionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet pour les transactions (lecture seule)
    """
    queryset = CreditTransaction.objects.all()
    serializer_class = CreditTransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrer par compte
        account_id = self.request.query_params.get('account')
        if account_id:
            queryset = queryset.filter(credit_account_id=account_id)
        
        # Filtrer par type
        transaction_type = self.request.query_params.get('type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        return queryset.select_related('credit_account', 'created_by', 'sale')


class CreditReminderViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour les relances
    """
    queryset = CreditReminder.objects.all()
    serializer_class = CreditReminderSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtrer par statut
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filtrer par compte
        account_id = self.request.query_params.get('account')
        if account_id:
            queryset = queryset.filter(credit_account_id=account_id)
        
        return queryset.select_related('credit_account', 'sent_by')
    
    @action(detail=True, methods=['post'])
    def mark_as_sent(self, request, pk=None):
        """
        Marquer une relance comme envoyée
        """
        reminder = self.get_object()
        reminder.status = 'sent'
        reminder.sent_at = timezone.now()
        reminder.sent_by = request.user
        reminder.save()
        
        return Response({
            'message': 'Relance marquée comme envoyée',
            'reminder': CreditReminderSerializer(reminder).data
        })
