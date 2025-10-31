# 🍽️ Impact du Menu Cuisine sur les Ventes

## 📋 Vue d'Ensemble

Le **Menu Cuisine** (Kitchen) et les **Ventes** (Sales) sont **étroitement liés** dans votre application. Voici comment ils interagissent :

---

## 🔄 Flux Complet : De la Cuisine à la Vente

```
┌─────────────────────────────────────────────────────────────────┐
│                    MENU CUISINE (Kitchen)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. INGRÉDIENTS                                                  │
│     ├─ Tomates (5 kg)                                           │
│     ├─ Oignons (3 kg)                                           │
│     ├─ Fromage (2 kg)                                           │
│     └─ Pâte à pizza (10 portions)                               │
│                                                                  │
│  2. RECETTES                                                     │
│     ├─ Pizza Margherita                                          │
│     │  ├─ Tomates: 200g                                         │
│     │  ├─ Fromage: 150g                                         │
│     │  └─ Pâte: 1 portion                                       │
│     │  → Coût: 3,500 BIF                                        │
│     │  → Prix vente: 15,000 BIF                                 │
│     │  → Marge: 11,500 BIF (329%)                               │
│     │                                                            │
│     └─ Pizza 4 Fromages                                          │
│        ├─ Fromage: 250g                                         │
│        ├─ Pâte: 1 portion                                       │
│        └─ Oignons: 50g                                          │
│        → Coût: 4,200 BIF                                        │
│        → Prix vente: 18,000 BIF                                 │
│        → Marge: 13,800 BIF (329%)                               │
│                                                                  │
│  3. PRODUITS (Menu)                                              │
│     ├─ Pizza Margherita (15,000 BIF)                            │
│     ├─ Pizza 4 Fromages (18,000 BIF)                            │
│     ├─ Coca-Cola (2,000 BIF)                                    │
│     └─ Fanta (2,000 BIF)                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ VENTE
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                      VENTE (Sales)                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Client: Jean Dupont                                             │
│  Table: 5                                                        │
│  Serveur: Marie                                                  │
│                                                                  │
│  Panier:                                                         │
│  ├─ 2x Pizza Margherita = 30,000 BIF                            │
│  ├─ 1x Pizza 4 Fromages = 18,000 BIF                            │
│  └─ 3x Coca-Cola = 6,000 BIF                                    │
│                                                                  │
│  Total: 54,000 BIF                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓ PAIEMENT
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  IMPACT SUR LA CUISINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  DÉDUCTION AUTOMATIQUE DES INGRÉDIENTS:                          │
│                                                                  │
│  Pizza Margherita (x2):                                          │
│  ├─ Tomates: -400g (5kg → 4.6kg)                               │
│  ├─ Fromage: -300g (2kg → 1.7kg)                               │
│  └─ Pâte: -2 portions (10 → 8)                                 │
│                                                                  │
│  Pizza 4 Fromages (x1):                                          │
│  ├─ Fromage: -250g (1.7kg → 1.45kg)                            │
│  ├─ Pâte: -1 portion (8 → 7)                                   │
│  └─ Oignons: -50g (3kg → 2.95kg)                               │
│                                                                  │
│  ALERTES GÉNÉRÉES:                                               │
│  ⚠️ Fromage: Stock faible (1.45kg < 2kg seuil)                 │
│  ✅ Tomates: OK (4.6kg > 1kg seuil)                             │
│  ✅ Oignons: OK (2.95kg > 0.5kg seuil)                          │
│  ⚠️ Pâte: Stock faible (7 < 10 seuil)                          │
│                                                                  │
│  LISTE D'ACHATS MISE À JOUR:                                     │
│  📝 Acheter 2kg de Fromage (priorité: haute)                    │
│  📝 Acheter 5 portions de Pâte (priorité: moyenne)              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Les 3 Niveaux d'Impact

### **Niveau 1 : INGRÉDIENTS → RECETTES** 🥘

**Objectif** : Calculer le coût réel de chaque plat

```typescript
Recette: Pizza Margherita
├─ Tomates (200g × 1,000 BIF/kg) = 200 BIF
├─ Fromage (150g × 8,000 BIF/kg) = 1,200 BIF
├─ Pâte (1 portion × 2,000 BIF) = 2,000 BIF
└─ Sauce (50ml × 200 BIF/L) = 10 BIF
    ↓
