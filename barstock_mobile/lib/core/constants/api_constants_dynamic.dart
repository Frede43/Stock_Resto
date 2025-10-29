import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;

class ApiConstants {
  // Détection automatique de la plateforme
  static String get baseUrl {
    if (kIsWeb) {
      // Web (Chrome, Firefox, etc.)
      return 'http://127.0.0.1:8000/api';
    } else if (Platform.isAndroid) {
      // Android Emulator ou Appareil
      // TODO: Changer pour appareil physique
      return 'http://10.0.2.2:8000/api';
    } else if (Platform.isIOS) {
      // iOS Simulator
      return 'http://127.0.0.1:8000/api';
    } else {
      // Fallback
      return 'http://127.0.0.1:8000/api';
    }
  }

  static String get wsBaseUrl {
    if (kIsWeb) {
      return 'ws://127.0.0.1:8000/ws';
    } else if (Platform.isAndroid) {
      return 'ws://10.0.2.2:8000/ws';
    } else {
      return 'ws://127.0.0.1:8000/ws';
    }
  }

  // Pour appareil physique, définir manuellement
  static const String physicalDeviceUrl = 'http://192.168.1.100:8000/api';
  static bool usePhysicalDevice = false;

  static String get effectiveBaseUrl {
    return usePhysicalDevice ? physicalDeviceUrl : baseUrl;
  }

  // Endpoints - Authentification
  static const String loginEndpoint = '/accounts/login/';
  static const String refreshEndpoint = '/accounts/token/refresh/';
  static const String profileEndpoint = '/accounts/profile/';
  static const String usersEndpoint = '/accounts/users/';

  // Endpoints - Produits et Ventes
  static const String productsEndpoint = '/products/';
  static const String salesEndpoint = '/sales/';
  static const String ordersEndpoint = '/sales/orders/';
  static const String tablesEndpoint = '/sales/tables/';

  // Endpoints - Système
  static const String alertsEndpoint = '/alerts/';
  static const String reportsEndpoint = '/reports/';
  static const String dashboardEndpoint = '/dashboard/';

  // Timeouts
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;

  // Debug
  static void printConfig() {
    print('🌐 Configuration API:');
    print('   Platform: ${kIsWeb ? "Web" : Platform.operatingSystem}');
    print('   Base URL: $effectiveBaseUrl');
    print('   WebSocket URL: $wsBaseUrl');
  }
}
