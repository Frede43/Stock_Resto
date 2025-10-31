# 🔍 Debug: 401 sur /sales/tables/ mais pas sur /products/

## 🎯 Observation Clé

**Produits** : ✅ Fonctionne  
**Tables** : ❌ Erreur 401

Cela signifie que :
- ✅ Le token est envoyé correctement
- ✅ L'URL est correcte
- ✅ Le CORS fonctionne
- ❌ **Problème spécifique à l'endpoint `/sales/tables/`**

---

## 🔍 Hypothèses

### **Hypothèse 1: Permission différente**

**Products** utilise probablement `permissions.IsAuthenticated` (DRF standard)  
**Tables** utilise `IsAuthenticated` (custom depuis `accounts.permissions`)

**Vérification** :
```python
# backend/sales/views.py ligne 27
permission_classes = [IsAuthenticated]  # Custom

# backend/products/views.py
permission_classes = [permissions.IsAuthenticated]  # DRF standard
```

### **Hypothèse 2: Token mal formaté pour certains endpoints**

Le token JWT peut être valide mais mal interprété par certaines vues.

### **Hypothèse 3: Middleware ou authentication class**

Un middleware pourrait bloquer spécifiquement les endpoints `/sales/`.

---

## 🛠️ Actions de Debug

### **1. Ajouter des logs backend**

J'ai ajouté des logs dans `accounts/permissions.py` :

```python
class IsAuthenticated(permissions.BasePermission):
    def has_permission(self, request, view):
        print(f"🔐 IsAuthenticated Check:")
        print(f"  - User: {request.user}")
        print(f"  - Is authenticated: {request.user.is_authenticated}")
        print(f"  - Auth header: {request.META.get('HTTP_AUTHORIZATION')}")
        # ...
```

### **2. Outil de test créé**

**Fichier** : `public/test-token.html`

**Utilisation** :
1. Ouvrir : `http://localhost:5173/test-token.html` (ou en production)
2. Cliquer sur "Vérifier Token"
3. Cliquer sur "Test GET /api/products/" → Doit fonctionner ✅
4. Cliquer sur "Test GET /api/sales/tables/" → Doit échouer ❌
5. Cliquer sur "Comparer" → Voir les différences

---

## 🚀 Déploiement des Logs

```bash
# 1. Commit les changements
git add backend/accounts/permissions.py
git add public/test-token.html
git add DEBUG_401_TABLES.md
git commit -m "debug: Add logs to IsAuthenticated permission"
git push origin main

# 2. Redéployer le backend
# Dashboard Render → barstock-api → Manual Deploy → Clear cache & deploy

# 3. Tester et voir les logs
# Dashboard Render → barstock-api → Logs
```

---

## 📊 Comparaison des Endpoints

| Aspect | Products | Tables |
|--------|----------|--------|
| **URL** | `/api/products/` | `/api/sales/tables/` |
| **Permission** | `permissions.IsAuthenticated` (DRF) | `IsAuthenticated` (custom) |
| **ViewSet** | `ProductViewSet` | `TableListCreateView` |
| **Status** | ✅ 200 | ❌ 401 |

---

## 🔍 Tests à Faire

### **Test 1: Vérifier le token**

Console :
```javascript
const token = localStorage.getItem('access_token');
console.log('Token:', token ? token.substring(0, 50) + '...' : 'AUCUN');

// Décoder
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Payload:', payload);
console.log('Expiré:', payload.exp < Math.floor(Date.now() / 1000));
```

### **Test 2: Comparer les requêtes**

```javascript
// Test Products (fonctionne)
fetch('https://barstock-api.onrender.com/api/products/', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
}).then(r => console.log('Products:', r.status));

// Test Tables (ne fonctionne pas)
fetch('https://barstock-api.onrender.com/api/sales/tables/', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
    }
}).then(r => console.log('Tables:', r.status));
```

### **Test 3: Voir les logs backend**

1. Dashboard Render → `barstock-api` → Logs
2. Créer une table depuis l'app
3. Chercher dans les logs :
   ```
   🔐 IsAuthenticated Check:
     - User: AnonymousUser  ← Si c'est ça, le token n'est pas reconnu
     - Is authenticated: False
     - Auth header: NO AUTH HEADER  ← Si c'est ça, le header n'arrive pas
   ```

---

## 🎯 Solutions Possibles

### **Solution 1: Utiliser la permission DRF standard**

```python
# backend/sales/views.py ligne 19
from rest_framework import permissions

class TableListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated]  # DRF standard
```

### **Solution 2: Vérifier l'authentication class**

```python
# backend/barstock_api/settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
}
```

### **Solution 3: Ajouter AllowAny temporairement pour debug**

```python
# backend/sales/views.py
from rest_framework import permissions

class TableListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.AllowAny]  # TEMPORAIRE POUR DEBUG
```

Puis tester. Si ça fonctionne, c'est bien un problème de permission.

---

## 📝 Prochaines Étapes

1. ✅ Commit et push les logs
2. ✅ Redéployer le backend
3. ⏳ Tester avec `test-token.html`
4. ⏳ Voir les logs backend sur Render
5. ⏳ Identifier la cause exacte
6. ⏳ Appliquer la solution

---

**Date**: 30 octobre 2025  
**Status**: 🔍 En cours d'investigation
