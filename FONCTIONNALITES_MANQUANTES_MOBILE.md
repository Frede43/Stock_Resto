# 🔴 FONCTIONNALITÉS MANQUANTES - MOBILE vs WEB

## 📊 Vue d'ensemble

**13 fonctionnalités manquantes** sur 32 (40.6% à implémenter)

---

## 🔴 PRIORITÉ HAUTE (2 fonctionnalités)

### 1. Kitchen - Gestion de la Cuisine 🍳

**Fichier Web** : `src/pages/Kitchen.tsx`

**Fonctionnalités** :
- ✅ Liste des recettes
- ✅ Créer/Modifier/Supprimer une recette
- ✅ Ajouter des ingrédients à une recette
- ✅ Calculer le coût d'une recette
- ✅ Associer recette à un produit
- ✅ Gérer les quantités d'ingrédients
- ✅ Voir le détail d'une recette

**Impact** : CRITIQUE - Essentiel pour la gestion de la cuisine

**Complexité** : Moyenne (3-5 jours)

**Fichier à créer** : `lib/presentation/pages/kitchen_page.dart`

**Services nécessaires** :
```dart
// lib/services/kitchen_service.dart
class KitchenService {
  Future<List<Recipe>> getRecipes();
  Future<Recipe> createRecipe(Recipe recipe);
  Future<Recipe> updateRecipe(int id, Recipe recipe);
  Future<void> deleteRecipe(int id);
  Future<List<Ingredient>> getIngredients();
  Future<double> calculateRecipeCost(int recipeId);
}
```

**Modèles nécessaires** :
```dart
// lib/data/models/recipe_model.dart
class Recipe {
  final int id;
  final String name;
  final String description;
  final int productId;
  final List<RecipeIngredient> ingredients;
  final double totalCost;
}

class RecipeIngredient {
  final int ingredientId;
  final String ingredientName;
  final double quantity;
  final String unit;
  final double cost;
}
```

---

### 2. Users - Gestion des Utilisateurs 👥

**Fichier Web** : `src/pages/Users.tsx`

**Fonctionnalités** :
- ✅ Liste des utilisateurs
- ✅ Créer un utilisateur
- ✅ Modifier un utilisateur
- ✅ Supprimer un utilisateur
- ✅ Gérer les rôles (admin, manager, server, cashier)
- ✅ Gérer les permissions
- ✅ Activer/Désactiver un utilisateur
- ✅ Réinitialiser le mot de passe

**Impact** : CRITIQUE - Essentiel pour les admins

**Complexité** : Moyenne (3-5 jours)

**Fichier à créer** : `lib/presentation/pages/users_page.dart`

**Services nécessaires** :
```dart
// lib/services/users_service.dart
class UsersService {
  Future<List<User>> getUsers();
  Future<User> createUser(User user);
  Future<User> updateUser(int id, User user);
  Future<void> deleteUser(int id);
  Future<void> changeUserRole(int id, String role);
  Future<void> toggleUserStatus(int id, bool isActive);
  Future<void> resetPassword(int id);
}
```

**Modèles nécessaires** :
```dart
// lib/data/models/user_model.dart (améliorer l'existant)
class User {
  final int id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String role; // admin, manager, server, cashier
  final bool isActive;
  final bool isSuperuser;
  final DateTime dateJoined;
  final DateTime? lastLogin;
}
```

---

## 🟡 PRIORITÉ MOYENNE (5 fonctionnalités)

### 3. Analytics - Analyses Avancées 📊

**Fichier Web** : `src/pages/Analytics.tsx`

**Fonctionnalités** :
- ✅ Graphiques de ventes
- ✅ Analyse de rentabilité
- ✅ Tendances de ventes
- ✅ Prédictions IA
- ✅ Benchmarks
- ✅ Top produits
- ✅ Analyse par période

**Impact** : Important pour les managers/admins

**Complexité** : Élevée (5-7 jours)

**Fichier à créer** : `lib/presentation/pages/analytics_page.dart`

**Dépendances** :
```yaml
fl_chart: ^0.66.0  # Déjà présent
syncfusion_flutter_charts: ^24.1.41  # Optionnel
```

---

### 4. Expenses - Gestion des Dépenses 💰

**Fichier Web** : `src/pages/Expenses.tsx`

**Fonctionnalités** :
- ✅ Liste des dépenses
- ✅ Créer une dépense
- ✅ Modifier une dépense
- ✅ Supprimer une dépense
- ✅ Catégories de dépenses
- ✅ Approbation des dépenses
- ✅ Budget par catégorie
- ✅ Analyse des dépenses

**Impact** : Important pour la comptabilité

**Complexité** : Moyenne (4-6 jours)

**Fichier à créer** : `lib/presentation/pages/expenses_page.dart`

---

### 5. Suppliers - Gestion des Fournisseurs 🚚

