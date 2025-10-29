# 🚀 Guide de Déploiement BarStockWise sur Render

## 📖 Introduction

Ce guide vous accompagne pas à pas pour déployer votre application BarStockWise sur Render.com.

**Temps estimé** : 30-40 minutes  
**Coût** : Gratuit (avec limitations) ou 14$/mois (recommandé pour production)

---

## 📋 Ce que vous allez déployer

Votre application BarStockWise comprend :

1. **Backend API** (Django) - L'API qui gère toute la logique métier
2. **Frontend Web** (React) - L'interface utilisateur web
3. **Base de données** (PostgreSQL) - Stockage des données

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir :

- [ ] Un compte sur [render.com](https://render.com) (gratuit)
- [ ] Votre code sur GitHub ou GitLab
- [ ] Un navigateur web
- [ ] 30 minutes de temps disponible

---

## 🎯 Étape 1 : Créer un compte Render

### 1.1 Inscription

1. Allez sur [render.com](https://render.com)
2. Cliquez sur **"Get Started"** ou **"Sign Up"**
3. Choisissez **"Sign up with GitHub"** (recommandé) ou **"Sign up with GitLab"**
4. Autorisez Render à accéder à vos repositories
5. Vérifiez votre email

### 1.2 Connecter votre Repository

1. Dans le dashboard Render, cliquez sur votre profil (en haut à droite)
2. Allez dans **"Account Settings"**
3. Section **"Git Providers"** → Connectez GitHub ou GitLab
4. Autorisez l'accès au repository `Stock_Resto`

✅ **Checkpoint** : Vous devriez voir votre repository dans la liste

---

## 🗄️ Étape 2 : Créer la Base de Données PostgreSQL

### 2.1 Créer le service PostgreSQL

1. Dans le dashboard Render, cliquez sur **"New +"** (en haut à droite)
2. Sélectionnez **"PostgreSQL"**

### 2.2 Configuration

Remplissez les champs suivants :

| Champ | Valeur à entrer |
|-------|-----------------|
| **Name** | `barstock-db` |
| **Database** | `barstock_db` |
| **User** | (laissez vide, généré automatiquement) |
| **Region** | `Frankfurt (EU Central)` ou le plus proche de vous |
| **PostgreSQL Version** | `15` |
| **Datadog API Key** | (laissez vide) |
| **Plan** | **Free** (pour tester) ou **Starter** (7$/mois pour production) |

### 2.3 Créer la base de données

1. Cliquez sur **"Create Database"**
2. ⏳ Attendez 2-3 minutes (la création prend du temps)
3. Une fois créée, le statut affiche **"Available"** en vert

### 2.4 Récupérer l'URL de connexion

1. Dans la page de votre base de données, cherchez la section **"Connections"**
2. Copiez l'**"Internal Database URL"** (commence par `postgresql://`)
3. 📝 Collez-la dans un fichier texte temporaire (vous en aurez besoin)

**Format de l'URL** :
```
postgresql://user:password@host:5432/database
```

✅ **Checkpoint** : Vous avez une base de données PostgreSQL active et son URL

---

## 🔧 Étape 3 : Déployer le Backend (API Django)

### 3.1 Créer le Web Service

1. Cliquez sur **"New +"** → **"Web Service"**
2. Sélectionnez **"Build and deploy from a Git repository"**
3. Cliquez sur **"Next"**

### 3.2 Connecter le Repository

1. Cherchez votre repository **"Stock_Resto"** dans la liste
2. Cliquez sur **"Connect"**

### 3.3 Configuration du Service

Remplissez les champs suivants avec attention :

| Champ | Valeur à entrer |
|-------|-----------------|
| **Name** | `barstock-api` |
| **Region** | `Frankfurt (EU Central)` (même région que la DB) |
| **Branch** | `main` (ou `master` selon votre repo) |
| **Root Directory** | `backend` ⚠️ Important ! |
| **Runtime** | `Python 3` |
| **Build Command** | `chmod +x build.sh && ./build.sh` |
| **Start Command** | `gunicorn --bind 0.0.0.0:$PORT barstock_api.wsgi:application` |

### 3.4 Choisir le Plan

- **Free** : Gratuit, se met en veille après 15 min d'inactivité (bon pour tester)
- **Starter** : 7$/mois, toujours actif (recommandé pour production)

Sélectionnez **Free** pour commencer.

### 3.5 Configurer les Variables d'Environnement

Cliquez sur **"Advanced"** pour afficher les options avancées.

Dans la section **"Environment Variables"**, ajoutez les variables suivantes :

#### Variables Obligatoires

Cliquez sur **"Add Environment Variable"** pour chaque ligne :

| Key | Value |
|-----|-------|
| `DEBUG` | `False` |
| `SECRET_KEY` | Voir ci-dessous comment générer ⬇️ |
| `ALLOWED_HOSTS` | `.onrender.com` |
| `CORS_ALLOWED_ORIGINS` | `https://barstock-web.onrender.com` |
| `RENDER` | `True` |
| `PYTHON_VERSION` | `3.10.0` |

#### Générer la SECRET_KEY

**Option 1 - En ligne** :
1. Ouvrez un terminal Python ou utilisez [Python Online](https://www.python.org/shell/)
2. Exécutez :
```python
import secrets
print(secrets.token_urlsafe(50))
```
3. Copiez le résultat (environ 68 caractères)

**Option 2 - Générateur en ligne** :
1. Allez sur [Djecrety](https://djecrety.ir/)
2. Cliquez sur "Generate"
3. Copiez la clé générée

**Exemple de SECRET_KEY** :
```
8kJ9mN2pQ5rS7tU0vW3xY6zA1bC4dE8fG2hI5jK9lM3nO7pQ0rS4tU8vW2xY6zA
```

#### Lier la Base de Données

1. Toujours dans **"Advanced"** → Section **"Environment Variables"**
2. Cliquez sur **"Add Environment Variable"**
3. Key : `DATABASE_URL`
4. ⚠️ **NE PAS** entrer la valeur manuellement !
5. Cliquez sur le bouton **"Add from Database"** (icône de base de données)
6. Sélectionnez `barstock-db` dans la liste
7. Sélectionnez **"Internal Database URL"**
8. Cliquez sur **"Add"**

✅ La variable `DATABASE_URL` est maintenant liée automatiquement

### 3.6 Créer le Service

1. Vérifiez que toutes les variables sont bien renseignées
2. Cliquez sur **"Create Web Service"** (en bas)
3. ⏳ Le déploiement commence automatiquement

### 3.7 Surveiller le Déploiement

1. Vous êtes redirigé vers la page du service
2. Onglet **"Logs"** s'affiche automatiquement
3. Observez les logs en temps réel :

```
📂 Dossier de travail: /opt/render/project/src/backend
🔧 Installation des dépendances...
📁 Collecte des fichiers statiques...
🗄️ Exécution des migrations...
✅ Build terminé !
```

4. ⏳ Attendez 5-10 minutes (premier déploiement)
5. Le statut passe à **"Live"** en vert quand c'est prêt

### 3.8 Vérifier le Backend

1. En haut de la page, vous voyez l'URL : `https://barstock-api.onrender.com`
2. Cliquez sur l'URL ou ouvrez dans un nouvel onglet
3. Ajoutez `/api/` à la fin : `https://barstock-api.onrender.com/api/`
4. Vous devriez voir une réponse JSON :

```json
{
  "message": "API BarStock",
  "version": "1.0",
  "endpoints": {
    "accounts": "/api/accounts/",
    "products": "/api/products/",
    ...
  }
}
```

✅ **Checkpoint** : Votre backend est en ligne et répond !

---

## 🌐 Étape 4 : Déployer le Frontend (React)

### 4.1 Créer le Static Site

1. Retournez au dashboard Render
2. Cliquez sur **"New +"** → **"Static Site"**
3. Sélectionnez **"Build and deploy from a Git repository"**
4. Cliquez sur **"Next"**

### 4.2 Connecter le Repository

1. Cherchez **"Stock_Resto"** (même repository que le backend)
2. Cliquez sur **"Connect"**

### 4.3 Configuration du Site

| Champ | Valeur à entrer |
|-------|-----------------|
| **Name** | `barstock-web` |
| **Branch** | `main` (ou `master`) |
| **Root Directory** | (laissez vide) ⚠️ Important ! |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `dist` |

### 4.4 Variables d'Environnement

Cliquez sur **"Advanced"** et ajoutez :

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://barstock-api.onrender.com` |
| `NODE_VERSION` | `18.17.0` |

⚠️ **Important** : Remplacez `barstock-api` par le nom exact de votre backend si différent.

### 4.5 Créer le Site

1. Cliquez sur **"Create Static Site"**
2. ⏳ Le build commence (3-5 minutes)
3. Surveillez les logs :

```
📦 Installation des dépendances...
🏗️ Build du frontend...
✅ Build frontend terminé !
```

4. Le statut passe à **"Live"** en vert

### 4.6 Vérifier le Frontend

1. Cliquez sur l'URL : `https://barstock-web.onrender.com`
2. La page de connexion devrait s'afficher
3. Le design doit être correct (CSS chargé)

✅ **Checkpoint** : Votre frontend est en ligne !

---

## 👤 Étape 5 : Créer un Utilisateur Admin

### 5.1 Accéder au Shell

1. Retournez sur la page de votre **Backend** (`barstock-api`)
2. Cliquez sur l'onglet **"Shell"** (à côté de Logs)
3. Cliquez sur **"Launch Shell"**
4. ⏳ Attendez 10-20 secondes qu'un terminal s'ouvre

### 5.2 Créer le Superutilisateur

Dans le terminal qui s'ouvre, tapez :

```bash
python manage.py createsuperuser
```

Répondez aux questions :

```
Username: admin
Email address: admin@barstockwise.com
Password: [tapez un mot de passe fort]
Password (again): [retapez le même mot de passe]
```

⚠️ **Note** : Le mot de passe ne s'affiche pas quand vous tapez (c'est normal)

Vous devriez voir :
```
Superuser created successfully.
```

### 5.3 Tester l'Admin Django

1. Ouvrez : `https://barstock-api.onrender.com/admin/`
2. Connectez-vous avec :
   - Username : `admin`
   - Password : celui que vous avez créé
3. Vous devriez voir l'interface d'administration Django

✅ **Checkpoint** : Vous pouvez accéder à l'admin Django

---

## 🔗 Étape 6 : Connecter Frontend et Backend

### 6.1 Mettre à Jour CORS

Le backend doit autoriser les requêtes du frontend.

1. Retournez sur la page **Backend** (`barstock-api`)
2. Onglet **"Environment"**
3. Cherchez la variable `CORS_ALLOWED_ORIGINS`
4. Cliquez sur l'icône ✏️ (modifier)
5. Vérifiez que la valeur est : `https://barstock-web.onrender.com`
6. Si vous avez changé le nom du frontend, mettez la bonne URL
7. Cliquez sur **"Save Changes"**
8. ⏳ Le service redémarre automatiquement (1-2 minutes)

### 6.2 Tester la Connexion

1. Ouvrez votre frontend : `https://barstock-web.onrender.com`
2. Sur la page de connexion, entrez :
   - Username : `admin`
   - Password : votre mot de passe admin
3. Cliquez sur **"Se connecter"**
4. Vous devriez être redirigé vers le dashboard

✅ **Checkpoint** : Le frontend communique avec le backend !

---

## 🧪 Étape 7 : Tests et Vérification

### 7.1 Tests Basiques

Testez les fonctionnalités principales :

- [ ] **Connexion** : Login/Logout fonctionne
- [ ] **Dashboard** : Les statistiques s'affichent
- [ ] **Produits** : Vous pouvez voir la liste des produits
- [ ] **Création** : Vous pouvez créer un nouveau produit
- [ ] **Navigation** : Tous les menus sont accessibles

### 7.2 Vérifier les Logs

Si quelque chose ne fonctionne pas :

**Backend** :
1. Page du backend → Onglet **"Logs"**
2. Cherchez les lignes en rouge (erreurs)

**Frontend** :
1. Ouvrez la console du navigateur (F12)
2. Onglet **"Console"**
3. Cherchez les erreurs en rouge

### 7.3 Problèmes Courants

#### Erreur CORS

**Symptôme** : Message d'erreur dans la console du navigateur mentionnant "CORS"

**Solution** :
1. Vérifiez que `CORS_ALLOWED_ORIGINS` dans le backend contient l'URL exacte du frontend
2. Pas d'espace, pas de slash à la fin
3. Format : `https://barstock-web.onrender.com`

#### Backend en veille (Plan Free)

**Symptôme** : Première requête très lente (30-60 secondes)

**Explication** : Le plan gratuit met le service en veille après 15 minutes d'inactivité

**Solutions** :
- Attendre que le service se réveille
- Upgrader vers le plan Starter (7$/mois) pour éviter la mise en veille

#### Erreur 500

**Symptôme** : Page blanche ou erreur 500

**Solution** :
1. Vérifiez les logs du backend
2. Vérifiez que `DATABASE_URL` est bien configurée
3. Vérifiez que les migrations ont été exécutées

---

## 📊 Étape 8 : Ajouter des Données

### 8.1 Via l'Admin Django

1. Allez sur `https://barstock-api.onrender.com/admin/`
2. Créez des données de test :
   - **Categories** : Boissons, Plats, Desserts
   - **Products** : Quelques produits dans chaque catégorie
   - **Suppliers** : 2-3 fournisseurs
   - **Users** : Créez des utilisateurs avec différents rôles

### 8.2 Créer des Utilisateurs

Dans l'admin Django, section **Accounts → Users** :

1. Cliquez sur **"Add User"**
2. Remplissez :
   - Username : `caissier1`
   - Password : (choisir un mot de passe)
   - Role : `cashier`
3. Cliquez sur **"Save"**

Créez au minimum :
- 1 Manager
- 1 Caissier
- 1 Serveur
- 1 Cuisinier

### 8.3 Tester avec les Nouveaux Utilisateurs

1. Déconnectez-vous de l'admin
2. Allez sur le frontend
3. Connectez-vous avec un des comptes créés
4. Vérifiez que les permissions sont correctes

---

## 🔐 Étape 9 : Sécurité et Configuration

### 9.1 Vérifications de Sécurité

Assurez-vous que :

- [x] `DEBUG=False` dans les variables d'environnement backend
- [x] `SECRET_KEY` est unique et longue (50+ caractères)
- [x] `ALLOWED_HOSTS` est configuré
- [x] HTTPS est actif (automatique sur Render)
- [x] Mots de passe admin sont forts

### 9.2 Configuration Email (Optionnel)

Pour recevoir des notifications par email :

1. Backend → Environment → Add Environment Variable

| Key | Value |
|-----|-------|
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USE_TLS` | `True` |
| `EMAIL_HOST_USER` | `votre-email@gmail.com` |
| `EMAIL_HOST_PASSWORD` | `votre-app-password` |

⚠️ **Gmail** : Utilisez un "App Password", pas votre mot de passe principal
- Allez dans votre compte Google → Sécurité → Mots de passe des applications

### 9.3 Sauvegarder les Informations

Créez un document sécurisé avec :

```
=== INFORMATIONS DÉPLOIEMENT BARSTOCK ===

URLs :
- Frontend : https://barstock-web.onrender.com
- Backend : https://barstock-api.onrender.com/api/
- Admin : https://barstock-api.onrender.com/admin/

Compte Admin :
- Username : admin
- Password : [votre mot de passe]

Base de données :
- Nom : barstock-db
- URL : [votre DATABASE_URL]

Date de déploiement : [date du jour]
```

🔒 **Gardez ce document en sécurité !**

---

## 📱 Étape 10 : Application Mobile (Optionnel)

### 10.1 Configuration

Pour connecter l'app mobile Flutter au backend déployé :

1. Ouvrez `barstock_mobile/lib/config/api_config.dart`
2. Modifiez :

```dart
class ApiConfig {
  static const String baseUrl = 'https://barstock-api.onrender.com';
  static const String apiUrl = '$baseUrl/api';
}
```

### 10.2 Build Android

```bash
cd barstock_mobile
flutter clean
flutter pub get
flutter build apk --release
```

L'APK sera dans : `build/app/outputs/flutter-apk/app-release.apk`

### 10.3 Distribution

- **Google Play Store** : Suivez le guide de publication Google
- **Distribution directe** : Partagez l'APK directement

---

## 🎯 Récapitulatif

### Ce que vous avez déployé

✅ **Base de données PostgreSQL** - Stockage des données  
✅ **Backend API Django** - Logique métier et API REST  
✅ **Frontend React** - Interface utilisateur web  
✅ **Compte Admin** - Accès à l'administration  
✅ **Configuration sécurisée** - HTTPS, CORS, etc.

### Vos URLs

- **Application Web** : `https://barstock-web.onrender.com`
- **API** : `https://barstock-api.onrender.com/api/`
- **Admin** : `https://barstock-api.onrender.com/admin/`

### Coûts

**Plan Gratuit** : 0$/mois
- Backend se met en veille après 15 min
- PostgreSQL expire après 90 jours
- Bon pour tester

**Plan Production** : 14$/mois
- Backend : 7$/mois (toujours actif)
- PostgreSQL : 7$/mois (permanent)
- Recommandé pour usage réel

---

## 🔄 Maintenance

### Mettre à Jour l'Application

Quand vous modifiez le code :

1. Commitez vos changements :
```bash
git add .
git commit -m "Description des changements"
git push origin main
```

2. Render détecte automatiquement et redéploie
3. Surveillez les logs pendant le redéploiement

### Redémarrage Manuel

Si besoin de redémarrer :

1. Page du service → Menu (⋮) en haut à droite
2. **"Manual Deploy"** → **"Deploy latest commit"**
3. Ou : **"Clear build cache & deploy"** (si problème de cache)

### Voir les Logs

**Backend** :
- Page du backend → Onglet "Logs"
- Logs en temps réel

**Frontend** :
- Page du frontend → Onglet "Logs"
- Logs de build uniquement

### Backup Base de Données

**Important** : Faites des backups réguliers !

1. Page PostgreSQL → Onglet "Backups"
2. Cliquez sur "Create Backup"
3. Téléchargez le backup

---

## 🆘 Support

### Documentation

- [Modifications Settings](./MODIFICATIONS_SETTINGS_RENDER.md) - Détails techniques
- [Render Docs](https://render.com/docs) - Documentation officielle
- [Django Deployment](https://docs.djangoproject.com/en/4.2/howto/deployment/) - Guide Django

### Problèmes Fréquents

**Q : Le backend ne démarre pas**  
R : Vérifiez les logs, la DATABASE_URL, et que build.sh est exécutable

**Q : Erreur CORS**  
R : Vérifiez CORS_ALLOWED_ORIGINS contient l'URL exacte du frontend

**Q : Le frontend est blanc**  
R : Ouvrez la console (F12), vérifiez VITE_API_URL et les erreurs

**Q : Connexion lente**  
R : Plan gratuit = mise en veille. Attendez 30-60s ou upgradez

---

## 🎉 Félicitations !

Votre application BarStockWise est maintenant déployée et accessible en ligne !

**Prochaines étapes** :
1. ✅ Tester toutes les fonctionnalités
2. ✅ Créer les utilisateurs réels
3. ✅ Importer les données de production
4. ✅ Former les utilisateurs
5. ✅ Monitorer les performances

**Bon succès avec votre application ! 🚀**

---

*Document créé le 29 octobre 2025*  
*Version 1.0 - BarStockWise Deployment Guide*
