class AppConfig {
  static const bool isDemoMode = false; // Mode production - API réelle
  static const bool enableOfflineMode = false;

  // Configuration API
  // ⚠️ CHANGER SELON VOTRE ENVIRONNEMENT:
  // Android Emulator: http://10.0.2.2:8000/api
  // iOS Simulator: http://127.0.0.1:8000/api
  // Appareil physique: http://192.168.X.X:8000/api (votre IP locale)
  // Web: http://127.0.0.1:8000/api
  static const String baseUrl = 'http://10.0.2.2:8000/api'; // ✅ Pour Android Emulator
  static const String wsBaseUrl = 'ws://10.0.2.2:8000/ws';

  // Configuration démo
  static const String demoUsername = 'admin';
  static const String demoPassword = 'admin123';

  // Timeouts
  static const int connectTimeout = 30000; // 30 secondes
  static const int receiveTimeout = 30000;

  // Messages
  static const String demoModeMessage = 'Mode démo activé - Données simulées';
  static const String offlineModeMessage =
      'Mode hors ligne - Fonctionnalités limitées';
}
