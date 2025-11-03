# 📖 GUIDE COMPLET D'UTILISATION - BarStockWise Web Application

## 🎯 Table des Matières

1. [Introduction](#introduction)
2. [Connexion](#connexion)
3. [Tableau de Bord](#tableau-de-bord)
4. [Gestion des Ventes (POS)](#gestion-des-ventes-pos)
5. [Gestion des Produits](#gestion-des-produits)
6. [Gestion des Stocks](#gestion-des-stocks)
7. [Gestion des Tables](#gestion-des-tables)
8. [Interface Cuisine](#interface-cuisine)
9. [Rapports et Analyses](#rapports-et-analyses)
10. [Gestion des Utilisateurs](#gestion-des-utilisateurs)
11. [Paramètres](#paramètres)
12. [Rôles et Permissions](#rôles-et-permissions)

---

## 📌 Introduction

**BarStockWise** est une application web complète de gestion de restaurant/bar développée pour **Harry's Grill Bar**. Elle permet de gérer :

- ✅ Les ventes et le point de vente (POS)
- ✅ Les produits et catégories
- ✅ Les stocks et inventaires
- ✅ Les tables et réservations
- ✅ Les commandes cuisine
- ✅ Les rapports et analyses
- ✅ Les utilisateurs et permissions
- ✅ Les fournisseurs et dépenses

### Technologies Utilisées
- **Frontend** : React 18 + TypeScript + Vite
- **UI** : Shadcn UI + Radix UI + Tailwind CSS
- **Backend** : Django REST Framework
- **Base de données** : PostgreSQL
- **Authentification** : JWT (JSON Web Tokens)
- **Temps réel** : WebSockets (Socket.io)

---

## 🔐 Connexion

### Accès à l'Application

1. **URL de l'application** : `http://localhost:5173` (développement) ou votre URL de production
2. **Page de connexion** : Vous serez automatiquement redirigé vers `/login` si non connecté

### Formulaire de Connexion

![Page de connexion](docs/images/login.png)

**Champs requis** :
- **Nom d'utilisateur** : Votre identifiant utilisateur
- **Mot de passe** : Votre mot de passe sécurisé

**Options** :
- ☑️ **Se souvenir** : Garde votre session active
- 🔗 **Mot de passe oublié** : Récupération de compte

### Comptes de Test

| Rôle | Nom d'utilisateur | Mot de passe | Accès |
|------|-------------------|--------------|-------|
| **Admin** | `admin` | `admin123` | Accès complet |
| **Manager** | `manager` | `manager123` | Gestion opérationnelle |
| **Serveur** | `server` | `server123` | Tables, commandes, ventes |
| **Caissier** | `cashier` | `cashier123` | Ventes uniquement |

### Après Connexion

Une fois connecté, vous serez redirigé vers le **tableau de bord** adapté à votre rôle :
- **Admin** → Dashboard administrateur complet
- **Manager** → Dashboard de gestion
- **Serveur** → Dashboard serveur (tables, commandes)
- **Caissier** → Dashboard caissier (ventes uniquement)

---

## 📊 Tableau de Bord

### Vue d'Ensemble

Le tableau de bord affiche les **métriques clés** en temps réel :

#### 📈 Statistiques Principales

1. **Ventes du jour**
   - Montant total des ventes (en FBu)
   - Variation par rapport à hier (%)
   - Icône : 💰

2. **Commandes en cours**
   - Nombre de commandes actives
   - Statuts : En attente, En préparation, Prêt
   - Icône : 🛒

3. **Alertes système**
   - Alertes de stock bas
   - Alertes critiques
   - Icône : ⚠️

4. **Tables occupées**
   - Nombre de tables occupées / total
   - Taux d'occupation (%)
   - Icône : 👥

#### 📊 Graphiques

**1. Ventes du jour (Graphique linéaire)**
- Évolution des ventes heure par heure
- Axe X : Heures (0:00 - 23:00)
- Axe Y : Montant en FBu
- Mise à jour en temps réel

**2. Produits les plus vendus (Graphique à barres)**
- Top 5-10 produits du jour
- Quantités vendues
- Permet d'identifier les best-sellers

#### ⚡ Actions Rapides

Boutons d'accès rapide :
- **Nouvelle vente** → Ouvre le POS
- **Gérer les tables** → Gestion des tables
- **Voir les stocks** → Inventaire
- **Rapports** → Génération de rapports

#### 🔔 Widget Alertes

Affiche les alertes actives :
- 🔴 **Critiques** : Rupture de stock
- 🟡 **Avertissements** : Stock faible
- 🔵 **Informations** : Notifications système

#### 🔄 Actualisation

- **Bouton "Actualiser"** : Rafraîchit toutes les données
- **Auto-refresh** : Toutes les 30 secondes (configurable)

---

## 💰 Gestion des Ventes (POS)

### Point de Vente (Sales)

**Accès** : Menu latéral → **Ventes** ou bouton "Nouvelle vente"

### Interface POS

L'interface est divisée en **3 sections** :

#### 1️⃣ Sélection des Produits (Gauche)

**Filtres** :
- 🔍 **Recherche** : Rechercher un produit par nom
- 📁 **Catégories** : Filtrer par catégorie (Boissons, Plats, Snacks)

**Affichage des produits** :
- Cartes produits avec :
  - Nom du produit
  - Prix de vente (FBu)
  - Stock disponible
  - Badge de statut :
    - 🟢 **Disponible** : Stock OK
    - 🟡 **Stock faible** : Proche du minimum
    - 🔴 **Rupture** : Stock épuisé (non sélectionnable)

**Ajouter au panier** :
- Cliquer sur une carte produit
- Le produit est ajouté au panier avec quantité = 1

#### 2️⃣ Panier (Droite)

**Contenu du panier** :
- Liste des articles sélectionnés
- Pour chaque article :
  - Nom
  - Prix unitaire
  - Quantité (modifiable avec +/-)
  - Sous-total
  - Bouton 🗑️ pour supprimer

**Contrôles de quantité** :
- ➕ **Plus** : Augmenter la quantité (max = stock disponible)
- ➖ **Moins** : Diminuer la quantité (min = 1)

**Total** :
- Affichage du montant total en **FBu**
- Calcul automatique

#### 3️⃣ Informations de Vente

**Champs obligatoires** :

1. **Table** (Select)
   - Liste des tables disponibles
   - Format : "Table N° X (Capacité Y)"
   - Seules les tables "Disponibles" sont sélectionnables

2. **Serveur** (Select)
   - Liste des serveurs actifs
   - Format : "Prénom Nom"

3. **Nom du client** (Input)
   - Nom du client (optionnel mais recommandé)

**Méthode de paiement** :
- 💵 **Cash** : Espèces
- 💳 **Card** : Carte bancaire
- 📱 **Mobile** : Mobile Money
- 📝 **Credit** : Crédit (à payer plus tard)

### Finaliser la Vente

**Bouton "Finaliser la vente"** :

1. **Validation** :
   - Vérifie que le panier n'est pas vide
   - Vérifie que table et serveur sont sélectionnés
   - Vérifie la disponibilité des stocks

2. **Traitement** :
   - Crée la vente dans le système
   - Occupe la table automatiquement
   - Déduit les quantités du stock
   - Génère une référence unique (SALE-YYYYMMDD-HHMMSS-UUID)

3. **Confirmation** :
   - Message de succès
   - Option d'imprimer la facture
   - Réinitialisation du panier

### Impression de Facture

**Facture générée** :
- En-tête : Harry's Grill Bar
- Informations : Date, heure, référence
- Table et serveur
- Liste des articles (nom, qté, prix, total)
- Montant total
- Méthode de paiement
- Pied de page : "Merci de votre visite !"

**Options d'impression** :
- 🖨️ **Imprimer** : Impression directe
- 📄 **PDF** : Télécharger en PDF
- ✉️ **Email** : Envoyer par email (si configuré)

---

## 📦 Gestion des Produits

### Page Produits

**Accès** : Menu latéral → **Produits**

### Vue d'Ensemble

**Statistiques en haut** :
- 📦 **Total produits** : Nombre total de produits
- 💰 **Valeur stock** : Valeur totale du stock (FBu)
- ⚠️ **Alertes stock** : Produits en stock faible

### Liste des Produits

**Tableau avec colonnes** :
- **Nom** : Nom du produit
- **Catégorie** : Catégorie (avec icône)
- **Prix d'achat** : Prix d'achat unitaire (FBu)
- **Prix de vente** : Prix de vente unitaire (FBu)
- **Stock** : Quantité en stock
- **Stock min** : Seuil d'alerte
- **Statut** : Badge de statut
  - 🟢 **OK** : Stock suffisant
  - 🟡 **Faible** : Stock bas
  - 🔴 **Critique** : Rupture de stock
- **Actions** : Boutons Modifier / Supprimer

### Filtres et Recherche

**Barre de recherche** :
- 🔍 Rechercher par nom de produit
- Recherche en temps réel

**Filtre par catégorie** :
- Dropdown avec toutes les catégories
- Option "Toutes les catégories"

### Ajouter un Produit

**Bouton "➕ Nouveau produit"** :

**Formulaire** :
1. **Informations de base**
   - Nom du produit *
   - Description
   - Catégorie * (Select)
   - Unité * (pièce, bouteille, casier, litre, kg, portion)

2. **Prix**
   - Prix d'achat * (FBu)
   - Prix de vente * (FBu)
   - Marge calculée automatiquement

3. **Stock**
   - Stock initial *
   - Stock minimum * (seuil d'alerte)

4. **Options avancées** (pour boissons)
   - Unités par casier
   - Prix du casier

**Validation** :
- Tous les champs marqués * sont obligatoires
- Prix de vente > Prix d'achat (recommandé)
- Stock minimum > 0

**Bouton "Créer"** :
- Enregistre le produit
- Affiche un message de confirmation
- Rafraîchit la liste

### Modifier un Produit

**Bouton "✏️ Modifier"** :
- Ouvre le même formulaire pré-rempli
- Permet de modifier tous les champs
- Bouton "Enregistrer les modifications"

### Supprimer un Produit

**Bouton "🗑️ Supprimer"** :
- Demande une confirmation
- ⚠️ **Attention** : Suppression définitive
- Vérifie qu'il n'y a pas de ventes en cours

### Gestion des Catégories

**Bouton "📁 Nouvelle catégorie"** :

**Formulaire** :
- Nom de la catégorie *
- Type * (boissons, plats, snacks)
- Description

**Catégories par défaut** :
- 🍺 **Boissons** : Bières, sodas, vins, etc.
- 🍽️ **Plats** : Entrées, plats principaux, desserts
- 🍿 **Snacks** : Amuse-gueules, tapas

---

## 📊 Gestion des Stocks

### Page Stocks

**Accès** : Menu latéral → **Stocks**

### Onglets Principaux

#### 1️⃣ Vue d'Ensemble

**Statistiques** :
- 📦 **Valeur totale** : Valeur du stock (FBu)
- 📈 **Entrées du mois** : Quantité entrée
- 📉 **Sorties du mois** : Quantité sortie
- ⚠️ **Alertes actives** : Nombre d'alertes

**Tableau des stocks** :
- Tous les produits avec leur stock actuel
- Colonnes : Nom, Catégorie, Stock actuel, Stock min, Stock max, Statut
- Indicateurs visuels :
  - 🟢 **OK** : Stock normal
  - 🟡 **Faible** : Stock < 150% du minimum
  - 🔴 **Critique** : Stock ≤ minimum
  - 🔵 **Excès** : Stock > 300% du minimum

#### 2️⃣ Mouvements de Stock

**Historique des mouvements** :
- Liste chronologique de tous les mouvements
- Colonnes :
  - Date et heure
  - Produit
  - Type de mouvement :
    - ⬆️ **Entrée** : Approvisionnement
    - ⬇️ **Sortie** : Vente
    - 🔄 **Ajustement** : Correction manuelle
    - ❌ **Perte** : Casse, péremption
  - Quantité
  - Stock avant / après
  - Utilisateur
  - Raison

**Filtres** :
- Par date (plage)
- Par type de mouvement
- Par produit

#### 3️⃣ Alertes Stock

**Liste des produits en alerte** :
- Produits avec stock ≤ minimum
- Tri par criticité (rupture en premier)
- Actions rapides :
  - 🛒 **Commander** : Créer un bon de commande
  - 📝 **Ajuster** : Ajustement manuel

### Ajustement de Stock

**Bouton "Ajuster le stock"** :

**Formulaire** :
1. **Produit** : Sélectionner le produit
2. **Type d'ajustement** :
   - ➕ **Ajouter** : Augmenter le stock
   - ➖ **Retirer** : Diminuer le stock
3. **Quantité** : Nombre d'unités
4. **Raison** * :
   - Inventaire
   - Correction d'erreur
   - Perte (casse, vol, péremption)
   - Retour fournisseur
   - Autre (préciser)
5. **Notes** : Commentaires additionnels

**Validation** :
- Enregistre le mouvement
- Met à jour le stock
- Crée une trace d'audit

### Approvisionnement

**Bouton "➕ Nouvel approvisionnement"** :

**Formulaire** :
1. **Fournisseur** * : Sélectionner le fournisseur
2. **Date de livraison** *
3. **Référence bon de commande** (optionnel)
4. **Produits** :
   - Ajouter des lignes de produits
   - Pour chaque produit :
     - Produit *
     - Quantité commandée *
     - Quantité reçue *
     - Prix unitaire *
5. **Total** : Calculé automatiquement
6. **Notes** : Observations

**Statuts** :
- 🟡 **En attente** : Commande passée
- 🔵 **Partielle** : Livraison partielle
- 🟢 **Reçue** : Livraison complète
- ❌ **Annulée** : Commande annulée

**Réception** :
- Marquer comme "Reçu"
- Met à jour automatiquement les stocks
- Crée les mouvements d'entrée

---

## 🪑 Gestion des Tables

### Page Tables

**Accès** : Menu latéral → **Tables**

### Vue d'Ensemble

**Affichage en grille** :
- Cartes visuelles pour chaque table
- Couleurs selon le statut :
  - 🟢 **Disponible** : Vert
  - 🔴 **Occupée** : Rouge
  - 🟡 **Réservée** : Jaune
  - 🔵 **Nettoyage** : Bleu

**Informations sur chaque carte** :
- Numéro de table
- Capacité (nombre de places)
- Emplacement (Terrasse, Salle principale, VIP, etc.)
- Statut actuel
- Si occupée :
  - Nom du client
  - Serveur assigné
  - Durée d'occupation
  - Montant de la vente en cours

### Actions sur les Tables

#### Table Disponible

**Boutons** :
- 🪑 **Occuper** : Marquer comme occupée
- 📅 **Réserver** : Créer une réservation

**Occuper une table** :
1. Cliquer sur "Occuper"
2. Formulaire :
   - Nom du client *
   - Nombre de personnes *
   - Serveur assigné *
3. Valider
4. La table passe en statut "Occupée"

#### Table Occupée

**Informations affichées** :
- Client
- Serveur
- Heure d'arrivée
- Durée
- Montant actuel

**Boutons** :
- 💰 **Voir la vente** : Détails de la commande
- ✅ **Libérer** : Marquer comme disponible
- 🧹 **Nettoyage** : Marquer pour nettoyage

**Libérer une table** :
1. Cliquer sur "Libérer"
2. Confirmation
3. La vente doit être payée avant
4. La table passe en "Nettoyage" puis "Disponible"

#### Table Réservée

**Informations** :
- Nom du client
- Date et heure de réservation
- Nombre de personnes
- Téléphone / Email

**Boutons** :
- ✅ **Confirmer arrivée** : Passe en "Occupée"
- ❌ **Annuler** : Annule la réservation
- ✏️ **Modifier** : Modifier les détails

### Créer une Réservation

**Bouton "📅 Nouvelle réservation"** :

**Formulaire** :
1. **Informations client**
   - Nom *
   - Téléphone *
   - Email (optionnel)

2. **Détails réservation**
   - Table * (Select)
   - Date * (Date picker)
   - Heure * (Time picker)
   - Nombre de personnes *
   - Durée estimée (défaut : 2h)

3. **Demandes spéciales**
   - Notes / Allergies / Préférences

**Validation** :
- Vérifie la disponibilité de la table
- Envoie une confirmation (si email fourni)
- Crée la réservation

**Statuts de réservation** :
- 🟡 **En attente** : Réservation créée
- 🟢 **Confirmée** : Client a confirmé
- 🔵 **Installée** : Client arrivé (table occupée)
- ✅ **Terminée** : Repas terminé
- ❌ **Annulée** : Réservation annulée
- 🚫 **No-show** : Client non présenté

### Créer une Nouvelle Table

**Bouton "➕ Nouvelle table"** :

**Formulaire** :
- Numéro de table *
- Capacité * (nombre de places)
- Emplacement * (Terrasse, Salle, VIP, etc.)
- Notes (optionnel)

### Notifications Tables

**Système de notifications** :
- 🔔 Alerte quand une table se libère
- 🔔 Rappel de réservations à venir (15 min avant)
- 🔔 Alerte si table occupée > 2h

---

## 👨‍🍳 Interface Cuisine

### Page Cuisine

**Accès** : Menu latéral → **Cuisine**

### Onglets Principaux

#### 1️⃣ Alertes Stock Cuisine

**Liste des ingrédients en alerte** :
- Tableau avec :
  - Nom de l'ingrédient
  - Stock actuel
  - Stock minimum
  - Unité
  - Sévérité :
    - 🔴 **Critique** : Stock = 0
    - 🟡 **Avertissement** : Stock ≤ minimum

**Actions** :
- 🛒 **Ajouter à la liste de courses**
- 📝 **Ajuster le stock**

#### 2️⃣ Prévisions de Production

**Calcul automatique** :
- Pour chaque recette :
  - Nombre maximum de portions réalisables
  - Ingrédient limitant
  - Coût par portion
  - Temps de préparation

**Exemple** :
```
Burger Classique
- Max portions : 25
- Limitant : Pain (25 unités)
- Coût/portion : 1,500 FBu
- Temps prépa : 15 min
```

#### 3️⃣ Liste de Courses

**Génération automatique** :
- Basée sur les alertes stock
- Basée sur les prévisions de vente
- Groupée par fournisseur

**Colonnes** :
- Ingrédient
- Quantité à commander
- Unité
- Fournisseur suggéré
- Prix estimé

**Actions** :
- ✅ **Marquer comme commandé**
- 📧 **Envoyer au fournisseur**
- 🖨️ **Imprimer**

#### 4️⃣ Analyse de Rentabilité

**Tableau des plats** :
- Nom du plat
- Coût des ingrédients
- Prix de vente
- Marge (FBu et %)
- Popularité (ventes)

**Tri** :
- Par marge (%)
- Par popularité
- Par rentabilité totale

**Indicateurs** :
- 🟢 **Rentable** : Marge > 60%
- 🟡 **Moyen** : Marge 40-60%
- 🔴 **Faible** : Marge < 40%

### Gestion des Ingrédients

**Bouton "➕ Nouvel ingrédient"** :

**Formulaire** :
- Nom *
- Quantité en stock *
- Unité * (kg, g, L, mL, pièce)
- Seuil d'alerte *
- Prix unitaire *
- Fournisseur (Select)
- Description

### Gestion des Recettes

**Bouton "➕ Nouvelle recette"** :

**Formulaire** :
1. **Informations de base**
   - Plat associé * (Select)
   - Nom de la recette *
   - Description
   - Instructions de préparation

2. **Détails**
   - Temps de préparation (minutes) *
   - Nombre de portions *

3. **Ingrédients**
   - Bouton "➕ Ajouter un ingrédient"
   - Pour chaque ingrédient :
     - Ingrédient * (Select)
     - Quantité utilisée *
     - Unité *

**Calculs automatiques** :
- Coût total de la recette
- Coût par portion
- Marge par portion

**Modifier une recette** :
- Bouton "✏️ Modifier"
- Même formulaire pré-rempli
- Possibilité d'ajouter/retirer des ingrédients

---

## 📈 Rapports et Analyses

### Page Rapports

**Accès** : Menu latéral → **Rapports**

### Types de Rapports

#### 1️⃣ Rapport de Ventes

**Données affichées** :
- **Statistiques globales** :
  - Nombre total de ventes
  - Chiffre d'affaires total (FBu)
  - Ventes payées
  - Ticket moyen

- **Ventes par heure** (Graphique)
  - Évolution sur la journée
  - Identification des heures de pointe

- **Top produits** (Tableau)
  - Produits les plus vendus
  - Quantités
  - Chiffre d'affaires généré

**Filtres** :
- Plage de dates (jour, semaine, mois, trimestre, année, personnalisé)
- Date de début / fin
- Catégorie de produits
- Serveur
- Méthode de paiement

**Export** :
- 📄 **PDF** : Rapport formaté
- 📊 **Excel** : Données brutes
- 📋 **CSV** : Import dans d'autres outils

#### 2️⃣ Rapport d'Inventaire

**Données affichées** :
- **Par produit** :
  - Stock initial
  - Entrées (approvisionnements)
  - Sorties (ventes)
  - Stock final
  - Valeur du stock (FBu)

- **Mouvements** :
  - Détail de tous les mouvements
  - Traçabilité complète

- **Alertes** :
  - Produits en rupture
  - Produits en stock faible
  - Produits en surstock

**Filtres** :
- Période
- Catégorie
- Statut (OK, Faible, Critique)

**Export** :
- PDF, Excel, CSV

#### 3️⃣ Rapport Financier

**Données affichées** :
- **Revenus** :
  - Ventes totales
  - Par catégorie
  - Par méthode de paiement

- **Dépenses** :
  - Approvisionnements
  - Autres dépenses

- **Marges** :
  - Marge brute
  - Marge nette
  - Taux de marge (%)

- **Graphiques** :
  - Évolution du CA
  - Répartition des revenus
  - Comparaison revenus/dépenses

**Filtres** :
- Période
- Type de dépense

**Export** :
- PDF, Excel

#### 4️⃣ Rapport Clients

**Données affichées** :
- Nombre de clients servis
- Clients réguliers
- Nouveaux clients
- Panier moyen
- Fréquence de visite

**Filtres** :
- Période
- Type de client

### Génération de Rapports

**Processus** :
1. Sélectionner le type de rapport
2. Définir les filtres (dates, catégories, etc.)
3. Cliquer sur "Générer le rapport"
4. Visualiser les données
5. Exporter si nécessaire

**Boutons d'action** :
- 🔄 **Actualiser** : Rafraîchir les données
- 📥 **Télécharger** : Exporter le rapport
- 🖨️ **Imprimer** : Imprimer directement
- 📧 **Envoyer** : Envoyer par email

### Rapport Journalier Automatique

**Génération automatique** :
- Tous les jours à minuit
- Envoyé par email aux managers/admins
- Contient :
  - Résumé des ventes
  - Produits populaires
  - Alertes stock
  - Statistiques clés

---

## 👥 Gestion des Utilisateurs

### Page Utilisateurs

**Accès** : Menu latéral → **Utilisateurs** (Admin uniquement)

### Liste des Utilisateurs

**Tableau avec colonnes** :
- **Avatar** : Photo de profil
- **Nom complet** : Prénom + Nom
- **Email** : Adresse email
- **Téléphone** : Numéro de téléphone
- **Rôle** : Badge coloré
  - 🔴 **Admin** : Administrateur
  - 🟡 **Manager** : Manager
  - 🟢 **Serveur** : Serveur
  - 🔵 **Caissier** : Caissier
- **Statut** :
  - 🟢 **Actif** : Compte actif
  - 🔴 **Inactif** : Compte désactivé
  - 🟡 **Suspendu** : Compte suspendu
- **Dernière connexion** : Date et heure
- **Actions** : Modifier / Supprimer

### Ajouter un Utilisateur

**Bouton "➕ Nouvel utilisateur"** :

**Formulaire** :
1. **Informations personnelles**
   - Nom d'utilisateur * (unique)
   - Prénom *
   - Nom *
   - Email *
   - Téléphone

2. **Rôle et accès**
   - Rôle * (Select)
   - Mot de passe * (généré ou manuel)
   - Confirmer le mot de passe *

3. **Permissions** (selon le rôle)
   - Liste de checkboxes
   - Permissions par module :
     - Ventes
     - Produits
     - Stocks
     - Tables
     - Commandes
     - Cuisine
     - Rapports
     - Utilisateurs
     - Paramètres

**Validation** :
- Nom d'utilisateur unique
- Email valide
- Mot de passe fort (min 8 caractères)
- Au moins un rôle sélectionné

**Bouton "Créer"** :
- Enregistre l'utilisateur
- Envoie un email de bienvenue (optionnel)
- Affiche les identifiants

### Modifier un Utilisateur

**Bouton "✏️ Modifier"** :
- Même formulaire pré-rempli
- Possibilité de changer le rôle
- Possibilité de modifier les permissions
- Réinitialiser le mot de passe

### Désactiver/Activer un Utilisateur

**Toggle Statut** :
- Désactiver : L'utilisateur ne peut plus se connecter
- Activer : Réactive le compte

### Supprimer un Utilisateur

**Bouton "🗑️ Supprimer"** :
- Demande une confirmation
- ⚠️ **Attention** : Suppression définitive
- Les données associées (ventes, etc.) sont conservées

### Historique d'Activité

**Bouton "📊 Activité"** :
- Affiche l'historique des actions de l'utilisateur
- Colonnes :
  - Date et heure
  - Action (Connexion, Vente, Modification, etc.)
  - Module
  - Détails
  - Adresse IP

**Filtres** :
- Par date
- Par type d'action
- Par module

---

## ⚙️ Paramètres

### Page Paramètres

**Accès** : Menu latéral → **Paramètres** (Admin/Manager)

### Sections

#### 1️⃣ Informations Restaurant

**Champs** :
- Nom de l'établissement *
- Adresse *
- Téléphone *
- Email *
- Site web
- Logo (upload)

#### 2️⃣ Paramètres de Vente

**Configuration** :
- Devise (FBu par défaut)
- TVA (%)
- Service (%)
- Arrondi automatique
- Impression automatique des factures

#### 3️⃣ Paramètres de Stock

**Configuration** :
- Seuil d'alerte global (%)
- Gestion automatique du stock
- Notifications d'alerte
- Fréquence d'inventaire

#### 4️⃣ Notifications

**Configuration** :
- Email de notification
- Notifications push
- Alertes stock
- Alertes ventes
- Alertes tables

#### 5️⃣ Sécurité

**Configuration** :
- Durée de session (minutes)
- Complexité mot de passe
- Authentification à deux facteurs (2FA)
- Historique des connexions

#### 6️⃣ Sauvegarde

**Options** :
- Sauvegarde automatique
- Fréquence (quotidienne, hebdomadaire)
- Restauration de sauvegarde
- Export de données

---

## 🔐 Rôles et Permissions

### Hiérarchie des Rôles

#### 1. Administrateur (Admin)

**Accès complet** :
- ✅ Toutes les fonctionnalités
- ✅ Gestion des utilisateurs
- ✅ Paramètres système
- ✅ Suppression de données
- ✅ Rapports financiers
- ✅ Gestion de la base de données

#### 2. Manager

**Accès de gestion** :
- ✅ Ventes et POS
- ✅ Produits (création, modification)
- ✅ Stocks (gestion complète)
- ✅ Tables et réservations
- ✅ Cuisine et recettes
- ✅ Rapports (sauf financiers sensibles)
- ✅ Fournisseurs et dépenses
- ❌ Gestion des utilisateurs
- ❌ Paramètres système

#### 3. Serveur

**Accès opérationnel** :
- ✅ Ventes et POS
- ✅ Tables (occuper, libérer)
- ✅ Commandes
- ✅ Consultation des produits
- ✅ Consultation des stocks
- ❌ Modification des produits
- ❌ Gestion des stocks
- ❌ Rapports
- ❌ Paramètres

#### 4. Caissier

**Accès limité** :
- ✅ Ventes et POS uniquement
- ✅ Consultation des produits
- ❌ Toutes les autres fonctionnalités

### Matrice de Permissions

| Fonctionnalité | Admin | Manager | Serveur | Caissier |
|----------------|-------|---------|---------|----------|
| **Ventes** |
| Créer une vente | ✅ | ✅ | ✅ | ✅ |
| Voir historique | ✅ | ✅ | ✅ | ❌ |
| Modifier une vente | ✅ | ✅ | ❌ | ❌ |
| Supprimer une vente | ✅ | ❌ | ❌ | ❌ |
| **Produits** |
| Voir les produits | ✅ | ✅ | ✅ | ✅ |
| Créer un produit | ✅ | ✅ | ❌ | ❌ |
| Modifier un produit | ✅ | ✅ | ❌ | ❌ |
| Supprimer un produit | ✅ | ❌ | ❌ | ❌ |
| **Stocks** |
| Voir les stocks | ✅ | ✅ | ✅ | ❌ |
| Ajuster les stocks | ✅ | ✅ | ❌ | ❌ |
| Approvisionnements | ✅ | ✅ | ❌ | ❌ |
| **Tables** |
| Voir les tables | ✅ | ✅ | ✅ | ❌ |
| Occuper/Libérer | ✅ | ✅ | ✅ | ❌ |
| Créer une table | ✅ | ✅ | ❌ | ❌ |
| Supprimer une table | ✅ | ❌ | ❌ | ❌ |
| **Rapports** |
| Rapports de ventes | ✅ | ✅ | ❌ | ❌ |
| Rapports financiers | ✅ | ❌ | ❌ | ❌ |
| Export de données | ✅ | ✅ | ❌ | ❌ |
| **Utilisateurs** |
| Voir les utilisateurs | ✅ | ❌ | ❌ | ❌ |
| Créer un utilisateur | ✅ | ❌ | ❌ | ❌ |
| Modifier un utilisateur | ✅ | ❌ | ❌ | ❌ |
| **Paramètres** |
| Paramètres restaurant | ✅ | ✅ | ❌ | ❌ |
| Paramètres système | ✅ | ❌ | ❌ | ❌ |
| Sauvegardes | ✅ | ❌ | ❌ | ❌ |

---

## 🎯 Bonnes Pratiques

### Pour les Administrateurs

1. **Sécurité** :
   - Changer les mots de passe par défaut
   - Activer l'authentification à deux facteurs
   - Réviser régulièrement les permissions

2. **Sauvegardes** :
   - Configurer des sauvegardes automatiques quotidiennes
   - Tester la restauration régulièrement

3. **Utilisateurs** :
   - Désactiver les comptes inactifs
   - Réviser l'historique d'activité

### Pour les Managers

1. **Stocks** :
   - Vérifier les alertes quotidiennement
   - Planifier les approvisionnements
   - Faire des inventaires réguliers

2. **Rapports** :
   - Consulter le rapport journalier
   - Analyser les tendances de vente
   - Identifier les produits rentables

### Pour les Serveurs

1. **Tables** :
   - Libérer les tables rapidement après paiement
   - Mettre à jour le statut en temps réel

2. **Ventes** :
   - Vérifier la disponibilité avant de prendre commande
   - Renseigner correctement le nom du client

### Pour les Caissiers

1. **Ventes** :
   - Vérifier le panier avant de finaliser
   - Imprimer systématiquement la facture
   - Vérifier la méthode de paiement

---

## 🆘 Support et Aide

### En cas de Problème

1. **Erreur de connexion** :
   - Vérifier les identifiants
   - Vérifier la connexion internet
   - Contacter l'administrateur

2. **Erreur lors d'une vente** :
   - Vérifier la disponibilité des produits
   - Vérifier que la table est disponible
   - Actualiser la page

3. **Données non à jour** :
   - Cliquer sur "Actualiser"
   - Vider le cache du navigateur
   - Recharger la page (F5)

### Contact Support

- **Email** : support@harrysgrillbar.com
- **Téléphone** : +257 62 12 45 10 / 79 932 322
- **Heures** : Lun-Dim 8h-22h

---

## 📱 Compatibilité

### Navigateurs Supportés

- ✅ **Chrome** 90+ (Recommandé)
- ✅ **Firefox** 88+
- ✅ **Safari** 14+
- ✅ **Edge** 90+

### Résolutions

- ✅ **Desktop** : 1920x1080 et plus
- ✅ **Laptop** : 1366x768 et plus
- ✅ **Tablette** : 768x1024 et plus
- ⚠️ **Mobile** : Utiliser l'application mobile Flutter

---

## 🔄 Mises à Jour

### Historique des Versions

**Version 1.0.0** (Actuelle)
- ✅ Gestion complète des ventes (POS)
- ✅ Gestion des produits et catégories
- ✅ Gestion des stocks et inventaires
- ✅ Gestion des tables et réservations
- ✅ Interface cuisine avec recettes
- ✅ Rapports et analyses
- ✅ Gestion des utilisateurs et permissions
- ✅ Notifications en temps réel (WebSockets)

### Prochaines Fonctionnalités

- 📅 Gestion avancée des réservations (calendrier)
- 📊 Tableaux de bord personnalisables
- 📱 Notifications push
- 🌐 Multi-langues (Français, Anglais, Kirundi)
- 💳 Intégration paiements mobiles (Lumicash, Ecocash)
- 📧 Envoi automatique de factures par email
- 🎁 Programme de fidélité clients

---

**© 2024 Harry's Grill Bar - BarStockWise v1.0.0**

*Développé avec ❤️ pour une gestion efficace de votre établissement*

