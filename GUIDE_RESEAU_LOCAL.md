# 🌐 Guide de Déploiement Bar Stock Wise sur Réseau Local

Ce guide vous explique comment configurer votre application Bar Stock Wise pour qu'elle soit accessible à tous les appareils de votre réseau local (WiFi/LAN).

## 📋 Prérequis

- ✅ Application Bar Stock Wise fonctionnelle en local
- ✅ Tous les appareils connectés au même réseau WiFi/LAN
- ✅ Pare-feu Windows configuré pour autoriser les connexions

## 🔧 Configuration Backend (Django)

### 1. Modifier les Settings Django

**Fichier**: `backend/bar_stock_wise/settings.py`

```python
# Autoriser toutes les adresses IP du réseau local
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '192.168.1.*',  # Remplacez par votre plage IP
    '10.0.0.*',     # Pour certains réseaux
    '*',            # ⚠️ Temporaire pour tests uniquement
]

# Configuration CORS pour le frontend
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://192.168.1.100:5173",  # Remplacez par l'IP de votre PC
    # Ajoutez d'autres IPs si nécessaire
]

# Ou pour autoriser toutes les origines (moins sécurisé)
CORS_ALLOW_ALL_ORIGINS = True  # ⚠️ Uniquement pour réseau local

# Configuration de la base de données (optionnel)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}
```

### 2. Démarrer le Serveur Django

```bash
# Dans le dossier backend/
python manage.py runserver 0.0.0.0:8000
```

**Important**: `0.0.0.0:8000` permet l'accès depuis toutes les interfaces réseau.

### 3. Trouver l'Adresse IP de votre PC

**Windows**:
```cmd
ipconfig
```

**Linux/Mac**:
```bash
ifconfig
# ou
ip addr show
```

Notez l'adresse IP (ex: `192.168.1.100`)

## ⚡ Configuration Frontend (React/Vite)

### 1. Modifier la Configuration Vite

**Fichier**: `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: '0.0.0.0',  // ✅ Écouter sur toutes les interfaces
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',  // ✅ Pour le mode production
    port: 4173,
  }
})
```

### 2. Modifier l'URL de l'API

**Fichier**: `src/lib/api.ts`

```typescript
// Remplacez localhost par l'IP de votre PC
const API_BASE_URL = 'http://192.168.1.100:8000/api';  // ✅ Votre IP

class ApiService {
  private baseURL = API_BASE_URL;
  
  // ... reste du code
}
```

**Ou créer une configuration dynamique**:

```typescript
// Configuration dynamique selon l'environnement
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  } else {
    // En réseau local, utiliser l'IP du serveur
    return 'http://192.168.1.100:8000/api';  // Remplacez par votre IP
  }
};

const API_BASE_URL = getApiBaseUrl();
```

### 3. Démarrer le Serveur Frontend

```bash
# Dans le dossier racine/
npm run dev
# ou
yarn dev
```

Le serveur sera accessible sur `http://0.0.0.0:5173`

## 🔥 Configuration du Pare-feu Windows

### Méthode 1: Interface Graphique

1. **Ouvrir le Pare-feu Windows**
   - `Panneau de configuration` → `Système et sécurité` → `Pare-feu Windows Defender`

2. **Paramètres avancés**
   - Cliquer sur "Paramètres avancés"

3. **Règles de trafic entrant**
   - Cliquer sur "Règles de trafic entrant"
   - "Nouvelle règle..."

4. **Créer les règles**:
   - **Port 8000 (Django)**:
     - Type: Port
     - Protocole: TCP
     - Port: 8000
     - Action: Autoriser la connexion
     - Profil: Privé et Public
     - Nom: "Django Backend - Port 8000"

   - **Port 5173 (Vite)**:
     - Type: Port  
     - Protocole: TCP
     - Port: 5173
     - Action: Autoriser la connexion
     - Profil: Privé et Public
     - Nom: "Vite Frontend - Port 5173"

### Méthode 2: Ligne de Commande (Admin)

```cmd
# Ouvrir CMD en tant qu'administrateur

# Autoriser le port 8000 (Django)
netsh advfirewall firewall add rule name="Django Backend" dir=in action=allow protocol=TCP localport=8000

# Autoriser le port 5173 (Vite)
netsh advfirewall firewall add rule name="Vite Frontend" dir=in action=allow protocol=TCP localport=5173
```

## 📱 Accès depuis les Appareils du Réseau

