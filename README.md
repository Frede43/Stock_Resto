# 🍽️ Bar Stock Wise - Système de Gestion pour Bars et Restaurants

Un système de gestion complet et moderne pour bars et restaurants, développé avec React/TypeScript et Django REST Framework.

## 🌟 Fonctionnalités Principales

### 💰 Point de Vente (POS)
- Interface caissier intuitive et rapide
- Gestion des commandes en temps réel
- Calcul automatique des totaux et taxes
- Support des paiements multiples

### 📦 Gestion des Stocks
- Suivi en temps réel des inventaires
- Alertes automatiques de stock faible
- Gestion des approvisionnements
- Synchronisation automatique avec les ventes

### 🍳 Gestion des Commandes
- Workflow cuisine optimisé
- Statuts de commandes en temps réel
- Notifications automatiques
- Intégration complète avec le POS

### 🪑 Système de Tables
- Plan de salle interactif
- Gestion des réservations
- Suivi de l'occupation en temps réel
- Attribution automatique des serveurs

### 📊 Rapports et Analytics
- Tableaux de bord en temps réel
- Rapports de ventes détaillés
- Analyses de performance
- Statistiques par période

### 👥 Gestion Utilisateurs
- Système de rôles granulaire (Admin, Manager, Serveur, Caissier)
- Authentification JWT sécurisée
- Permissions personnalisables
- Gestion des sessions

### 🔔 Notifications Temps Réel
- WebSockets pour les mises à jour instantanées
- Alertes stocks et commandes
- Notifications système
- Centre de notifications unifié

## 🏗️ Architecture Technique

### Frontend
- **React 18** avec TypeScript
- **Vite** pour le build et le développement
- **Tailwind CSS** + **shadcn/ui** pour l'interface
- **React Query** pour la gestion d'état
- **React Router** pour la navigation
- **Socket.io** pour le temps réel

### Backend
- **Django REST Framework**
- **PostgreSQL/SQLite** pour la base de données
- **Django Channels** pour WebSockets
- **JWT** pour l'authentification
- **API REST** complète

### Déploiement
- **Docker** et **Docker Compose**
- **Nginx** comme reverse proxy
- Support **production** et **développement**

## 🚀 Installation Rapide

### Prérequis
- Node.js 18+ et npm
- Python 3.9+
- Git

### 1. Cloner le Repository
```bash
git clone https://github.com/Frede43/Stock_Resto.git
cd Stock_Resto
```

### 2. Installation Backend (Django)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver 8000
```

### 3. Installation Frontend (React)
```bash
# Dans un nouveau terminal
npm install
npm run dev
```

### 4. Accès à l'Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Django**: http://localhost:8000/admin

## 🔐 Comptes de Test

### Administrateur
- **Utilisateur**: `admin`
- **Mot de passe**: `Lumenge4242`

### Caissier
- **Utilisateur**: `caissier`
- **Mot de passe**: `temp123456`

## 🐳 Déploiement avec Docker

### Développement
```bash
docker-compose up -d
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 📱 Interfaces par Rôle

### 👑 Administrateur
- Accès complet au système
- Gestion des utilisateurs et permissions
- Configuration système
- Tous les rapports et analytics

### 📊 Manager
- Gestion opérationnelle
- Rapports et statistiques
- Gestion des stocks et approvisionnements
- Supervision des équipes

### 🍽️ Serveur
- Prise de commandes
- Gestion des tables
- Suivi des commandes cuisine
- Interface optimisée mobile

### 💰 Caissier
- Point de vente simplifié
- Encaissements
- Historique des ventes
- Interface dédiée et rapide

## 🔧 Configuration

### Variables d'Environnement
Créer un fichier `.env` à la racine :

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/barstock
# ou pour SQLite en développement
DATABASE_URL=sqlite:///db.sqlite3

# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# API
API_BASE_URL=http://localhost:8000

# WebSockets
WEBSOCKET_URL=ws://localhost:8000/ws/
```

## 🛠️ Développement

### Structure du Projet
```
├── backend/                 # Django REST API
│   ├── accounts/           # Gestion utilisateurs
│   ├── inventory/          # Gestion stocks
│   ├── sales/             # Point de vente
│   ├── orders/            # Commandes
│   └── analytics/         # Rapports
├── src/                   # Frontend React
│   ├── components/        # Composants UI
│   ├── pages/            # Pages de l'application
│   ├── hooks/            # Hooks React personnalisés
│   ├── services/         # Services API
│   └── utils/            # Utilitaires
└── public/               # Assets statiques
```

### Scripts Disponibles
```bash
# Frontend
npm run dev          # Serveur de développement
npm run build        # Build de production
npm run preview      # Prévisualisation du build
npm run lint         # Linting du code

# Backend
python manage.py runserver    # Serveur Django
python manage.py test        # Tests unitaires
python manage.py migrate     # Migrations DB
```

## 🔍 Fonctionnalités Avancées

### Corrections Appliquées
- ✅ **Problème de redirection caissier** résolu
- ✅ **Compatibilité cross-browser** (Edge/Chrome)
- ✅ **Gestion sécurisée du localStorage**
- ✅ **Synchronisation temps réel** améliorée
- ✅ **Gestion d'erreurs robuste**

### Sécurité
- Authentification JWT avec refresh tokens
- Validation côté client et serveur
- Protection CSRF
- Sanitisation des données
- Gestion sécurisée des sessions

### Performance
- Lazy loading des composants
- Optimisation des requêtes API
- Cache intelligent
- Compression des assets
- Service Workers (PWA ready)

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

Pour toute question ou problème :
- Ouvrir une [issue](https://github.com/Frede43/Stock_Resto/issues)
- Consulter la [documentation](https://github.com/Frede43/Stock_Resto/wiki)

## 🎯 Roadmap

- [ ] Application mobile (React Native)
- [ ] Intégration systèmes de paiement
- [ ] Module de fidélité client
- [ ] Analytics avancées avec IA
- [ ] API publique pour intégrations
- [ ] Support multi-établissements

---

**Développé avec AlainDev pour la communauté des restaurateurs**
