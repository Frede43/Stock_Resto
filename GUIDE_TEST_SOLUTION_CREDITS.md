# 🧪 GUIDE DE TEST - SOLUTION SYNCHRONISATION CRÉDITS

**Date** : 06 novembre 2025, 13:05  
**Objectif** : Tester la synchronisation automatique entre ventes et comptes crédit

---

## ✅ MODIFICATIONS APPORTÉES

### **Fichier modifié** : `backend/credits/views.py`

**Méthode** : `add_payment()` (lignes 54-173)

**Changements** :
1. ✅ Ajout d'une transaction atomique (`db_transaction.atomic()`)
2. ✅ Récupération des ventes non payées du compte
3. ✅ Marquage automatique des ventes comme `'paid'`
4. ✅ Gestion intelligente des paiements partiels
5. ✅ Réponse détaillée avec les ventes mises à jour

---

## 🔧 PRÉPARATION

### **1. Redémarrer le serveur backend**

```bash
cd backend
python manage.py runserver
```

### **2. Vérifier que le frontend est lancé**

```bash
npm run dev
```

---

## 🧪 SCÉNARIO DE TEST 1 : Paiement Complet

### **Étape 1 : Créer une vente à crédit**

1. Aller sur http://localhost:5173/pos (Point de Vente)
2. Ajouter des articles (ex: Primus x2 = 4000 FBu)
3. Sélectionner **Mode de paiement : Crédit**
4. Sélectionner un **Compte crédit** (ex: David Niyonkuru)
5. Cliquer **"Valider la vente"**

**Résultat attendu** :
```
✅ Vente créée : SALE-2025-XXX
   - status = 'completed'
   - payment_method = 'credit'
   - total_amount = 4000 FBu
   
✅ Compte David : -4000 FBu (dette augmentée)
```

---

### **Étape 2 : Vérifier sur /daily-report (Admin)**

1. Aller sur http://localhost:5173/daily-report
2. Cliquer sur l'onglet **"Ventes à Crédit"**
3. Vérifier que la vente apparaît avec :
   - ❌ Status : **"Non payée"** (badge rouge)
   - Client : David Niyonkuru
   - Montant : 4 000 FBu

**Résultat attendu** :
```
✅ La vente apparaît dans l'onglet "Ventes à Crédit"
✅ Status = "Non payée"
```

---

### **Étape 3 : Enregistrer le paiement depuis /credits (Caissier)**

1. Aller sur http://localhost:5173/credits
2. Chercher **David Niyonkuru**
3. Cliquer sur **"Paiement"**
4. Entrer :
   - Montant : **4000 FBu**
   - Mode : **Espèces**
   - Notes : "Paiement complet test"
5. Cliquer **"Enregistrer le paiement"**

**Résultat attendu** :
```json
{
  "success": true,
  "message": "Paiement enregistré avec succès",
  "transaction": {
    "id": 15,
    "amount": 4000.0,
    "payment_method": "cash"
  },
  "account": {
    "new_balance": 0.0,
    "available_credit": 50000.0
  },
  "sales_updated": {
    "marked_paid": [
      {
        "id": 42,
        "reference": "SALE-2025-XXX",
        "amount": 4000.0,
        "customer": "David Niyonkuru"
      }
    ],
    "partially_paid": [],
    "total_marked_paid": 1
  }
}
```

**Toast affiché** :
```
✅ Paiement enregistré avec succès
```

---

### **Étape 4 : Vérifier la synchronisation sur /daily-report**

1. Retourner sur http://localhost:5173/daily-report
2. Onglet **"Ventes à Crédit"**
3. Vérifier que la vente de David :
   - ✅ Status : **"Payée"** (badge vert)
   - ✅ Le bouton "Enregistrer paiement" a disparu

**Résultat attendu** :
```
✅ La vente est maintenant marquée "Payée"
✅ Cohérence totale entre /credits et /daily-report
```

---

## 🧪 SCÉNARIO DE TEST 2 : Paiement Partiel

### **Étape 1 : Créer 2 ventes à crédit**

