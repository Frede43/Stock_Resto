# 🔧 Fix: Erreur 404 sur Render lors de l'actualisation

## 🔍 Problème Actuel

Quand vous êtes sur `https://barstock-web.onrender.com/profile` (ou toute autre route) et que vous actualisez (F5), vous obtenez **"Not Found"** (404).

## ⚠️ Cause

Render ne prend pas en compte le fichier `_redirects` pour les **Web Services**. Il faut soit :
1. Utiliser un **Static Site** au lieu d'un Web Service
2. Reconfigurer le service existant

---

## ✅ Solution 1: Recréer comme Static Site (RECOMMANDÉ)

### **Étape 1: Supprimer l'ancien service web**

1. Aller sur https://dashboard.render.com
2. Sélectionner `barstock-web`
3. Settings → Delete Service

### **Étape 2: Créer un nouveau Static Site**

1. Dashboard Render → **New +** → **Static Site**
2. Connecter votre repo GitHub
3. Configurer:
   - **Name**: `barstock-web`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Auto-Deploy**: Yes

### **Étape 3: Ajouter les variables d'environnement**

Dans **Environment** :
```
NODE_VERSION=18.17.0
VITE_API_URL=https://barstock-api.onrender.com
```

### **Étape 4: Configurer les Rewrites**

Dans **Redirects/Rewrites**, ajouter :
```
Source: /*
Destination: /index.html
Action: Rewrite
```

### **Étape 5: Deploy**

Cliquer sur **Create Static Site** → Render va build et déployer

---

## ✅ Solution 2: Modifier le Service Existant

Si vous ne voulez pas recréer le service :

### **Étape 1: Vérifier le type de service**

1. Dashboard Render → `barstock-web` → Settings
2. Vérifier que **Service Type** = `Static Site`
3. Si c'est `Web Service`, il faut recréer (Solution 1)

### **Étape 2: Ajouter les Rewrites manuellement**

1. Settings → **Redirects/Rewrites**
2. Add Rule:
   - **Source**: `/*`
   - **Destination**: `/index.html`
   - **Action**: `Rewrite`
3. Save Changes

### **Étape 3: Redéployer**

1. Manual Deploy → Clear build cache & deploy

---

## ✅ Solution 3: Utiliser render.yaml (Blueprint)

### **Étape 1: Commit les fichiers**

```bash
git add render.yaml
git add public/_redirects
git add vite.config.ts
git commit -m "fix: Configure SPA routing for Render"
git push origin main
```

### **Étape 2: Créer depuis Blueprint**

1. Dashboard Render → **New +** → **Blueprint**
2. Sélectionner votre repo
3. Render va lire `render.yaml` et créer les services automatiquement

---

## 📋 Vérification Post-Déploiement

### **Test 1: Vérifier que _redirects est dans dist/**

Après le build sur Render, vérifier les logs :
```
Building...
✓ built in 2m 4s
Copying public files...
  ✓ _redirects copied to dist/
```

### **Test 2: Tester les routes**

1. Aller sur `https://barstock-web.onrender.com/products`
2. Appuyer sur **F5**
3. ✅ La page doit se charger (pas de 404)

### **Test 3: Vérifier les rewrites**

Dans les logs Render, chercher :
```
Rewrite rule applied: /* → /index.html
```

---

## 🎯 Checklist de Déploiement

- [ ] Fichier `public/_redirects` existe avec `/* /index.html 200`
- [ ] `vite.config.ts` a `publicDir: 'public'`
- [ ] Service Render est de type **Static Site** (pas Web Service)
- [ ] Rewrite rule configuré: `/* → /index.html`
- [ ] Variables d'environnement configurées
- [ ] Build réussi sur Render
- [ ] Fichier `_redirects` copié dans `dist/`
- [ ] Test d'actualisation sur toutes les routes ✅

---

## 🔍 Debugging

### **Problème: _redirects non copié**

**Vérifier**:
```bash
# Localement
npm run build
ls dist/_redirects  # Doit exister
```

**Si absent**:
- Vérifier que `public/_redirects` existe
- Vérifier `vite.config.ts` a `publicDir: 'public'`

### **Problème: Rewrites non appliqués**

**Vérifier dans Render Dashboard**:
1. Settings → Redirects/Rewrites
2. Doit avoir: `/* → /index.html (Rewrite)`

**Si absent**:
- Ajouter manuellement via Dashboard
- Ou utiliser `render.yaml` avec Blueprint

### **Problème: 404 persiste**

**Solutions**:
1. Clear build cache: Manual Deploy → Clear cache
2. Vérifier type de service: Doit être Static Site
3. Recréer le service (Solution 1)

---

## 📞 Résumé

**Problème**: 404 lors de l'actualisation  
**Cause**: Render ne trouve pas les routes React  
**Solution**: Configurer rewrites `/* → /index.html`  
**Méthode recommandée**: Créer un Static Site avec rewrites  

**Après déploiement**: Toutes les routes fonctionneront avec F5 ! 🎉

---

## 🚀 Commandes Rapides

```bash
# 1. Commit les changements
git add .
git commit -m "fix: Configure SPA routing for Render Static Site"
git push origin main

# 2. Vérifier le build localement
npm run build
ls dist/_redirects  # Doit exister

# 3. Tester localement
npm run preview
# Aller sur http://localhost:3000/products
# Actualiser (F5) → Doit fonctionner
```

**Date**: 30 octobre 2025  
**Version**: 2.0.0