**Fichier Web** : `src/pages/Suppliers.tsx`

**Fonctionnalités** :
- ✅ Liste des fournisseurs
- ✅ Créer un fournisseur
- ✅ Modifier un fournisseur
- ✅ Supprimer un fournisseur
- ✅ Contacts fournisseur
- ✅ Historique des commandes
- ✅ Évaluation fournisseur

**Impact** : Important pour les achats

**Complexité** : Moyenne (3-5 jours)

**Fichier à créer** : `lib/presentation/pages/suppliers_page.dart`

---

### 6. Supplies - Gestion des Approvisionnements 📦

**Fichier Web** : `src/pages/Supplies.tsx`

**Fonctionnalités** :
- ✅ Liste des commandes fournisseurs
- ✅ Créer une commande
- ✅ Modifier une commande
- ✅ Réceptionner une commande
- ✅ Gérer les bons de livraison
- ✅ Historique des approvisionnements

**Impact** : Important pour la logistique

**Complexité** : Moyenne (4-6 jours)

**Fichier à créer** : `lib/presentation/pages/supplies_page.dart`

---

### 7. Alerts - Alertes Avancées 🔔

**Fichier Web** : `src/pages/Alerts.tsx`

**Fonctionnalités** :
- ✅ Alertes stock faible
- ✅ Alertes expiration produits
- ✅ Alertes système
- ✅ Notifications personnalisées
- ✅ Historique des alertes
- ✅ Configuration des seuils

**Impact** : Utile pour la gestion proactive

**Complexité** : Moyenne (3-5 jours)

**Fichier à créer** : `lib/presentation/pages/alerts_page.dart`

---

## 🟢 PRIORITÉ BASSE (6 fonctionnalités)

### 8. Monitoring - Surveillance Système 📡

**Fichier Web** : `src/pages/Monitoring.tsx`

**Fonctionnalités** :
- ✅ État du serveur
- ✅ Performances API
- ✅ Logs système
- ✅ Utilisation ressources
- ✅ Alertes techniques

**Impact** : Utile pour les admins techniques

**Complexité** : Élevée (5-7 jours)

---

### 9. StockSync - Synchronisation Stock 🔄

**Fichier Web** : `src/pages/StockSync.tsx`

**Fonctionnalités** :
- ✅ Synchronisation multi-sites
- ✅ Transferts de stock
- ✅ Inventaires centralisés

**Impact** : Utile pour les chaînes de restaurants

**Complexité** : Élevée (5-7 jours)

---

### 10. ProductRecords - Historique Produits 📋

**Fichier Web** : `src/pages/ProductRecords.tsx`

**Fonctionnalités** :
- ✅ Historique modifications produits
- ✅ Traçabilité
- ✅ Audit des changements

**Impact** : Utile pour l'audit

**Complexité** : Faible (2-3 jours)

---

### 11. Help - Aide & Documentation ❓

**Fichier Web** : `src/pages/Help.tsx`

**Fonctionnalités** :
- ✅ Documentation
- ✅ Tutoriels
- ✅ FAQ
- ✅ Support

**Impact** : Utile pour les nouveaux utilisateurs

**Complexité** : Faible (2-3 jours)

---

### 12. Employees - Gestion Avancée Employés 👔

**Fichier Web** : Fonctionnalités avancées non présentes dans `employees_page.dart`

**Fonctionnalités manquantes** :
- ❌ Gestion des horaires
- ❌ Gestion des salaires
- ❌ Gestion des congés
- ❌ Évaluation des performances

**Impact** : Utile pour les RH

**Complexité** : Moyenne (4-6 jours)

---

### 13. Index - Page d'accueil publique 🏠

**Fichier Web** : `src/pages/Index.tsx`

**Fonctionnalités** :
- ✅ Page d'accueil publique
- ✅ Présentation de l'app
- ✅ Liens vers login

**Impact** : Optionnel pour mobile

**Complexité** : Faible (1-2 jours)

---

## 📅 Planning de Développement

### Sprint 1 - Fonctionnalités Critiques (2 semaines)
- **Semaine 1** : Kitchen (5 jours)
- **Semaine 2** : Users (5 jours)

### Sprint 2 - Fonctionnalités Importantes (3 semaines)
- **Semaine 3** : Analytics (5 jours)
- **Semaine 4** : Expenses (4 jours) + Suppliers (3 jours)
- **Semaine 5** : Supplies (4 jours) + Alerts (3 jours)

### Sprint 3 - Fonctionnalités Optionnelles (2 semaines)
- **Semaine 6** : Employees avancé (4 jours) + ProductRecords (3 jours)
- **Semaine 7** : Help (2 jours) + Tests et corrections (3 jours)

### Sprint 4 - Fonctionnalités Avancées (optionnel, 2 semaines)
- **Semaine 8** : Monitoring (5 jours)
- **Semaine 9** : StockSync (5 jours)

