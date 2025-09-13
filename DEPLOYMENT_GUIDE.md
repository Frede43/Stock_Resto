# Guide de Déploiement - Bar Stock Wise

## Architecture du Projet

**Bar Stock Wise** est une application full-stack composée de :
- **Frontend** : React + TypeScript + Vite + Tailwind CSS
- **Backend** : Django REST Framework + SQLite/PostgreSQL
- **Authentification** : JWT avec rôles granulaires
- **WebSockets** : Django Channels pour temps réel

---

## 🚀 Déploiement Local

### Prérequis
- **Node.js** (v16+) et npm
- **Python** (v3.8+)
- **Git**

### 1. Cloner le Projet
```bash
git clone <YOUR_GIT_URL>
cd Bar_R/cursor
```

### 2. Configuration Backend (Django)

#### Installation des dépendances Python
```bash
cd backend
pip install -r requirements.txt
```

#### Configuration de la base de données
```bash
# Migrations
python manage.py makemigrations
python manage.py migrate

# Créer un superutilisateur
python manage.py createsuperuser
```

#### Démarrer le serveur Django
```bash
python manage.py runserver 127.0.0.1:8000
```

### 3. Configuration Frontend (React)

#### Installation des dépendances Node.js
```bash
# Depuis la racine du projet
npm install
```

#### Démarrer le serveur de développement
```bash
npm run dev
```

### 4. Accès à l'Application
- **Frontend** : http://localhost:5173
- **Backend API** : http://127.0.0.1:8000
- **Admin Django** : http://127.0.0.1:8000/admin

### 5. Configuration des Variables d'Environnement

Créer un fichier `.env` dans le dossier `backend/` :
```env
SECRET_KEY=votre-cle-secrete-django
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Base de données (optionnel pour production)
DB_NAME=barstock_db
DB_USER=barstock_user
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
DB_PORT=5432

# Configuration restaurant
RESTAURANT_NAME=Harry's Grill
RESTAURANT_PHONE=+257 62 12 45 10
RESTAURANT_ADDRESS=Bujumbura, Burundi
```

---

## 🌐 Déploiement sur PythonAnywhere

### 1. Préparation du Code

#### Modifier les paramètres pour la production
Dans `backend/barstock_api/settings.py` :
```python
# Production settings
DEBUG = False
ALLOWED_HOSTS = ['votre-username.pythonanywhere.com']

# Base de données MySQL (PythonAnywhere)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'votre_username$barstock_db',
        'USER': 'votre_username',
        'PASSWORD': 'votre_mot_de_passe_mysql',
        'HOST': 'votre_username.mysql.pythonanywhere-services.com',
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
    }
}

# Fichiers statiques
STATIC_URL = '/static/'
STATIC_ROOT = '/home/votre_username/mysite/static'
MEDIA_URL = '/media/'
MEDIA_ROOT = '/home/votre_username/mysite/media'
```

#### Build du Frontend
```bash
npm run build
```

### 2. Upload sur PythonAnywhere

#### Via Git (Recommandé)
```bash
# Sur PythonAnywhere console
git clone https://github.com/votre-username/votre-repo.git
cd votre-repo
```

#### Via Files (Alternative)
- Uploader les fichiers via l'interface Files de PythonAnywhere

### 3. Configuration Backend sur PythonAnywhere

#### Créer un environnement virtuel
```bash
mkvirtualenv --python=/usr/bin/python3.10 barstock-env
workon barstock-env
```

#### Installer les dépendances
```bash
cd /home/votre_username/Bar_R/cursor/backend
pip install -r requirements.txt
pip install mysqlclient  # Pour MySQL
```

#### Configuration de la base de données MySQL
```bash
# Créer la base de données via l'interface PythonAnywhere
# Puis exécuter les migrations
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 4. Configuration Web App sur PythonAnywhere

#### Dans l'onglet Web :
1. **Source code** : `/home/votre_username/Bar_R/cursor/backend`
2. **Working directory** : `/home/votre_username/Bar_R/cursor/backend`
3. **WSGI configuration file** : Éditer pour pointer vers votre projet

#### Contenu du fichier WSGI :
```python
import os
import sys

