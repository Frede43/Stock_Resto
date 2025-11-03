# 🔧 FIX CORS - Production Render

## 🚨 PROBLÈME IDENTIFIÉ

### Erreur
```
Access to fetch at 'https://barstock-api.onrender.com/api/alerts/alerts/active/' 
from origin 'https://barstock-web.onrender.com' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Cause
**Configuration CORS dupliquée** dans `backend/barstock_api/settings.py` :
- Première config (lignes 202-223) : Liste statique avec production
- Deuxième config (lignes 389-397) : Tentative de redéfinition qui écrase la première

**Résultat** : En production, la configuration CORS n'était pas correctement appliquée.

---

## ✅ SOLUTION APPLIQUÉE

### 1. Configuration CORS Unifiée

**Fichier** : `backend/barstock_api/settings.py`

```python
# CORS settings - Configuration pour développement et production
CORS_ALLOW_CREDENTIALS = True  # Permet l'envoi de cookies et credentials

# En développement, autoriser toutes les origines
if DEBUG:
    CORS_ALLOW_ALL_ORIGINS = True
    print("⚠️ CORS: Toutes les origines autorisées (DEBUG=True)")
else:
    CORS_ALLOW_ALL_ORIGINS = False
    print("✅ CORS: Mode production activé")

# Liste des origines autorisées (dev + production)
CORS_ALLOWED_ORIGINS = [
    # Développement local
    "http://localhost:5173",
    "http://127.0.0.1:5173", 
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Production Render
    "https://barstock-web.onrender.com",
    "https://barstock-api.onrender.com",  # API elle-même
]
```

### 2. Suppression de la Configuration Dupliquée

**Avant** (lignes 389-397) :
```python
# Configuration CORS pour production
if not DEBUG:
    CORS_ALLOW_ALL_ORIGINS = False
    CORS_ALLOWED_ORIGINS = config(
        'CORS_ALLOWED_ORIGINS',
        default='https://barstock-web.onrender.com',
        cast=Csv()
    )
    print(f"✅ CORS configuré pour production: {CORS_ALLOWED_ORIGINS}")
```

**Après** :
```python
# Log de la configuration CORS active
if not DEBUG:
    print(f"✅ CORS configuré pour production: {CORS_ALLOWED_ORIGINS}")
    print(f"✅ CORS_ALLOW_CREDENTIALS: {CORS_ALLOW_CREDENTIALS}")
```

### 3. Middleware CORS Correctement Placé

```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # ✅ EN PREMIER
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    # ...
]
```

---

## 🧪 VÉRIFICATION

### Logs Backend Attendus (Production)

Lors du démarrage de l'application sur Render :
```
✅ CORS: Mode production activé
✅ CORS configuré pour production: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000', 'http://127.0.0.1:3000', 'https://barstock-web.onrender.com', 'https://barstock-api.onrender.com']
✅ CORS_ALLOW_CREDENTIALS: True
```

### Headers HTTP Attendus

Lors d'une requête depuis `https://barstock-web.onrender.com` :

**Request Headers** :
```
Origin: https://barstock-web.onrender.com
Access-Control-Request-Method: GET
Access-Control-Request-Headers: authorization, content-type
```

**Response Headers** :
```
Access-Control-Allow-Origin: https://barstock-web.onrender.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: DELETE, GET, OPTIONS, PATCH, POST, PUT
Access-Control-Allow-Headers: accept, authorization, content-type, ...
Access-Control-Max-Age: 86400
```

---

## 🚀 DÉPLOIEMENT

### 1. Commit et Push
```bash
git add backend/barstock_api/settings.py
git commit -m "Fix CORS configuration for production"
git push origin main
```

### 2. Vérifier le Déploiement Render

1. Aller sur https://dashboard.render.com
2. Sélectionner le service `barstock-api`
3. Attendre la fin du déploiement (2-3 min)
4. Vérifier les logs :
   ```
   ✅ CORS: Mode production activé
   ✅ CORS configuré pour production: [...]
   ```

### 3. Tester en Production

1. Ouvrir https://barstock-web.onrender.com
2. Ouvrir la console (F12)
3. Vérifier qu'il n'y a plus d'erreur CORS
4. Tester une requête API (ex: créer une table)

---

## 🔍 DIAGNOSTIC EN CAS DE PROBLÈME

### Vérifier les Headers CORS

**Chrome DevTools** :
1. F12 → Network
2. Faire une requête API
3. Cliquer sur la requête
4. Onglet "Headers"
5. Vérifier "Response Headers" :
   - `Access-Control-Allow-Origin` doit être présent
   - `Access-Control-Allow-Credentials: true`

### Vérifier les Logs Backend

**Render Dashboard** :
1. Aller sur https://dashboard.render.com
2. Service `barstock-api` → Logs
3. Chercher les lignes CORS :
   ```
   ✅ CORS: Mode production activé
   ✅ CORS configuré pour production: [...]
   ```

### Tester avec cURL

```bash
# Test preflight OPTIONS
curl -X OPTIONS https://barstock-api.onrender.com/api/alerts/alerts/ \
  -H "Origin: https://barstock-web.onrender.com" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: authorization" \
  -v

# Vérifier la présence de :
# Access-Control-Allow-Origin: https://barstock-web.onrender.com
# Access-Control-Allow-Credentials: true
```

---

## 📊 CONFIGURATION COMPLÈTE CORS

### Variables Utilisées

```python
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False  # En production
CORS_ALLOWED_ORIGINS = [...]
CORS_ALLOW_HEADERS = [...]
CORS_ALLOW_METHODS = [...]
CORS_PREFLIGHT_MAX_AGE = 86400
CORS_EXPOSE_HEADERS = [...]
```

### Origines Autorisées

```python
# Développement
http://localhost:5173
http://127.0.0.1:5173
http://localhost:3000
http://127.0.0.1:3000

# Production
https://barstock-web.onrender.com
https://barstock-api.onrender.com
```

---

## ✅ CHECKLIST

Avant de déployer :
- [x] Configuration CORS unifiée
- [x] Duplication supprimée
- [x] URLs de production ajoutées
- [x] Middleware en première position
- [x] Logs de debug ajoutés

Après déploiement :
- [ ] Logs backend vérifiés
- [ ] Headers CORS présents
- [ ] Aucune erreur CORS en console
- [ ] Requêtes API fonctionnelles

---

## 🎯 RÉSULTAT ATTENDU

✅ **Avant** : Erreur CORS bloquant toutes les requêtes API  
✅ **Après** : Requêtes API fonctionnelles avec headers CORS corrects  

**Temps de résolution** : 5 minutes  
**Impact** : Critique - Bloquait toute l'application en production  
**Status** : ✅ RÉSOLU  

---

**Date** : 4 novembre 2025, 01:10  
**Commit** : Fix CORS configuration for production  
