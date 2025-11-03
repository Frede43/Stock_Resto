# 📋 SCÉNARIO COMPLET - MODULE GESTION DES DÉPENSES

## 🎯 Vue d'Ensemble

Ce document présente **tous les scénarios d'utilisation** du module de gestion des dépenses de BarStockWise, de A à Z.

---

## 👥 ACTEURS DU SYSTÈME

| Rôle | Permissions | Responsabilités |
|------|-------------|-----------------|
| **Employé** | Créer des dépenses | Soumettre les dépenses avec justificatifs |
| **Manager** | Approuver/Rejeter | Valider ou refuser les dépenses |
| **Admin** | Accès complet | Gérer budgets, catégories, rapports |
| **Système** | Automatique | Calculs, alertes, notifications |

---

## 📖 SCÉNARIO 1 : CRÉATION D'UNE DÉPENSE PAR UN EMPLOYÉ

### **Contexte**
Jean, serveur chez Harry's Grill Bar, achète des fournitures de nettoyage pour 25,000 FBu.

### **Étapes Détaillées**

#### **1.1 Connexion et Navigation**
```
1. Jean se connecte avec ses identifiants
2. Clique sur "Dépenses" dans le menu latéral
3. Arrive sur la page de gestion des dépenses
```

#### **1.2 Ouverture du Formulaire**
```
4. Clique sur le bouton "+ Nouvelle Dépense"
5. Un dialog s'ouvre avec le formulaire
```

#### **1.3 Remplissage du Formulaire**
```
6. Sélectionne la catégorie : "Fournitures"
7. Entre la description : "Produits de nettoyage - Savon, détergent"
8. Entre le montant : 25000 FBu
9. Sélectionne le mode de paiement : "Espèces"
10. Entre le nom du fournisseur : "Quincaillerie Centrale"
11. Sélectionne la date : 2025-11-03
12. Ajoute une note : "Achat urgent pour le service du soir"
```

#### **1.4 Upload du Reçu**
```
13. Clique sur "Choisir un fichier"
14. Sélectionne la photo du reçu (IMG_20251103_143022.jpg)
15. Le nom du fichier s'affiche : "IMG_20251103_143022.jpg"
16. Vérifie que tous les champs sont remplis
```

#### **1.5 Soumission**
```
17. Clique sur "Enregistrer"
18. Le système génère une référence : "EXP-20251103143500-A7B3C9D2"
19. La dépense est créée avec le statut "En attente"
20. Un toast de confirmation s'affiche : "Dépense créée avec succès"
21. Le dialog se ferme
22. La nouvelle dépense apparaît dans la liste avec un badge jaune "En attente"
```

### **Données Créées**
```json
{
  "reference": "EXP-20251103143500-A7B3C9D2",
  "category": "Fournitures",
  "description": "Produits de nettoyage - Savon, détergent",
  "amount": 25000,
  "payment_method": "cash",
  "supplier_name": "Quincaillerie Centrale",
  "expense_date": "2025-11-03T14:35:00Z",
  "notes": "Achat urgent pour le service du soir",
  "receipt_file": "expenses/receipts/2025/11/IMG_20251103_143022.jpg",
  "user": "Jean Mukendi",
  "is_approved": false,
  "status": "pending"
}
```

---

## 📖 SCÉNARIO 2 : APPROBATION D'UNE DÉPENSE PAR LE MANAGER

### **Contexte**
Marie, manager, reçoit une notification qu'une nouvelle dépense attend son approbation.

### **Étapes Détaillées**

#### **2.1 Notification et Navigation**
```
1. Marie reçoit une notification : "Nouvelle dépense en attente"
2. Se connecte et accède à "Dépenses"
3. Voit un badge rouge "3" sur le filtre "En attente"
```

#### **2.2 Consultation de la Dépense**
```
4. Clique sur le filtre "En attente"
5. Voit la dépense de Jean : "EXP-20251103143500-A7B3C9D2"
6. Examine les détails :
   - Catégorie : Fournitures
   - Montant : 25,000 FBu
   - Fournisseur : Quincaillerie Centrale
   - Créé par : Jean Mukendi
   - Date : 03/11/2025
```

