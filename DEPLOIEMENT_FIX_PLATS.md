# 🚀 Guide de Déploiement : Fix Filtre Plats

## 📋 Changements à Déployer

### **Backend**
- ✅ `backend/products/serializers.py` - Ajout de `category_type` au `ProductListSerializer`

### **Frontend**
- ✅ `src/pages/Kitchen.tsx` - Amélioration du filtre avec logs détaillés

---

## 🚀 Méthode 1 : Script Automatique (Recommandé)

### **Étape 1 : Exécuter le Script**

```bash
deploy-fix-plats.bat
```

Le script va :
1. ✅ Vérifier les changements
2. ✅ Commit les modifications
3. ✅ Builder le frontend
4. ✅ Push vers GitHub

### **Étape 2 : Déployer sur le Serveur**

Connectez-vous à votre serveur et exécutez :

```bash
# 1. Aller dans le dossier du projet
cd /var/www/stock_resto

# 2. Récupérer les changements
git pull origin main

# 3. Redémarrer le backend Django
cd backend
python manage.py collectstatic --noinput
sudo systemctl restart gunicorn

# 4. Copier le nouveau build frontend
cd ..
sudo cp -r dist/* /var/www/stock_resto/html/
```

---

## 🚀 Méthode 2 : Déploiement Manuel

### **Partie 1 : Local (Windows)**

#### **1. Commit et Push**

```bash
# Vérifier les changements
git status

# Ajouter les fichiers
git add src/pages/Kitchen.tsx
git add backend/products/serializers.py

# Commit
git commit -m "fix: Filtre des plats dans dialog recette"

# Push
git push origin main
```

#### **2. Builder le Frontend**

```bash
npm run build
```

**Résultat** : Le dossier `dist/` contient le nouveau build.

---

### **Partie 2 : Serveur (Production)**

#### **1. Se Connecter au Serveur**

```bash
ssh user@votre-serveur.com
```

#### **2. Récupérer les Changements**

```bash
cd /var/www/stock_resto
git pull origin main
```

#### **3. Redémarrer le Backend**

```bash
cd backend

# Collecter les fichiers statiques
python manage.py collectstatic --noinput

# Redémarrer Gunicorn
sudo systemctl restart gunicorn

# Vérifier le statut
sudo systemctl status gunicorn
```

#### **4. Déployer le Frontend**

**Option A : Copier depuis le serveur (si vous avez Node.js sur le serveur)**

```bash
cd /var/www/stock_resto
npm install
npm run build
sudo cp -r dist/* /var/www/stock_resto/html/
```

**Option B : Uploader depuis votre PC (si pas de Node.js sur le serveur)**

Sur votre PC Windows :

```bash
# Utiliser SCP pour uploader le dossier dist
scp -r dist/* user@votre-serveur.com:/var/www/stock_resto/html/
```

#### **5. Vérifier les Permissions**

```bash
sudo chown -R www-data:www-data /var/www/stock_resto/html/
sudo chmod -R 755 /var/www/stock_resto/html/
```

---

## ✅ Vérification du Déploiement

### **1. Tester l'API Backend**

Ouvrez dans votre navigateur :

```
https://votre-site.com/api/products/
```

**Vérifier** que la réponse contient `category_type` :

```json
{
  "results": [
    {
      "id": 1,
      "name": "Brochette",
      "category_type": "plats",  ← ✅ Doit être présent
      "category_name": "Plats"
    }
  ]
}
```

---

### **2. Tester le Frontend**

1. Ouvrir https://votre-site.com/kitchen
2. Vider le cache du navigateur (Ctrl+Shift+R)
3. Ouvrir la console (F12)
4. Cliquer sur "Créer une Nouvelle Recette"
5. Vérifier les logs :

**Résultat Attendu** :
```
🔍 Total products loaded: 10
🍽️ Product: Brochette | Type: plats | Name: Plats
✅ KEPT: Brochette
🍽️ Product: Coca zero | Type: boissons | Name: Boissons
✅ Filtered food products: 5 out of 10
```

---

### **3. Vérifier le Dropdown**

Le dropdown "Plat associé" doit afficher **UNIQUEMENT** :
- ✅ Brochette
- ✅ Pizza Margherita
- ✅ Riz au Poulet
- ✅ ... (autres plats)

**PAS de boissons !**

---

## 🔧 Dépannage

### **Problème 1 : Le filtre ne fonctionne toujours pas**

**Solution** : Vider le cache du navigateur

```
1. F12 → Onglet Network
2. Cocher "Disable cache"
3. Ctrl+Shift+R (actualisation forcée)
```

---

### **Problème 2 : Erreur 500 sur l'API**

**Solution** : Vérifier les logs Django

```bash
sudo tail -f /var/log/gunicorn/error.log
```

---

### **Problème 3 : Le frontend n'est pas mis à jour**

**Solution** : Vérifier que le build a été copié

```bash
ls -la /var/www/stock_resto/html/assets/
# Vérifier la date de modification des fichiers
```

---

## 📊 Résumé des Commandes

### **Sur votre PC (Windows)**

```bash
# 1. Commit et push
git add .
git commit -m "fix: Filtre des plats"
git push

# 2. Build
npm run build
```

### **Sur le Serveur (Linux)**

```bash
# 1. Pull
cd /var/www/stock_resto
git pull

# 2. Redémarrer backend
cd backend
sudo systemctl restart gunicorn

# 3. Déployer frontend
cd ..
npm run build  # Si Node.js installé
sudo cp -r dist/* /var/www/stock_resto/html/
```

---

## ✅ Checklist de Déploiement

### **Local**
- [ ] Commit des changements
- [ ] Push vers GitHub
- [ ] Build du frontend réussi

### **Serveur**
- [ ] Git pull effectué
- [ ] Backend redémarré
- [ ] Frontend copié
- [ ] Permissions vérifiées

### **Tests**
- [ ] API retourne `category_type`
- [ ] Console affiche les bons logs
- [ ] Dropdown affiche uniquement les plats
- [ ] Aucune boisson dans la liste

---

## 🎉 Succès !

Une fois toutes les étapes complétées, le filtre des plats fonctionnera correctement en production !

**Le dropdown "Plat associé" affichera uniquement les plats, pas les boissons.** ✅

---

**Date** : 1er novembre 2025  
**Version** : 2.3.3  
**Status** : 📝 **Guide de déploiement**
