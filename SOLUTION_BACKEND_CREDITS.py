# backend/credits/views.py
# 🔧 SOLUTION PROFESSIONNELLE : Synchronisation automatique ventes/crédits

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from decimal import Decimal
from django.db import transaction
from .models import CreditAccount, CreditTransaction
from sales.models import Sale


class CreditAccountViewSet(viewsets.ModelViewSet):
    # ... autres méthodes ...
    
    @action(detail=True, methods=['post'])
    @transaction.atomic  # ✅ Transaction atomique pour garantir la cohérence
    def add_payment(self, request, pk=None):
        """
        Enregistrer un paiement sur un compte crédit.
        
        Cette méthode :
        1. Crée une transaction de paiement
        2. Met à jour le solde du compte
        3. ✅ NOUVEAU : Marque automatiquement les ventes associées comme payées
        
        Gère les paiements partiels intelligemment.
        """
        account = self.get_object()
        
        # Validation des données
        amount = request.data.get('amount')
        if not amount:
            return Response(
                {'error': 'Le montant est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            amount = Decimal(str(amount))
        except (ValueError, TypeError):
            return Response(
                {'error': 'Montant invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if amount <= 0:
            return Response(
                {'error': 'Le montant doit être positif'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if amount > abs(account.current_balance):
            return Response(
                {'error': f'Le paiement ne peut pas dépasser la dette ({abs(account.current_balance)} FBu)'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        payment_method = request.data.get('payment_method', 'cash')
        notes = request.data.get('notes', '')
        
        # 1. Créer la transaction de paiement
        payment_transaction = CreditTransaction.objects.create(
            account=account,
            transaction_type='payment',
            amount=amount,
            payment_method=payment_method,
            notes=notes
        )
        
        # 2. Mettre à jour le solde du compte
        old_balance = account.current_balance
        account.current_balance += amount  # Le paiement réduit la dette (balance négative)
        account.save()
        
        # 3. ✅ NOUVEAU : Marquer les ventes associées comme payées
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
        
        # Préparer la réponse détaillée
        response_data = {
            'success': True,
            'message': 'Paiement enregistré avec succès',
            'transaction': {
                'id': payment_transaction.id,
                'amount': float(amount),
                'payment_method': payment_method,
                'notes': notes,
                'created_at': payment_transaction.created_at.isoformat()
            },
            'account': {
                'id': account.id,
                'customer': account.customer_name,
                'old_balance': float(old_balance),
                'new_balance': float(account.current_balance),
                'balance_change': float(amount)
            },
            'sales_updated': {
                'marked_paid': sales_marked_paid,
                'partially_paid': sales_partially_paid,
                'total_marked_paid': len(sales_marked_paid)
            }
        }
        
        return Response(response_data, status=status.HTTP_200_OK)


# ============================================================================
# EXEMPLE D'UTILISATION
# ============================================================================

"""
SCÉNARIO 1 : Paiement complet d'une seule vente
-----------------------------------------------
Compte David : -9000 FBu (1 vente de 9000 FBu)

POST /api/credits/accounts/1/add-payment/
{
  "amount": 9000,
  "payment_method": "cash",
  "notes": "Paiement complet"
}

RÉSULTAT :
{
  "success": true,
  "message": "Paiement enregistré avec succès",
  "transaction": {
    "id": 15,
    "amount": 9000.0,
    "payment_method": "cash",
    "notes": "Paiement complet",
    "created_at": "2025-11-06T13:00:00Z"
  },
  "account": {
    "id": 1,
    "customer": "David Niyonkuru",
    "old_balance": -9000.0,
    "new_balance": 0.0,
    "balance_change": 9000.0
  },
  "sales_updated": {
    "marked_paid": [
      {
        "id": 42,
        "reference": "SALE-2025-001",
        "amount": 9000.0,
        "customer": "David Niyonkuru"
      }
    ],
    "partially_paid": [],
    "total_marked_paid": 1
  }
}

✅ Vente SALE-2025-001 : status = 'paid'
✅ Compte David : 0 FBu
✅ Transaction créée
✅ COHÉRENCE TOTALE !


SCÉNARIO 2 : Paiement partiel
------------------------------
Compte Marie : -15000 FBu (2 ventes : 9000 + 6000 FBu)

POST /api/credits/accounts/2/add-payment/
{
  "amount": 10000,
  "payment_method": "mobile",
  "notes": "Paiement partiel"
}

RÉSULTAT :
{
  "success": true,
  "message": "Paiement enregistré avec succès",
  "transaction": {
    "id": 16,
    "amount": 10000.0,
    "payment_method": "mobile",
    "notes": "Paiement partiel",
    "created_at": "2025-11-06T13:05:00Z"
  },
  "account": {
    "id": 2,
    "customer": "Marie Uwase",
    "old_balance": -15000.0,
    "new_balance": -5000.0,
    "balance_change": 10000.0
  },
  "sales_updated": {
    "marked_paid": [
      {
        "id": 43,
        "reference": "SALE-2025-002",
        "amount": 9000.0,
        "customer": "Marie Uwase"
      }
    ],
    "partially_paid": [
      {
        "id": 44,
        "reference": "SALE-2025-003",
        "amount_paid": 1000.0,
        "amount_remaining": 5000.0,
        "customer": "Marie Uwase"
      }
    ],
    "total_marked_paid": 1
  }
}

✅ Vente SALE-2025-002 : status = 'paid' (9000 FBu payés)
⏳ Vente SALE-2025-003 : status = 'completed' (1000/6000 FBu payés)
✅ Compte Marie : -5000 FBu (reste à payer)
✅ Transaction créée
✅ LOGIQUE INTELLIGENTE !


SCÉNARIO 3 : Paiement multiple
-------------------------------
Compte Jean : -25000 FBu (3 ventes : 10000 + 8000 + 7000 FBu)

POST /api/credits/accounts/3/add-payment/
{
  "amount": 25000,
  "payment_method": "card",
  "notes": "Paiement total"
}

RÉSULTAT :
{
  "success": true,
  "message": "Paiement enregistré avec succès",
  "transaction": {
    "id": 17,
    "amount": 25000.0,
    "payment_method": "card",
    "notes": "Paiement total",
    "created_at": "2025-11-06T13:10:00Z"
  },
  "account": {
    "id": 3,
    "customer": "Jean Habimana",
    "old_balance": -25000.0,
    "new_balance": 0.0,
    "balance_change": 25000.0
  },
  "sales_updated": {
    "marked_paid": [
      {
        "id": 45,
        "reference": "SALE-2025-004",
        "amount": 10000.0,
        "customer": "Jean Habimana"
      },
      {
        "id": 46,
        "reference": "SALE-2025-005",
        "amount": 8000.0,
        "customer": "Jean Habimana"
      },
      {
        "id": 47,
        "reference": "SALE-2025-006",
        "amount": 7000.0,
        "customer": "Jean Habimana"
      }
    ],
    "partially_paid": [],
    "total_marked_paid": 3
  }
}

✅ Vente SALE-2025-004 : status = 'paid'
✅ Vente SALE-2025-005 : status = 'paid'
✅ Vente SALE-2025-006 : status = 'paid'
✅ Compte Jean : 0 FBu
✅ Transaction créée
✅ TOUTES LES VENTES MARQUÉES !
"""


# ============================================================================
# TESTS UNITAIRES
# ============================================================================

"""
# backend/credits/tests.py

from django.test import TestCase
from decimal import Decimal
from .models import CreditAccount, CreditTransaction
from sales.models import Sale


class CreditPaymentTestCase(TestCase):
    def setUp(self):
        # Créer un compte crédit
        self.account = CreditAccount.objects.create(
            customer_name="David Test",
            credit_limit=50000,
            current_balance=-9000
        )
        
        # Créer une vente à crédit
        self.sale = Sale.objects.create(
            customer_name="David Test",
            credit_account=self.account,
            payment_method='credit',
            total_amount=9000,
            status='completed'
        )
    
    def test_full_payment_marks_sale_paid(self):
        # Enregistrer un paiement complet
        response = self.client.post(
            f'/api/credits/accounts/{self.account.id}/add-payment/',
            {
                'amount': 9000,
                'payment_method': 'cash',
                'notes': 'Test paiement complet'
            },
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Vérifier que la vente est marquée comme payée
        self.sale.refresh_from_db()
        self.assertEqual(self.sale.status, 'paid')
        
        # Vérifier que le compte est à 0
        self.account.refresh_from_db()
        self.assertEqual(self.account.current_balance, 0)
        
        # Vérifier qu'une transaction a été créée
        self.assertEqual(CreditTransaction.objects.count(), 1)
    
    def test_partial_payment_does_not_mark_sale_paid(self):
        # Enregistrer un paiement partiel
        response = self.client.post(
            f'/api/credits/accounts/{self.account.id}/add-payment/',
            {
                'amount': 5000,
                'payment_method': 'cash',
                'notes': 'Test paiement partiel'
            },
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        
        # Vérifier que la vente n'est PAS marquée comme payée
        self.sale.refresh_from_db()
        self.assertEqual(self.sale.status, 'completed')
        
        # Vérifier que le compte a été mis à jour
        self.account.refresh_from_db()
        self.assertEqual(self.account.current_balance, -4000)
"""
