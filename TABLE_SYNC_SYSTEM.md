# 🔄 Système de Synchronisation Automatique Tables ↔ Ventes

## 🎯 Fonctionnalités Implémentées

### **1. Synchronisation Automatique Backend** ⚡

Quand une vente est créée ou modifiée, la table est automatiquement mise à jour via des **signaux Django**.

#### **A. Création de Vente → Table Occupée**
```python
# backend/sales/signals.py - Signal post_save
@receiver(post_save, sender=Sale)
def occupy_table_on_sale_creation(sender, instance, created, **kwargs):
    if created and instance.table and instance.status == 'pending':
        table = instance.table
        table.status = 'occupied'
        table.occupied_since = timezone.now()
        table.customer = instance.customer_name
        table.server = f"{instance.server.first_name} {instance.server.last_name}"
        table.save()
```

**Résultat** :
- ✅ Table passe à `status = 'occupied'`
- ✅ `occupied_since` = date/heure actuelle
- ✅ `customer` = nom du client de la vente
- ✅ `server` = nom du serveur assigné

#### **B. Vente Payée/Annulée → Table Libérée**
```python
# backend/sales/signals.py - Signal pre_save
@receiver(pre_save, sender=Sale)
def update_table_status_on_sale_change(sender, instance, **kwargs):
    if instance.status in ['paid', 'cancelled'] and instance.table:
        table = instance.table
        table.status = 'available'
        table.occupied_since = None
        table.customer = None
        table.server = None
        table.save()
        
        # Créer notification
        create_table_freed_notification(table, instance)
```

**Résultat** :
- ✅ Table passe à `status = 'available'`
- ✅ Infos client/serveur effacées
- ✅ **Notification créée** pour alerter l'équipe

---

### **2. Système de Notifications** 🔔

#### **A. Backend - Stockage dans Cache**
```python
# backend/sales/signals.py
def create_table_freed_notification(table, sale):
    notification_data = {
        'type': 'table_freed',
        'table_id': table.id,
        'table_number': table.number,
        'table_location': table.location,
        'freed_at': timezone.now().isoformat(),
        'sale_reference': sale.reference,
        'customer_name': sale.customer_name,
        'total_amount': float(sale.total_amount),
        'message': f"La table {table.number} a été libérée"
    }
    
    # Stocker dans cache Redis/Memcached
    cache.set(notification_key, notification_data, 300)  # 5 minutes
    
    # Ajouter à la liste des notifications récentes
    recent_notifications = cache.get('recent_table_notifications', [])
    recent_notifications.insert(0, notification_data)
    cache.set('recent_table_notifications', recent_notifications, 3600)  # 1 heure
```

#### **B. Backend - Endpoint API**
```python
# backend/sales/views.py
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def table_notifications(request):
    notifications = cache.get('recent_table_notifications', [])
    
    # Filtrer les 5 dernières minutes si demandé
    if request.GET.get('recent_only') == 'true':
        five_minutes_ago = timezone.now() - timedelta(minutes=5)
        notifications = [n for n in notifications if ...]
    
    return Response({'notifications': notifications, 'count': len(notifications)})
```

**Route** : `GET /api/sales/notifications/tables/`

#### **C. Frontend - Hook Personnalisé**
```typescript
// src/hooks/use-table-notifications.ts
export function useTableNotifications(options) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Polling automatique toutes les 15 secondes
  useEffect(() => {
    const intervalId = setInterval(fetchNotifications, 15000);
    return () => clearInterval(intervalId);
  }, []);
  
  // Afficher toast quand table libérée
  unseenNotifications.forEach((notif) => {
    toast({
      title: "🎉 Table libérée !",
      description: `Table ${notif.table_number} est maintenant disponible`,
      duration: 8000,
    });
  });
  
  return { notifications, unreadCount, refresh };
}
```

**Utilisation** :
```typescript
const { notifications, unreadCount } = useTableNotifications({
  enabled: true,
  pollInterval: 15000,
  onTableFreed: () => refetchTables()
});
```

---

### **3. Interface Utilisateur Améliorée** 🎨

#### **A. Page Tables - Affichage des Infos de Vente**

**Tables Disponibles** :
```tsx
<Button onClick={() => navigate('/sales', { state: { selectedTable: table.id } })}>
  Créer une vente
</Button>
```

**Tables Occupées** :
```tsx
<div className="space-y-2">
  {/* Client */}
  <div className="text-xs">
    <strong>Client:</strong> {table.customer}
  </div>
  
  {/* Serveur */}
  <div className="text-xs">
    <strong>Serveur:</strong> {table.server}
  </div>
  
  {/* Durée */}
  <div className="flex items-center gap-1 text-xs">
    <Clock className="h-3 w-3" />
    Depuis {new Date(table.occupied_since).toLocaleTimeString()}
  </div>
  
  {/* Bouton voir vente */}
  <Button onClick={() => navigate(`/tables/${table.id}`)}>
    <DollarSign className="h-3 w-3 mr-1" />
    Voir la vente
  </Button>
</div>
```

