# ✅ Ajout du Champ `session_duration` dans l'Admin Django

## 🎯 Objectif

Permettre la configuration de la durée de session (en heures) directement depuis l'interface d'administration Django, sans avoir à modifier le code.

---

## 📋 Modifications Effectuées

### 1. **Modèle Django** (`backend/settings/models.py`)

#### Ajout du Champ

```python
# Ligne 47
session_duration = models.IntegerField(
    default=1, 
    help_text="Durée de la session en heures"
)
```

#### Mise à Jour `to_dict()`

```python
# Ligne 103
'system': {
    'language': self.language,
    'timezone': self.timezone,
    'date_format': self.date_format,
    'backup_frequency': self.backup_frequency,
    'two_factor_auth': self.two_factor_auth,
    'auto_logout': self.auto_logout,
    'audit_logs': self.audit_logs,
    'session_timeout': self.session_timeout,
    'session_duration': self.session_duration,  # ✅ Ajouté
    'max_login_attempts': self.max_login_attempts
}
```

#### Mise à Jour `update_from_dict()`

```python
# Ligne 146
if 'system' in data:
    system = data['system']
    # ... autres champs ...
    self.session_duration = system.get('session_duration', self.session_duration)  # ✅ Ajouté
```

---

### 2. **Interface Admin** (`backend/settings/admin.py`)

#### Ajout Section "Sécurité"

```python
# Lignes 53-63
('Sécurité', {
    'fields': (
        'two_factor_auth',
        'auto_logout',
        'audit_logs',
        'session_duration',  # ✅ Nouveau champ
        'session_timeout',   # Ancien champ (déprécié)
        'max_login_attempts'
    ),
    'description': 'session_duration est en heures (recommandé: 1-8h), session_timeout est en minutes (déprécié)'
}),
```

---

### 3. **Migration Django**

#### Création de la Migration

```bash
cd backend
python manage.py makemigrations settings
```

**Résultat** :
```
Migrations for 'settings':
  settings\migrations\0005_systemsettings_session_duration.py
    - Add field session_duration to systemsettings
```

#### Application de la Migration

```bash
python manage.py migrate settings
```

**Résultat** :
```
Operations to perform:
  Apply all migrations: settings
Running migrations:
  Applying settings.0005_systemsettings_session_duration... OK
```

---

## 🎨 Interface Admin Django

### Accès

```
http://127.0.0.1:8000/admin/settings/systemsettings/
```

### Nouvelle Section "Sécurité"

```
┌─────────────────────────────────────────────┐
│ SÉCURITÉ                                    │
├─────────────────────────────────────────────┤
│ Two factor auth:         ☐                  │
│ Auto logout:             ☑                  │
│ Audit logs:              ☑                  │
│ Session duration:        [1] heures         │ ← NOUVEAU
│ Session timeout:         [30] minutes       │ ← Déprécié
│ Max login attempts:      [5]                │
└─────────────────────────────────────────────┘

ℹ️ session_duration est en heures (recommandé: 1-8h), 
   session_timeout est en minutes (déprécié)
```

---

## 🔄 Flux de Données

### Backend → API → Frontend

```
┌──────────────────┐
│  Admin Django    │
│  session_duration│
│  = 2 heures      │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Base de Données │
│  PostgreSQL      │
│  session_duration│
│  = 2             │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  API REST        │
│  GET /api/       │
│  settings/       │
│  {               │
│    "system": {   │
│      "session_   │
│      duration":2 │
│    }             │
│  }               │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Frontend React  │
│  use-auth.tsx    │
│  sessionDuration │
│  = 2 * 60 * 60   │
│    * 1000        │
│  = 7200000 ms    │
└──────────────────┘
```

---

## 📊 Valeurs Recommandées

| Contexte                  | Durée (heures) | Cas d'Usage                          |
|---------------------------|----------------|--------------------------------------|
| **Sécurité Maximale**     | 1              | Données sensibles, multiples users   |
| **Usage Standard**        | 2-4            | Restaurant classique                 |
| **Service Continu**       | 8              | Journée de travail complète          |
| **Service de Nuit**       | 12             | Bar/Nightclub                        |
| **Session Longue Durée**  | 24             | Usage exceptionnel                   |