COÛT TOTAL: 3,410 BIF
```

**Impact** :
- ✅ Vous connaissez le **coût réel** de chaque plat
- ✅ Vous pouvez calculer la **marge bénéficiaire**
- ✅ Vous pouvez ajuster les **prix de vente**

---

### **Niveau 2 : RECETTES → PRODUITS (Menu)** 📋

**Objectif** : Créer le menu avec les prix de vente

```typescript
Produit: Pizza Margherita
├─ Coût ingrédients: 3,410 BIF (calculé depuis recette)
├─ Prix de vente: 15,000 BIF (défini par vous)
└─ Marge: 11,590 BIF (340%)
    ↓
AFFICHÉ DANS LE MENU
```

**Impact** :
- ✅ Le **prix d'achat** est calculé automatiquement
- ✅ Vous voyez la **rentabilité** de chaque plat
- ✅ Vous pouvez optimiser votre **menu**

---

### **Niveau 3 : PRODUITS → VENTES** 💰

**Objectif** : Vendre et déduire automatiquement les ingrédients

```typescript
Vente: 2x Pizza Margherita
    ↓
DÉDUCTION AUTOMATIQUE:
├─ Tomates: -400g
├─ Fromage: -300g
├─ Pâte: -2 portions
└─ Sauce: -100ml
    ↓
ALERTES SI STOCK FAIBLE
```

**Impact** :
- ✅ **Stock mis à jour automatiquement**
- ✅ **Alertes** si ingrédients manquants
- ✅ **Liste d'achats** générée automatiquement

---

## 📊 Exemple Concret

### **Situation Initiale**

```
STOCK CUISINE:
├─ Tomates: 10 kg (seuil: 2 kg)
├─ Fromage: 5 kg (seuil: 1 kg)
├─ Pâte: 20 portions (seuil: 5 portions)
└─ Oignons: 8 kg (seuil: 1 kg)

RECETTES:
├─ Pizza Margherita (Tomates 200g + Fromage 150g + Pâte 1)
└─ Pizza 4 Fromages (Fromage 250g + Pâte 1 + Oignons 50g)

MENU:
├─ Pizza Margherita: 15,000 BIF
└─ Pizza 4 Fromages: 18,000 BIF
```

---

### **Journée de Ventes**

```
VENTE 1 (Table 1):
├─ 3x Pizza Margherita
└─ 2x Pizza 4 Fromages
    ↓
DÉDUCTION:
├─ Tomates: -600g (10kg → 9.4kg) ✅
├─ Fromage: -950g (5kg → 4.05kg) ✅
├─ Pâte: -5 portions (20 → 15) ✅
└─ Oignons: -100g (8kg → 7.9kg) ✅

VENTE 2 (Table 3):
├─ 5x Pizza Margherita
└─ 3x Pizza 4 Fromages
    ↓
DÉDUCTION:
├─ Tomates: -1kg (9.4kg → 8.4kg) ✅
├─ Fromage: -1.5kg (4.05kg → 2.55kg) ✅
├─ Pâte: -8 portions (15 → 7) ⚠️ ALERTE
└─ Oignons: -150g (7.9kg → 7.75kg) ✅

VENTE 3 (Table 5):
├─ 8x Pizza Margherita
└─ 4x Pizza 4 Fromages
    ↓
