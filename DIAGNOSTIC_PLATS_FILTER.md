# 🔍 Diagnostic : Filtre des Plats - Guide de Résolution

## 📋 Problème

**Local** : Affiche "Aucun plat disponible"  
**Production** : Affiche toutes les boissons au lieu des plats

---

## 🧪 Étape 1 : Diagnostic avec les Logs

### **1.1 Ouvrir la Console du Navigateur**

1. Aller sur http://localhost:5173/kitchen
2. Appuyer sur **F12** pour ouvrir les DevTools
3. Aller dans l'onglet **Console**
4. Cliquer sur "Créer une Nouvelle Recette"
5. Observer les logs

### **1.2 Logs Attendus**

Vous devriez voir :

```
🔍 Total products loaded: 20
📦 All products: [{id: 1, name: "Pizza", category: 5, category_name: "Plats", category_type: "plats"}, ...]
🍽️ Product: Pizza Margherita | Type: plats | Name: Plats
✅ KEPT: Pizza Margherita
🍽️ Product: Amstel blonde | Type: boissons | Name: Boissons
✅ Filtered food products: 5 out of 20
🍽️ Food products: ["Pizza Margherita", "Riz au Poulet", ...]
```

### **1.3 Analyser les Logs**

**Si vous voyez** :
```
🔍 Total products loaded: 0
```
→ **Problème** : Les produits ne sont pas chargés depuis l'API

**Si vous voyez** :
```
🍽️ Product: Pizza | Type: undefined | Name: undefined
```
→ **Problème** : Le backend n'envoie pas `category_type` et `category_name`

**Si vous voyez** :
```
🍽️ Product: Pizza | Type: food | Name: Food
```
→ **Problème** : Les catégories utilisent des noms différents

---

## 🔧 Étape 2 : Vérifier la Base de Données

### **2.1 Vérifier les Catégories**

Connectez-vous à votre base de données et exécutez :

```sql
SELECT id, name, type FROM products_category;
```

**Résultat attendu** :
```
id | name      | type
---|-----------|----------
1  | Boissons  | boissons
2  | Plats     | plats
3  | Snacks    | snacks
```

**Si différent** : Notez les valeurs exactes de `type` et `name`.

---

### **2.2 Vérifier les Produits**

```sql
SELECT p.id, p.name, c.name as category_name, c.type as category_type
FROM products_product p
JOIN products_category c ON p.category_id = c.id
LIMIT 10;
```

**Résultat attendu** :
```
id | name              | category_name | category_type
---|-------------------|---------------|---------------
1  | Pizza Margherita  | Plats         | plats
2  | Amstel blonde     | Boissons      | boissons
```

---

## 🔧 Étape 3 : Vérifier l'API Backend

### **3.1 Tester l'Endpoint Products**

Ouvrez dans votre navigateur ou Postman :

```
http://127.0.0.1:8000/api/products/
```

**Réponse attendue** :
```json
{
  "count": 20,
  "results": [
    {
      "id": 1,
      "name": "Pizza Margherita",
      "category": 2,
      "category_name": "Plats",
      "category_type": "plats",
      "selling_price": "15000.00"
    },
    {
      "id": 2,
      "name": "Amstel blonde 65cl",
      "category": 1,
      "category_name": "Boissons",
      "category_type": "boissons",
      "selling_price": "2000.00"
    }
  ]
}
```

**Vérifier** :
- ✅ `category_name` est présent
- ✅ `category_type` est présent
- ✅ Les valeurs sont correctes

---

## 🔧 Solutions selon le Diagnostic

### **Cas 1 : category_type manquant dans l'API**

**Problème** : Le serializer n'envoie pas `category_type`

**Solution** : Vérifier `backend/products/serializers.py` :

```python
class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_type = serializers.CharField(source='category.type', read_only=True)  # ← Doit être présent
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'category', 'category_name', 'category_type',  # ← Doit être dans fields
            # ... autres champs
        ]
```

---

### **Cas 2 : Type de catégorie différent**

**Problème** : Vos catégories utilisent un type différent (ex: "food" au lieu de "plats")

**Solution** : Modifier le filtre dans `Kitchen.tsx` :

