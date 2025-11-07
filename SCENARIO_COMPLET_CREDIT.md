# 📋 SCÉNARIO COMPLET : Vente à Crédit et Paiement Ultérieur

## 🎯 Objectif
Documenter le workflow complet d'une vente à crédit, de la création à la clôture, et son impact sur le système.

---

## 🎬 SCÉNARIO : Restaurant "Harry's Grill Bar-Resto"

### 👥 Personnages
- **David** : Client régulier avec compte crédit
- **Marie** : Caissière
- **Jean** : Gérant

### 📅 Timeline
- **Jour 1 (Lundi 04/11/2025)** : Vente à crédit
- **Jour 3 (Mercredi 06/11/2025)** : Paiement du crédit

---

## 📖 PARTIE 1 : VENTE À CRÉDIT (Lundi 04/11/2025)

### 🕐 Étape 1 : Client arrive et commande (11h30)

**Action** : David arrive au restaurant et s'installe à la Table 5.

**Dans le système** :
```
Page: /tables
État: Table 5 = "available" (disponible)
```

---

### 🕐 Étape 2 : Prise de commande (11h35)

**Action** : Marie (caissière) prend la commande de David.

**Page** : `/sales` (Point de Vente)

**Marie saisit** :
1. Sélectionne **Table 5**
2. Entre le nom : **"David"**
3. Sélectionne serveur : **"Marie"**
4. Ajoute les articles :
   - 2x Coca-Cola (1000 FBu chacun)
   - 1x Burger (5000 FBu)
   - 1x Frites (2000 FBu)

**Total** : 9 000 FBu

**Dans le système** :
```sql
-- Rien n'est encore enregistré
-- C'est juste dans le panier (cart) en mémoire
```

---

### 🕐 Étape 3 : Création de la vente à crédit (11h40)

**Action** : Marie clique sur **"Créer la vente"** et sélectionne :
- Mode de paiement : **"Crédit"**
- Compte crédit : **"David - ACC-001"**

**Backend** : `POST /api/sales/`

**Données envoyées** :
```json
{
  "table": 5,
  "customer_name": "David",
  "server": 2,
  "payment_method": "credit",
  "credit_account": 1,
  "items": [
    { "product": 10, "quantity": 2, "unit_price": 1000 },
    { "product": 25, "quantity": 1, "unit_price": 5000 },
    { "product": 30, "quantity": 1, "unit_price": 2000 }
  ],
  "total_amount": 9000
}
```

**Backend traite** (`backend/sales/models.py`) :

1. **Création de la vente** :
```python
sale = Sale.objects.create(
    reference="SALE-2025-001",
    table=table_5,
    customer_name="David",
    server=marie,
    payment_method="credit",
    credit_account=david_account,
    total_amount=9000,
    status="pending"  # ⚠️ En attente
)
```

