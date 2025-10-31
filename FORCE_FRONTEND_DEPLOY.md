# 🚀 Forcer le Redéploiement du Frontend

## 🔍 Problème

Le frontend en production sur `https://barstock-web.onrender.com` utilise **encore l'ancienne version** du code qui envoie les requêtes vers `http://127.0.0.1:8000` au lieu de `https://barstock-api.onrender.com`.

### **Preuve** :
```
POST http://127.0.0.1:8000/api/sales/tables/ net::ERR_CONNECTION_REFUSED
```

## ✅ Solution : Forcer le Rebuild

### **Étape 1 : Vérifier que le code est correct**

Le fichier `src/services/api.ts` ligne 75 doit contenir :
```typescript
let url = `${this.baseURL}${endpoint}`;  // ✅ Correct
```

**Pas** :
```typescript
let url = `${API_BASE_URL}${endpoint}`;  // ❌ Incorrect
```

### **Étape 2 : Commit un changement mineur pour forcer le rebuild**

Parfois Render ne détecte pas les changements. On va faire un commit "dummy" :

```bash
# Ajouter un commentaire dans un fichier
echo "# Force rebuild" >> README.md

# Commit
git add README.md
git commit -m "chore: Force frontend rebuild"
git push origin main
```

### **Étape 3 : Forcer le redéploiement sur Render**

1. **Aller sur** : https://dashboard.render.com
2. **Cliquer sur** : `barstock-web` (ou le nom de votre service frontend)
3. **Cliquer sur** : **"Manual Deploy"** (en haut à droite)
4. **COCHER** : ☑️ **"Clear build cache & deploy"** ⚠️ **TRÈS IMPORTANT**
5. **Cliquer sur** : **"Deploy"**
6. **Attendre** : 3-5 minutes

### **Étape 4 : Vérifier les logs de build**

Dans les logs Render, vous devez voir :
```
Building...
> vite build
✓ built in 2m 4s
Deploying...
✓ Live
```

### **Étape 5 : Tester**

1. **Ouvrir en navigation privée** : `https://barstock-web.onrender.com`
2. **Se connecter**
3. **Ouvrir la console** (F12)
4. **Aller sur** `/sales`
5. **Créer une table**
6. **Vérifier les logs** :
   ```javascript
   🚀 Requête API: {
     url: "https://barstock-api.onrender.com/api/sales/tables/",  // ✅ Doit être Render
     baseURL: "https://barstock-api.onrender.com/api",
     hasToken: true
   }
   ```

---

## 🔍 Si ça ne marche toujours pas

### **Vérifier la variable d'environnement**

1. Dashboard Render → `barstock-web` → **Environment**
2. Vérifier :
   ```
   VITE_API_URL = https://barstock-api.onrender.com
   ```
3. Si manquante ou incorrecte, **l'ajouter/corriger**
4. **Redéployer** (Manual Deploy → Clear cache)

### **Vérifier le build command**

Dashboard Render → `barstock-web` → **Settings** → **Build & Deploy**

**Build Command** doit être :
```bash
npm install && npm run build
```

**Publish Directory** doit être :
```
dist
```

### **Vérifier le fichier vite.config.ts**

Le fichier `vite.config.ts` doit contenir :
```typescript
export default defineConfig({
  // ...
  build: {
    outDir: 'dist',
  },
  // ...
})
```

---

## 🎯 Checklist de Vérification

- [ ] Code `api.ts` utilise `this.baseURL` ✅
- [ ] `.env.production` contient `VITE_API_URL=https://barstock-api.onrender.com` ✅
- [ ] Code pushé sur GitHub ✅
- [ ] **Frontend redéployé avec "Clear cache"** ⚠️ À FAIRE
- [ ] Logs de build montrent "✓ built in ..." ⚠️ À VÉRIFIER
- [ ] Test en navigation privée ⚠️ À FAIRE
- [ ] Logs console montrent la bonne URL ⚠️ À VÉRIFIER

---

## 🚨 Action Immédiate

**Allez sur Render Dashboard MAINTENANT** :

1. https://dashboard.render.com
2. Cliquez sur `barstock-web`
3. **Manual Deploy** → ☑️ **Clear build cache & deploy**
4. Attendez 5 minutes
5. Testez en **navigation privée**

Le problème est que **Render utilise un cache du build**. Le "Clear cache" va forcer un rebuild complet avec le nouveau code ! 🚀

---

**Date** : 31 octobre 2025  
**Status** : ⚠️ En attente de redéploiement frontend
