class ApiConstants {
  // URLs de base
  // ⚠️ IMPORTANT: Changer selon l'environnement
  // - iOS Simulator: http://127.0.0.1:8000/api
  // - Android Emulator: http://10.0.2.2:8000/api
  // - Appareil physique: http://192.168.X.X:8000/api (IP locale du PC)
  // ⚠️ CHANGER SELON LA PLATEFORME:
  // Web (Chrome): http://127.0.0.1:8000/api
  // Android Emulator: http://10.0.2.2:8000/api
  static const String baseUrl = 'http://127.0.0.1:8000/api'; // ✅ Pour Web
  static const String wsBaseUrl = 'ws://127.0.0.1:8000/ws';
  
  // Endpoints - Authentification
  static const String loginEndpoint = '/accounts/login/';
  static const String refreshEndpoint = '/accounts/token/refresh/';
  static const String profileEndpoint = '/accounts/profile/';
  static const String usersEndpoint = '/accounts/users/';
  
  // Endpoints - Produits et Ventes
  static const String productsEndpoint = '/products/';
  static const String salesEndpoint = '/sales/'; // Créer une vente
  static const String ordersEndpoint = '/sales/orders/'; // ✅ CORRIGÉ: Commandes en cours
  static const String tablesEndpoint = '/sales/tables/'; // ✅ CORRIGÉ: Tables
  
  // Endpoints - Système
  static const String alertsEndpoint = '/alerts/';
  static const String reportsEndpoint = '/reports/';
  static const String dashboardEndpoint = '/dashboard/';
  
  // Timeouts
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
}