1. Vente 1 : 9000 FBu (ex: Mutzig x3 + Brochettes x2)
2. Vente 2 : 6000 FBu (ex: Primus x3)
3. Les deux pour le même client (ex: Marie Uwase)

**Résultat attendu** :
```
✅ Vente 1 : 9000 FBu, status='completed'
✅ Vente 2 : 6000 FBu, status='completed'
✅ Compte Marie : -15000 FBu
```

---

### **Étape 2 : Paiement partiel de 10000 FBu**

1. Aller sur /credits
2. Chercher Marie Uwase
3. Enregistrer un paiement de **10000 FBu**

**Résultat attendu** :
```json
{
  "success": true,
  "message": "Paiement enregistré avec succès",
  "account": {
    "new_balance": -5000.0
  },
  "sales_updated": {
    "marked_paid": [
      {
        "id": 43,
        "reference": "SALE-2025-001",
        "amount": 9000.0,
        "customer": "Marie Uwase"
      }
    ],
    "partially_paid": [
      {
        "id": 44,
        "reference": "SALE-2025-002",
        "amount_paid": 1000.0,
        "amount_remaining": 5000.0,
        "customer": "Marie Uwase"
      }
    ],
    "total_marked_paid": 1
  }
}
```

**Logique** :
```
Paiement : 10000 FBu

1. Vente 1 (9000 FBu) → Payée complètement ✅
   Reste : 10000 - 9000 = 1000 FBu

2. Vente 2 (6000 FBu) → Paiement partiel (1000/6000)
   Reste : 1000 - 1000 = 0 FBu
   Status : 'completed' (pas encore 'paid')

Compte : -15000 + 10000 = -5000 FBu
```

---

### **Étape 3 : Vérifier sur /daily-report**

1. Onglet "Ventes à Crédit"
2. Vérifier :
   - ✅ Vente 1 : **"Payée"** (badge vert)
   - ⏳ Vente 2 : **"Non payée"** (badge rouge)

**Résultat attendu** :
```
✅ Vente 1 marquée comme payée
⏳ Vente 2 reste non payée (paiement partiel)
✅ Logique intelligente respectée !
```

---

## 🧪 SCÉNARIO DE TEST 3 : Paiement Multiple

### **Étape 1 : Créer 3 ventes à crédit**

1. Vente 1 : 10000 FBu
2. Vente 2 : 8000 FBu
3. Vente 3 : 7000 FBu
4. Toutes pour Jean Habimana

**Résultat attendu** :
```
✅ Compte Jean : -25000 FBu
```

---

### **Étape 2 : Paiement total de 25000 FBu**

1. Aller sur /credits
2. Chercher Jean Habimana
3. Enregistrer un paiement de **25000 FBu**

**Résultat attendu** :
```json
{
  "success": true,
  "message": "Paiement enregistré avec succès",
  "account": {
    "new_balance": 0.0
  },
  "sales_updated": {
    "marked_paid": [
      {
        "id": 45,
        "reference": "SALE-2025-004",
        "amount": 10000.0
      },
      {
        "id": 46,
        "reference": "SALE-2025-005",
        "amount": 8000.0
      },
      {
        "id": 47,
        "reference": "SALE-2025-006",
        "amount": 7000.0
      }
    ],
    "partially_paid": [],
    "total_marked_paid": 3
  }
}
```

---

### **Étape 3 : Vérifier sur /daily-report**

1. Onglet "Ventes à Crédit"
2. Vérifier que **TOUTES** les 3 ventes de Jean sont :
   - ✅ Status : **"Payée"** (badge vert)

**Résultat attendu** :
```
✅ Les 3 ventes sont marquées comme payées
✅ Compte Jean : 0 FBu
✅ Synchronisation parfaite !
```

---

## 🔍 VÉRIFICATION BACKEND (Console)

### **Ouvrir la console Django**

```bash
cd backend
python manage.py shell
```

### **Vérifier une vente**

