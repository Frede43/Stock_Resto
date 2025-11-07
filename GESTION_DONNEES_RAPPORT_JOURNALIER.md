# 📊 GESTION DES DONNÉES - RAPPORT JOURNALIER BOISSONS & CUISINE

## 🎯 OBJECTIF
Expliquer comment le tableau "Rapport Journalier Boissons et Cuisine" gère les données pour les ventes cash et crédit, et comment il calcule les bénéfices.

---

## 📋 SITUATION ACTUELLE

### ❌ PROBLÈME IDENTIFIÉ

Le tableau **"Boissons & Cuisine"** actuellement :
- ✅ Affiche les mouvements de stock (entrées/sorties)
- ✅ Calcule les revenus et bénéfices
- ❌ **NE DISTINGUE PAS** les ventes cash des ventes à crédit
- ❌ **MÉLANGE** toutes les ventes ensemble
- ❌ Les bénéfices affichés incluent les ventes non payées (crédit)

### 📊 SOURCE DES DONNÉES

**Fichier** : `src/pages/DailyReport.tsx` (lignes 400-520)

```typescript
// Le système calcule les données à partir de :
1. ordersData (commandes du jour)
2. productsData (liste des produits)
3. salesData (ventes - mais pas utilisé actuellement !)

// Calcul actuel :
orders.forEach((order: any) => {
  order.items?.forEach((item: any) => {
    const quantity = item.quantity || 0;
    const itemRevenue = quantity * (item.product?.price || 0);
    const itemCost = quantity * stats.costPrice;
    
    stats.revenue += itemRevenue;  // ⚠️ INCLUT TOUT (cash + crédit)
    stats.totalCost += itemCost;
    stats.profit = stats.revenue - stats.totalCost;  // ⚠️ BÉNÉFICE THÉORIQUE
  });
});
```

---

## 🔍 ANALYSE DÉTAILLÉE

### 1️⃣ COLONNES DU TABLEAU

| Colonne | Signification | Source |
|---------|--------------|--------|
| **PRODUIT** | Nom du produit | `product.name` |
| **Prix Unitaire** | Prix de vente | `product.price` |
| **Stock Initial** | Stock au début du jour | `product.current_stock` |
| **Entrée Stock** | Nouvelles entrées | Mouvements de stock |
| **Stock Total** | Initial + Entrées | Calculé |
| **Consommation** | Quantité vendue | `order.items.quantity` |
| **Stock Restant** | Total - Consommation | Calculé |
| **P.A.** | Prix d'achat | `product.purchase_price` |
| **P.V.** | Prix de vente | `product.selling_price` |
| **Stock Vendu** | Quantité vendue | `order.items.quantity` |
| **MAR** | Marge (Revenu) | `quantity × prix_vente` |
| **BENEF** | Bénéfice | `MAR - (quantity × P.A.)` |

### 2️⃣ CALCUL DES BÉNÉFICES ACTUELS

```typescript
// Pour chaque produit :
const revenue = totalSales × sellingPrice;      // Revenu total
const cost = totalSales × purchasePrice;        // Coût total
const profit = revenue - cost;                  // Bénéfice

// Exemple :
// Produit : Coca-Cola
// Stock vendu : 10 unités
// P.V. : 1000 FBu
// P.A. : 600 FBu

revenue = 10 × 1000 = 10 000 FBu
cost = 10 × 600 = 6 000 FBu
profit = 10 000 - 6 000 = 4 000 FBu  ✅ BÉNÉFICE THÉORIQUE
```

### ⚠️ PROBLÈME MAJEUR

```
Le bénéfice affiché = Bénéfice THÉORIQUE (si tout était payé)

Mais en réalité :
- 5 Coca vendus en CASH → 5 000 FBu reçus ✅
- 5 Coca vendus à CRÉDIT → 5 000 FBu NON reçus ❌

Bénéfice RÉEL = (5 × 1000) - (10 × 600) = 5 000 - 6 000 = -1 000 FBu
(Perte si on compte seulement le cash reçu !)
```

---

## 💡 SOLUTION RECOMMANDÉE

### 🎯 OBJECTIF
Distinguer les ventes cash des ventes à crédit pour calculer :
1. **Bénéfice théorique** (total des ventes)
2. **Bénéfice réel** (seulement les ventes payées)
3. **Créances** (ventes à crédit non payées)

### 📊 NOUVEAU TABLEAU PROPOSÉ

#### Option A : Ajouter des colonnes au tableau existant

| PRODUIT | P.A. | P.V. | Ventes Cash | Ventes Crédit | Total Ventes | MAR Cash | MAR Crédit | BENEF Réel | BENEF Théorique |
|---------|------|------|-------------|---------------|--------------|----------|------------|------------|-----------------|
| Coca-Cola | 600 | 1000 | 5 | 5 | 10 | 5 000 | 5 000 | 2 000 | 4 000 |
| Fanta | 600 | 1000 | 8 | 2 | 10 | 8 000 | 2 000 | 3 200 | 4 000 |