#### **B. Indicateur de Notifications**
```tsx
{/* Header de la page Tables */}
<div className="flex gap-2">
  {/* Bouton actualiser */}
  <Button onClick={() => refetchTables()}>
    <RefreshCw className="h-4 w-4" />
    Actualiser
  </Button>
  
  {/* Badge notifications */}
  {unreadCount > 0 && (
    <div className="relative">
      <Button variant="outline">
        <Bell className="h-4 w-4" />
        <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white">
          {unreadCount}
        </span>
      </Button>
    </div>
  )}
</div>
```

#### **C. Actualisation Automatique**
```typescript
// Actualiser les tables toutes les 30 secondes
useEffect(() => {
  const interval = setInterval(() => {
    refetchTables();
  }, 30000);
  
  return () => clearInterval(interval);
}, [refetchTables]);
```

---

## 📊 Flux Complet

### **Scénario : Création de Vente**

1. **Utilisateur** : Clique sur "Créer une vente" pour Table 5
2. **Frontend** : Navigue vers `/sales` avec `selectedTable = 5`
3. **Frontend** : Crée la vente avec `table: 5`
4. **Backend** : Signal `post_save` détecte la nouvelle vente
5. **Backend** : Met à jour Table 5 → `status = 'occupied'`, `customer = "Jean Dupont"`, `server = "Marie Martin"`
6. **Frontend** : Polling détecte le changement (30s max)
7. **Frontend** : Affiche Table 5 comme occupée avec infos client/serveur

### **Scénario : Paiement de Vente**

1. **Utilisateur** : Marque la vente comme payée
2. **Backend** : Signal `pre_save` détecte `status = 'paid'`
3. **Backend** : Libère Table 5 → `status = 'available'`, efface client/serveur
4. **Backend** : Crée notification dans cache
5. **Frontend** : Polling (15s) récupère la notification
6. **Frontend** : Affiche toast "🎉 Table 5 libérée !"
7. **Frontend** : Actualise la liste des tables
8. **Frontend** : Table 5 affiche "Créer une vente"

---

## 🔧 Configuration

### **Backend**

1. **Activer les signaux** :
```python
# backend/sales/apps.py
class SalesConfig(AppConfig):
    def ready(self):
        import sales.signals  # noqa
```

2. **Ajouter la route** :
```python
# backend/sales/urls.py
path('notifications/tables/', views.table_notifications, name='table_notifications'),
```

3. **Cache requis** :
```python
# backend/barstock_api/settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        # Ou Redis pour production
    }
}
```

### **Frontend**

1. **Importer le hook** :
```typescript
import { useTableNotifications } from '@/hooks/use-table-notifications';
```

2. **Utiliser dans le composant** :
```typescript
const { notifications, unreadCount } = useTableNotifications({
  enabled: true,
  pollInterval: 15000,
  onTableFreed: () => refetchTables()
});
```

---

## 🧪 Tests

### **Test 1 : Création de Vente**
1. Aller sur `/tables`
2. Cliquer sur "Créer une vente" pour une table disponible
3. Créer la vente avec client et serveur
4. ✅ **Vérifier** : Table passe à "Occupée"
5. ✅ **Vérifier** : Nom client et serveur affichés
6. ✅ **Vérifier** : Heure d'occupation affichée

### **Test 2 : Paiement de Vente**
1. Aller sur `/sales-history`
2. Marquer une vente comme payée
3. Attendre 15 secondes max
4. ✅ **Vérifier** : Toast "Table X libérée !" apparaît
5. ✅ **Vérifier** : Badge notification (cloche rouge) apparaît
6. ✅ **Vérifier** : Table passe à "Disponible"

### **Test 3 : Actualisation Automatique**
1. Ouvrir `/tables` dans 2 onglets
2. Dans onglet 1 : Créer une vente
3. Dans onglet 2 : Attendre 30 secondes
4. ✅ **Vérifier** : Table se met à jour automatiquement

---

## 📈 Améliorations Futures

### **Priorité Haute** 🔴
- [ ] **WebSocket** : Remplacer polling par WebSocket pour notifications temps réel
- [ ] **Son** : Ajouter notification sonore quand table libérée
- [ ] **Historique** : Page dédiée pour voir toutes les notifications

### **Priorité Moyenne** 🟡
- [ ] **Filtres** : Filtrer notifications par emplacement/serveur
- [ ] **Statistiques** : Temps moyen d'occupation par table
- [ ] **Prédictions** : Estimer l'heure de libération

### **Priorité Basse** 🟢
- [ ] **Mobile** : App mobile avec push notifications
- [ ] **Email** : Envoyer email quand table VIP libérée
- [ ] **Dashboard** : Vue en temps réel de toutes les tables

---

## 🎯 Résumé

| Fonctionnalité | Status | Description |
|----------------|--------|-------------|
| **Sync Auto** | ✅ | Vente créée → Table occupée |
| **Libération** | ✅ | Vente payée → Table disponible |
| **Notifications** | ✅ | Toast quand table libérée |
| **Polling** | ✅ | Vérification toutes les 15s |
| **Actualisation** | ✅ | Auto-refresh toutes les 30s |
| **Infos Vente** | ✅ | Client, serveur, durée affichés |
| **Badge** | ✅ | Compteur notifications non lues |

---

**Date** : 31 octobre 2025 12:30  
**Status** : ✅ **Système complet et fonctionnel**  
**Prochaine étape** : Déployer et tester en production