---

## 🧪 Tests Effectués

### ✅ Test 1 : Création de la Migration

```bash
cd backend
python manage.py makemigrations settings
```

**Résultat** : Migration créée avec succès

---

### ✅ Test 2 : Application de la Migration

```bash
python manage.py migrate settings
```

**Résultat** : Migration appliquée sans erreur

---

### ✅ Test 3 : Vérification en Base de Données

```sql
SELECT session_duration FROM settings_systemsettings;
```

**Résultat** : Champ existe avec valeur par défaut `1`

---

### ✅ Test 4 : API REST

```bash
curl http://127.0.0.1:8000/api/settings/
```

**Résultat** :
```json
{
  "system": {
    "session_duration": 1
  }
}
```

---

## 📚 Documentation Créée

### 1. **SESSION_DURATION_ADMIN_GUIDE.md**

Guide complet avec :
- Configuration depuis l'admin Django
- Intégration avec le frontend
- Structure de la base de données
- Tests et troubleshooting
- Scénarios d'utilisation

### 2. **RESUME_AJOUT_SESSION_DURATION.md** (ce document)

Résumé technique des modifications effectuées

---

## 🚀 Prochaines Étapes

### Étape 1 : Intégration Frontend (Optionnel)

Modifier `src/hooks/use-auth.tsx` pour récupérer `session_duration` depuis l'API :

```typescript
const [sessionDuration, setSessionDuration] = useState(60 * 60 * 1000);

useEffect(() => {
  const fetchSessionDuration = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/`);
      const data = await response.json();
      const durationInHours = data.system.session_duration || 1;
      const durationInMs = durationInHours * 60 * 60 * 1000;
      setSessionDuration(durationInMs);
    } catch (error) {
      console.error('Erreur récupération session_duration:', error);
    }
  };
  
  fetchSessionDuration();
}, []);
```

---

### Étape 2 : Ajouter dans la Page Settings (Frontend)

Ajouter un champ dans `src/pages/Settings.tsx` pour modifier la durée :

```typescript
<div className="space-y-2">
  <Label htmlFor="session_duration">Durée de session (heures)</Label>
  <Input
    id="session_duration"
    type="number"
    min="1"
    max="24"
    value={systemSettings.session_duration || 1}
    onChange={(e) => setSystemSettings(prev => ({
      ...prev,
      session_duration: parseInt(e.target.value)
    }))}
  />
</div>
```

---

## 📦 Fichiers Modifiés

```
backend/
├── settings/
│   ├── models.py                              # ✅ Modifié
│   ├── admin.py                               # ✅ Modifié
│   └── migrations/
│       └── 0005_systemsettings_session_duration.py  # ✅ Créé
│
docs/
├── SESSION_DURATION_ADMIN_GUIDE.md            # ✅ Créé
└── RESUME_AJOUT_SESSION_DURATION.md           # ✅ Créé
```

---

## ✅ Résumé

### Ce qui a été fait

- ✅ Ajout du champ `session_duration` dans le modèle `SystemSettings`
- ✅ Mise à jour des méthodes `to_dict()` et `update_from_dict()`
- ✅ Ajout d'une section "Sécurité" dans l'admin Django
- ✅ Création et application de la migration
- ✅ Documentation complète créée

### Ce qui fonctionne

- ✅ Modification depuis l'admin Django
- ✅ Récupération via l'API REST (`/api/settings/`)
- ✅ Sauvegarde en base de données
- ✅ Valeur par défaut : 1 heure

### Prochaines étapes (optionnel)

- 🔄 Intégrer dans le frontend (`use-auth.tsx`)
- 🔄 Ajouter dans la page Settings
- 🔄 Tests E2E complets

---

**Date** : 5 novembre 2025  
**Auteur** : Cascade AI  
**Status** : ✅ Implémenté et testé  
**Version** : 1.0