```typescript
const isFood = categoryType === 'VOTRE_TYPE_ICI' ||  // ← Remplacer par votre type
               categoryName === 'VOTRE_NOM_ICI';     // ← Remplacer par votre nom
```

---

### **Cas 3 : Produits non chargés**

**Problème** : `productsData` est vide ou undefined

**Solution** : Vérifier le hook `useProducts()` dans `Kitchen.tsx` :

```typescript
const { data: productsData, isLoading, error } = useProducts();

console.log('Products data:', productsData);
console.log('Is loading:', isLoading);
console.log('Error:', error);
```

---

### **Cas 4 : Catégories avec majuscules**

**Problème** : Les catégories sont "Plats" (avec majuscule) au lieu de "plats"

**Solution** : Le filtre actuel gère déjà ce cas :

```typescript
const isFood = categoryType === 'plats' || 
               categoryType === 'Plats' ||  // ← Gère la majuscule
               categoryName === 'Plats' ||
               categoryName === 'plats';
```

---

## 🔧 Étape 4 : Correction Manuelle si Nécessaire

### **Si les catégories utilisent des noms différents**

Modifiez `src/pages/Kitchen.tsx` ligne ~199 :

```typescript
// AVANT
const isFood = categoryType === 'plats' || 
               categoryType === 'Plats' ||
               categoryName === 'Plats' ||
               categoryName === 'plats' ||
               categoryName?.toLowerCase().includes('plat');

// APRÈS (exemple si vos catégories utilisent "food")
const isFood = categoryType === 'food' ||           // ← Votre type
               categoryType === 'Food' ||
               categoryName === 'Food' ||
               categoryName === 'food' ||
               categoryName?.toLowerCase().includes('food');
```

---

## 📝 Checklist de Diagnostic

Cochez au fur et à mesure :

### **Backend**
- [ ] Les catégories existent dans la BD avec `type = 'plats'`
- [ ] Les produits sont liés aux bonnes catégories
- [ ] L'API `/api/products/` retourne `category_type` et `category_name`
- [ ] Le serializer inclut ces champs

### **Frontend**
- [ ] Les produits sont chargés (`productsData` non vide)
- [ ] Les logs montrent les bonnes valeurs de `category_type`
- [ ] Le filtre utilise les bonnes valeurs pour comparer
- [ ] Le build est réussi sans erreurs

---

## 🎯 Actions Immédiates

### **1. Copier ce script de diagnostic**

Ajoutez temporairement dans `Kitchen.tsx` après la ligne 179 :

```typescript
// 🔍 DIAGNOSTIC TEMPORAIRE - À RETIRER APRÈS
React.useEffect(() => {
  if (productsData) {
    console.log('='.repeat(80));
    console.log('🔍 DIAGNOSTIC COMPLET');
    console.log('='.repeat(80));
    
    const products = Array.isArray(productsData) ? productsData : productsData?.results || [];
    
    console.log('📊 Nombre total de produits:', products.length);
    console.log('');
    
    products.forEach((product: any, index: number) => {
      console.log(`Produit ${index + 1}:`);
      console.log('  - Nom:', product.name);
      console.log('  - Category ID:', product.category);
      console.log('  - Category Name:', product.category_name);
      console.log('  - Category Type:', product.category_type);
      console.log('  - Est un plat?', 
        product.category_type === 'plats' || 
        product.category_name === 'Plats'
      );
      console.log('');
    });
    
    console.log('='.repeat(80));
  }
}, [productsData]);
```

### **2. Tester et Noter les Résultats**

1. Lancer `npm run dev`
2. Ouvrir http://localhost:5173/kitchen
3. Ouvrir la console (F12)
4. Cliquer sur "Créer une Nouvelle Recette"
5. **Copier TOUS les logs** et me les envoyer

---

## 📧 Informations à Fournir

Pour que je puisse vous aider davantage, envoyez-moi :

1. **Les logs complets de la console** (copier-coller)
2. **Le résultat de la requête SQL** sur les catégories
3. **Le résultat de l'API** `/api/products/` (premiers produits)
4. **Screenshot** de la console avec les logs

---

## ✅ Solution Finale

Une fois le diagnostic fait, je pourrai vous donner la solution exacte adaptée à votre configuration.

---

**Date** : 1er novembre 2025  
**Version** : 2.3.2  
**Status** : 🔍 **Diagnostic en cours**
