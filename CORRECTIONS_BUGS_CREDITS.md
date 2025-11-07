# 🐛 CORRECTIONS DES BUGS - SYSTÈME CRÉDITS

**Date** : 06 novembre 2025, 13:25  
**Objectif** : Corriger les bugs identifiés dans le système de crédits

---

## 🚨 BUG 1 : Endpoint `mark-as-paid` introuvable (404)

### **Erreur**
```
POST http://127.0.0.1:8000/api/sales/20/mark-as-paid/ 404 (Not Found)
```

### **Cause**
Le frontend appelle `/api/sales/20/mark-as-paid/` mais le backend expose `/api/sales/20/mark-paid/`

### **Routes backend disponibles**
```python
# backend/sales/urls.py
path('<int:sale_id>/mark-paid/', views.mark_sale_as_paid, name='mark_sale_as_paid'),
```

### **✅ CORRECTION APPLIQUÉE**

**Fichier** : `src/pages/DailyReport.tsx` (ligne 1154)

**Avant** ❌
```typescript
await apiService.post(`/sales/${selectedSaleForPayment.id}/mark-as-paid/`);
```

**Après** ✅
```typescript
await apiService.post(`/sales/${selectedSaleForPayment.id}/mark-paid/`);
```

---

## 🚨 BUG 2 : Page `/credits` affiche 0 FBu partout

### **Symptômes**
- Comptes actifs : 1
- Dette totale : 0 FBu ❌
- Avec dette : 0 ❌
- Paiements ce mois : 0 FBu ❌
- Solde actuel du compte David : 0.00 FBu ❌

### **Causes possibles**

#### **1. Backend ne retourne pas les bonnes données**
```python
# backend/credits/views.py - statistics()
total_debt = CreditAccount.objects.aggregate(
    total=Sum('current_balance')
)['total'] or 0
```

**Problème potentiel** : `current_balance` peut être négatif (dette = balance négative)

#### **2. Modèle CreditAccount**
Vérifier si `current_balance` est bien mis à jour lors des transactions

#### **3. Frontend ne parse pas correctement les données**
```typescript
// src/pages/Credits.tsx
const accounts = accountsData?.results || [];
```

### **✅ CORRECTIONS APPLIQUÉES**

#### **A. Ajout de logs de débogage**

**Fichier** : `src/pages/Credits.tsx` (lignes 77-85)

```typescript
// 🔍 DEBUG: Logs pour comprendre pourquoi les données ne s'affichent pas
console.log('🔍 Credits Page Debug:', {
  accountsData,
  accounts: accounts.length,
  statistics,
  isLoading,
  statusFilter,
  searchTerm
});
```

**Utilité** : Permet de voir exactement ce que retourne l'API

---

## 🔧 ACTIONS À FAIRE MAINTENANT

### **Étape 1 : Redémarrer le frontend**
```bash
# Arrêter le serveur (Ctrl+C)
npm run dev
```

### **Étape 2 : Tester le bug 1 (mark-paid)**
1. Aller sur http://localhost:5173/daily-report
2. Onglet "Ventes à Crédit"
3. Cliquer sur "Enregistrer paiement" pour une vente
4. Vérifier qu'il n'y a plus d'erreur 404

**Résultat attendu** :
```
✅ Paiement enregistré avec succès
✅ La vente et le compte crédit ont été mis à jour
```

### **Étape 3 : Déboguer le bug 2 (données 0 FBu)**
1. Aller sur http://localhost:5173/credits
2. Ouvrir la console du navigateur (F12)
3. Regarder les logs `🔍 Credits Page Debug:`

**Vérifier** :
```javascript
{
  accountsData: { results: [...], count: 1 },  // Doit contenir des comptes
  accounts: 1,  // Nombre de comptes
  statistics: {
    total_debt: 0,  // ⚠️ Si 0, problème backend
    active_accounts: 1,
    accounts_with_debt: 0  // ⚠️ Si 0, problème backend
  },
  isLoading: false
}
```

### **Étape 4 : Vérifier le backend**

#### **A. Tester l'API directement**
```bash
# Récupérer les comptes crédit
curl http://localhost:8000/api/credits/accounts/

# Récupérer les statistiques
curl http://localhost:8000/api/credits/accounts/statistics/
```

#### **B. Vérifier la base de données**
```bash
cd backend
python manage.py shell
```