#### **2.3 Vérification du Justificatif**
```
7. Clique sur l'icône "Download" pour voir le reçu
8. Le fichier s'ouvre dans un nouvel onglet
9. Vérifie que le reçu correspond :
   ✓ Montant correct : 25,000 FBu
   ✓ Date correcte : 03/11/2025
   ✓ Fournisseur correct : Quincaillerie Centrale
   ✓ Articles listés : Savon, détergent
```

#### **2.4 Vérification du Budget**
```
10. Consulte la section "Budgets par Catégorie"
11. Voit pour "Fournitures" :
    - Budget mensuel : 500,000 FBu
    - Dépensé : 325,000 FBu (65%)
    - Après approbation : 350,000 FBu (70%)
    - Statut : Barre verte (OK)
```

#### **2.5 Approbation**
```
12. Clique sur le bouton "Approuver" (icône CheckCircle)
13. Un toast de confirmation s'affiche : "Dépense approuvée avec succès"
14. Le badge passe de "En attente" (jaune) à "Approuvée" (vert)
15. La dépense disparaît du filtre "En attente"
16. Le compteur "En attente" passe de 3 à 2
```

### **Données Mises à Jour**
```json
{
  "reference": "EXP-20251103143500-A7B3C9D2",
  "is_approved": true,
  "approved_by": "Marie Nkurunziza",
  "approved_at": "2025-11-03T14:42:15Z",
  "status": "approved"
}
```

### **Notifications Envoyées**
```
→ À Jean : "Votre dépense EXP-20251103143500-A7B3C9D2 a été approuvée par Marie Nkurunziza"
→ Au système comptable : Mise à jour du budget "Fournitures"
```

---

## 📖 SCÉNARIO 3 : REJET D'UNE DÉPENSE AVEC RAISON

### **Contexte**
Marie examine une dépense de 150,000 FBu pour "Équipement" qui semble excessive.

### **Étapes Détaillées**

#### **3.1 Identification du Problème**
```
1. Marie voit la dépense : "EXP-20251103150000-B8C4D3E1"
2. Montant : 150,000 FBu
3. Catégorie : Équipement
4. Description : "Achat matériel cuisine"
5. Pas de justificatif uploadé (receipt_file: null)
```

#### **3.2 Vérification du Budget**
```
6. Consulte le budget "Équipement" :
   - Budget mensuel : 200,000 FBu
   - Dépensé : 180,000 FBu (90%)
   - Après approbation : 330,000 FBu (165%) ⚠️
   - Statut : Dépassement de budget !
```

#### **3.3 Rejet de la Dépense**
```
7. Clique sur le bouton "Rejeter" (icône AlertTriangle)
8. Un dialog s'ouvre : "Raison du rejet"
9. Entre la raison : "Budget équipement dépassé (165%). Justificatif manquant. Veuillez soumettre à nouveau le mois prochain avec facture."
10. Clique sur "Confirmer le rejet"
```

#### **3.4 Confirmation**
```
11. Un toast s'affiche : "Dépense rejetée"
12. Le badge passe à "Rejetée" (rouge)
13. La raison du rejet s'affiche sous la dépense
14. La dépense reste visible mais marquée comme rejetée
```

### **Données Mises à Jour**
```json
{
  "reference": "EXP-20251103150000-B8C4D3E1",
  "is_approved": false,
  "rejection_reason": "Budget équipement dépassé (165%). Justificatif manquant. Veuillez soumettre à nouveau le mois prochain avec facture.",
  "status": "rejected"
}
```

### **Notifications Envoyées**
```
→ À l'employé : "Votre dépense EXP-20251103150000-B8C4D3E1 a été rejetée. Raison : Budget équipement dépassé..."
```

---

## 📖 SCÉNARIO 4 : GESTION DES BUDGETS PAR L'ADMIN

