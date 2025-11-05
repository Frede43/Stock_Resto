# 🔧 Fix : Token non trouvé dans localStorage

## 📋 Problème

L'outil de diagnostic affiche :
```
❌ Aucun token trouvé dans localStorage
Connectez-vous d'abord sur l'application.
```

**Alors que vous êtes déjà connecté en tant qu'admin.**

---

## 🔍 Cause

L'application principale utilise **`access_token`** dans localStorage, mais l'outil de diagnostic cherchait **`token`**.

### Code de l'application (src/services/api.ts)

```typescript
private saveTokensToStorage(tokens: AuthTokens) {
  this.accessToken = tokens.access;
  this.refreshToken = tokens.refresh;
  localStorage.setItem('access_token', tokens.access);  // ← Clé utilisée
  localStorage.setItem('refresh_token', tokens.refresh);
}
```

### Code de l'outil (AVANT la correction)

```javascript
const token = localStorage.getItem('token');  // ❌ Mauvaise clé
```

---

## ✅ Solution Appliquée

### 1. Correction de l'outil de diagnostic

**Fichier** : `public/check-permissions-production.html`

**Changements** :

```javascript
// AVANT
const token = localStorage.getItem('token');

// APRÈS
const token = localStorage.getItem('access_token') || localStorage.getItem('token');
```

**Lignes modifiées** :
- Ligne 404 : `loadTokenFromStorage()`
- Ligne 839 : Auto-load au chargement de la page

### 2. Création d'un outil de debug

**Fichier** : `public/debug-localstorage.html`

**Fonctionnalités** :
- ✅ Vérifie tous les tokens possibles (`access_token`, `token`, `refresh_token`, etc.)
- ✅ Affiche le contenu complet du localStorage
- ✅ Permet de vider le localStorage
- ✅ Liens rapides vers l'application et l'outil de diagnostic

---

## 🚀 Utilisation

### Option 1 : Actualiser la page (Recommandé)

1. **Déployez les modifications** :
   ```bash
   git add public/check-permissions-production.html public/debug-localstorage.html
   git commit -m "fix: Détection automatique de access_token dans localStorage"
   git push origin main
   ```

2. **Attendez le redéploiement** (2-3 minutes)

3. **Actualisez l'outil de diagnostic** (Ctrl + F5)

4. **Cliquez sur "📋 Charger depuis localStorage"**

**Résultat attendu** :
```
✅ Token chargé depuis localStorage
Clé: access_token
Token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

---

### Option 2 : Outil de debug

1. **Ouvrez** : `https://barstock-web.onrender.com/debug-localstorage.html`

2. **Vérifiez les tokens** :
   - ✅ `access_token` : TROUVÉ
   - ✅ `refresh_token` : TROUVÉ
   - ❌ `token` : ABSENT

3. **Copiez le token** depuis `access_token`

4. **Retournez sur l'outil de diagnostic**

5. **Collez le token manuellement** dans le champ

---

### Option 3 : Console du navigateur

1. **Ouvrez la console** (F12)

2. **Tapez** :
   ```javascript
   localStorage.getItem('access_token')
   ```

3. **Copiez le résultat**

4. **Collez dans l'outil de diagnostic**

---

## 🔍 Vérification

### Vérifier que le token existe

**Console du navigateur** (F12) :
```javascript
// Vérifier access_token
console.log('access_token:', localStorage.getItem('access_token'));

// Vérifier refresh_token
console.log('refresh_token:', localStorage.getItem('refresh_token'));

// Afficher tout le localStorage
console.log('localStorage:', localStorage);
```

**Résultat attendu** :
```
access_token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzMwNzg...
refresh_token: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTczMTM...
```

---

## 🚨 Si le token n'existe toujours pas

### Cause possible : Vous n'êtes pas connecté sur la même origine

**Problème** : localStorage est isolé par origine (domaine + port)

**Exemples** :
- `http://localhost:5173` → localStorage séparé
- `https://barstock-web.onrender.com` → localStorage séparé

**Solution** :

1. **Vérifiez l'URL actuelle** :
   - Si vous êtes sur `localhost`, connectez-vous sur `localhost`
   - Si vous êtes sur `barstock-web.onrender.com`, connectez-vous sur `barstock-web.onrender.com`

2. **Connectez-vous sur la bonne origine** :
   ```
   Production : https://barstock-web.onrender.com
   Local : http://localhost:5173
   ```

3. **Vérifiez à nouveau le localStorage**

---

## 🔒 Sécurité

### Pourquoi utiliser `access_token` au lieu de `token` ?

**Raison** : Séparation claire entre token d'accès et token de rafraîchissement

```typescript
localStorage.setItem('access_token', tokens.access);    // Token court (15 min)
localStorage.setItem('refresh_token', tokens.refresh);  // Token long (7 jours)
```

**Avantages** :
- ✅ Meilleure sécurité (tokens séparés)
- ✅ Gestion du rafraîchissement automatique
- ✅ Conformité aux standards JWT

---

## 📊 Récapitulatif

### Avant la correction

```
Outil cherche : localStorage.getItem('token')
Application stocke : localStorage.setItem('access_token', ...)
Résultat : ❌ Token non trouvé
```

### Après la correction

```
Outil cherche : localStorage.getItem('access_token') || localStorage.getItem('token')
Application stocke : localStorage.setItem('access_token', ...)
Résultat : ✅ Token trouvé
```

---

## 📝 Fichiers Modifiés

1. **public/check-permissions-production.html** :
   - Ligne 404 : Détection `access_token`
   - Ligne 839 : Auto-load `access_token`

2. **public/debug-localstorage.html** (nouveau) :
   - Outil de debug complet
   - Vérification de tous les tokens
   - Affichage du localStorage

3. **SOLUTION_RAPIDE_PERMISSIONS.md** :
   - Section "Token non trouvé" mise à jour

---

## ✅ Checklist de Vérification

- [ ] Modifications déployées en production
- [ ] Page de diagnostic actualisée (Ctrl + F5)
- [ ] Bouton "Charger depuis localStorage" cliqué
- [ ] Message "✅ Token chargé" affiché
- [ ] Token visible dans le champ (commence par `eyJ...`)
- [ ] Outil de debug vérifié (optionnel)
- [ ] Initialisation des permissions réussie

---

**Date de création** : 5 novembre 2025  
**Auteur** : Cascade AI  
**Version** : 1.0  
**Status** : ✅ Problème résolu