```python
from sales.models import Sale

# Récupérer la vente
sale = Sale.objects.get(id=42)

print(f"Référence: {sale.reference}")
print(f"Status: {sale.status}")  # Devrait être 'paid'
print(f"Montant: {sale.total_amount}")
print(f"Mode paiement: {sale.payment_method}")  # Devrait être 'credit'
print(f"Compte crédit: {sale.credit_account}")
```

### **Vérifier un compte crédit**

```python
from credits.models import CreditAccount, CreditTransaction

# Récupérer le compte
account = CreditAccount.objects.get(customer_name="David Niyonkuru")

print(f"Solde: {account.current_balance}")  # Devrait être 0
print(f"Crédit disponible: {account.available_credit}")

# Voir les transactions
transactions = CreditTransaction.objects.filter(credit_account=account).order_by('-transaction_date')
for t in transactions:
    print(f"{t.transaction_date} | {t.transaction_type} | {t.amount} FBu")
```

---

## 📊 CHECKLIST DE VALIDATION

### **✅ Problème 1 : Filtre payment_method**

- [ ] Aller sur /daily-report → Onglet "Ventes à Crédit"
- [ ] Vérifier que SEULES les ventes avec `payment_method='credit'` apparaissent
- [ ] Les ventes en espèces/carte ne doivent PAS apparaître

### **✅ Problème 2 : Synchronisation /credits ↔️ /daily-report**

- [ ] Créer une vente à crédit
- [ ] Vérifier qu'elle apparaît "Non payée" sur /daily-report
- [ ] Enregistrer le paiement sur /credits
- [ ] Vérifier qu'elle devient "Payée" sur /daily-report
- [ ] Vérifier que le compte crédit est à jour

### **✅ Paiements partiels**

- [ ] Créer 2 ventes pour un même client
- [ ] Payer partiellement
- [ ] Vérifier que seule la première vente est marquée "Payée"
- [ ] La deuxième reste "Non payée"

### **✅ Paiements multiples**

- [ ] Créer 3 ventes pour un même client
- [ ] Payer le montant total
- [ ] Vérifier que les 3 ventes sont marquées "Payées"

---

## 🐛 DÉBOGAGE

### **Si la vente n'est pas marquée comme payée**

1. Ouvrir la console backend
2. Vérifier les logs :
```bash
# Devrait afficher :
✅ NOUVEAU : Marquer les ventes associées comme payées
Ventes non payées trouvées : 1
Vente SALE-2025-XXX marquée comme payée
```

3. Vérifier dans la base de données :
```python
from sales.models import Sale
sale = Sale.objects.get(id=42)
print(sale.status)  # Devrait être 'paid'
```

### **Si le filtre payment_method ne fonctionne pas**

1. Tester l'API directement :
```bash
curl "http://localhost:8000/api/sales/?payment_method=credit&date_from=2025-11-06&date_to=2025-11-06"
```

2. Vérifier que seules les ventes à crédit sont retournées

---

## 🎉 RÉSULTAT ATTENDU FINAL

### **Avant la solution**
```
❌ Caissier enregistre paiement sur /credits
❌ Vente reste "Non payée" sur /daily-report
❌ Incohérence des données
```

### **Après la solution**
```
✅ Caissier enregistre paiement sur /credits
✅ Vente devient "Payée" automatiquement
✅ Admin voit le changement sur /daily-report
✅ Cohérence totale garantie !
```

---

## 📝 NOTES IMPORTANTES

1. **Transaction atomique** : Si une erreur survient, RIEN n'est enregistré (ni paiement, ni marquage de vente)
2. **Ordre chronologique** : Les ventes sont payées dans l'ordre de création (FIFO)
3. **Paiements partiels** : Seules les ventes complètement payées sont marquées `'paid'`
4. **Réponse détaillée** : L'API retourne la liste des ventes mises à jour

---

**Date de création** : 06 novembre 2025, 13:10  
**Statut** : ✅ **SOLUTION IMPLÉMENTÉE - PRÊTE POUR TEST**  
**Priorité** : 🔥 **HAUTE**
