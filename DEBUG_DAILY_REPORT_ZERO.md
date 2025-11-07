# 🐛 DEBUG: Rapport Journalier affiche 0 FBu

**Date** : 06 novembre 2025, 14:40  
**Problème** : La page `/daily-report` affiche 0 FBu pour tous les bénéfices

---

## 🔍 ANALYSE DU PROBLÈME

### **Symptômes**
```
💵 Bénéfice Réel (Cash)    : 0 FBu
🏦 Bénéfice Crédit         : 0 FBu
📊 Bénéfice Total          : 0 FBu
```

### **Causes possibles**

#### **1. Aucune vente dans la base de données** ❓
- La date sélectionnée n'a aucune vente
- Les ventes existent mais avec une autre date

#### **2. Problème de récupération des données** ❓
- `allSalesData` est vide ou null
- `productsData` est vide ou null
- Erreur API non gérée

#### **3. Problème de calcul** ❓
- Les items des ventes sont vides
- Les prix sont à 0
- Le mapping des produits échoue

---

## 🧪 ÉTAPES DE DIAGNOSTIC

### **Étape 1 : Vérifier les logs de la console**

Ouvrir la console du navigateur (F12) et chercher :

```javascript
// Log 1 : Vérification des données
🔍 DEBUG salesByPaymentMethod: {
  allSalesData: 0,  // ❌ Si 0 → Aucune vente récupérée
  productsData: 50, // ✅ Si > 0 → Produits OK
  selectedDate: "2025-11-06"
}

// Log 2 : Résultat du calcul
✅ Résultat salesByPaymentMethod: {
  cashProfit: 0,    // ❌ Si 0 → Pas de vente cash
  creditProfit: 0,  // ❌ Si 0 → Pas de vente crédit
  totalProfit: 0    // ❌ Si 0 → Aucun bénéfice
}
```

**Interprétation** :
- Si `allSalesData: 0` → **Problème de récupération des ventes**
- Si `productsData: 0` → **Problème de récupération des produits**
- Si les deux > 0 mais profit = 0 → **Problème de calcul**

---

### **Étape 2 : Vérifier la date sélectionnée**

Dans la console, vérifier :
```javascript
console.log('Date sélectionnée:', selectedDate);
// Doit être au format: "2025-11-06"
```

**Actions** :
1. Changer la date dans le sélecteur
2. Vérifier si les données apparaissent
3. Essayer avec la date d'aujourd'hui

---

### **Étape 3 : Vérifier les requêtes API**

Dans l'onglet **Network** (F12) :

1. **Requête ventes** :
   ```
   GET /api/sales/?date_from=2025-11-06&date_to=2025-11-06
   ```
   - Status : 200 OK ✅
   - Réponse : `{ "results": [...], "count": X }`
   - Si `count: 0` → Aucune vente ce jour-là

2. **Requête produits** :
   ```
   GET /api/products/
   ```
   - Status : 200 OK ✅
   - Réponse : `{ "results": [...], "count": X }`
   - Si `count: 0` → Aucun produit en base

---

### **Étape 4 : Vérifier les données en base**

#### **Backend Django Shell** :
```bash
cd backend
python manage.py shell
```

```python
from sales.models import Sale
from datetime import date

# Vérifier les ventes du jour
today = date.today()
sales = Sale.objects.filter(created_at__date=today)
print(f"Ventes aujourd'hui: {sales.count()}")

# Afficher les ventes
for sale in sales:
    print(f"- {sale.reference}: {sale.total_amount} FBu ({sale.payment_method})")
    print(f"  Items: {sale.items.count()}")
    for item in sale.items.all():
        print(f"    - {item.product.name}: {item.quantity} x {item.unit_price} FBu")
```

**Résultats attendus** :
- Si `count: 0` → **Créer une vente de test**
- Si `count > 0` → **Vérifier que les items existent**

---

## 🔧 SOLUTIONS SELON LE DIAGNOSTIC

### **Solution 1 : Aucune vente en base** ✅

**Créer une vente de test** :

1. Aller sur `/sales`
2. Créer une vente cash :
   - Produit : Coca-Cola (2 unités)
   - Mode paiement : Espèces
   - Cliquer "Payer"
3. Retourner sur `/daily-report`
4. ✅ Vérifier que le bénéfice cash apparaît

**Créer une vente à crédit** :

1. Aller sur `/sales`
2. Créer une vente crédit :
   - Produit : Burger (1 unité)
   - Mode paiement : Crédit
   - Compte crédit : David
3. Aller sur `/sales-history`
4. Cliquer "Approuver (sans paiement)"
5. Retourner sur `/daily-report`
6. ✅ Vérifier que le bénéfice crédit apparaît

---

### **Solution 2 : Problème de date** ✅

**Vérifier le format de date** :

```typescript
// Dans DailyReport.tsx
const selectedDate = useMemo(() => {
  return dateFilter || new Date().toISOString().split('T')[0];
}, [dateFilter]);

console.log('📅 Date sélectionnée:', selectedDate);
// Doit afficher: "2025-11-06"
```