```python
from credits.models import CreditAccount, CreditTransaction

# Lister tous les comptes
accounts = CreditAccount.objects.all()
for acc in accounts:
    print(f"{acc.customer_name}: {acc.current_balance} FBu")

# Vérifier les transactions
transactions = CreditTransaction.objects.all()
for t in transactions:
    print(f"{t.credit_account.customer_name} | {t.transaction_type} | {t.amount} FBu")
```

---

## 🔍 DIAGNOSTIC PROBABLE

### **Hypothèse 1 : Balance négative**

Le système utilise probablement des **balances négatives** pour représenter les dettes :
- Balance = -9000 FBu → Client doit 9000 FBu
- Balance = 0 FBu → Pas de dette
- Balance = +5000 FBu → Crédit en faveur du client

**Problème** : Le frontend affiche `0.00 FBu` au lieu de `9000 FBu` (valeur absolue)

**Solution** : Afficher `Math.abs(current_balance)` dans le frontend

### **Hypothèse 2 : Transactions non appliquées**

Les transactions de type `'sale'` (vente à crédit) ne mettent peut-être pas à jour le `current_balance`

**Vérifier** : `backend/credits/models.py` - signal `post_save` sur `CreditTransaction`

---

## ✅ CORRECTIONS SUPPLÉMENTAIRES À APPLIQUER

### **1. Afficher la valeur absolue de la dette**

**Fichier** : `src/pages/Credits.tsx`

**Trouver** :
```typescript
<p className="text-2xl font-bold">{account.current_balance.toLocaleString()} FBu</p>
```

**Remplacer par** :
```typescript
<p className="text-2xl font-bold">{Math.abs(account.current_balance).toLocaleString()} FBu</p>
```

### **2. Corriger les statistiques**

**Fichier** : `backend/credits/views.py` (ligne 161)

**Avant** :
```python
total_debt = CreditAccount.objects.aggregate(
    total=Sum('current_balance')
)['total'] or 0
```

**Après** :
```python
from django.db.models.functions import Abs

total_debt = CreditAccount.objects.aggregate(
    total=Sum(Abs('current_balance'))
)['total'] or 0

# OU si balance négative = dette
total_debt = abs(CreditAccount.objects.aggregate(
    total=Sum('current_balance')
)['total'] or 0)
```

### **3. Filtrer les comptes avec dette**

**Fichier** : `backend/credits/views.py` (ligne 165)

**Avant** :
```python
accounts_with_debt = CreditAccount.objects.filter(
    status='active',
    current_balance__gt=0  # ❌ Si balance négative = dette
).count()
```

**Après** :
```python
accounts_with_debt = CreditAccount.objects.filter(
    status='active',
    current_balance__lt=0  # ✅ Balance négative = dette
).count()

# OU
accounts_with_debt = CreditAccount.objects.filter(
    status='active',
    current_balance__ne=0  # Balance != 0
).count()
```

---

## 📊 CHECKLIST DE VALIDATION

### **Bug 1 : mark-paid**
- [ ] Correction appliquée dans `DailyReport.tsx`
- [ ] Frontend redémarré
- [ ] Test : Enregistrer un paiement depuis /daily-report
- [ ] Vérifier : Pas d'erreur 404
- [ ] Vérifier : Toast de succès affiché

### **Bug 2 : Données 0 FBu**
- [ ] Logs de débogage ajoutés
- [ ] Console du navigateur ouverte
- [ ] Logs `🔍 Credits Page Debug` visibles
- [ ] API testée directement avec curl
- [ ] Base de données vérifiée avec Django shell
- [ ] Hypothèse identifiée (balance négative ou transactions non appliquées)
- [ ] Corrections backend appliquées si nécessaire
- [ ] Frontend mis à jour pour afficher valeur absolue

---

## 🎯 RÉSULTAT ATTENDU FINAL

### **Page `/credits` (Caissier)**
```
✅ Comptes actifs : 1
✅ Dette totale : 9 000 FBu (au lieu de 0)
✅ Avec dette : 1 (au lieu de 0)
✅ Paiements ce mois : 0 FBu (si aucun paiement)

Compte David :
✅ Solde actuel : 9 000 FBu (au lieu de 0.00)
✅ Limite : 50 000 FBu
✅ Disponible : 41 000 FBu
```

### **Page `/daily-report` (Admin)**
```
✅ Onglet "Ventes à Crédit" fonctionne
✅ Bouton "Enregistrer paiement" fonctionne (pas d'erreur 404)
✅ Synchronisation avec /credits fonctionne
```

---

**Date de création** : 06 novembre 2025, 13:30  
**Statut** : 🔧 **CORRECTIONS PARTIELLES APPLIQUÉES**  
**Prochaine étape** : Tester et déboguer avec les logs