**Calculs** :
```typescript
// Ventes Cash
const cashSales = orders.filter(o => o.payment_method === 'cash' || o.payment_method === 'card' || o.payment_method === 'mobile');
const cashRevenue = cashSales × sellingPrice;
const cashProfit = cashRevenue - (cashSales × purchasePrice);

// Ventes Crédit
const creditSales = orders.filter(o => o.payment_method === 'credit');
const creditRevenue = creditSales × sellingPrice;
const creditProfit = creditRevenue - (creditSales × purchasePrice);

// Totaux
const totalProfit = cashProfit + creditProfit;  // Théorique
const realProfit = cashProfit;                  // Réel (cash reçu)
```

#### Option B : Séparer en deux sections

**Section 1 : Ventes Payées (Cash/Carte/Mobile)**
- Affiche uniquement les ventes payées
- Bénéfice = Bénéfice RÉEL (argent en caisse)

**Section 2 : Ventes à Crédit**
- Affiche uniquement les ventes à crédit
- Bénéfice = Bénéfice THÉORIQUE (à recevoir)

---

## 🔧 IMPLÉMENTATION TECHNIQUE

### 1️⃣ Modifier le calcul des données

**Fichier** : `src/pages/DailyReport.tsx`

```typescript
// Ajouter la récupération des ventes avec payment_method
const { data: salesData } = useSales({
  date_from: selectedDate,
  date_to: selectedDate
});

// Modifier le calcul des statistiques par produit
const productStats = new Map<string, any>();

products.forEach((product: any) => {
  productStats.set(product.id, {
    id: product.id,
    name: product.name,
    price: product.selling_price,
    costPrice: product.purchase_price,
    
    // Nouvelles propriétés
    cashSales: 0,           // Quantité vendue en cash
    creditSales: 0,         // Quantité vendue à crédit
    totalSales: 0,          // Total des ventes
    
    cashRevenue: 0,         // Revenu cash
    creditRevenue: 0,       // Revenu crédit
    totalRevenue: 0,        // Revenu total
    
    cashProfit: 0,          // Bénéfice réel (cash)
    creditProfit: 0,        // Bénéfice théorique (crédit)
    totalProfit: 0,         // Bénéfice total théorique
    
    category: product.category?.name || 'Autres'
  });
});

// Calculer à partir des ventes (pas des commandes)
salesData?.results?.forEach((sale: any) => {
  sale.items?.forEach((item: any) => {
    const productId = item.product?.id || item.product_id;
    const stats = productStats.get(productId);
    
    if (stats) {
      const quantity = item.quantity || 0;
      const revenue = quantity * stats.price;
      const cost = quantity * stats.costPrice;
      const profit = revenue - cost;
      
      // Distinguer selon le mode de paiement
      if (sale.payment_method === 'credit') {
        stats.creditSales += quantity;
        stats.creditRevenue += revenue;
        stats.creditProfit += profit;
      } else {
        // cash, card, mobile = ventes payées
        stats.cashSales += quantity;
        stats.cashRevenue += revenue;
        stats.cashProfit += profit;
      }
      
      // Totaux
      stats.totalSales = stats.cashSales + stats.creditSales;
      stats.totalRevenue = stats.cashRevenue + stats.creditRevenue;
      stats.totalProfit = stats.cashProfit + stats.creditProfit;
    }
  });
});
```

### 2️⃣ Modifier l'affichage du tableau

```typescript
<TableRow key={product.id}>
  <TableCell>{product.name}</TableCell>
  <TableCell>{product.price.toLocaleString()} FBu</TableCell>
  
  {/* Nouvelles colonnes */}
  <TableCell className="text-center">
    <div className="space-y-1">
      <div className="text-green-600 font-medium">
        💵 {product.cashSales}
      </div>
      <div className="text-blue-600 text-xs">
        🏦 {product.creditSales}
      </div>
    </div>
  </TableCell>
  
  <TableCell className="text-center">
    <div className="space-y-1">
      <div className="text-green-600 font-medium">
        {product.cashRevenue.toLocaleString()} FBu
      </div>
      <div className="text-blue-600 text-xs">
        {product.creditRevenue.toLocaleString()} FBu
      </div>
    </div>
  </TableCell>
  
  <TableCell className="text-center">
    <div className="space-y-1">
      <div className="text-green-600 font-bold">
        ✅ {product.cashProfit.toLocaleString()} FBu
      </div>
      <div className="text-blue-600 text-xs">
        ⏳ {product.creditProfit.toLocaleString()} FBu
      </div>
    </div>
  </TableCell>
</TableRow>
```

### 3️⃣ Ajouter un résumé financier

