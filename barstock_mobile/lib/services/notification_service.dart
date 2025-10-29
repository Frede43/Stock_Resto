import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationService {
  static final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static Future<void> initialize() async {
    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings settings = InitializationSettings(
      android: androidSettings,
    );

    await _notifications.initialize(settings);
  }

  static Future<void> showWelcomeNotification(String username) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'welcome',
      'Bienvenue',
      channelDescription: 'Notifications de bienvenue',
      importance: Importance.high,
      priority: Priority.high,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
    );

    await _notifications.show(
      0,
      'Bienvenue !',
      'Bonjour $username, vous êtes connecté à BarStockWise',
      details,
    );
  }

  static Future<void> showStockAlert(String productName, int quantity) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'stock_alerts',
      'Alertes de Stock',
      channelDescription: 'Notifications pour les alertes de stock',
      importance: Importance.high,
      priority: Priority.high,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
    );

    await _notifications.show(
      1,
      'Stock Critique',
      '$productName: $quantity unités restantes',
      details,
    );
  }

  static Future<void> showNewOrder(
      String orderNumber, String tableNumber) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'new_orders',
      'Nouvelles Commandes',
      channelDescription: 'Notifications pour les nouvelles commandes',
      importance: Importance.max,
      priority: Priority.max,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
    );

    await _notifications.show(
      2,
      'Nouvelle Commande',
      'Commande #$orderNumber - Table $tableNumber',
      details,
    );
  }

  static Future<void> showLocalNotification(String title, String body) async {
    const AndroidNotificationDetails androidDetails =
        AndroidNotificationDetails(
      'general',
      'Notifications générales',
      channelDescription: 'Notifications générales de l\'application',
      importance: Importance.high,
      priority: Priority.high,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
    );

    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
    );
  }
}
