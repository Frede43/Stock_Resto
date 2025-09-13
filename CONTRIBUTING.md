# Guide de Contribution - Bar Stock Wise

Merci de votre intérêt pour contribuer à Bar Stock Wise ! Ce guide vous aidera à comprendre comment participer au développement du projet.

## 🚀 Comment Contribuer

### 1. Fork et Clone
```bash
# Fork le repository sur GitHub, puis :
git clone https://github.com/votre-username/Stock_Resto.git
cd Stock_Resto
```

### 2. Configuration de l'Environnement
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate

# Frontend
npm install
```

### 3. Créer une Branche
```bash
git checkout -b feature/nom-de-votre-fonctionnalite
# ou
git checkout -b fix/description-du-bug
```

## 📋 Types de Contributions

### 🐛 Correction de Bugs
- Recherchez d'abord dans les [issues existantes](https://github.com/Frede43/Stock_Resto/issues)
- Créez une nouvelle issue si le bug n'est pas encore reporté
- Incluez des étapes de reproduction détaillées

### ✨ Nouvelles Fonctionnalités
- Discutez d'abord de votre idée dans une issue
- Assurez-vous qu'elle s'aligne avec la vision du projet
- Documentez la fonctionnalité proposée

### 📚 Documentation
- Améliorations du README
- Commentaires de code
- Guides d'utilisation
- Traductions

## 🔧 Standards de Développement

### Code Style

#### Frontend (TypeScript/React)
```typescript
// Utilisez des noms descriptifs
const handleUserAuthentication = () => { ... }

// Préférez les arrow functions pour les composants
const UserProfile: React.FC<Props> = ({ user }) => {
  return <div>...</div>
}

// Utilisez TypeScript strict
interface User {
  id: number;
  username: string;
  role: 'admin' | 'manager' | 'server' | 'cashier';
}
```

#### Backend (Python/Django)
```python
# Suivez PEP 8
def calculate_total_price(items: List[Item]) -> Decimal:
    """Calculate the total price including taxes."""
    return sum(item.price for item in items)

# Utilisez des docstrings
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing user accounts.
    
    Provides CRUD operations for user management
    with role-based access control.
    """
```

### Structure des Commits
```
type(scope): description courte

Description plus détaillée si nécessaire.

- Changement 1
- Changement 2

Fixes #123
```

**Types de commits :**
- `feat`: nouvelle fonctionnalité
- `fix`: correction de bug
- `docs`: documentation
- `style`: formatage, style
- `refactor`: refactoring du code
- `test`: ajout/modification de tests
- `chore`: tâches de maintenance

### Tests

#### Frontend
```bash
npm run test
npm run test:coverage
```

#### Backend
```bash
python manage.py test
python manage.py test --coverage
```

## 🔍 Process de Review

### Avant de Soumettre
- [ ] Tests passent localement
- [ ] Code respecte les standards
- [ ] Documentation mise à jour
- [ ] Pas de conflits de merge
- [ ] Commit messages clairs

### Pull Request
1. **Titre descriptif** : `feat(auth): add two-factor authentication`
2. **Description détaillée** :
   - Quoi : Qu'est-ce qui a été changé
   - Pourquoi : Raison du changement
   - Comment : Approche technique utilisée
3. **Screenshots** si changements UI
4. **Tests** : Comment tester les changements

### Template PR
```markdown
## Description
Brief description of changes

## Type de Changement
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests manuels effectués
- [ ] Tests de régression OK

## Screenshots
(si applicable)

## Checklist
- [ ] Code respecte les standards
- [ ] Documentation mise à jour
- [ ] Tests passent
- [ ] Pas de conflits
```

## 🏗️ Architecture du Projet

### Frontend Structure
```
src/
├── components/          # Composants réutilisables
│   ├── ui/             # Composants UI de base
│   ├── layout/         # Composants de mise en page
│   └── dashboard/      # Composants spécifiques dashboard
├── pages/              # Pages de l'application
├── hooks/              # Hooks React personnalisés
├── services/           # Services API
├── utils/              # Fonctions utilitaires
└── types/              # Types TypeScript
```

### Backend Structure
```
backend/
├── accounts/           # Gestion utilisateurs
├── inventory/          # Gestion stocks
├── sales/             # Point de vente
├── orders/            # Commandes
├── analytics/         # Rapports et analytics
└── barstock_api/      # Configuration Django
```

## 🎯 Priorités de Développement

### High Priority
- Performance et optimisation
- Sécurité et authentification
- Stabilité et tests
- UX/UI améliorations

### Medium Priority
- Nouvelles fonctionnalités
- Intégrations externes
- Documentation avancée

### Low Priority
- Refactoring non-critique
- Fonctionnalités expérimentales

## 🐛 Reporting de Bugs

### Template d'Issue
```markdown
**Description du Bug**
Description claire et concise du problème.

**Étapes de Reproduction**
1. Aller à '...'
2. Cliquer sur '....'
3. Faire défiler jusqu'à '....'
4. Voir l'erreur

**Comportement Attendu**
Description de ce qui devrait se passer.

**Screenshots**
Si applicable, ajoutez des screenshots.

**Environnement:**
- OS: [e.g. Windows 10]
- Navigateur: [e.g. Chrome 91]
- Version: [e.g. 1.2.3]

**Contexte Additionnel**
Tout autre contexte utile.
```

## 💬 Communication

- **Issues GitHub** : Pour bugs et fonctionnalités
- **Discussions** : Pour questions générales
- **Pull Requests** : Pour reviews de code

## 🏆 Reconnaissance

Les contributeurs sont listés dans le README et reçoivent notre reconnaissance pour leur travail. Chaque contribution, petite ou grande, est appréciée !

## 📞 Besoin d'Aide ?

- Consultez la [documentation](https://github.com/Frede43/Stock_Resto/wiki)
- Ouvrez une [discussion](https://github.com/Frede43/Stock_Resto/discussions)
- Contactez les mainteneurs via les issues

---

**Merci de contribuer à Bar Stock Wise ! 🍽️**