# Ajouter le chemin du projet
path = '/home/votre_username/Bar_R/cursor/backend'
if path not in sys.path:
    sys.path.insert(0, path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'barstock_api.settings'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
```

### 5. Configuration des Fichiers Statiques

#### Dans l'onglet Web > Static files :
- **URL** : `/static/`
- **Directory** : `/home/votre_username/Bar_R/cursor/backend/staticfiles/`

- **URL** : `/media/`
- **Directory** : `/home/votre_username/Bar_R/cursor/backend/media/`

### 6. Déploiement du Frontend

#### Option 1 : Servir via Django (Simple)
```python
# Dans settings.py
STATICFILES_DIRS = [
    BASE_DIR / 'staticfiles',
    BASE_DIR.parent / 'dist',  # Build du frontend
]
```

#### Option 2 : CDN/Hébergement séparé (Recommandé)
- Déployer le build sur Netlify/Vercel
- Configurer les CORS pour autoriser le domaine frontend

### 7. Variables d'Environnement sur PythonAnywhere

Créer un fichier `.env` ou configurer dans `settings.py` :
```python
import os
from decouple import config

SECRET_KEY = config('SECRET_KEY', default='fallback-key')
DEBUG = config('DEBUG', default=False, cast=bool)
```

### 8. Configuration HTTPS et Domaine

#### SSL Certificate (Gratuit avec Let's Encrypt)
- Activer HTTPS dans l'onglet Web
- Forcer HTTPS : `SECURE_SSL_REDIRECT = True`

#### Domaine personnalisé (Optionnel)
- Configurer CNAME dans votre DNS
- Ajouter le domaine dans PythonAnywhere

---

## 🔧 Configuration Avancée

### WebSockets (Optionnel)
Pour les notifications temps réel, configurer Redis :
```bash
# Sur PythonAnywhere (compte payant requis pour Redis)
pip install channels-redis
```

### Tâches Périodiques
```bash
# Configurer des tâches dans l'onglet Tasks
# Exemple : python manage.py send_daily_reports
```

### Monitoring et Logs
```bash
# Consulter les logs d'erreur
tail -f /var/log/votre_username.pythonanywhere.com.error.log

# Logs d'accès
tail -f /var/log/votre_username.pythonanywhere.com.access.log
```

---

## 🚨 Checklist de Déploiement

### Avant le déploiement :
- [ ] Tests locaux passent
- [ ] Variables d'environnement configurées
- [ ] `DEBUG = False` en production
- [ ] `ALLOWED_HOSTS` configuré
- [ ] Fichiers statiques collectés
- [ ] Base de données migrée
- [ ] Superutilisateur créé

### Après le déploiement :
- [ ] Application accessible
- [ ] Connexion admin fonctionne
- [ ] API endpoints répondent
- [ ] Fichiers statiques chargent
- [ ] Authentification fonctionne
- [ ] Tests de fonctionnalités critiques

---

## 🆘 Dépannage Courant

### Erreur 500 Internal Server Error
```bash
# Vérifier les logs d'erreur
tail -f /var/log/votre_username.pythonanywhere.com.error.log

# Vérifier les migrations
python manage.py showmigrations
python manage.py migrate
```

### Problèmes de fichiers statiques
```bash
# Recollecte des fichiers statiques
python manage.py collectstatic --clear --noinput
```

### Erreurs de base de données
```bash
# Vérifier la connexion MySQL
python manage.py dbshell

# Reset des migrations (attention !)
python manage.py migrate --fake-initial
```

### CORS Issues
```python
# Dans settings.py
CORS_ALLOWED_ORIGINS = [
    "https://votre-frontend-domain.com",
    "https://votre-username.pythonanywhere.com",
]
```

---

## 📞 Support

- **Documentation Django** : https://docs.djangoproject.com/
- **PythonAnywhere Help** : https://help.pythonanywhere.com/
- **React Documentation** : https://react.dev/

Pour des questions spécifiques au projet, consultez le code source et les commentaires intégrés.
