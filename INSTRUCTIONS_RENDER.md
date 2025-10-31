# 🚀 Instructions de Déploiement Render - FRONTEND

## ⚠️ IMPORTANT : Vous DEVEZ faire ces étapes MAINTENANT

Le code a été pushé sur GitHub avec succès, mais **Render n'a pas encore rebuild le frontend**.

---

## 📋 Étapes à Suivre (5 minutes)

### **Étape 1 : Ouvrir Render Dashboard**

1. Ouvrir votre navigateur
2. Aller sur : **https://dashboard.render.com**
3. Se connecter si nécessaire

### **Étape 2 : Sélectionner le Service Frontend**

1. Dans la liste des services, chercher : **`barstock-web`** (ou le nom de votre frontend)
2. **Cliquer dessus**

### **Étape 3 : Forcer le Redéploiement**

1. En haut à droite, cliquer sur le bouton bleu : **"Manual Deploy"**
2. Une popup s'ouvre
3. **COCHER LA CASE** : ☑️ **"Clear build cache & deploy"**
   - ⚠️ **TRÈS IMPORTANT** : Cette case DOIT être cochée !
4. Cliquer sur le bouton : **"Deploy"**

### **Étape 4 : Attendre le Build**

1. Vous allez voir les logs de build en temps réel
2. Attendre de voir :
   ```
   Building...
   > vite build
   ✓ built in 2m 4s
   Deploying...
   ✓ Live
   ```
3. Durée : **3-5 minutes**

### **Étape 5 : Tester**

1. **Ouvrir une fenêtre de navigation privée** :
   - Chrome : `Ctrl + Shift + N`
   - Firefox : `Ctrl + Shift + P`

2. **Aller sur** : `https://barstock-web.onrender.com`

3. **Se connecter** avec vos identifiants

4. **Ouvrir la console** (F12)

5. **Aller sur la page** : `/sales` ou `/tables`

6. **Créer une nouvelle table** :
   - Cliquer sur "Nouvelle table"
   - Nom : "Table Test"
   - Capacité : 4
   - Cliquer sur "Créer"

7. **Vérifier les logs dans la console** :
   ```javascript
   🚀 Requête API: {
     method: "POST",
     url: "https://barstock-api.onrender.com/api/sales/tables/",  // ✅ Doit être Render
     baseURL: "https://barstock-api.onrender.com/api",
     hasToken: true
   }
   ```

8. ✅ **La table doit être créée avec succès !**

---

## ✅ Résultat Attendu

**AVANT** (actuellement) :
```
POST http://127.0.0.1:8000/api/sales/tables/ net::ERR_CONNECTION_REFUSED
```

**APRÈS** (après le redéploiement) :
```
POST https://barstock-api.onrender.com/api/sales/tables/ 201 Created
```

---

## 🔍 Si ça ne marche toujours pas

### **Vérifier la variable d'environnement**

1. Dashboard Render → `barstock-web` → **Environment**
2. Chercher : `VITE_API_URL`
3. Valeur doit être : `https://barstock-api.onrender.com`
4. Si manquante :
   - Cliquer sur **"Add Environment Variable"**
   - Key : `VITE_API_URL`
   - Value : `https://barstock-api.onrender.com`
   - Cliquer sur **"Save Changes"**
   - **Redéployer** (Manual Deploy → Clear cache)

### **Vérifier les logs de build**

Si le build échoue, vérifier les logs pour voir l'erreur.

### **Effacer le cache du navigateur**

1. Console (F12)
2. Taper :
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload(true);
   ```

---

## 📊 Checklist

- [ ] Aller sur https://dashboard.render.com
- [ ] Cliquer sur `barstock-web`
- [ ] Cliquer sur "Manual Deploy"
- [ ] ☑️ COCHER "Clear build cache & deploy"
- [ ] Cliquer sur "Deploy"
- [ ] Attendre 3-5 minutes
- [ ] Tester en navigation privée
- [ ] Vérifier l'URL dans les logs console
- [ ] Créer une table avec succès

---

## 🎯 Résumé

**Problème** : Frontend utilise l'ancienne URL `http://127.0.0.1:8000`  
**Cause** : Render n'a pas rebuild avec le nouveau code  
**Solution** : Forcer le rebuild avec "Clear cache & deploy"  
**Résultat attendu** : ✅ URL correcte `https://barstock-api.onrender.com`

---

**⚠️ ALLEZ SUR RENDER MAINTENANT ET SUIVEZ LES ÉTAPES !** 🚀

---

**Date** : 31 octobre 2025 05:50  
**Status** : ⏳ En attente de votre action sur Render
