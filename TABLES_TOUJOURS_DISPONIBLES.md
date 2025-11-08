# 🪑 Tables Toujours Disponibles

## ✅ Modification Implémentée

### **Problème Initial**
Lorsqu'une vente était créée pour une table, le système marquait automatiquement la table comme "occupée". Cela empêchait de servir plusieurs clients différents à la même table.

### **Solution Appliquée**
Les tables restent maintenant **toujours disponibles**, même après la création d'une vente.

---

## 🔧 Modifications Techniques

### **Fichier Modifié** : `backend/sales/signals.py`

#### **1. Signal `update_table_status_on_sale_change` (Ligne 12)**

**Avant** :
```python
@receiver(pre_save, sender=Sale)
def update_table_status_on_sale_change(sender, instance, **kwargs):
    # Libérait la table quand la vente était payée ou annulée
    if instance.status in ['paid', 'cancelled']:
        table.status = 'available'
        table.save()
```

**Après** :
```python
@receiver(pre_save, sender=Sale)
def update_table_status_on_sale_change(sender, instance, **kwargs):
    """
    ❌ DÉSACTIVÉ : La table reste toujours disponible
    """
    pass  # Signal désactivé
```

#### **2. Signal `occupy_table_on_sale_creation` (Ligne 50)**

**Avant** :
```python
@receiver(post_save, sender=Sale)
def occupy_table_on_sale_creation(sender, instance, created, **kwargs):
    # Marquait la table comme occupée lors de la création d'une vente
    if created and instance.table:
        table.status = 'occupied'
        table.save()
```

**Après** :
```python
@receiver(post_save, sender=Sale)
def occupy_table_on_sale_creation(sender, instance, created, **kwargs):
    """
    ❌ DÉSACTIVÉ : La table reste toujours disponible
    """
    pass  # Signal désactivé
```

---

## 🎯 Comportement Actuel

### **Avant la Modification**

1. **Création d'une vente** → Table marquée comme "Occupée" 🔴
2. **Paiement de la vente** → Table marquée comme "Disponible" 🟢
3. **Problème** : Impossible de servir plusieurs clients à la même table

### **Après la Modification**

1. **Création d'une vente** → Table reste "Disponible" 🟢
2. **Paiement de la vente** → Table reste "Disponible" 🟢
3. **Avantage** : Plusieurs clients peuvent être servis à la même table ✅

---

## 📊 Cas d'Usage

### **Scénario 1 : Restaurant Classique**

**Situation** :
- Table 5 : Client A commande 2 brochettes (11h00)
- Table 5 : Client B commande 3 brochettes (11h30)
- Table 5 : Client C commande 1 brochette (12h00)

**Résultat** :
- ✅ Les 3 ventes sont enregistrées pour la Table 5
- ✅ La table reste disponible tout le temps
- ✅ Aucun conflit entre les clients

### **Scénario 2 : Bar/Café**

**Situation** :
- Table 3 : Client A prend un café (9h00)
- Table 3 : Client B prend un thé (9h15)
- Table 3 : Client C prend un jus (9h30)

**Résultat** :
- ✅ Les 3 ventes sont enregistrées pour la Table 3
- ✅ La table reste disponible pour d'autres clients
- ✅ Pas de blocage

---

## 🔄 Gestion Manuelle des Tables

Si vous voulez quand même marquer une table comme "occupée" manuellement :

### **Option 1 : Via l'Interface Web**

1. Aller sur `/tables`
2. Cliquer sur une table
3. Cliquer sur "Occupée" dans les boutons de statut

### **Option 2 : Via l'API**

```bash
PATCH /api/tables/{id}/
{
  "status": "occupied"
}
```

---

## ⚠️ Points Importants

### **1. Statuts de Table Disponibles**

| Statut | Description | Utilisation |
|--------|-------------|-------------|
| `available` | Disponible | Par défaut, toujours |
| `occupied` | Occupée | Changement manuel uniquement |
| `reserved` | Réservée | Changement manuel uniquement |
| `cleaning` | En nettoyage | Changement manuel uniquement |

### **2. Impact sur les Ventes**

- ✅ Les ventes peuvent toujours être créées pour n'importe quelle table
- ✅ Le statut de la table n'affecte pas la création de ventes
- ✅ Plusieurs ventes peuvent être associées à la même table

### **3. Historique des Ventes**

Toutes les ventes restent enregistrées avec :
- Numéro de table
- Nom du client
- Serveur
- Montant
- Date et heure

---

## 🧪 Tests à Effectuer

### **Test 1 : Créer une Vente**

1. Aller sur `/sales`
2. Sélectionner une table (ex: Table 5)
3. Ajouter des produits au panier
4. Créer la vente
5. **Vérifier** : La table reste "Disponible" ✅

### **Test 2 : Créer Plusieurs Ventes sur la Même Table**

1. Créer une vente pour Table 5 (Client A)
2. Créer une autre vente pour Table 5 (Client B)
3. Créer une troisième vente pour Table 5 (Client C)
4. **Vérifier** : Les 3 ventes sont enregistrées ✅
5. **Vérifier** : La table reste "Disponible" ✅

### **Test 3 : Payer une Vente**

1. Créer une vente pour Table 5
2. Payer la vente
3. **Vérifier** : La table reste "Disponible" ✅

---

## 🚀 Redémarrage du Serveur

Pour appliquer les modifications, redémarrez le serveur backend :

```bash
# Dans le dossier backend
python manage.py runserver
```

Ou si vous utilisez un script :

```bash
# Windows
.\start_backend.bat

# Linux/Mac
./start_backend.sh
```

---

## 📝 Notes Techniques

### **Pourquoi Désactiver les Signaux ?**

Les signaux Django (`pre_save` et `post_save`) sont des événements qui se déclenchent automatiquement lors de la sauvegarde d'un objet. En les désactivant, on empêche le changement automatique du statut des tables.

### **Alternative : Supprimer les Signaux**

Si vous voulez complètement supprimer cette fonctionnalité, vous pouvez :

1. Supprimer les fonctions `update_table_status_on_sale_change` et `occupy_table_on_sale_creation`
2. Ou les commenter complètement

**Mais** : Je les ai gardées commentées pour faciliter la réactivation si nécessaire.

---

## 🎉 Résultat Final

✅ Les tables restent **toujours disponibles**  
✅ Plusieurs clients peuvent être servis à la même table  
✅ Aucun blocage lors de la création de ventes  
✅ Gestion manuelle du statut toujours possible  

**Date de modification** : 8 novembre 2025  
**Version** : 1.0
