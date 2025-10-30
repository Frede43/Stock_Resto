# 🚀 Déploiement du Fix 401

## 📋 Changements à Déployer

### **1. Frontend** (`src/services/api.ts`)
- ✅ Ligne 75: `this.baseURL` au lieu de `API_BASE_URL`
- ✅ Lignes 194-203: `this.baseURL` dans `login()`

### **2. Backend** (`backend/barstock_api/settings.py`)
- ✅ CORS_ALLOWED_ORIGINS inclut les URLs Render

---

## 🚀 Étapes de Déploiement

### **Étape 1: Commit et Push**

```bash
# Vérifier le statut
git status

# Si des changements non commités
git add src/services/api.ts
git add backend/barstock_api/settings.py
git commit -m "fix: Use this.baseURL for API requests and add production CORS"
git push origin main
```

### **Étape 2: Forcer le Redéploiement sur Render**

#### **Pour le Backend (barstock-api)**
1. Aller sur https://dashboard.render.com
2. Cliquer sur `barstock-api`
3. Cliquer sur **"Manual Deploy"** (en haut à droite)
4. Sélectionner **"Clear build cache & deploy"**
5. Cliquer sur **"Deploy"**
6. Attendre 2-3 minutes

#### **Pour le Frontend (barstock-web)**
1. Aller sur https://dashboard.render.com
2. Cliquer sur `barstock-web` (ou `barstock-web-v2`)
3. Cliquer sur **"Manual Deploy"** (en haut à droite)
4. Sélectionner **"Clear build cache & deploy"** ⚠️ IMPORTANT
5. Cliquer sur **"Deploy"**
6. Attendre 3-5 minutes

---

## 🧪 Test Après Déploiement

### **Test 1: Vérifier l'URL dans les logs**

1. Ouvrir https://barstock-web.onrender.com
2. Ouvrir la console (F12)
3. Se connecter
4. Chercher dans les logs :

```javascript
🚀 Requête API: {
  method: "POST",
  url: "https://barstock-api.onrender.com/api/sales/tables/",  // ✅ Doit être Render, pas localhost
  baseURL: "https://barstock-api.onrender.com/api",
  hasToken: true
}
```

### **Test 2: Créer une table**

1. Aller sur `/sales`
2. Cliquer sur "Nouvelle table"
3. Nom: "Table 1", Capacité: 4
4. Cliquer sur "Créer"
5. ✅ **Doit fonctionner sans erreur 401**

---

## ⚠️ Si l'erreur persiste

### **Problème: Cache du navigateur**

```javascript
// Dans la console
localStorage.clear();
sessionStorage.clear();
location.reload(true);  // Force reload sans cache
```

Ou ouvrir en **navigation privée** :
- Chrome: `Ctrl + Shift + N`
- Firefox: `Ctrl + Shift + P`

### **Problème: Render n'a pas rebuild**

Vérifier les logs de déploiement :
1. Dashboard → `barstock-web` → Logs
2. Chercher :
   ```
   Building...
   ✓ built in 2m 4s
   Deploying...
   ✓ Live
   ```

Si pas de nouveau build, forcer à nouveau avec **Clear cache**.

### **Problème: Variable d'environnement manquante**

1. Dashboard → `barstock-web` → Environment
2. Vérifier :
   ```
   VITE_API_URL = https://barstock-api.onrender.com
   ```
3. Si manquante, l'ajouter et redéployer

---

## 🔍 Debug Avancé

### **Vérifier le code déployé**

Console sur https://barstock-web.onrender.com :

```javascript
// Vérifier l'URL de l'API
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
// Doit afficher: https://barstock-api.onrender.com

// Vérifier le baseURL dans l'instance API
// (Nécessite d'accéder à l'instance, pas toujours possible)
```

### **Tester directement avec fetch**

```javascript
const token = localStorage.getItem('access_token');

fetch('https://barstock-api.onrender.com/api/sales/tables/', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        name: 'Table Test',
        capacity: 4
    })
})
.then(r => {
    console.log('Status:', r.status);
    return r.json();
})
.then(data => console.log('✅ Succès:', data))
.catch(err => console.error('❌ Erreur:', err));
```

Si ça fonctionne avec `fetch` direct mais pas avec l'app, c'est un problème de **cache du build**.

---

## 📊 Checklist

- [ ] Code `api.ts` modifié localement ✅
- [ ] Code `settings.py` modifié localement ✅
- [ ] Changements commités et pushés
- [ ] Backend redéployé sur Render (avec clear cache)
- [ ] Frontend redéployé sur Render (avec clear cache)
- [ ] Cache navigateur effacé
- [ ] Test en navigation privée
- [ ] Logs montrent la bonne URL (Render, pas localhost)
- [ ] Création de table fonctionne

---

## 🎯 Commandes Rapides

```bash
# 1. Commit et push
git add .
git commit -m "fix: API URL and CORS for production"
git push origin main

# 2. Attendre 30 secondes

# 3. Forcer le redéploiement
# Aller sur Render Dashboard
# barstock-api → Manual Deploy → Clear cache & deploy
# barstock-web → Manual Deploy → Clear cache & deploy

# 4. Attendre 3-5 minutes

# 5. Tester en navigation privée
# https://barstock-web.onrender.com
```

---

**Date**: 30 octobre 2025  
**Status**: 🔧 En attente de déploiement
