# 🚀 GUIDE DE DÉPLOIEMENT FIREBASE - BARSTOCK MOBILE

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Configuration Firebase](#configuration-firebase)
3. [Configuration du projet Flutter](#configuration-du-projet-flutter)
4. [Déploiement Android](#déploiement-android)
5. [Déploiement iOS](#déploiement-ios)
6. [Déploiement Web](#déploiement-web)
7. [Configuration des services Firebase](#configuration-des-services-firebase)
8. [Tests et validation](#tests-et-validation)
9. [Maintenance et mises à jour](#maintenance-et-mises-à-jour)

---

## 🎯 Prérequis

### 1. Outils requis

```bash
# Flutter SDK (version 3.0.0 ou supérieure)
flutter --version

# Firebase CLI
npm install -g firebase-tools

# FlutterFire CLI
dart pub global activate flutterfire_cli

# Android Studio (pour Android)
# Xcode (pour iOS, Mac uniquement)
```

### 2. Comptes nécessaires

- ✅ Compte Google/Firebase (gratuit)
- ✅ Compte Google Play Developer (25$ une fois) - pour Android
- ✅ Compte Apple Developer (99$/an) - pour iOS
- ✅ Compte GitHub (optionnel, pour CI/CD)

### 3. Vérifier l'installation

```bash
cd C:\Users\AlainDev\Desktop\Stock_Resto\barstock_mobile

# Vérifier les dépendances
flutter doctor -v

# Nettoyer le projet
flutter clean
flutter pub get
```

---

## 🔥 Configuration Firebase

### Étape 1 : Créer un projet Firebase

1. **Aller sur** : https://console.firebase.google.com/
2. **Cliquer sur** : "Ajouter un projet"
3. **Nom du projet** : `barstock-mobile` (ou `harrys-grill-mobile`)
4. **Activer Google Analytics** : Oui (recommandé)
5. **Créer le projet** : Attendre 30-60 secondes

### Étape 2 : Installer Firebase CLI

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Vérifier la connexion
firebase projects:list
```

### Étape 3 : Installer FlutterFire CLI

```bash
# Installer FlutterFire CLI
dart pub global activate flutterfire_cli

# Vérifier l'installation
flutterfire --version
```

### Étape 4 : Configurer Firebase dans le projet

```bash
cd C:\Users\AlainDev\Desktop\Stock_Resto\barstock_mobile

# Configurer Firebase automatiquement
flutterfire configure

# Sélectionner :
# - Projet : barstock-mobile
# - Plateformes : Android, iOS, Web
# - Bundle ID iOS : com.harrys.barstock (ou votre ID)
# - Package Android : com.harrys.barstock
```

**Résultat** : Fichiers créés automatiquement :
- `lib/firebase_options.dart`
- `android/app/google-services.json`
- `ios/Runner/GoogleService-Info.plist`
- `web/index.html` (mis à jour)

---

## 📱 Configuration du projet Flutter

### Étape 1 : Ajouter les dépendances Firebase

Modifier `pubspec.yaml` :

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # Firebase Core (OBLIGATOIRE)
  firebase_core: ^2.24.2
  
  # Firebase Services
  firebase_auth: ^4.15.3          # Authentification
  cloud_firestore: ^4.13.6        # Base de données
  firebase_storage: ^11.5.6       # Stockage fichiers
  firebase_messaging: ^14.7.9     # Notifications push
  firebase_analytics: ^10.7.4     # Analytics
  firebase_crashlytics: ^3.4.8    # Crash reporting
  
  # Dépendances existantes
  provider: ^6.1.1
  go_router: ^12.1.3
  http: ^1.1.2
  dio: ^5.4.0
  # ... autres dépendances
```

Installer les dépendances :

```bash
flutter pub get
```

### Étape 2 : Initialiser Firebase dans l'app

Modifier `lib/main.dart` :

```dart
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'services/api_service.dart';
import 'services/auth_service.dart';
import 'services/websocket_service.dart';
import 'services/notification_service.dart';
import 'services/dashboard_service.dart';
import 'services/orders_service.dart';
import 'services/profile_service.dart';
import 'presentation/pages/login_page.dart';
import 'presentation/pages/home_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // ✅ INITIALISER FIREBASE
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Initialiser les locales pour le formatage des dates
  await initializeDateFormatting('fr_FR', null);
  
  // Initialiser les services
  await NotificationService.initialize();
  ApiService().initialize();

  runApp(const MyApp());
}

// ... reste du code
```

---

## 🤖 Déploiement Android

### Étape 1 : Configuration Android

Modifier `android/app/build.gradle` :

```gradle
android {
    namespace "com.harrys.barstock"
    compileSdkVersion 34
    ndkVersion flutter.ndkVersion

    defaultConfig {
        applicationId "com.harrys.barstock"
        minSdkVersion 21  // ✅ Minimum pour Firebase
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        multiDexEnabled true  // ✅ Pour Firebase
    }

    signingConfigs {
        release {
            // ✅ Configuration signature (voir ci-dessous)
            keyAlias keystoreProperties['keyAlias']
            keyPassword keystoreProperties['keyPassword']
            storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
            storePassword keystoreProperties['storePassword']
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}

dependencies {
    implementation "org.jetbrains.kotlin:kotlin-stdlib-jdk7:$kotlin_version"
    implementation platform('com.google.firebase:firebase-bom:32.7.0')  // ✅ Firebase BOM
    implementation 'com.google.firebase:firebase-analytics'
    implementation 'com.android.support:multidex:1.0.3'  // ✅ MultiDex
}

// ✅ Plugin Google Services (à la fin du fichier)
apply plugin: 'com.google.gms.google-services'
```

Modifier `android/build.gradle` :

```gradle
buildscript {
    ext.kotlin_version = '1.9.0'
    repositories {
        google()
        mavenCentral()
    }

    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
        classpath "org.jetbrains.kotlin:kotlin-gradle-plugin:$kotlin_version"
        classpath 'com.google.gms:google-services:4.4.0'  // ✅ Google Services
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

### Étape 2 : Créer une clé de signature

```bash
# Créer un keystore
keytool -genkey -v -keystore C:\Users\AlainDev\Desktop\Stock_Resto\barstock_mobile\android\app\upload-keystore.jks -storetype JKS -keyalg RSA -keysize 2048 -validity 10000 -alias upload

# Informations à fournir :
# - Password: [votre_mot_de_passe_sécurisé]
# - Nom: Harry's Grill
# - Organisation: Harry's Grill
# - Ville: Bujumbura
# - Pays: BI
```

Créer `android/key.properties` :

```properties
storePassword=[votre_mot_de_passe]
keyPassword=[votre_mot_de_passe]
keyAlias=upload
storeFile=upload-keystore.jks
```

**⚠️ IMPORTANT** : Ajouter `key.properties` au `.gitignore` !

### Étape 3 : Build APK/AAB

```bash
cd C:\Users\AlainDev\Desktop\Stock_Resto\barstock_mobile

# Build APK (pour tests)
flutter build apk --release

# Build AAB (pour Google Play)
flutter build appbundle --release

# Fichiers générés :
# - build/app/outputs/flutter-apk/app-release.apk
# - build/app/outputs/bundle/release/app-release.aab
```

### Étape 4 : Déployer sur Google Play Console

1. **Aller sur** : https://play.google.com/console/
2. **Créer une application** : "BarStockWise Mobile"
3. **Remplir les informations** :
   - Nom : BarStockWise Mobile
   - Description courte : Gestion de restaurant mobile
   - Description complète : [voir ci-dessous]
   - Catégorie : Business
   - Screenshots : Minimum 2 (phone), 1 (tablet)
   - Icône : 512x512px
4. **Télécharger l'AAB** : Production > Créer une version > Télécharger `app-release.aab`
5. **Soumettre pour révision** : 1-7 jours

---

## 🍎 Déploiement iOS

### Étape 1 : Configuration Xcode

```bash
cd C:\Users\AlainDev\Desktop\Stock_Resto\barstock_mobile\ios

# Ouvrir dans Xcode (Mac uniquement)
open Runner.xcworkspace
```

Dans Xcode :
1. **Sélectionner Runner** (projet)
2. **General** :
   - Display Name : BarStockWise
   - Bundle Identifier : com.harrys.barstock
   - Version : 1.0.0
   - Build : 1
3. **Signing & Capabilities** :
   - Team : [Votre Apple Developer Team]
   - Automatically manage signing : ✅

### Étape 2 : Build iOS

```bash
# Build pour iOS (Mac uniquement)
flutter build ios --release

# Ou build IPA
flutter build ipa --release

# Fichier généré :
# build/ios/ipa/barstock_mobile.ipa
```

### Étape 3 : Déployer sur App Store Connect

1. **Aller sur** : https://appstoreconnect.apple.com/
2. **Créer une app** : "BarStockWise Mobile"
3. **Remplir les informations** :
   - Nom : BarStockWise Mobile
   - Langue principale : Français
   - Bundle ID : com.harrys.barstock
   - SKU : barstock-mobile-001
4. **Télécharger l'IPA** : Transporter app ou Xcode
5. **Soumettre pour révision** : 1-7 jours

---

## 🌐 Déploiement Web (Firebase Hosting)

### Étape 1 : Build Web

```bash
cd C:\Users\AlainDev\Desktop\Stock_Resto\barstock_mobile

# Build pour le web
flutter build web --release

# Fichiers générés dans :
# build/web/
```

### Étape 2 : Initialiser Firebase Hosting

```bash
# Initialiser Firebase dans le projet
firebase init hosting

# Sélectionner :
# - Projet : barstock-mobile
# - Public directory : build/web
# - Single-page app : Yes
# - Overwrite index.html : No
```

Fichier `firebase.json` créé :

```json
{
  "hosting": {
    "public": "build/web",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### Étape 3 : Déployer sur Firebase Hosting

```bash
# Déployer
firebase deploy --only hosting

# URL générée :
# https://barstock-mobile.web.app
# https://barstock-mobile.firebaseapp.com
```

### Étape 4 : Configurer un domaine personnalisé (optionnel)

1. **Firebase Console** > Hosting > Add custom domain
2. **Entrer le domaine** : `mobile.harrys-grill.com`
3. **Ajouter les enregistrements DNS** :
   - Type A : 151.101.1.195, 151.101.65.195
4. **Attendre la vérification** : 24-48h

---

## 🔧 Configuration des services Firebase

### 1. Firebase Authentication

```bash
# Firebase Console > Authentication > Sign-in method
# Activer :
# - Email/Password ✅
# - Google ✅ (optionnel)
# - Phone ✅ (optionnel)
```

### 2. Cloud Firestore

```bash
# Firebase Console > Firestore Database > Create database
# Mode : Production
# Région : europe-west1 (Belgique) ou us-central1

# Règles de sécurité :
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre lecture/écriture uniquement aux utilisateurs authentifiés
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Firebase Storage

```bash
# Firebase Console > Storage > Get started
# Règles de sécurité :
```

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 4. Firebase Cloud Messaging (Notifications Push)

```bash
# Firebase Console > Cloud Messaging
# Télécharger :
# - google-services.json (Android)
# - GoogleService-Info.plist (iOS)
```

Ajouter dans `lib/services/firebase_messaging_service.dart` :

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class FirebaseMessagingService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  Future<void> initialize() async {
    // Demander la permission
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      print('✅ Notifications autorisées');
      
      // Récupérer le token FCM
      String? token = await _firebaseMessaging.getToken();
      print('📱 FCM Token: $token');
      
      // Écouter les messages
      FirebaseMessaging.onMessage.listen(_handleMessage);
      FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpened);
    }
  }

  void _handleMessage(RemoteMessage message) {
    print('📩 Message reçu: ${message.notification?.title}');
    // Afficher notification locale
  }

  void _handleMessageOpened(RemoteMessage message) {
    print('📬 Message ouvert: ${message.notification?.title}');
    // Naviguer vers la page appropriée
  }
}
```

Initialiser dans `main.dart` :

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  
  // ✅ Initialiser FCM
  await FirebaseMessagingService().initialize();
  
  runApp(const MyApp());
}
```

### 5. Firebase Analytics

```dart
import 'package:firebase_analytics/firebase_analytics.dart';

class AnalyticsService {
  final FirebaseAnalytics _analytics = FirebaseAnalytics.instance;

  Future<void> logEvent(String name, Map<String, dynamic> parameters) async {
    await _analytics.logEvent(name: name, parameters: parameters);
  }

  Future<void> logLogin(String method) async {
    await _analytics.logLogin(loginMethod: method);
  }

  Future<void> logScreenView(String screenName) async {
    await _analytics.logScreenView(screenName: screenName);
  }
}
```

### 6. Firebase Crashlytics

```bash
# Ajouter dans pubspec.yaml
firebase_crashlytics: ^3.4.8

# Initialiser dans main.dart
```

```dart
import 'package:firebase_crashlytics/firebase_crashlytics.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  
  // ✅ Initialiser Crashlytics
  FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
  
  runApp(const MyApp());
}
```

---

## ✅ Tests et validation

### 1. Tests locaux

```bash
# Tester sur émulateur Android
flutter run -d emulator-5554

# Tester sur simulateur iOS (Mac)
flutter run -d "iPhone 14 Pro"

# Tester sur navigateur
flutter run -d chrome
```

### 2. Tests Firebase

```bash
# Tester l'authentification
# - Créer un compte
# - Se connecter
# - Se déconnecter

# Tester Firestore
# - Créer un document
# - Lire un document
# - Mettre à jour un document
# - Supprimer un document

# Tester les notifications
# Firebase Console > Cloud Messaging > Send test message
```

### 3. Tests de performance

```bash
# Analyser la taille de l'app
flutter build apk --analyze-size

# Profiler l'app
flutter run --profile
```

---

## 🔄 Maintenance et mises à jour

### 1. Mettre à jour la version

Modifier `pubspec.yaml` :

```yaml
version: 1.0.1+2  # 1.0.1 = version, 2 = build number
```

Modifier `android/app/build.gradle` :

```gradle
defaultConfig {
    versionCode 2
    versionName "1.0.1"
}
```

### 2. Build et déployer la mise à jour

```bash
# Android
flutter build appbundle --release
# Télécharger sur Google Play Console

# iOS
flutter build ipa --release
# Télécharger sur App Store Connect

# Web
flutter build web --release
firebase deploy --only hosting
```

### 3. CI/CD avec GitHub Actions

Créer `.github/workflows/deploy.yml` :

```yaml
name: Deploy to Firebase

on:
  push:
    branches:
      - main

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Flutter
        uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.16.0'
      
      - name: Install dependencies
        run: flutter pub get
      
      - name: Build web
        run: flutter build web --release
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
          projectId: barstock-mobile
```

---

## 📊 Monitoring et Analytics

### 1. Firebase Console

- **Dashboard** : Vue d'ensemble
- **Analytics** : Événements, utilisateurs, conversions
- **Crashlytics** : Crashes, erreurs
- **Performance** : Temps de chargement, requêtes réseau
- **Cloud Messaging** : Notifications envoyées, ouvertes

### 2. Google Play Console

- **Statistiques** : Téléchargements, notes, avis
- **Rapports** : Crashes ANR, performances
- **Pré-lancement** : Tests automatiques

### 3. App Store Connect

- **Statistiques** : Téléchargements, notes, avis
- **Rapports** : Crashes, performances
- **TestFlight** : Tests bêta

---

## 💰 Coûts estimés

### Firebase (Plan Gratuit - Spark)
- ✅ **Hosting** : 10 GB stockage, 360 MB/jour transfert
- ✅ **Firestore** : 1 GB stockage, 50K lectures/jour, 20K écritures/jour
- ✅ **Storage** : 5 GB stockage, 1 GB/jour téléchargement
- ✅ **Authentication** : Illimité
- ✅ **Cloud Messaging** : Illimité

### Firebase (Plan Payant - Blaze)
- 💰 **Hosting** : 0.026$/GB stockage, 0.15$/GB transfert
- 💰 **Firestore** : 0.18$/GB stockage, 0.06$/100K lectures, 0.18$/100K écritures
- 💰 **Storage** : 0.026$/GB stockage, 0.12$/GB téléchargement
- 💰 **Cloud Functions** : 0.40$/million invocations

### Stores
- 💰 **Google Play** : 25$ (une fois)
- 💰 **App Store** : 99$/an

### Estimation mensuelle (1000 utilisateurs actifs)
- Firebase Gratuit : 0$/mois
- Firebase Payant : 10-50$/mois (selon usage)
- Total : 10-50$/mois + frais stores

---

## 🆘 Dépannage

### Problème : Build Android échoue

```bash
# Solution 1 : Nettoyer le projet
flutter clean
flutter pub get
cd android
./gradlew clean
cd ..
flutter build apk

# Solution 2 : Mettre à jour Gradle
# Modifier android/gradle/wrapper/gradle-wrapper.properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.0-all.zip
```

### Problème : Firebase non initialisé

```dart
// Vérifier que Firebase est initialisé AVANT runApp()
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  runApp(const MyApp());
}
```

### Problème : Notifications ne fonctionnent pas

```bash
# Android : Vérifier google-services.json
# iOS : Vérifier GoogleService-Info.plist
# Vérifier les permissions dans AndroidManifest.xml et Info.plist
```

---

## 📚 Ressources

### Documentation officielle
- **Flutter** : https://docs.flutter.dev/
- **Firebase** : https://firebase.google.com/docs
- **FlutterFire** : https://firebase.flutter.dev/

### Tutoriels
- **Firebase + Flutter** : https://www.youtube.com/watch?v=sfA3NWDBPZ4
- **Google Play Deploy** : https://www.youtube.com/watch?v=g0GNuoCOtaQ
- **App Store Deploy** : https://www.youtube.com/watch?v=akFF1uJWZck

### Communauté
- **Flutter Discord** : https://discord.gg/flutter
- **Stack Overflow** : https://stackoverflow.com/questions/tagged/flutter
- **Reddit** : https://www.reddit.com/r/FlutterDev/

---

## ✅ Checklist finale

Avant de déployer en production :

- [ ] Tests complets sur Android
- [ ] Tests complets sur iOS
- [ ] Tests complets sur Web
- [ ] Firebase configuré et testé
- [ ] Authentification fonctionnelle
- [ ] Base de données synchronisée
- [ ] Notifications push testées
- [ ] Analytics configuré
- [ ] Crashlytics activé
- [ ] Icône et splash screen configurés
- [ ] Screenshots et descriptions prêts
- [ ] Politique de confidentialité publiée
- [ ] Conditions d'utilisation publiées
- [ ] Build signé et testé
- [ ] Version incrémentée
- [ ] Changelog rédigé
- [ ] Documentation à jour

---

**Date de création** : 3 novembre 2025  
**Version** : 1.0.0  
**Auteur** : Cascade AI  
**Projet** : BarStockWise Mobile - Harry's Grill

🎉 **Bon déploiement !**
