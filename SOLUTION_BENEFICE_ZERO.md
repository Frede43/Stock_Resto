# 🔍 SOLUTION : Bénéfice à 0 FBu

**Date** : 06 novembre 2025, 15:00  
**Problème** : Section "Boissons & Cuisine" affiche 0 FBu mais section du haut affiche 10,000 FBu

---

## ✅ PROBLÈME IDENTIFIÉ

Il y a **DEUX sections différentes** qui utilisent **DEUX sources de données différentes** :

### **Section 1 : Stats du haut** ✅ FONCTIONNE
```typescript
// Ligne 1282 de DailyReport.tsx
{reportData.totalRevenue.toLocaleString()} FBu
```
- **Source** : `useDailyReport()` → Endpoint `/api/reports/daily/`
- **Résultat** : ✅ 10,000 FBu (affiche correctement)

### **Section 2 : Boissons & Cuisine** ❌ NE FONCTIONNE PAS
```typescript
// Ligne 1626 de DailyReport.tsx
{salesByPaymentMethod.cashStats.totalProfit.toLocaleString()} FBu
```
- **Source** : `useMemo` calculé à partir de `useSales()` et `useProducts()`
- **Résultat** : ❌ 0 FBu (ne s'affiche pas)

---

## 🔍 CAUSE DU PROBLÈME

Le calcul `salesByPaymentMethod` (ligne 281-406) dépend de :

1. **`allSalesData`** : Ventes récupérées via `useSales()`
2. **`productsData`** : Produits récupérés via `useProducts()`

**Ligne 306** :
```typescript
costPrice: product.purchase_price || 0,
```

**Ligne 340** :
```typescript
const cost = quantity * stats.costPrice;
```

**Si `purchase_price` est NULL ou 0** :
- `costPrice = 0`
- `cost = quantity * 0 = 0`
- `profit = revenue - 0 = revenue`

**MAIS** le calcul échoue si :
- Les ventes n'ont pas d'items
- Les items n'ont pas de `product_id`
- Le mapping produit échoue

---

## 🧪 DIAGNOSTIC

### **Étape 1 : Ouvrir la console du navigateur**

1. Appuyer sur **F12**
2. Aller sur l'onglet **Console**
3. Aller sur `/daily-report`
4. Chercher ces logs :

```javascript
🔍 DEBUG salesByPaymentMethod: {
  allSalesData: ?,  // ← Doit être > 0
  productsData: ?,  // ← Doit être > 0
  selectedDate: "2025-11-06"
}

✅ Résultat salesByPaymentMethod: {
  cashProfit: ?,    // ← Doit être > 0
  creditProfit: ?,
  totalProfit: ?
}
```

### **Interprétation** :

| Log | Signification | Action |
|-----|---------------|--------|
| `allSalesData: 0` | Aucune vente récupérée | Vérifier la date sélectionnée |
| `productsData: 0` | Aucun produit en base | Créer des produits |
| `cashProfit: 0` mais `allSalesData > 0` | **Prix d'achat manquants** | Corriger les prix |

---

## 🔧 SOLUTIONS

### **Solution 1 : Vérifier les prix d'achat** ✅ RECOMMANDÉ

1. Ouvrir : `http://localhost:5173/check-products-prices.html`
2. Coller votre token JWT
3. Cliquer "📊 Vérifier les Produits"
4. Si des produits n'ont pas de prix d'achat :
   - Cliquer "🔧 Corriger les Prix"
   - Confirmer l'action
   - ✅ Prix d'achat = 60% du prix de vente

### **Solution 2 : Vérifier les logs de la console**

Si les prix sont OK mais le problème persiste :

1. Ouvrir la console (F12)
2. Copier les logs :
   ```
   🔍 DEBUG salesByPaymentMethod: { ... }
   ✅ Résultat salesByPaymentMethod: { ... }
   ```
3. Me les envoyer pour analyse

### **Solution 3 : Vérifier la structure des ventes**

Vérifier que les ventes ont bien des items :

```javascript
// Dans la console du navigateur
fetch('http://127.0.0.1:8000/api/sales/?date_from=2025-11-06&date_to=2025-11-06', {
  headers: {
    'Authorization': 'Bearer VOTRE_TOKEN'
  }
})
.then(r => r.json())
.then(data => {
  console.log('Ventes:', data.results);
  data.results.forEach(sale => {
    console.log(`- ${sale.reference}:`, sale.items?.length || 0, 'items');
    sale.items?.forEach(item => {
      console.log(`  - ${item.product?.name || item.product_id}: ${item.quantity} x ${item.unit_price} FBu`);
    });
  });
});
```

---

## 🎯 RÉSULTAT ATTENDU

Après correction, vous devriez voir :

```
💵 Bénéfice Réel (Cash)    : 6 000 FBu ✅
   Revenu : 10 000 FBu
   Coût : 4 000 FBu

🏦 Bénéfice Crédit         : 0 FBu
   Revenu : 0 FBu
   Coût : 0 FBu

📊 Bénéfice Total          : 6 000 FBu ✅
```

---

## 📊 COMPARAISON DES DEUX SECTIONS

| Aspect | Section du haut | Section Boissons & Cuisine |
|--------|----------------|---------------------------|
| **Source** | `useDailyReport()` | `useSales()` + `useProducts()` |
| **Endpoint** | `/api/reports/daily/` | `/api/sales/` + `/api/products/` |
| **Calcul** | Backend Django | Frontend React |
| **Dépendance** | Aucune | Prix d'achat requis |
| **Résultat** | ✅ 10,000 FBu | ❌ 0 FBu |

---

## 🚀 ACTION IMMÉDIATE

1. **Ouvrir la console** (F12)
2. **Copier les logs** `🔍 DEBUG salesByPaymentMethod`
3. **Me les envoyer** pour diagnostic précis

OU

1. **Utiliser l'outil** : `http://localhost:5173/check-products-prices.html`
2. **Corriger les prix** automatiquement
3. **Actualiser** `/daily-report`

---

**Date de création** : 06 novembre 2025, 15:00  
**Statut** : 🔍 **EN ATTENTE DES LOGS**  
**Action requise** : Copier les logs de la console