**Total** : 7-9 semaines (35-45 jours de développement)

---

## 🛠️ Structure de Fichiers à Créer

```
lib/
├── presentation/
│   ├── pages/
│   │   ├── kitchen_page.dart          # ✅ Priorité HAUTE
│   │   ├── users_page.dart            # ✅ Priorité HAUTE
│   │   ├── analytics_page.dart        # 🟡 Priorité MOYENNE
│   │   ├── expenses_page.dart         # 🟡 Priorité MOYENNE
│   │   ├── suppliers_page.dart        # 🟡 Priorité MOYENNE
│   │   ├── supplies_page.dart         # 🟡 Priorité MOYENNE
│   │   ├── alerts_page.dart           # 🟡 Priorité MOYENNE
│   │   ├── monitoring_page.dart       # 🟢 Priorité BASSE
│   │   ├── stock_sync_page.dart       # 🟢 Priorité BASSE
│   │   ├── product_records_page.dart  # 🟢 Priorité BASSE
│   │   └── help_page.dart             # 🟢 Priorité BASSE
│   └── widgets/
│       ├── recipe_form_dialog.dart
│       ├── user_form_dialog.dart
│       ├── expense_form_dialog.dart
│       └── supplier_form_dialog.dart
├── services/
│   ├── kitchen_service.dart
│   ├── users_service.dart
│   ├── analytics_service.dart
│   ├── expenses_service.dart
│   ├── suppliers_service.dart
│   └── supplies_service.dart
└── data/
    └── models/
        ├── recipe_model.dart
        ├── ingredient_model.dart
        ├── expense_model.dart
        ├── supplier_model.dart
        └── supply_model.dart
```

---

## 📊 Estimation des Ressources

### Développeur Flutter (1 personne)
- **Sprint 1** : 2 semaines (Kitchen + Users)
- **Sprint 2** : 3 semaines (Analytics, Expenses, Suppliers, Supplies, Alerts)
- **Sprint 3** : 2 semaines (Employees, ProductRecords, Help)
- **Sprint 4** : 2 semaines (Monitoring, StockSync) - optionnel

**Total** : 7-9 semaines

### Coût estimé (freelance)
- Taux horaire : 25-50€/h
- Heures par jour : 6-8h
- Jours par semaine : 5
- **Sprint 1** : 2 semaines × 5 jours × 7h × 35€ = 2 450€
- **Sprint 2** : 3 semaines × 5 jours × 7h × 35€ = 3 675€
- **Sprint 3** : 2 semaines × 5 jours × 7h × 35€ = 2 450€
- **Sprint 4** : 2 semaines × 5 jours × 7h × 35€ = 2 450€

**Total** : 8 575€ - 11 025€ (selon sprints)

---

## ✅ Checklist par Fonctionnalité

### Kitchen
- [ ] Créer `kitchen_page.dart`
- [ ] Créer `kitchen_service.dart`
- [ ] Créer `recipe_model.dart`
- [ ] Créer `recipe_form_dialog.dart`
- [ ] Intégrer API backend `/api/kitchen/recipes/`
- [ ] Tests unitaires
- [ ] Tests d'intégration

### Users
- [ ] Créer `users_page.dart`
- [ ] Créer `users_service.dart`
- [ ] Améliorer `user_model.dart`
- [ ] Créer `user_form_dialog.dart`
- [ ] Intégrer API backend `/api/accounts/users/`
- [ ] Tests unitaires
- [ ] Tests d'intégration

### Analytics
- [ ] Créer `analytics_page.dart`
- [ ] Créer `analytics_service.dart`
- [ ] Intégrer graphiques `fl_chart`
- [ ] Intégrer API backend `/api/analytics/`
- [ ] Tests unitaires

### Expenses
- [ ] Créer `expenses_page.dart`
- [ ] Créer `expenses_service.dart`
- [ ] Créer `expense_model.dart`
- [ ] Intégrer API backend `/api/expenses/`
- [ ] Tests unitaires

### Suppliers
- [ ] Créer `suppliers_page.dart`
- [ ] Créer `suppliers_service.dart`
- [ ] Créer `supplier_model.dart`
- [ ] Intégrer API backend `/api/suppliers/`
- [ ] Tests unitaires

---

## 🎯 Recommandations

1. **Commencer par Kitchen et Users** (Sprint 1) - Fonctionnalités critiques
2. **Réutiliser les composants existants** - Widgets, services, modèles
3. **Tester au fur et à mesure** - Ne pas accumuler la dette technique
4. **Documenter le code** - Pour faciliter la maintenance
5. **Suivre l'architecture existante** - Clean Architecture (data/domain/presentation)

---

**Date** : 3 novembre 2025  
**Version** : 1.0.0  
**Auteur** : Cascade AI