```typescript
<Card className="mt-4">
  <CardHeader>
    <CardTitle>Résumé Financier</CardTitle>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-3 gap-4">
      {/* Ventes Payées */}
      <div className="p-4 bg-green-50 rounded-lg">
        <div className="text-sm text-muted-foreground">Bénéfice Réel (Cash)</div>
        <div className="text-2xl font-bold text-green-600">
          {totalCashProfit.toLocaleString()} FBu
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Argent en caisse
        </div>
      </div>
      
      {/* Ventes à Crédit */}
      <div className="p-4 bg-blue-50 rounded-lg">
        <div className="text-sm text-muted-foreground">Bénéfice Crédit (À recevoir)</div>
        <div className="text-2xl font-bold text-blue-600">
          {totalCreditProfit.toLocaleString()} FBu
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          En attente de paiement
        </div>
      </div>
      
      {/* Total Théorique */}
      <div className="p-4 bg-purple-50 rounded-lg">
        <div className="text-sm text-muted-foreground">Bénéfice Total (Théorique)</div>
        <div className="text-2xl font-bold text-purple-600">
          {totalProfit.toLocaleString()} FBu
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Cash + Crédit
        </div>
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 📊 EXEMPLE CONCRET

### Scénario du jour

**Ventes de Coca-Cola** :
- 10 vendus en CASH à 1000 FBu = 10 000 FBu
- 5 vendus à CRÉDIT à 1000 FBu = 5 000 FBu
- Prix d'achat : 600 FBu

### Calculs

```
VENTES CASH :
- Quantité : 10
- Revenu : 10 × 1000 = 10 000 FBu
- Coût : 10 × 600 = 6 000 FBu
- Bénéfice RÉEL : 10 000 - 6 000 = 4 000 FBu ✅ (en caisse)

VENTES CRÉDIT :
- Quantité : 5
- Revenu : 5 × 1000 = 5 000 FBu
- Coût : 5 × 600 = 3 000 FBu
- Bénéfice THÉORIQUE : 5 000 - 3 000 = 2 000 FBu ⏳ (à recevoir)

TOTAL :
- Quantité : 15
- Revenu : 15 000 FBu
- Coût : 9 000 FBu
- Bénéfice TOTAL : 6 000 FBu (4 000 réel + 2 000 théorique)
```

### Affichage dans le tableau

| Produit | P.A. | P.V. | Ventes | Revenu | Bénéfice |
|---------|------|------|--------|--------|----------|
| Coca-Cola | 600 FBu | 1000 FBu | 💵 10<br>🏦 5 | 💵 10 000 FBu<br>🏦 5 000 FBu | ✅ 4 000 FBu<br>⏳ 2 000 FBu |

**Légende** :
- 💵 = Ventes payées (cash/carte/mobile)
- 🏦 = Ventes à crédit
- ✅ = Bénéfice réel (argent reçu)
- ⏳ = Bénéfice théorique (à recevoir)

---

## 🎯 AVANTAGES DE CETTE APPROCHE

### ✅ Pour le Gérant

1. **Visibilité claire** sur l'argent réellement en caisse
2. **Distinction** entre bénéfice réel et théorique
3. **Suivi** des créances par produit
4. **Décisions** basées sur les liquidités réelles

### ✅ Pour la Comptabilité

1. **Traçabilité** complète des ventes
2. **Rapprochement** facile avec la caisse
3. **Analyse** des modes de paiement
4. **Prévisions** de trésorerie

### ✅ Pour la Gestion

1. **Identification** des produits vendus à crédit
2. **Optimisation** des stocks selon le mode de paiement
3. **Politique** de crédit par produit
4. **Alertes** sur les créances importantes

---

## 🚀 PROCHAINES ÉTAPES

### Phase 1 : Modification du calcul ✅
- Récupérer les ventes avec payment_method
- Distinguer cash vs crédit dans les calculs
- Mettre à jour les statistiques

### Phase 2 : Modification de l'affichage
- Ajouter colonnes cash/crédit
- Afficher les deux types de bénéfices
- Ajouter le résumé financier

### Phase 3 : Rapports avancés
- Export PDF avec distinction cash/crédit
- Graphiques d'évolution
- Alertes sur créances importantes

---

## 📝 NOTES IMPORTANTES

### ⚠️ Points d'attention

1. **Stock** : Le stock est déduit dès la vente (cash ou crédit)
2. **Coût** : Le coût est engagé dès la vente (cash ou crédit)
3. **Bénéfice réel** : Seulement pour les ventes payées
4. **Créances** : Suivies séparément dans l'onglet "Ventes à Crédit"

### 💡 Recommandations

1. **Toujours afficher** les deux types de bénéfices
2. **Mettre en évidence** le bénéfice réel (cash)
3. **Suivre** l'évolution des créances
4. **Alerter** si les créances dépassent un seuil

---

## 🔗 LIENS UTILES

- **Page Daily Report** : `/daily-report`
- **Onglet Ventes à Crédit** : Déjà implémenté ✅
- **Documentation crédit** : `GESTION_RAPPORTS_CREDIT.md`
- **Bouton Approuver** : Fonctionnel ✅

---

**Date de création** : 6 novembre 2025
**Auteur** : Cascade AI
**Version** : 1.0
