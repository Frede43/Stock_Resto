# 🖨️ Guide de Test d'Imprimante - Bar Stock Wise

Ce guide vous explique comment tester et configurer votre imprimante pour l'impression automatique des factures.

## 🔧 Configuration de l'Imprimante

### 1. Accéder aux Paramètres d'Impression

1. **Ouvrir l'application** Bar Stock Wise
2. **Aller dans Paramètres** (icône engrenage)
3. **Cliquer sur l'onglet "Impression"**
4. **Utiliser le composant "Test d'Imprimante"**

### 2. Configuration Basique

**Nom de l'imprimante** (optionnel):
- Laissez vide pour utiliser l'imprimante par défaut
- Ou spécifiez le nom exact de votre imprimante
- Exemples: `HP LaserJet`, `Canon PIXMA`, `Epson TM-T20` 

**Impression automatique**:
- ✅ **Activé**: Imprime automatiquement après confirmation de vente
- ❌ **Désactivé**: Affiche seulement la facture à l'écran

## 🧪 Test de Connectivité

### Étapes du Test

1. **Cliquer sur "Tester"** dans l'interface
2. **Vérifier le statut**:
   - 🟢 **Connectée**: Test réussi
   - 🔴 **Erreur**: Problème de connexion
   - ⚪ **Inconnu**: Pas encore testé

3. **Page de test imprimée**:
   ```
   ================================
           BAR STOCK WISE
         Test d'impression
   ================================
   
   Date: [Date/Heure actuelle]
   Imprimante: [Nom configuré]
   
   ✅ Test d'impression réussi!
   Votre imprimante fonctionne correctement.
   
   ================================
   ```

## 🖨️ Types d'Imprimantes Supportées

### Imprimantes de Bureau
- **HP LaserJet** (série P, M)
- **Canon PIXMA** (série G, TS)
- **Epson EcoTank** (série L)
- **Brother** (série HL, DCP)

### Imprimantes Thermiques (POS)
- **Epson TM-T20** / TM-T82
- **Star TSP100** / TSP650
- **Citizen CT-S310**
- **Bixolon SRP-350**

### Imprimantes Réseau
- Toute imprimante connectée au réseau local
- Configuration via adresse IP: `192.168.1.100`

## ⚙️ Configuration Avancée

### 1. Imprimante USB

```bash
# Windows - Vérifier les imprimantes installées
Control Panel > Devices and Printers
```

**Nom à utiliser**: Nom exact affiché dans Windows

### 2. Imprimante Réseau

**Configuration**:
- **Nom**: Adresse IP de l'imprimante (ex: `192.168.1.50`)
- **Port**: Généralement 9100 pour les imprimantes réseau
- **Protocole**: RAW ou LPR

### 3. Imprimante Partagée

**Format du nom**:
```
\\NomOrdinateur\NomImprimante
\\192.168.1.100\HP_LaserJet
```

## 🔄 Processus d'Impression Automatique

### Workflow Complet

1. **Client passe commande** → Ajout au panier
2. **Finaliser la vente** → Bouton bleu "Finaliser"
3. **Modal de confirmation** → Vérification des détails
4. **Confirmer la vente** → Bouton vert "Confirmer"
5. **Traitement backend** → Création de la vente + facture
6. **Affichage facture** → Modal avec aperçu
7. **Impression automatique** (si activée) → Envoi à l'imprimante

### Code d'Impression

```typescript
// Impression automatique après confirmation
React.useEffect(() => {
  if (isOpen && invoiceData) {
    const autoPrint = localStorage.getItem('auto_print_receipts') === 'true';
    if (autoPrint) {
      setTimeout(() => {
        window.print(); // Déclenche l'impression
      }, 500);
    }
  }
}, [isOpen, invoiceData]);
```

## 🐛 Dépannage

### Problèmes Courants

#### 1. "Imprimante non trouvée"
**Solutions**:
- ✅ Vérifier que l'imprimante est allumée
- ✅ Vérifier la connexion USB/réseau
- ✅ Réinstaller les pilotes d'imprimante
- ✅ Tester depuis une autre application (Notepad)

#### 2. "Rien ne s'imprime"
**Solutions**:
- ✅ Vérifier le papier et l'encre/toner
- ✅ Vérifier la file d'attente d'impression
- ✅ Redémarrer le service de spouleur d'impression
- ✅ Tester avec l'imprimante par défaut

#### 3. "Format d'impression incorrect"
**Solutions**:
- ✅ Vérifier la taille du papier (A4, 80mm pour thermique)
- ✅ Ajuster les marges dans les paramètres d'imprimante
- ✅ Utiliser le pilote correct pour votre modèle

#### 4. "Impression automatique ne fonctionne pas"
**Solutions**:
- ✅ Vérifier que l'option est activée dans les paramètres
- ✅ Autoriser les pop-ups dans le navigateur
- ✅ Vérifier les paramètres de sécurité du navigateur

### Commandes de Diagnostic

**Windows**:
```cmd
# Lister les imprimantes installées
wmic printer list brief

# Vérifier le service de spouleur
net start spooler

# Tester l'impression
echo Test > PRN
```

**Navigateur**:
```javascript
// Console du navigateur - Tester l'impression
window.print();

// Vérifier les paramètres localStorage
localStorage.getItem('auto_print_receipts');
localStorage.getItem('receipt_printer_name');
```

## 📋 Checklist de Configuration

### Avant le Test
- [ ] Imprimante allumée et connectée
- [ ] Pilotes installés et à jour
- [ ] Papier et consommables disponibles
- [ ] Accès à l'application Bar Stock Wise

### Configuration
- [ ] Nom d'imprimante configuré (si nécessaire)
- [ ] Impression automatique activée/désactivée selon préférence
- [ ] Paramètres sauvegardés

### Test
- [ ] Test d'impression lancé avec succès
- [ ] Page de test imprimée correctement
- [ ] Statut "Connectée" affiché
- [ ] Aucune erreur dans la console

### Validation Finale
- [ ] Vente de test créée
- [ ] Facture générée automatiquement
- [ ] Impression automatique fonctionnelle (si activée)
- [ ] Format de facture correct

## 🎯 Résultat Attendu

Après configuration complète:

1. **Vente confirmée** → Facture générée instantanément
2. **Modal facture** → Aperçu professionnel
3. **Impression automatique** → Facture imprimée sans intervention
4. **Format optimisé** → Facture 80mm pour imprimantes thermiques ou A4 pour bureau

## 🔒 Sécurité et Bonnes Pratiques

### Paramètres Recommandés

**Pour un bar/restaurant**:
- ✅ **Impression automatique**: Activée
- ✅ **Imprimante dédiée**: Imprimante thermique POS
- ✅ **Sauvegarde**: Configuration sauvegardée

**Pour tests/développement**:
- ❌ **Impression automatique**: Désactivée
- ✅ **Imprimante par défaut**: Utilisée
- ✅ **Test manuel**: Via bouton "Imprimer"

### Maintenance

- **Quotidienne**: Vérifier papier et consommables
- **Hebdomadaire**: Nettoyer la tête d'impression (thermique)
- **Mensuelle**: Mettre à jour les pilotes si nécessaire
- **Sauvegardes**: Exporter la configuration des paramètres

---

**✅ Avec cette configuration, votre imprimante sera prête pour l'impression automatique des factures !**
