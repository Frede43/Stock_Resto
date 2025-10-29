import 'dart:async';
import 'package:flutter/foundation.dart';
import 'api_service.dart';
import 'demo_service.dart';
import '../core/config/app_config.dart';

class DashboardService extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final DemoService _demoService = DemoService();

  Map<String, dynamic> _stats = {};
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = false;

  Map<String, dynamic> get dashboardStats => _stats;
  Map<String, dynamic> get stats => _stats;
  List<Map<String, dynamic>> get notifications => _notifications;
  List<Map<String, dynamic>> _topProducts = [];
  List<Map<String, dynamic>> get topProducts => _topProducts;
  bool get isLoading => _isLoading;

  // Obtenir les statistiques du tableau de bord
  Future<void> loadDashboardData() async {
    await loadDashboardStats();
  }

  Future<void> loadDashboardStats() async {
    _isLoading = true;
    notifyListeners();

    try {
      if (AppConfig.isDemoMode) {
        _stats = await _demoService.getDashboardStats();
        _notifications = await _demoService.getNotifications();
        _topProducts = await _demoService.getTopProducts();
      } else {
        // Mode production - API réelle
        print('📊 Chargement des statistiques du dashboard...');
        
        // Statistiques du dashboard
        final statsResponse = await _apiService.get('/dashboard/stats/');
        print('📡 Réponse dashboard: ${statsResponse.statusCode}');
        
        if (statsResponse.statusCode == 200) {
          final data = statsResponse.data;
          print('📦 Données reçues: $data');
          
          _stats = {
            'totalSales': data['today_sales'] ?? 0,
            'totalOrders': data['pending_orders'] ?? 0,
            'totalProducts': data['total_products'] ?? 0,
            'lowStockAlerts': data['low_stock_alerts'] ?? 0,
            'occupiedTables': data['occupied_tables'] ?? 0,
            'totalTables': data['total_tables'] ?? 0,
            'occupancyRate': data['occupancy_rate'] ?? '0%',
            'salesChange': data['sales_change'] ?? '0%',
            'salesChangeType': data['sales_change_type'] ?? 'neutral',
          };
          
          print('✅ Stats chargées: ${_stats['totalSales']} BIF, ${_stats['totalOrders']} commandes');
        } else {
          print('❌ Erreur dashboard: ${statsResponse.statusCode}');
        }

        // Notifications récentes (alertes non résolues)
        try {
          final notificationsResponse = await _apiService.get('/alerts/?is_resolved=false&limit=10');
          if (notificationsResponse.statusCode == 200) {
            final results = notificationsResponse.data['results'] ?? notificationsResponse.data ?? [];
            _notifications = List<Map<String, dynamic>>.from(
              results.map((notification) => {
                'id': notification['id'],
                'type': notification['type'] ?? 'info',
                'title': notification['title'] ?? 'Notification',
                'message': notification['message'] ?? '',
                'timestamp': notification['created_at'],
                'isRead': notification['is_resolved'] ?? false,
              })
            );
            print('✅ ${_notifications.length} notifications chargées');
          }
        } catch (e) {
          print('⚠️ Erreur chargement notifications: $e');
          _notifications = [];
        }

        // Produits les plus vendus
        try {
          final productsResponse = await _apiService.get('/products/?ordering=-total_sold&limit=5');
          if (productsResponse.statusCode == 200) {
            final results = productsResponse.data['results'] ?? productsResponse.data ?? [];
            _topProducts = List<Map<String, dynamic>>.from(
              results.map((product) => {
                'id': product['id'],
                'name': product['name'],
                'sales': product['total_sold'] ?? 0,
                'price': product['selling_price'] ?? 0,
                'stock': product['current_stock'] ?? 0,
              })
            );
            print('✅ ${_topProducts.length} produits populaires chargés');
          }
        } catch (e) {
          print('⚠️ Erreur chargement produits: $e');
          _topProducts = [];
        }
      }
    } catch (e) {
      print('Erreur lors du chargement du tableau de bord: $e');

      // Fallback en mode démo
      if (!AppConfig.isDemoMode && AppConfig.enableOfflineMode) {
        print('🔄 Fallback en mode démo pour le tableau de bord');
        _stats = await _demoService.getDashboardStats();
        _notifications = await _demoService.getNotifications();
      }
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Marquer une notification comme lue
  Future<void> markNotificationAsRead(int notificationId) async {
    try {
      if (AppConfig.isDemoMode) {
        // Simuler la mise à jour
        _notifications = _notifications.map((notification) {
          if (notification['id'] == notificationId) {
            return {...notification, 'isRead': true};
          }
          return notification;
        }).toList();
        notifyListeners();
      } else {
        await _apiService
            .patch('/notifications/$notificationId/', data: {'is_read': true});
        // Recharger les notifications
        await loadDashboardStats();
      }
    } catch (e) {
      print('Erreur lors de la mise à jour de la notification: $e');
    }
  }

  // Stream des notifications en temps réel
  Stream<Map<String, dynamic>> get realTimeNotifications {
    if (AppConfig.isDemoMode) {
      return _demoService.getRealTimeNotifications();
    } else {
      // TODO: Implémenter WebSocket pour les notifications temps réel
      return const Stream.empty();
    }
  }
}
