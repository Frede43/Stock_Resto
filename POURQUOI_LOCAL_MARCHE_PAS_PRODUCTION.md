# 🔍 Pourquoi ça marche en LOCAL mais pas en PRODUCTION ?

## 🎯 Situation

- ✅ **Local** (`http://localhost:5173/tables`) : **Fonctionne parfaitement**
- ❌ **Production** (`https://barstock-web.onrender.com/tables`) : **Ne fonctionne pas**

---

## 💡 Explication : Le Proxy Vite

### **En LOCAL (Développement)**

Quand vous lancez `npm run dev`, Vite démarre un **serveur de développement** avec un **proxy** configuré :

```typescript
// vite.config.ts lignes 15-20
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8000',  // ← Proxy automatique
      changeOrigin: true,
    }
  }
}
```

**Ce que ça fait** :
1. Votre code frontend fait une requête vers `/api/sales/tables/`
2. Vite **intercepte** automatiquement cette requête
3. Vite **redirige** vers `http://127.0.0.1:8000/api/sales/tables/`
4. ✅ **Ça fonctionne !**

### **En PRODUCTION (Build)**

Quand vous faites `npm run build`, Vite crée des **fichiers statiques** (HTML, JS, CSS) dans le dossier `dist/`.

**Le proxy n'existe plus !**

Le code doit maintenant utiliser l'**URL complète** : `https://barstock-api.onrender.com/api`

---

## 🔍 Le Problème Exact

### **Théorie (ce qui devrait se passer)**

```typescript
// src/services/api.ts lignes 8-10
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : 'http://127.0.0.1:8000/api';
```

En production, `VITE_API_URL` devrait être `https://barstock-api.onrender.com`, donc :
- `API_BASE_URL` = `https://barstock-api.onrender.com/api` ✅

### **Réalité (ce qui se passe)**

Le build en production utilise **encore** `http://127.0.0.1:8000/api` ❌

**Pourquoi ?**

1. **Hypothèse 1** : La variable d'environnement `VITE_API_URL` n'est **pas définie** sur Render
2. **Hypothèse 2** : Le build utilise un **cache ancien**
3. **Hypothèse 3** : Le fichier `.env.production` n'est **pas lu** par Vite

---

## ✅ Solutions (dans l'ordre)

### **Solution 1 : Vérifier la Variable d'Environnement sur Render**

1. **Aller sur** : https://dashboard.render.com
2. **Cliquer sur** : `barstock-web` (frontend)
3. **Aller dans** : **Environment** (dans le menu de gauche)
4. **Chercher** : `VITE_API_URL`

**Si elle n'existe pas** :
- Cliquer sur **"Add Environment Variable"**
- **Key** : `VITE_API_URL`
- **Value** : `https://barstock-api.onrender.com`
- Cliquer sur **"Save Changes"**
- **Redéployer** : Manual Deploy → Clear cache & deploy

**Si elle existe déjà** :
- Vérifier que la valeur est **exactement** : `https://barstock-api.onrender.com`
- Pas de `/api` à la fin !
- Pas d'espace avant ou après !

### **Solution 2 : Forcer un Build Propre**

Le problème le plus probable est que Render utilise un **cache du build précédent**.

**Étapes** :
1. Dashboard Render → `barstock-web`
2. **Manual Deploy**
3. ☑️ **COCHER** : **"Clear build cache & deploy"**
4. Deploy
5. Attendre 5 minutes

### **Solution 3 : Vérifier le Build Command**

Dashboard Render → `barstock-web` → **Settings** → **Build & Deploy**

**Build Command** doit être :
```bash
npm install && npm run build
```

**Publish Directory** doit être :
```
dist
```

### **Solution 4 : Hardcoder l'URL Temporairement (Test)**

Pour tester si c'est bien un problème de variable d'environnement :

```typescript
// src/services/api.ts lignes 8-10
const API_BASE_URL = 'https://barstock-api.onrender.com/api';  // Hardcodé pour test
```

Puis :
```bash
git add src/services/api.ts
git commit -m "test: Hardcode API URL"
git push origin main
```

Redéployer sur Render (Clear cache).

Si ça fonctionne, c'est que le problème vient de `import.meta.env.VITE_API_URL`.

---

## 🧪 Outil de Diagnostic

J'ai créé un outil pour diagnostiquer le problème :

**Fichier** : `public/debug-production.html`

### **Utilisation** :

1. **Pousser le fichier** :
   ```bash
   git add public/debug-production.html
   git commit -m "debug: Add production diagnostic tool"
   git push origin main
   ```

2. **Redéployer** sur Render

3. **Ouvrir** : `https://barstock-web.onrender.com/debug-production.html`

4. **Voir** :
   - ✅ Environnement détecté (Local ou Production)
   - ✅ URL API attendue vs réelle
   - ✅ Status du token JWT
   - ✅ Tests API directs

5. **Cliquer sur** : "Tester Tables" pour voir l'erreur exacte

---

## 📊 Comparaison Local vs Production

| Aspect | Local | Production |
|--------|-------|------------|
| **Serveur** | Vite Dev Server | Fichiers statiques |
| **Proxy** | ✅ Actif | ❌ Inexistant |
| **URL API** | Proxy vers localhost | URL complète Render |
| **Variables env** | `.env` | Variables Render |
| **Build** | Pas de build | `npm run build` |
| **Cache** | Pas de cache | Cache possible |

---

## 🎯 Plan d'Action Immédiat

### **Étape 1 : Diagnostic**

```bash
# Pousser l'outil de diagnostic
git add public/debug-production.html
git commit -m "debug: Add diagnostic tool"
git push origin main
```

### **Étape 2 : Redéployer**

1. Render Dashboard → `barstock-web`
2. Manual Deploy → ☑️ Clear cache & deploy
3. Attendre 5 minutes

### **Étape 3 : Tester**

1. Ouvrir : `https://barstock-web.onrender.com/debug-production.html`
2. Voir les résultats
3. Cliquer sur "Tester Tables"
4. **Noter l'URL exacte utilisée**

### **Étape 4 : Corriger**

Selon les résultats :

**Si l'URL est `http://127.0.0.1:8000`** :
→ Problème de variable d'environnement
→ Ajouter `VITE_API_URL` sur Render

**Si l'URL est `https://barstock-api.onrender.com` mais erreur 401** :
→ Problème de permissions (déjà corrigé normalement)
→ Vérifier les logs backend

**Si l'URL est `https://barstock-api.onrender.com` mais erreur CORS** :
→ Problème de CORS backend
→ Vérifier `backend/barstock_api/settings.py`

---

## 🔑 La Clé du Problème

**Le proxy Vite masque le problème en local.**

En local, même si votre code utilise la mauvaise URL, le proxy corrige automatiquement.

En production, **il n'y a pas de proxy**, donc le code doit utiliser la **bonne URL dès le départ**.

---

## 📝 Résumé

**Problème** : Proxy Vite fonctionne en local, mais pas en production  
**Cause probable** : Variable `VITE_API_URL` non définie sur Render  
**Solution** : Ajouter la variable sur Render + Clear cache & deploy  
**Test** : Utiliser `debug-production.html` pour diagnostiquer  

---

**Date** : 31 octobre 2025 06:01  
**Status** : 🔍 Diagnostic en cours
