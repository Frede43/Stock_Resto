# 🔐 Identifiants de Production - BarStockWise

## 👤 Superutilisateur Admin

### Identifiants par Défaut
```
Username: admin
Password: admin123
Email: admin@barstockwise.com
```

### Création Automatique
Le superutilisateur est créé automatiquement lors du déploiement via le script `backend/create_superuser.py`.

### Accès
- **Interface Admin Django** : `https://barstock-api.onrender.com/admin/`
- **Application Web** : `https://barstock-web.onrender.com/`

## ⚠️ SÉCURITÉ IMPORTANTE

### 🔒 Changez le Mot de Passe Immédiatement !

**Après le premier déploiement, changez le mot de passe :**

#### Option 1 : Via l'Interface Admin Django
1. Connectez-vous à `https://barstock-api.onrender.com/admin/`
2. Allez dans **"Users"** → **"admin"**
3. Cliquez sur **"Change password"**
4. Entrez un nouveau mot de passe fort

#### Option 2 : Via le Shell Render
1. Dashboard Render → Service Backend → Onglet **"Shell"**
2. Lancez le shell
3. Exécutez :
```python
from django.contrib.auth import get_user_model
User = get_user_model()
user = User.objects.get(username='admin')
user.set_password('VOTRE_NOUVEAU_MOT_DE_PASSE_FORT')
user.save()
print("✅ Mot de passe changé avec succès!")
```

### 📋 Recommandations pour un Mot de Passe Fort
- Minimum 12 caractères
- Mélange de majuscules, minuscules, chiffres et symboles
- Pas de mots du dictionnaire
- Unique (pas utilisé ailleurs)

**Exemple de mot de passe fort** :
```
B@rSt0ck#2025!Secure
```

## 🔄 Création Manuelle (Si Nécessaire)

Si le script automatique échoue, créez manuellement via le Shell Render :

```bash
python manage.py createsuperuser
```

Puis entrez :
```
Username: admin
Email: admin@barstockwise.com
Password: [votre mot de passe]
```

## 👥 Autres Utilisateurs à Créer

Après avoir créé le superutilisateur, créez les autres utilisateurs via l'admin Django :

### Manager
```
Username: manager
Role: manager
```

### Caissier
```
Username: caissier
Role: cashier
```

### Serveur
```
Username: serveur
Role: server
```

### Cuisinier
```
Username: cuisinier
Role: cook
```

## 📝 Notes

- Le superutilisateur a tous les droits (admin Django + application)
- Les autres utilisateurs ont des permissions limitées selon leur rôle
- Tous les mots de passe doivent être changés lors de la première connexion
- Gardez ce fichier en sécurité et ne le partagez pas publiquement

## 🔍 Vérification

Pour vérifier que le superutilisateur a été créé :

1. **Via l'admin Django** :
   - Allez sur `https://barstock-api.onrender.com/admin/`
   - Connectez-vous avec `admin` / `admin123`

2. **Via le Shell Render** :
```python
from django.contrib.auth import get_user_model
User = get_user_model()
admin = User.objects.get(username='admin')
print(f"Username: {admin.username}")
print(f"Email: {admin.email}")
print(f"Is superuser: {admin.is_superuser}")
print(f"Is staff: {admin.is_staff}")
print(f"Role: {admin.role}")
```

---

**Date de création** : 29 octobre 2025  
**Dernière mise à jour** : 29 octobre 2025

⚠️ **IMPORTANT** : Ne commitez pas ce fichier avec les vrais mots de passe de production !