### **Contexte**
L'admin veut définir les budgets mensuels pour toutes les catégories.

### **Étapes Détaillées**

#### **4.1 Accès à la Gestion des Budgets**
```
1. L'admin se connecte
2. Va sur "Dépenses"
3. Clique sur "Gérer les Budgets"
4. Un dialog s'ouvre avec la liste des catégories
```

#### **4.2 Configuration des Budgets**
```
5. Voit la liste des catégories :
   - Fournitures : 500,000 FBu/mois
   - Équipement : 200,000 FBu/mois
   - Salaires : 2,000,000 FBu/mois
   - Loyer : 800,000 FBu/mois
   - Électricité : 150,000 FBu/mois
   - Eau : 50,000 FBu/mois
   - Marketing : 300,000 FBu/mois
```

#### **4.3 Modification d'un Budget**
```
6. Clique sur "Modifier" pour "Marketing"
7. Change le budget de 300,000 à 400,000 FBu
8. Clique sur "Enregistrer"
9. Un toast confirme : "Budget mis à jour avec succès"
```

#### **4.4 Ajout d'une Nouvelle Catégorie avec Budget**
```
10. Clique sur "Nouvelle Catégorie"
11. Entre le nom : "Maintenance"
12. Entre la description : "Réparations et entretien"
13. Définit le budget : 250,000 FBu/mois
14. Définit le seuil d'alerte : 80%
15. Clique sur "Créer"
```

### **Résultat**
```
✓ 8 catégories avec budgets définis
✓ Budget total mensuel : 4,350,000 FBu
✓ Alertes automatiques configurées à 80%
```

---

## 📖 SCÉNARIO 5 : ALERTE DE DÉPASSEMENT DE BUDGET

### **Contexte**
Le budget "Fournitures" atteint 85% et déclenche une alerte.

### **Étapes Détaillées**

#### **5.1 Déclenchement Automatique**
```
1. Une nouvelle dépense de 50,000 FBu est approuvée
2. Le système calcule :
   - Budget : 500,000 FBu
   - Dépensé avant : 375,000 FBu (75%)
   - Dépensé après : 425,000 FBu (85%)
   - Seuil d'alerte : 80% ⚠️
```

#### **5.2 Affichage de l'Alerte**
```
3. Dans la section "Budgets par Catégorie" :
   - La barre de progression passe au orange
   - Badge "85%" en orange (warning)
   - Message : "⚠️ Attention : 85% du budget utilisé"
   - Restant : 75,000 FBu
```

#### **5.3 Notifications**
```
4. Notification envoyée à :
   → Manager : "Alerte budget Fournitures : 85% utilisé (425,000/500,000 FBu)"
   → Admin : "Alerte budget Fournitures : 85% utilisé"
```

#### **5.4 Actions Possibles**
```
5. Le manager peut :
   - Continuer à approuver (jusqu'à 100%)
   - Rejeter les nouvelles dépenses
   - Demander à l'admin d'augmenter le budget
```

---

## 📖 SCÉNARIO 6 : DÉPASSEMENT DE BUDGET (100%+)

### **Contexte**
Le budget "Fournitures" dépasse 100%.

### **Étapes**
```
1. Nouvelle dépense de 100,000 FBu soumise
2. Calcul :
   - Budget : 500,000 FBu
   - Dépensé : 425,000 FBu (85%)
   - Après approbation : 525,000 FBu (105%)
```

### **Affichage**
```
3. Barre de progression ROUGE (100% max)
4. Badge "105%" en ROUGE (destructive)
5. Message : "⚠️ Dépassement de budget: +25,000 FBu"
6. Alerte visuelle forte
```

### **Notification Critique**
```
→ Admin : "🚨 URGENT : Budget Fournitures dépassé de 5% (+25,000 FBu)"
→ Manager : "Budget Fournitures dépassé : 525,000/500,000 FBu"
```

---

## 📖 SCÉNARIO 7 : CONSULTATION DES STATISTIQUES