DÉDUCTION:
├─ Tomates: -1.6kg (8.4kg → 6.8kg) ✅
├─ Fromage: -2.2kg (2.55kg → 0.35kg) 🚨 CRITIQUE
├─ Pâte: -12 portions (7 → -5) ❌ RUPTURE
└─ Oignons: -200g (7.75kg → 7.55kg) ✅
```

---

### **Résultat Final**

```
STOCK APRÈS VENTES:
├─ Tomates: 6.8 kg ✅ OK
├─ Fromage: 0.35 kg 🚨 CRITIQUE (< 1kg seuil)
├─ Pâte: -5 portions ❌ RUPTURE
└─ Oignons: 7.55 kg ✅ OK

ALERTES GÉNÉRÉES:
🚨 CRITIQUE: Fromage en rupture imminente (0.35kg)
❌ RUPTURE: Pâte épuisée (-5 portions)

LISTE D'ACHATS:
📝 URGENT: Acheter 10kg de Fromage
📝 URGENT: Acheter 30 portions de Pâte

IMPACT SUR LES VENTES:
⚠️ Pizza Margherita: INDISPONIBLE (manque Pâte)
⚠️ Pizza 4 Fromages: INDISPONIBLE (manque Pâte et Fromage)

CHIFFRE D'AFFAIRES:
├─ Vente 1: 81,000 BIF
├─ Vente 2: 129,000 BIF
├─ Vente 3: 192,000 BIF
└─ TOTAL: 402,000 BIF

COÛT INGRÉDIENTS:
├─ Tomates: 3,200 BIF
├─ Fromage: 37,200 BIF
├─ Pâte: 50,000 BIF
├─ Oignons: 450 BIF
└─ TOTAL: 90,850 BIF

MARGE BRUTE: 311,150 BIF (77%)
```

---

## 🔧 Fonctionnalités Actuelles

### **1. Gestion des Ingrédients** 📦

**Page** : `/kitchen` → Onglet "Ingrédients"

**Fonctionnalités** :
- ✅ Ajouter/modifier ingrédients
- ✅ Définir seuils d'alerte
- ✅ Voir stock en temps réel
- ✅ Alertes automatiques (critique/warning)

**Code** :
```typescript
// Ajouter un ingrédient
await createIngredient({
  nom: "Tomates",
  quantite_restante: 10,
  unite: "kg",
  seuil_alerte: 2,
  prix_unitaire: 1000
});
```

---

### **2. Gestion des Recettes** 🥘

**Page** : `/kitchen` → Onglet "Recettes"

**Fonctionnalités** :
- ✅ Créer recettes avec ingrédients
- ✅ Calculer coût automatique
- ✅ Voir portions possibles
- ✅ Identifier ingrédient limitant

**Code** :
```typescript
// Créer une recette
await createRecipe({
  nom_recette: "Pizza Margherita",
  plat: productId,
  ingredients: [
    { ingredient: 1, quantite_utilisee_par_plat: 200, unite: "g" },
    { ingredient: 2, quantite_utilisee_par_plat: 150, unite: "g" }
  ]
});
```

---

### **3. Déduction Automatique** 🔄

**Quand** : Lors du paiement d'une vente

**Fonctionnalités** :
- ✅ Déduction automatique des ingrédients
- ✅ Mise à jour stock en temps réel
- ✅ Génération alertes si stock faible
- ✅ Liste d'achats mise à jour

**Code** (Backend) :
```python
# backend/sales/signals.py
@receiver(post_save, sender=Sale)
def update_ingredient_stock(sender, instance, **kwargs):
    if instance.status == 'paid':
        for item in instance.items.all():
            recipe = item.product.recipe
            if recipe:
                for ing in recipe.ingredients.all():
                    ingredient = ing.ingredient
                    quantity_used = ing.quantite_utilisee_par_plat * item.quantity
                    ingredient.quantite_restante -= quantity_used
                    ingredient.save()