2. **⚠️ Stock NON déduit** (sera déduit lors de l'approbation) :
```python
# ❌ ANCIEN COMPORTEMENT (INCORRECT) :
# for item in items:
#     product.current_stock -= item.quantity  # NE SE FAIT PAS ICI

# ✅ NOUVEAU COMPORTEMENT (CORRECT) :
# Le stock reste inchangé pour l'instant
# Il sera déduit quand le caissier clique "Approuver (sans paiement)"

# Coca-Cola : 50 unités (inchangé)
# Burger : 30 unités (inchangé)
# Frites : 40 unités (inchangé)
```

3. **Création de la dette** :
```python
CreditTransaction.objects.create(
    credit_account=david_account,
    transaction_type="debt",  # Dette
    amount=9000,
    reference="SALE-2025-001",
    description="Vente à crédit - Table 5"
)

# Solde de David : 0 → -9000 FBu (dette)
```

4. **Signal post_save** (`backend/sales/signals.py`) :
```python
# Occupation automatique de la table
table_5.status = "occupied"
table_5.occupied_since = now()
table_5.customer = "David"
table_5.server = "Marie"
table_5.current_sale = sale
table_5.save()
```

**Résultat** :
```
✅ Vente créée : SALE-2025-001
⏳ Stock NON déduit (sera déduit à l'approbation)
✅ Dette enregistrée : -9000 FBu
✅ Table 5 = "occupied"
✅ Statut vente = "pending"
```

---

### 🕐 Étape 4 : David consomme (11h45 - 12h15)

**Action** : David mange tranquillement.

**Dans le système** :
```
Table 5 : OCCUPÉE par David
Vente SALE-2025-001 : status = "pending"
```

---

### 🕐 Étape 5 : David termine et part (12h20)

**Action** : David a fini. Marie clique sur **"Approuver (sans paiement)"**.

**Page** : `/sales-history`

**Backend** : `POST /api/sales/1/approve-credit/`

**Backend traite** (`backend/sales/views.py`) :

```python
def approve_sale_credit(request, pk):
    sale = Sale.objects.get(pk=pk)
    
    # Vérifications
    if sale.payment_method != 'credit':
        return error("Réservé aux ventes à crédit")
    
    # ✅ NOUVEAU : Vérifier le stock avant d'approuver
    for item in sale.items.all():
        if item.product.current_stock < item.quantity:
            return error(f"Stock insuffisant pour {item.product.name}")
    
    # ✅ NOUVEAU : Déduire le stock lors de l'approbation
    for item in sale.items.all():
        # Décompter le stock produit
        item.product.current_stock -= item.quantity
        item.product.save()
        
        # Créer un mouvement de stock pour tracer la sortie
        StockMovement.objects.create(
            product=item.product,
            movement_type='out',
            reason='credit_sale',
            quantity=item.quantity,
            reference=f"SALE-{sale.id}",
            notes=f"Vente à crédit approuvée #{sale.id}"
        )
    
    # Approbation
    sale.status = "completed"  # ✅ Terminée
    sale.save()
    
    # Libération de la table
    table_5.free()  # status = "available"
    
    return {
        "success": True,
        "message": "Vente approuvée, table libérée, stock déduit"
    }
```

**Résultat** :
```
✅ Vente SALE-2025-001 : status = "completed"
✅ Table 5 = "available" (libérée)
✅ Stock déduit MAINTENANT :
   - Coca-Cola : 50 → 48 unités (-2)
   - Burger : 30 → 29 unités (-1)
   - Frites : 40 → 39 unités (-1)
❌ Paiement = NON (crédit)
✅ Dette reste : -9000 FBu
```

---

### 📊 ÉTAT DU SYSTÈME (Fin Lundi 04/11/2025)

#### 1. **Stock** (déduit lors de l'approbation)
```
Coca-Cola : 50 → 48 unités (-2) ✅ Déduit quand caissier clique "Approuver"
Burger    : 30 → 29 unités (-1) ✅ Déduit quand caissier clique "Approuver"
Frites    : 40 → 39 unités (-1) ✅ Déduit quand caissier clique "Approuver"
```

#### 2. **Vente** (complétée mais non payée)
```sql
SELECT * FROM sales WHERE reference = 'SALE-2025-001';

id: 1
reference: SALE-2025-001
customer_name: David
payment_method: credit
status: completed  ✅
total_amount: 9000
created_at: 2025-11-04 11:40:00
```

#### 3. **Compte Crédit** (dette active)
```sql
SELECT * FROM credit_accounts WHERE id = 1;

id: 1
customer_name: David
account_number: ACC-001
balance: -9000  ❌ (dette)
status: active
```

#### 4. **Transaction Crédit** (dette enregistrée)
```sql
SELECT * FROM credit_transactions WHERE reference = 'SALE-2025-001';

id: 1
credit_account: 1 (David)
transaction_type: debt
amount: 9000
reference: SALE-2025-001
created_at: 2025-11-04 11:40:00
```

#### 5. **Historique Ventes** (`/sales-history`)
```
┌──────────────┬────────┬─────────┬──────────┬────────┐
│  Référence   │ Client │ Montant │ Paiement │ Statut │
├──────────────┼────────┼─────────┼──────────┼────────┤
│ SALE-2025-001│ David  │ 9000 FBu│  Crédit  │Terminée│
└──────────────┴────────┴─────────┴──────────┴────────┘
```

#### 6. **Rapport Journalier** (`/daily-report` - Lundi 04/11)

**Résumé Financier** :
```
┌─────────────────────────────────────────────┐
│  💵 Bénéfice Réel (Cash)    : 0 FBu        │
│     (Aucune vente cash aujourd'hui)         │
├─────────────────────────────────────────────┤
│  🏦 Bénéfice Crédit         : 3 600 FBu    │
│     Revenu : 9 000 FBu                      │
│     Coût   : 5 400 FBu                      │
│     ⚠️ ALERTE: Crédit élevé (> 1500 FBu)   │
├─────────────────────────────────────────────┤
│  📊 Bénéfice Total          : 3 600 FBu    │
│     (Théorique si David paie)               │
└─────────────────────────────────────────────┘
```

**Graphique d'évolution** :
```
Lundi 04/11 :
- Cash   : 0 FBu
- Crédit : 3 600 FBu
- Total  : 3 600 FBu
```

**Historique des ratios** :
```
┌─────────┬──────┬────────┬───────┬───────┐
│  Date   │ Cash │ Crédit │ Total │ Ratio │
├─────────┼──────┼────────┼───────┼───────┤
│ Lun 04  │  0   │ 3600   │ 3600  │  0%   │
└─────────┴──────┴────────┴───────┴───────┘

💡 Analyse : 🚨 ATTENTION - Ratio cash = 0%
Recommandation : Relancez le paiement de David
```

**Onglet "Ventes à Crédit"** :
```
Total Ventes : 1
Montant Total : 9 000 FBu
Non Payées : 1

┌──────┬───────────────┬────────┬─────────┬────────┐
│ Heure│   Référence   │ Client │ Montant │ Statut │
├──────┼───────────────┼────────┼─────────┼────────┤
│ 11:40│ SALE-2025-001 │ David  │ 9000 FBu│Non payé│
└──────┴───────────────┴────────┴─────────┴────────┘
```

---

## 📖 PARTIE 2 : PAIEMENT DU CRÉDIT (Mercredi 06/11/2025)

### 🕐 Étape 6 : David revient payer (10h00)

**Action** : David revient au restaurant pour payer sa dette.

**Marie dit** : "Bonjour David, vous avez une dette de 9 000 FBu du lundi."

---

### 🕐 Étape 7 : Enregistrement du paiement (10h05)

**Page** : `/credit-accounts` (Gestion des Comptes Crédit)

**Marie** :
1. Cherche le compte de David (ACC-001)
2. Voit le solde : **-9 000 FBu**
3. Clique sur **"Enregistrer un paiement"**
4. Entre :
   - Montant : **9 000 FBu**
   - Mode de paiement : **"Espèces"** (cash)
   - Note : "Paiement dette du 04/11"

**Backend** : `POST /api/credits/accounts/1/add-payment/`

**Données envoyées** :
```json
{
  "amount": 9000,
  "payment_method": "cash",
  "notes": "Paiement dette du 04/11"
}
```

**Backend traite** (`backend/credits/views.py`) :

```python
def add_payment(request, account_id):
    account = CreditAccount.objects.get(id=account_id)
    
    # Création de la transaction de paiement
    CreditTransaction.objects.create(
        credit_account=account,
        transaction_type="payment",  # ✅ Paiement
        amount=9000,
        payment_method="cash",
        description="Paiement dette du 04/11",
        created_at=now()  # 2025-11-06 10:05:00
    )
    
    # Mise à jour du solde
    account.balance += 9000  # -9000 + 9000 = 0
    account.save()
    
    # ⚠️ LA VENTE ORIGINALE NE CHANGE PAS
    # Elle reste status="completed", payment_method="credit"
    
    return {
        "success": True,
        "message": "Paiement enregistré",
        "new_balance": 0
    }
```

**Résultat** :
```
✅ Transaction créée : type="payment", amount=9000
✅ Solde David : -9000 → 0 FBu
✅ Paiement en espèces enregistré
❌ Vente SALE-2025-001 : reste "completed" (pas "paid")
```

---

### 📊 ÉTAT DU SYSTÈME (Mercredi 06/11/2025 après paiement)

#### 1. **Stock** (inchangé depuis lundi)
```
Coca-Cola : 48 unités (déjà déduit le lundi lors de l'approbation)
Burger    : 29 unités (déjà déduit le lundi lors de l'approbation)
Frites    : 39 unités (déjà déduit le lundi lors de l'approbation)
```

#### 2. **Vente Originale** (INCHANGÉE)
```sql
SELECT * FROM sales WHERE reference = 'SALE-2025-001';

id: 1
reference: SALE-2025-001
status: completed  ✅ (reste completed)
payment_method: credit  ✅ (reste credit)
total_amount: 9000
created_at: 2025-11-04 11:40:00  ⬅️ Date originale
```

#### 3. **Compte Crédit** (soldé)
```sql
SELECT * FROM credit_accounts WHERE id = 1;

id: 1
customer_name: David
balance: 0  ✅ (soldé)
```

#### 4. **Transactions Crédit** (2 transactions)
```sql
SELECT * FROM credit_transactions WHERE credit_account_id = 1;

-- Transaction 1 : Dette (Lundi)
id: 1
transaction_type: debt
amount: 9000
created_at: 2025-11-04 11:40:00

-- Transaction 2 : Paiement (Mercredi)
id: 2
transaction_type: payment  ✅
amount: 9000
payment_method: cash
created_at: 2025-11-06 10:05:00  ⬅️ Date du paiement
```

---

### 📊 IMPACT SUR LES RAPPORTS

#### **Rapport Journalier LUNDI 04/11** (inchangé)
```
Page: /daily-report?date=2025-11-04

💵 Bénéfice Réel (Cash)    : 0 FBu
🏦 Bénéfice Crédit         : 3 600 FBu
📊 Bénéfice Total          : 3 600 FBu

Onglet "Ventes à Crédit" :
- 1 vente à crédit
- Montant : 9 000 FBu
- Statut : Terminée (completed)
```

#### **Rapport Journalier MERCREDI 06/11** (nouveau)
```
Page: /daily-report?date=2025-11-06

💵 Bénéfice Réel (Cash)    : 0 FBu  ⬅️ Toujours 0 !
🏦 Bénéfice Crédit         : 0 FBu
📊 Bénéfice Total          : 0 FBu

⚠️ IMPORTANT : Le paiement de David n'apparaît PAS ici
car ce n'est pas une VENTE, c'est un PAIEMENT DE DETTE
```

#### **Rapport Crédits** (`/credits-report`)
```
Page: /credits-report?date=2025-11-06

📊 Transactions du Jour (06/11) :
┌──────┬──────────┬────────┬─────────┬────────┐
│ Heure│   Type   │ Client │ Montant │ Solde  │
├──────┼──────────┼────────┼─────────┼────────┤
│ 10:05│ Paiement │ David  │ 9000 FBu│  0 FBu │
└──────┴──────────┴────────┴─────────┴────────┘

📈 Résumé :
- Nouvelles dettes : 0 FBu
- Paiements reçus : 9 000 FBu  ✅
- Net du jour : +9 000 FBu (positif)
```

#### **Rapport de Caisse** (si implémenté)
```
Page: /cash-report?date=2025-11-06

💰 Entrées de Caisse :
┌──────┬─────────────────────┬─────────┐
│ Heure│     Description     │ Montant │
├──────┼─────────────────────┼─────────┤
│ 10:05│ Paiement crédit ACC-│ 9000 FBu│
│      │ 001 (David)         │         │
└──────┴─────────────────────┴─────────┘

Total Espèces : 9 000 FBu
```

---

## 🔍 ANALYSE DÉTAILLÉE : Pourquoi ce système ?

### ✅ **Avantages de cette approche**

#### 1. **Traçabilité Complète**
```
Lundi 04/11 : Vente à crédit enregistrée
              → Visible dans rapport du 04/11
              → Dette créée

Mercredi 06/11 : Paiement enregistré
                 → Visible dans rapport crédits du 06/11
                 → Dette soldée
```

#### 2. **Séparation Claire**
```
Vente (04/11)     ≠     Paiement (06/11)
└─ Rapport Ventes       └─ Rapport Crédits
└─ Stock déduit         └─ Caisse créditée
└─ Date : 04/11         └─ Date : 06/11
```

#### 3. **Comptabilité Correcte**
```
Lundi 04/11 :
- Chiffre d'affaires : 9 000 FBu (théorique)
- Bénéfice théorique : 3 600 FBu
- Liquidité : 0 FBu (pas d'argent reçu)

Mercredi 06/11 :
- Chiffre d'affaires : 0 FBu (pas de vente)
- Encaissement : 9 000 FBu (paiement dette)
- Liquidité : +9 000 FBu
```

---

## 📊 TABLEAU RÉCAPITULATIF

| Aspect | Lundi 04/11 (Vente) | Mercredi 06/11 (Paiement) |
|--------|---------------------|---------------------------|
| **Action** | Vente à crédit | Paiement dette |
| **Stock** | Déduit (-2, -1, -1) | Inchangé |
| **Vente** | Créée (completed) | Inchangée |
| **Dette** | Créée (-9000 FBu) | Soldée (0 FBu) |
| **Caisse** | 0 FBu | +9 000 FBu |
| **Rapport Ventes** | 1 vente crédit | 0 vente |
| **Rapport Crédits** | 1 dette | 1 paiement |
| **Bénéfice Réel** | 0 FBu | 0 FBu |
| **Bénéfice Théorique** | 3 600 FBu | 0 FBu |

---

## 🎯 RECOMMANDATIONS POUR LE GÉRANT

### 📊 **Analyse Financière**

#### **Semaine du 04/11 au 10/11**

**Rapport Journalier** :
```
┌─────────┬──────────┬────────────┬───────────┐
│  Date   │   Cash   │   Crédit   │   Total   │
├─────────┼──────────┼────────────┼───────────┤
│ Lun 04  │    0 FBu │  3 600 FBu │ 3 600 FBu │
│ Mar 05  │ 5000 FBu │      0 FBu │ 5 000 FBu │
│ Mer 06  │    0 FBu │      0 FBu │     0 FBu │
├─────────┼──────────┼────────────┼───────────┤
│ TOTAL   │ 5000 FBu │  3 600 FBu │ 8 600 FBu │
└─────────┴──────────┴────────────┴───────────┘

Ratio Cash : 58% (acceptable)
```

**Rapport Crédits** :
```
┌─────────┬─────────────┬──────────────┬─────────┐
│  Date   │ Dettes      │  Paiements   │   Net   │
├─────────┼─────────────┼──────────────┼─────────┤
│ Lun 04  │  9 000 FBu  │       0 FBu  │ -9000   │
│ Mar 05  │      0 FBu  │       0 FBu  │     0   │
│ Mer 06  │      0 FBu  │   9 000 FBu  │ +9000   │
├─────────┼─────────────┼──────────────┼─────────┤
│ TOTAL   │  9 000 FBu  │   9 000 FBu  │     0   │
└─────────┴─────────────┴──────────────┴─────────┘

Taux de recouvrement : 100% ✅
```

**Rapport de Caisse** :
```
Lundi 04   : 0 FBu (vente crédit)
Mardi 05   : 5 000 FBu (vente cash)
Mercredi 06: 9 000 FBu (paiement crédit)
────────────────────────────────────
TOTAL      : 14 000 FBu en caisse
```

---

## 💡 POINTS CLÉS À RETENIR

### ✅ **Ce qui se passe**

1. **Vente à crédit** :
   - Stock déduit immédiatement
   - Vente enregistrée avec `payment_method="credit"`
   - Dette créée dans le compte crédit
   - Apparaît dans le rapport du jour de la vente

2. **Paiement ultérieur** :
   - Transaction de paiement créée
   - Dette soldée
   - Argent en caisse
   - Apparaît dans le rapport crédits du jour du paiement
   - **N'apparaît PAS comme une vente**

### ⚠️ **Ce qui NE se passe PAS**

1. ❌ La vente originale ne devient PAS `status="paid"`
2. ❌ Le paiement ne crée PAS une nouvelle vente
3. ❌ Le stock n'est PAS déduit deux fois
4. ❌ Le paiement n'apparaît PAS dans le rapport ventes

---

## 🔧 AMÉLIORATION POSSIBLE

### **Option : Lier le paiement à la vente originale**

Si vous voulez tracer le lien :

```python
# Lors du paiement
CreditTransaction.objects.create(
    credit_account=account,
    transaction_type="payment",
    amount=9000,
    related_sale_id=1,  # ✅ Lien vers SALE-2025-001
    payment_method="cash"
)
```

Cela permettrait de voir dans l'historique :
```
Paiement de 9 000 FBu
→ Pour la vente SALE-2025-001 du 04/11/2025
```

---

## 📝 CONCLUSION

Le système actuel est **correct et professionnel** :

✅ **Séparation claire** entre ventes et paiements de dettes
✅ **Traçabilité** complète des opérations
✅ **Comptabilité** précise par jour
✅ **Stock** géré correctement
✅ **Rapports** distincts pour ventes et crédits

**Le gérant peut** :
- Voir les ventes du jour (cash + crédit)
- Suivre les créances
- Suivre les encaissements
- Analyser la liquidité réelle vs théorique

**C'est exactement comme ça que ça devrait fonctionner !** ✅