### **Contexte**
L'admin veut analyser les dépenses du mois.

### **Étapes**

#### **7.1 Vue d'Ensemble**
```
1. Accède à "Dépenses"
2. Consulte les cartes de statistiques :
   - Total ce mois : 3,250,000 FBu
   - Nombre de dépenses : 47
   - En attente : 5 (125,000 FBu)
   - Moyenne par jour : 108,333 FBu
```

#### **7.2 Analyse par Catégorie**
```
3. Consulte "Dépenses par Catégorie" :
   1. Salaires : 2,000,000 FBu (61.5%)
   2. Loyer : 800,000 FBu (24.6%)
   3. Fournitures : 425,000 FBu (13.1%)
   4. Marketing : 25,000 FBu (0.8%)
```

#### **7.3 Top Fournisseurs**
```
4. Consulte "Top Fournisseurs" :
   1. Quincaillerie Centrale : 325,000 FBu (15 achats)
   2. Brarudi : 150,000 FBu (8 achats)
   3. Électricité REGIDESO : 145,000 FBu (1 facture)
```

#### **7.4 Méthodes de Paiement**
```
5. Consulte "Répartition par Mode de Paiement" :
   - Espèces : 1,200,000 FBu (37%)
   - Virement bancaire : 1,800,000 FBu (55%)
   - Mobile Money : 250,000 FBu (8%)
```

---

## 📖 SCÉNARIO 8 : EXPORT DE RAPPORT MENSUEL

### **Contexte**
L'admin doit générer un rapport pour la comptabilité.

### **Étapes**
```
1. Sélectionne le mois : Novembre 2025
2. Clique sur "Exporter PDF"
3. Le système génère un PDF avec :
   - En-tête : Harry's Grill Bar
   - Période : Novembre 2025
   - Total général : 3,250,000 FBu
   - Tableau par catégorie
   - Graphique en camembert
   - Liste détaillée des dépenses approuvées
   - Signatures : Manager + Admin
4. Le PDF se télécharge : "Rapport_Depenses_Nov_2025.pdf"
```

---

## 🔄 WORKFLOW COMPLET RÉSUMÉ

```
┌─────────────────────────────────────────────────────────────┐
│                    CYCLE DE VIE D'UNE DÉPENSE               │
└─────────────────────────────────────────────────────────────┘

1. CRÉATION (Employé)
   ↓
   [En attente] - Badge jaune
   ↓
2. NOTIFICATION (Manager/Admin)
   ↓
3. EXAMEN (Manager)
   ├─→ APPROUVER
   │   ↓
   │   [Approuvée] - Badge vert
   │   ↓
   │   - Mise à jour budget
   │   - Notification employé
   │   - Inclus dans statistiques
   │
   └─→ REJETER
       ↓
       [Rejetée] - Badge rouge
       ↓
       - Raison enregistrée
       - Notification employé
       - Exclu des statistiques
```

---

## 📊 TABLEAU DE BORD TEMPS RÉEL