```

---

### **4. Analyse Rentabilité** 💰

**Page** : `/kitchen` → Onglet "Rentabilité"

**Fonctionnalités** :
- ✅ Coût réel par plat
- ✅ Prix de vente
- ✅ Marge bénéficiaire
- ✅ Recommandations prix

**Calcul** :
```typescript
Coût ingrédients: 3,410 BIF
Prix vente: 15,000 BIF
Marge: 11,590 BIF
Pourcentage: 340%
```

---

### **5. Prévision Production** 📊

**Page** : `/kitchen` → Onglet "Production"

**Fonctionnalités** :
- ✅ Portions possibles par recette
- ✅ Ingrédient limitant
- ✅ Recommandations achats

**Exemple** :
```
Pizza Margherita:
├─ Stock Tomates: 10kg → 50 pizzas possibles
├─ Stock Fromage: 5kg → 33 pizzas possibles
├─ Stock Pâte: 20 portions → 20 pizzas possibles ⚠️ LIMITANT
└─ MAXIMUM: 20 pizzas (limité par Pâte)
```

---

## 🎯 Impact sur le Business

### **Avant (Sans Système Cuisine)**

```
❌ Prix de vente au hasard
❌ Pas de suivi des coûts
❌ Stock non géré
❌ Ruptures fréquentes
❌ Pertes inconnues
❌ Rentabilité inconnue

RÉSULTAT:
- Pertes d'argent
- Clients mécontents
- Gaspillage
```

### **Après (Avec Système Cuisine)**

```
✅ Prix basés sur coûts réels
✅ Marges optimisées
✅ Stock géré automatiquement
✅ Alertes préventives
✅ Liste d'achats automatique
✅ Rentabilité connue

RÉSULTAT:
- Profits maximisés
- Clients satisfaits
- Moins de gaspillage
- Meilleure gestion
```

---

## 🚀 Mode Offline

**Bonne nouvelle** : Tout fonctionne offline !

### **Avec les Hooks Créés**

```typescript
// Hook offline pour cuisine
const { createOrder, markAsReady } = useOfflineKitchen();

// Créer commande offline
await createOrder({
  table_id: 5,
  items: [{ product_id: 10, quantity: 2 }]
});

// Hook offline pour stocks
const { recordSaleStockMovements } = useOfflineStocks();

// Déduire ingrédients offline
await recordSaleStockMovements(saleItems, saleId);
```

**Synchronisation** :
- ✅ Commandes sauvegardées localement
- ✅ Déductions stock en attente
- ✅ Sync automatique quand internet revient

---

## 📝 Résumé

### **Le Lien Cuisine → Ventes**

```
INGRÉDIENTS
    ↓ (composent)
RECETTES
    ↓ (définissent coût)
PRODUITS (Menu)
    ↓ (vendus dans)
VENTES
    ↓ (déduisent)
INGRÉDIENTS (mise à jour stock)
```

### **Impact Concret**

1. **Vous ajoutez des ingrédients** → Stock cuisine mis à jour
2. **Vous créez des recettes** → Coût calculé automatiquement
3. **Vous définissez les produits** → Prix basés sur coûts
4. **Client commande** → Vente créée
5. **Client paie** → Ingrédients déduits automatiquement
6. **Stock faible** → Alerte générée
7. **Liste d'achats** → Mise à jour automatique

---

## ✅ Conclusion

**Le menu cuisine impacte DIRECTEMENT les ventes en :**

1. ✅ **Calculant les coûts réels** de chaque plat
2. ✅ **Optimisant les prix de vente** pour maximiser les marges
3. ✅ **Déduisant automatiquement** les ingrédients après chaque vente
4. ✅ **Générant des alertes** quand le stock est faible
5. ✅ **Créant la liste d'achats** automatiquement
6. ✅ **Empêchant les ruptures** de stock
7. ✅ **Maximisant la rentabilité** du restaurant

**C'est un système complet et automatisé qui relie la cuisine aux ventes ! 🎉**

---

**Date** : 31 octobre 2025  
**Version** : 2.2.0  
**Status** : ✅ **Documenté et expliqué**