**Actions** :
1. Ouvrir la console (F12)
2. Vérifier le log "📅 Date sélectionnée"
3. Si format incorrect → Corriger le code

---

### **Solution 3 : Problème de récupération API** ✅

**Vérifier les hooks** :

```typescript
// Dans DailyReport.tsx (ligne 210-213)
const { data: allSalesData, refetch: refetchAllSales } = useSales({ 
  date_from: selectedDate,
  date_to: selectedDate
});

console.log('📊 allSalesData:', allSalesData);
// Doit afficher: { results: [...], count: X }
```

**Actions** :
1. Vérifier que `allSalesData` n'est pas `undefined`
2. Vérifier que `allSalesData.results` existe
3. Si erreur → Vérifier l'API backend

---

### **Solution 4 : Problème de calcul** ✅

**Vérifier le mapping des produits** :

```typescript
// Dans DailyReport.tsx (ligne 330-363)
allSalesData.results.forEach((sale: any) => {
  console.log('🔍 Vente:', sale.reference, sale.payment_method);
  
  sale.items?.forEach((item: any) => {
    const productId = item.product?.id || item.product_id;
    const stats = productStats.get(productId);
    
    console.log('  - Item:', {
      productId,
      quantity: item.quantity,
      unit_price: item.unit_price,
      statsFound: !!stats
    });
  });
});
```

**Actions** :
1. Vérifier que chaque item a un `product_id`
2. Vérifier que le produit existe dans `productStats`
3. Vérifier que `quantity` et `unit_price` sont > 0

---

## 🎯 SOLUTION RAPIDE (TEST)

### **Créer des données de test complètes** :

```bash
cd backend
python manage.py shell
```

```python
from sales.models import Sale, SaleItem
from products.models import Product
from django.contrib.auth import get_user_model
from datetime import datetime

User = get_user_model()

# Récupérer un utilisateur
user = User.objects.first()

# Récupérer des produits
coca = Product.objects.filter(name__icontains='coca').first()
burger = Product.objects.filter(name__icontains='burger').first()

if coca and burger:
    # Créer une vente cash
    sale_cash = Sale.objects.create(
        reference=f"SALE-TEST-{datetime.now().strftime('%Y%m%d%H%M%S')}",
        payment_method='cash',
        status='paid',
        total_amount=7000,
        created_by=user,
        server=user
    )
    
    SaleItem.objects.create(
        sale=sale_cash,
        product=coca,
        quantity=2,
        unit_price=1000
    )
    
    SaleItem.objects.create(
        sale=sale_cash,
        product=burger,
        quantity=1,
        unit_price=5000
    )
    
    print(f"✅ Vente cash créée: {sale_cash.reference}")
    print(f"   Total: {sale_cash.total_amount} FBu")
    print(f"   Items: {sale_cash.items.count()}")
    
    # Créer une vente crédit
    from credits.models import CreditAccount
    
    account = CreditAccount.objects.first()
    if account:
        sale_credit = Sale.objects.create(
            reference=f"SALE-TEST-CREDIT-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            payment_method='credit',
            status='completed',
            total_amount=5000,
            credit_account=account,
            created_by=user,
            server=user
        )
        
        SaleItem.objects.create(
            sale=sale_credit,
            product=burger,
            quantity=1,
            unit_price=5000
        )
        
        print(f"✅ Vente crédit créée: {sale_credit.reference}")
        print(f"   Total: {sale_credit.total_amount} FBu")
        print(f"   Items: {sale_credit.items.count()}")
else:
    print("❌ Produits non trouvés. Créer des produits d'abord.")
```

---

## 📊 VÉRIFICATION FINALE

Après avoir créé les ventes de test :

1. **Ouvrir** : `http://localhost:5173/daily-report`
2. **Sélectionner** : Date d'aujourd'hui
3. **Vérifier** :
   ```
   💵 Bénéfice Réel (Cash)    : X FBu (> 0)
   🏦 Bénéfice Crédit         : Y FBu (> 0)
   📊 Bénéfice Total          : X+Y FBu (> 0)
   ```

4. **Console** :
   ```javascript
   🔍 DEBUG salesByPaymentMethod: {
     allSalesData: 2,  // ✅ 2 ventes
     productsData: 50, // ✅ Produits OK
     selectedDate: "2025-11-06"
   }
   
   ✅ Résultat salesByPaymentMethod: {
     cashProfit: 2100,    // ✅ Bénéfice cash
     creditProfit: 2000,  // ✅ Bénéfice crédit
     totalProfit: 4100    // ✅ Total
   }
   ```

---

## 🚀 PROCHAINES ÉTAPES

1. **Ouvrir la console du navigateur** (F12)
2. **Aller sur** `/daily-report`
3. **Copier les logs** et me les envoyer
4. **Je pourrai alors identifier** le problème exact

**Logs à copier** :
```javascript
🔍 DEBUG salesByPaymentMethod: { ... }
✅ Résultat salesByPaymentMethod: { ... }
```

---

**Date de création** : 06 novembre 2025, 14:45  
**Statut** : 🔍 **EN ATTENTE DES LOGS**  
**Action requise** : Ouvrir console et copier les logs
