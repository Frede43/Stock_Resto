# 📊 Rapport Journalier - Colonnes Cash/Crédit

## ✅ Modifications Implémentées

### **Page concernée** : `/daily-report` → Onglet "Boissons & Cuisine"

---

## 🎯 Nouvelles Fonctionnalités

### **1. Colonnes Ajoutées**

Deux nouvelles colonnes ont été ajoutées au tableau :

| Colonne | Description | Couleur |
|---------|-------------|---------|
| **Conso. Cash** | Quantité vendue en espèces, carte bancaire ou mobile money | 🟢 Vert |
| **Conso. Crédit** | Quantité vendue à crédit (en attente de paiement) | 🔵 Bleu |

**Position** : Après la colonne "Consommation" et avant "Stock Restant"

### **2. Format du Bénéfice Modifié**

La colonne "BENEF" affiche maintenant :

```
Format: [Total] FBu
        (dont [Crédit] FBu en attente)
```

**Exemple** :
- Si Brochette a 1 vente cash (3000 FBu de bénéfice) et 1 vente crédit (3000 FBu de bénéfice)
- Affichage : 
  ```
  6000 FBu
  (dont 3000 FBu en attente)
  ```

---

## 📋 Structure du Tableau

### **En-tête**

```
PRODUIT | Prix Unitaire | Stock Initial | Entrée Stock | Stock Total | 
Consommation | Conso. Cash | Conso. Crédit | Stock Restant | P.A. | P.V. | 
Stock Vendu | MAR | BENEF
```

### **Exemple de Ligne**

| Produit | ... | Consommation | Conso. Cash | Conso. Crédit | ... | BENEF |
|---------|-----|--------------|-------------|---------------|-----|-------|
| Brochette | ... | 2 | **1** 🟢 | **1** 🔵 | ... | 6000 FBu<br>(dont 3000 FBu en attente) |

---

## 🎨 Mise en Forme

### **Colonnes Cash**
- Fond : `bg-green-50` (clair) / `bg-green-950/30` (sombre)
- Texte : `text-green-700` (clair) / `text-green-400` (sombre)

### **Colonnes Crédit**
- Fond : `bg-blue-50` (clair) / `bg-blue-950/30` (sombre)
- Texte : `text-blue-700` (clair) / `text-blue-400` (sombre)

### **Bénéfice en Attente**
- Taille : `text-xs` (petit)
- Couleur : `text-blue-600` (clair) / `text-blue-400` (sombre)
- Format : Entre parenthèses avec "dont ... en attente"

---

## 🔍 Logique de Calcul

### **Consommation Cash**
Somme des quantités vendues avec les méthodes de paiement :
- ✅ `cash` (Espèces)
- ✅ `card` (Carte bancaire)
- ✅ `mobile` (Mobile Money)
- ✅ `bank_transfer` (Virement bancaire)

### **Consommation Crédit**
Somme des quantités vendues avec :
- ✅ `credit` (Vente à crédit approuvée)
- ❌ Exclut les ventes annulées (`status === 'cancelled'`)

### **Bénéfice**
```javascript
Bénéfice Total = Bénéfice Cash + Bénéfice Crédit

Si Bénéfice Crédit > 0:
  Afficher: "Total (dont Crédit en attente)"
Sinon:
  Afficher: "Total"
```

---

## 📊 Sous-totaux et Totaux

### **Sous-total par Catégorie**
- Somme des consommations cash de tous les produits de la catégorie
- Somme des consommations crédit de tous les produits de la catégorie
- Bénéfice total avec indication du montant en attente

### **Total Général**
- Somme de toutes les consommations cash
- Somme de toutes les consommations crédit
- Bénéfice total avec indication du montant en attente

---

## 🧪 Scénarios de Test

### **Scénario 1 : Vente Cash Uniquement**
```
Produit: Brochette
Conso. Cash: 5
Conso. Crédit: 0
Bénéfice: 15000 FBu
```
✅ Pas de mention "en attente"

### **Scénario 2 : Vente Crédit Uniquement**
```
Produit: Brochette
Conso. Cash: 0
Conso. Crédit: 3
Bénéfice: 9000 FBu
         (dont 9000 FBu en attente)
```
✅ Tout le bénéfice est en attente

### **Scénario 3 : Vente Mixte (Cash + Crédit)**
```
Produit: Brochette
Conso. Cash: 2
Conso. Crédit: 1
Bénéfice: 9000 FBu
         (dont 3000 FBu en attente)
```
✅ Affichage du total avec montant en attente

### **Scénario 4 : Paiement d'une Vente Crédit**
```
Avant paiement:
  Conso. Cash: 0
  Conso. Crédit: 1
  Bénéfice: 3000 FBu (dont 3000 FBu en attente)

Après paiement:
  Conso. Cash: 0
  Conso. Crédit: 1
  Bénéfice: 3000 FBu (dont 3000 FBu en attente)
```
⚠️ **Note** : Le paiement ne change PAS la consommation crédit (elle reste à crédit)
Le bénéfice reste "en attente" jusqu'au paiement effectif

---

## 💡 Comprendre les Colonnes

### **Consommation** (Colonne existante)
- Total des quantités vendues (Cash + Crédit)
- Correspond au stock sorti

### **Conso. Cash** (Nouvelle)
- Quantités vendues avec paiement immédiat
- Argent déjà en caisse

### **Conso. Crédit** (Nouvelle)
- Quantités vendues à crédit
- Argent à recevoir

### **Relation**
```
Consommation = Conso. Cash + Conso. Crédit
```

---

## 🎯 Objectif Atteint

Le caissier peut maintenant :
1. ✅ Voir combien de produits ont été vendus en cash
2. ✅ Voir combien de produits ont été vendus à crédit
3. ✅ Connaître le bénéfice total (cash + crédit)
4. ✅ Connaître le montant exact en attente de paiement

**Exemple concret** :
```
Brochette:
- Conso. Cash: 10 → 30000 FBu de bénéfice en caisse
- Conso. Crédit: 5 → 15000 FBu de bénéfice en attente
- BENEF: 45000 FBu (dont 15000 FBu en attente)
```

Le caissier sait qu'il a **30000 FBu en caisse** et **15000 FBu à recevoir**.

---

## 📝 Fichiers Modifiés

- `src/pages/DailyReport.tsx`
  - Ajout de 2 colonnes dans le tableau (lignes 1784-1785)
  - Modification du format de la colonne Bénéfice (lignes 1870-1883)
  - Mise à jour des sous-totaux (lignes 1897-1957)
  - Mise à jour du total général (lignes 1980-2034)

---

## 🚀 Prochaines Étapes

Pour tester :
1. Ouvrir `http://localhost:5173/daily-report`
2. Sélectionner une date
3. Aller dans l'onglet "Boissons & Cuisine"
4. Vérifier les nouvelles colonnes "Conso. Cash" et "Conso. Crédit"
5. Vérifier le format du bénéfice avec "(dont X en attente)"

---

**Date de mise à jour** : 7 novembre 2025
**Version** : 1.0
