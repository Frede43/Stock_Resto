# 🚀 Guide Simple : Tester en Production

## ⚠️ ERREUR COMMUNE

Vous avez testé le fichier `debug-production.html` **en local** (`http://127.0.0.1:5500`).

**C'est normal qu'il n'y ait pas de token en local !**

---

## ✅ Comment Tester CORRECTEMENT

### **Étape 1 : Le code a été pushé ✅**

Le fichier `debug-production.html` est maintenant sur GitHub.

### **Étape 2 : Redéployer sur Render**

1. **Ouvrir** : https://dashboard.render.com

2. **Cliquer sur** : `barstock-web` (votre frontend)

3. **Cliquer sur** : **"Manual Deploy"** (bouton bleu en haut à droite)

4. **COCHER** : ☑️ **"Clear build cache & deploy"**

5. **Cliquer sur** : **"Deploy"**

6. **Attendre** : 3-5 minutes (regarder les logs)

### **Étape 3 : Tester sur le Site de Production**

1. **Ouvrir votre navigateur**

2. **Aller sur** : `https://barstock-web.onrender.com`

3. **Se connecter** avec vos identifiants

4. **Ensuite, aller sur** : `https://barstock-web.onrender.com/debug-production.html`

5. **Vous verrez** :
   - ✅ Environnement : **🌐 PRODUCTION** (pas LOCAL)
   - ✅ URL : `https://barstock-web.onrender.com`
   - ✅ Token JWT présent
   - ✅ Configuration API

6. **Cliquer sur** : **"Tester Tables"**

7. **Voir le résultat** :
   - Si ✅ **Succès** : Le problème est résolu !
   - Si ❌ **Échec** : Voir l'URL exacte utilisée dans l'erreur

---

## 🔍 Ce que Vous Allez Découvrir

Le diagnostic va vous montrer **exactement** quelle URL est utilisée :

### **Scénario 1 : URL Incorrecte**
```
URL: http://127.0.0.1:8000/api/sales/tables/
❌ Erreur: ERR_CONNECTION_REFUSED
```
**Solution** : Ajouter `VITE_API_URL` dans les variables d'environnement Render

### **Scénario 2 : URL Correcte mais Erreur 401**
```
URL: https://barstock-api.onrender.com/api/sales/tables/
❌ Erreur: 401 Unauthorized
```
**Solution** : Problème de permissions (normalement déjà corrigé)

### **Scénario 3 : Tout Fonctionne**
```
URL: https://barstock-api.onrender.com/api/sales/tables/
✅ Succès: 201 Created
```
**Solution** : Aucune, ça marche ! 🎉

---

## 📋 Checklist Complète

- [ ] Code pushé sur GitHub ✅
- [ ] Aller sur https://dashboard.render.com
- [ ] Cliquer sur `barstock-web`
- [ ] Manual Deploy → ☑️ Clear cache & deploy
- [ ] Attendre 3-5 minutes
- [ ] Ouvrir `https://barstock-web.onrender.com`
- [ ] Se connecter
- [ ] Aller sur `https://barstock-web.onrender.com/debug-production.html`
- [ ] Cliquer sur "Tester Tables"
- [ ] Noter l'URL exacte dans l'erreur

---

## 🎯 Différence Local vs Production

| Aspect | Local (127.0.0.1:5500) | Production (Render) |
|--------|------------------------|---------------------|
| **Token** | ❌ Aucun | ✅ Présent (après connexion) |
| **API URL** | `http://127.0.0.1:8000` | `https://barstock-api.onrender.com` |
| **Environnement** | 💻 LOCAL | 🌐 PRODUCTION |
| **Proxy Vite** | ✅ Actif | ❌ Inexistant |

---

## 💡 Pourquoi Tester sur Render ?

1. **Token JWT** : Seulement disponible après connexion sur le vrai site
2. **Variables d'environnement** : Différentes entre local et production
3. **Build** : Le code en production est compilé (`npm run build`)
4. **Cache** : Render peut utiliser un cache du build précédent

---

## 🚨 Action Immédiate

**MAINTENANT** :

1. Aller sur Render Dashboard
2. Redéployer `barstock-web` avec Clear cache
3. Attendre 5 minutes
4. Tester sur `https://barstock-web.onrender.com/debug-production.html`
5. Me dire ce que vous voyez !

---

**Date** : 31 octobre 2025 06:04  
**Status** : ⏳ En attente de test sur Render
