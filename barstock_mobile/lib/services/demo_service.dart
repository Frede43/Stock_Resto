import 'dart:async';
import '../data/models/user_model.dart';
import '../data/models/order_model.dart';
import '../data/models/product_model.dart';
import '../data/mock_data/mock_data.dart';

class DemoService {
  static final DemoService _instance = DemoService._internal();
  factory DemoService() => _instance;
  DemoService._internal();

  // Simuler un délai de réseau
  Future<void> _simulateNetworkDelay() async {
    await Future.delayed(const Duration(milliseconds: 800));
  }

  // Authentification de démonstration
  Future<Map<String, dynamic>?> login(String username, String password) async {
    await _simulateNetworkDelay();

    if (username == 'admin' && password == 'admin123') {
      return {
        'access': 'demo_access_token',
        'refresh': 'demo_refresh_token',
        'user': MockData.demoUser.toJson(),
      };
    }
    return null;
  }

  // Obtenir les statistiques du tableau de bord
  Future<Map<String, dynamic>> getDashboardStats() async {
    await _simulateNetworkDelay();
    return MockData.dashboardStats;
  }

  // Obtenir les commandes
  Future<List<OrderModel>> getOrders() async {
    await _simulateNetworkDelay();
    return MockData.demoOrders;
  }

  // Obtenir les produits
  Future<List<ProductModel>> getProducts() async {
    await _simulateNetworkDelay();
    return MockData.demoProducts;
  }

  // Obtenir les notifications
  Future<List<Map<String, dynamic>>> getNotifications() async {
    await _simulateNetworkDelay();
    return MockData.demoNotifications;
  }

  // Mettre à jour le statut d'une commande
  Future<bool> updateOrderStatus(int orderId, String status) async {
    await _simulateNetworkDelay();
    // Simuler la mise à jour
    return true;
  }

  // Obtenir le profil utilisateur
  Future<UserModel> getUserProfile() async {
    await _simulateNetworkDelay();
    return MockData.demoUser;
  }

  // Mettre à jour le profil utilisateur
  Future<bool> updateUserProfile(UserModel user) async {
    await _simulateNetworkDelay();
    // Simuler la mise à jour
    return true;
  }

  // Obtenir les produits populaires
  Future<List<Map<String, dynamic>>> getTopProducts() async {
    await _simulateNetworkDelay();
    return [
      {
        'id': 1,
        'name': 'Primus',
        'sales': 150,
        'price': 2000.0,
        'revenue': 300000.0,
      },
      {
        'id': 2,
        'name': 'Coca-Cola',
        'sales': 120,
        'price': 1500.0,
        'revenue': 180000.0,
      },
      {
        'id': 3,
        'name': 'Brochettes',
        'sales': 80,
        'price': 3000.0,
        'revenue': 240000.0,
      },
    ];
  }

  // Simuler les notifications en temps réel
  Stream<Map<String, dynamic>> getRealTimeNotifications() {
    return Stream.periodic(const Duration(seconds: 10), (index) {
      final notifications = [
        {
          'type': 'stock_alert',
          'title': 'Stock faible',
          'message': 'Produit X - Stock critique',
          'timestamp': DateTime.now(),
        },
        {
          'type': 'new_order',
          'title': 'Nouvelle commande',
          'message': 'Commande #ORD-00${index + 4} - Table ${index + 1}',
          'timestamp': DateTime.now(),
        },
      ];
      return notifications[index % notifications.length];
    });
  }
}