### URLs d'Accès

Remplacez `192.168.1.100` par l'IP de votre PC:

- **Frontend**: `http://192.168.1.100:5173`
- **Backend API**: `http://192.168.1.100:8000/api`
- **Admin Django**: `http://192.168.1.100:8000/admin`

### Test de Connectivité

1. **Depuis votre PC**:
   ```bash
   # Tester le backend
   curl http://192.168.1.100:8000/api/auth/me/
   
   # Tester le frontend
   curl http://192.168.1.100:5173
   ```

2. **Depuis un autre appareil**:
   - Ouvrir un navigateur
   - Aller sur `http://192.168.1.100:5173`

## 🚀 Script de Démarrage Automatique

**Fichier**: `start_network.bat`

```batch
@echo off
echo 🚀 Démarrage de Bar Stock Wise en réseau local...

echo 📡 Démarrage du backend Django...
start "Django Backend" cmd /k "cd /d backend && python manage.py runserver 0.0.0.0:8000"

timeout /t 3

echo ⚡ Démarrage du frontend Vite...
start "Vite Frontend" cmd /k "npm run dev"

echo ✅ Application démarrée !
echo 📱 Accès réseau: http://192.168.1.100:5173
echo 🔧 Admin Django: http://192.168.1.100:8000/admin

pause
```

## 🔒 Sécurité et Bonnes Pratiques

### ⚠️ Sécurité Réseau Local

```python
# settings.py - Configuration sécurisée
ALLOWED_HOSTS = [
    '192.168.1.100',  # IP spécifique de votre PC
    '192.168.1.*',    # Plage IP de votre réseau
]

# Désactiver DEBUG en production
DEBUG = False  # ⚠️ Important pour la sécurité

# CORS spécifique
CORS_ALLOWED_ORIGINS = [
    "http://192.168.1.100:5173",
    "http://192.168.1.101:5173",  # Autres appareils autorisés
]
```

### 🛡️ Variables d'Environnement

**Fichier**: `.env`

```env
# Configuration réseau
NETWORK_IP=192.168.1.100
FRONTEND_PORT=5173
BACKEND_PORT=8000

# Sécurité
SECRET_KEY=your-secret-key-here
DEBUG=False
ALLOWED_HOSTS=192.168.1.100,192.168.1.*
```

## 🐛 Dépannage

### Problèmes Courants

1. **"Site inaccessible" depuis un autre appareil**:
   - ✅ Vérifier l'IP avec `ipconfig`
   - ✅ Vérifier le pare-feu Windows
   - ✅ Tester avec `ping 192.168.1.100`

2. **Erreur CORS**:
   - ✅ Vérifier `CORS_ALLOWED_ORIGINS` dans Django
   - ✅ Redémarrer le serveur Django

3. **API non accessible**:
   - ✅ Vérifier que Django écoute sur `0.0.0.0:8000`
   - ✅ Tester l'API: `http://IP:8000/api/auth/me/`

4. **Frontend ne charge pas**:
   - ✅ Vérifier `vite.config.ts` avec `host: '0.0.0.0'`
   - ✅ Vérifier l'URL de l'API dans le code

### Commandes de Diagnostic

```bash
# Vérifier les ports ouverts
netstat -an | findstr :8000
netstat -an | findstr :5173

# Tester la connectivité
ping 192.168.1.100
telnet 192.168.1.100 8000
```

## 📋 Checklist de Déploiement

- [ ] IP du PC identifiée (`ipconfig`)
- [ ] `settings.py` configuré avec `ALLOWED_HOSTS`
- [ ] `vite.config.ts` configuré avec `host: '0.0.0.0'`
- [ ] URL de l'API mise à jour dans le frontend
- [ ] Pare-feu configuré (ports 8000 et 5173)
- [ ] Django démarré avec `0.0.0.0:8000`
- [ ] Vite démarré avec host `0.0.0.0`
- [ ] Test d'accès depuis un autre appareil

## 🎯 Résultat Final

Après configuration, votre application sera accessible depuis n'importe quel appareil du réseau local:

- **PC Principal**: `http://localhost:5173`
- **Smartphones**: `http://192.168.1.100:5173`
- **Tablettes**: `http://192.168.1.100:5173`
- **Autres PC**: `http://192.168.1.100:5173`

Tous les utilisateurs pourront utiliser le système POS, gérer les stocks, et accéder aux rapports en temps réel ! 🚀