### **Indicateurs Clés**
```
┌──────────────────────────────────────────────────────────┐
│  DÉPENSES DU MOIS                                        │
├──────────────────────────────────────────────────────────┤
│  Total : 3,250,000 FBu                                   │
│  Budget : 4,350,000 FBu                                  │
│  Utilisé : 74.7% ████████████████░░░░░                   │
│  Restant : 1,100,000 FBu                                 │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  STATUT DES DÉPENSES                                     │
├──────────────────────────────────────────────────────────┤
│  ✅ Approuvées : 42 (3,125,000 FBu)                      │
│  ⏳ En attente : 5 (125,000 FBu)                         │
│  ❌ Rejetées : 3 (75,000 FBu)                            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│  ALERTES BUDGÉTAIRES                                     │
├──────────────────────────────────────────────────────────┤
│  🟢 Fournitures : 85% (Attention)                        │
│  🔴 Équipement : 105% (Dépassement!)                     │
│  🟢 Marketing : 6% (OK)                                  │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ CHECKLIST DE VÉRIFICATION

### **Pour l'Employé**
- [ ] Catégorie sélectionnée
- [ ] Description claire et précise
- [ ] Montant correct
- [ ] Mode de paiement indiqué
- [ ] Fournisseur renseigné
- [ ] Date exacte
- [ ] Justificatif uploadé (photo/PDF)
- [ ] Notes ajoutées si nécessaire

### **Pour le Manager**
- [ ] Vérifier le justificatif
- [ ] Vérifier le montant
- [ ] Vérifier la catégorie
- [ ] Consulter le budget restant
- [ ] Vérifier la cohérence (date, fournisseur)
- [ ] Décider : Approuver ou Rejeter
- [ ] Si rejet : Donner une raison claire

### **Pour l'Admin**
- [ ] Budgets définis pour toutes les catégories
- [ ] Seuils d'alerte configurés (80%)
- [ ] Catégories actives et pertinentes
- [ ] Rapports mensuels générés
- [ ] Alertes de dépassement surveillées

---

## 🎓 BONNES PRATIQUES

### **Création de Dépenses**
1. ✅ Toujours uploader un justificatif
2. ✅ Description précise (pas juste "Achat")
3. ✅ Montant exact (vérifier le reçu)
4. ✅ Catégorie appropriée
5. ✅ Soumettre rapidement (max 48h après achat)

### **Approbation**
1. ✅ Vérifier TOUS les justificatifs
2. ✅ Consulter le budget avant d'approuver
3. ✅ Rejeter avec raison claire et constructive
4. ✅ Traiter les demandes sous 24h
5. ✅ Communiquer avec l'employé si doute

### **Gestion des Budgets**
1. ✅ Réviser les budgets mensuellement
2. ✅ Ajuster selon l'activité réelle
3. ✅ Anticiper les pics saisonniers
4. ✅ Garder une marge de sécurité (10-15%)
5. ✅ Analyser les dépassements récurrents

---

## 🔐 SÉCURITÉ ET TRAÇABILITÉ

### **Chaque Action est Tracée**
```
Création :
- Qui : Jean Mukendi (ID: 42)
- Quand : 2025-11-03 14:35:00
- Quoi : Dépense de 25,000 FBu

Approbation :
- Qui : Marie Nkurunziza (ID: 5)
- Quand : 2025-11-03 14:42:15
- Quoi : Approuvé la dépense EXP-20251103143500-A7B3C9D2

Modification Budget :
- Qui : Admin (ID: 1)
- Quand : 2025-11-03 15:00:00
- Quoi : Budget Marketing : 300,000 → 400,000 FBu
```

### **Fichiers Sécurisés**
```
Stockage : /media/expenses/receipts/2025/11/
Permissions : Lecture seule pour employés
              Lecture/Écriture pour managers
              Accès complet pour admin
Backup : Quotidien automatique
Rétention : 7 ans (conformité fiscale)
```

---

## 📱 RESPONSIVE MOBILE

### **Sur Smartphone**
- ✅ Formulaire adapté (1 colonne)
- ✅ Boutons pleine largeur
- ✅ Upload photo directement depuis caméra
- ✅ Tableaux scrollables horizontalement
- ✅ Graphiques tactiles
- ✅ Notifications push

### **Sur Tablette**
- ✅ Layout 2 colonnes
- ✅ Sidebar visible
- ✅ Graphiques plus grands
- ✅ Multi-sélection possible

---

## 🎯 CONCLUSION

Votre module de gestion des dépenses offre :

✅ **Workflow complet** : Création → Approbation → Statistiques  
✅ **Contrôle budgétaire** : Alertes automatiques à 80% et 100%  
✅ **Traçabilité totale** : Qui, quand, pourquoi, combien  
✅ **Justificatifs** : Upload et stockage sécurisé  
✅ **Statistiques** : Analyse en temps réel  
✅ **Responsive** : Web + Mobile  
✅ **Sécurisé** : Permissions par rôle  

**Prêt pour la production ! 🚀**

