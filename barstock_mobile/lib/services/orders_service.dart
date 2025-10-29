import 'dart:async';
import 'package:flutter/foundation.dart';
import 'api_service.dart';
import 'demo_service.dart';
import '../core/config/app_config.dart';
import '../core/constants/api_constants.dart';
import '../data/models/order_model.dart';

class OrdersService extends ChangeNotifier {
  final ApiService _apiService = ApiService();
  final DemoService _demoService = DemoService();

  List<OrderModel> _orders = [];
  bool _isLoading = false;
  String _filterStatus = 'all';

  List<OrderModel> get orders => _orders;
  bool get isLoading => _isLoading;
  String get filterStatus => _filterStatus;

  // Obtenir les commandes filtrées
  List<OrderModel> get filteredOrders {
    if (_filterStatus == 'all') return _orders;
    return _orders.where((order) => order.status == _filterStatus).toList();
  }

  // Charger toutes les commandes
  Future<void> loadOrders() async {
    print('🚀 ========== DÉBUT loadOrders() ==========');
    print('📍 isDemoMode: ${AppConfig.isDemoMode}');
    print('📍 enableOfflineMode: ${AppConfig.enableOfflineMode}');
    
    _isLoading = true;
    notifyListeners();

    try {
      if (AppConfig.isDemoMode) {
        print('🎭 Mode démo activé - Chargement données fictives');
        _orders = await _demoService.getOrders();
      } else {
        print('🌐 Mode API RÉEL activé');
        print('📦 Chargement des commandes depuis le backend...');
        print('🔗 URL: ${ApiConstants.baseUrl}/sales/orders/');
        
        // ✅ Utilise le endpoint dédié aux commandes en cours
        final response = await _apiService.get('/sales/orders/');
        print('📡 Status code: ${response.statusCode}');
        print('📦 Type de données: ${response.data.runtimeType}');
        
        if (response.statusCode == 200) {
          // Le backend peut retourner soit un objet avec 'results', soit directement une liste
          final data = response.data;
          final results = data is Map ? (data['results'] ?? data['data'] ?? []) : (data is List ? data : []);
          
          print('📦 ${results.length} commandes reçues du backend');
          print('📦 Données: $results');
          
          if (results.isEmpty) {
            print('⚠️ Aucune commande en cours (statuts: pending, preparing, ready)');
          }
          
          _orders = (results as List).map((sale) {
            print('   ✓ Commande #${sale['id']}: ${sale['status']} - Table ${sale['table']?['number'] ?? 'N/A'}');
            return OrderModel(
              id: sale['id'],
              orderNumber: sale['reference'] ?? sale['sale_number'] ?? 'N/A',
              tableNumber: sale['table']?['number']?.toString() ?? 'N/A',
              status: _mapSaleStatusToOrderStatus(sale['status']),
              total: _parseDouble(sale['total_amount'] ?? sale['final_amount']),
              createdAt: DateTime.parse(sale['created_at'] ?? DateTime.now().toIso8601String()),
              items: (sale['items'] ?? []).map<OrderItemModel>((item) {
                return OrderItemModel(
                  id: item['id'],
                  productName: item['product']?['name'] ?? item['product_name'] ?? 'Produit',
                  quantity: item['quantity'] ?? 1,
                  price: _parseDouble(item['total_price'] ?? item['subtotal']),
                );
              }).toList(),
              notes: sale['notes'],
            );
          }).toList();
          
          print('✅ ${_orders.length} commandes chargées avec succès depuis l\'API');
        } else {
          print('❌ Erreur HTTP: ${response.statusCode}');
          print('❌ Message: ${response.data}');
          throw Exception('Erreur HTTP ${response.statusCode}');
        }
      }
    } catch (e, stackTrace) {
      print('💥 EXCEPTION dans loadOrders():');
      print('❌ Erreur: $e');
      print('📍 Stack trace: $stackTrace');

      // Fallback en mode démo UNIQUEMENT si activé
      if (!AppConfig.isDemoMode && AppConfig.enableOfflineMode) {
        print('🔄 Fallback en mode démo pour les commandes');
        _orders = await _demoService.getOrders();
      } else {
        print('❌ Pas de fallback - Mode offline désactivé');
        _orders = []; // Liste vide en cas d'erreur
      }
    } finally {
      _isLoading = false;
      notifyListeners();
      print('🏁 ========== FIN loadOrders() - Total: ${_orders.length} ==========\n');
    }
  }

  // Mettre à jour le statut d'une commande
  Future<bool> updateOrderStatus(int orderId, String status) async {
    try {
      if (AppConfig.isDemoMode) {
        // Simuler la mise à jour
        final success = await _demoService.updateOrderStatus(orderId, status);
        if (success) {
          // Mettre à jour localement
          _orders = _orders.map((order) {
            if (order.id == orderId) {
              return OrderModel(
                id: order.id,
                orderNumber: order.orderNumber,
                tableNumber: order.tableNumber,
                status: status,
                total: order.total,
                createdAt: order.createdAt,
                items: order.items,
                notes: order.notes,
              );
            }
            return order;
          }).toList();
          notifyListeners();
        }
        return success;
      } else {
        // Mapper le statut de commande vers le statut de vente Django
        final saleStatus = _mapOrderStatusToSaleStatus(status);
        final response = await _apiService
            .patch('/sales/$orderId/', data: {'status': saleStatus});
        if (response.statusCode == 200) {
          // Recharger les commandes
          await loadOrders();
          return true;
        }
      }
    } catch (e) {
      print('Erreur lors de la mise à jour du statut: $e');
    }
    return false;
  }

  // ✅ NOUVEAU: Commencer la préparation d'une commande
  Future<bool> startPreparation(int orderId) async {
    try {
      if (AppConfig.isDemoMode) {
        return await updateOrderStatus(orderId, 'preparing');
      } else {
        print('🔥 Démarrage préparation commande #$orderId');
        
        // Utilise l'action dédiée
        final response = await _apiService.patch('/sales/orders/$orderId/start_preparation/');
        
        if (response.statusCode == 200) {
          print('✅ Préparation commencée');
          await loadOrders(); // Recharger la liste
          return true;
        } else {
          print('❌ Erreur: ${response.statusCode}');
          print('Message: ${response.data}');
        }
      }
    } catch (e) {
      print('❌ Erreur lors du démarrage de la préparation: $e');
    }
    return false;
  }

  // ✅ NOUVEAU: Marquer une commande comme prête
  Future<bool> markAsReady(int orderId) async {
    try {
      if (AppConfig.isDemoMode) {
        return await updateOrderStatus(orderId, 'ready');
      } else {
        print('✅ Marquage commande #$orderId comme prête');
        
        // Utilise l'action dédiée
        final response = await _apiService.patch('/sales/orders/$orderId/mark_ready/');
        
        if (response.statusCode == 200) {
          final data = response.data;
          final prepTime = data['preparation_time_minutes'] ?? 0;
          print('✅ Commande prête (préparée en $prepTime min)');
          await loadOrders(); // Recharger la liste
          return true;
        } else {
          print('❌ Erreur: ${response.statusCode}');
          print('Message: ${response.data}');
        }
      }
    } catch (e) {
      print('❌ Erreur lors du marquage comme prête: $e');
    }
    return false;
  }

  // ✅ NOUVEAU: Annuler une commande
  Future<bool> cancelOrder(int orderId, String reason) async {
    try {
      if (AppConfig.isDemoMode) {
        return await updateOrderStatus(orderId, 'cancelled');
      } else {
        print('❌ Annulation commande #$orderId: $reason');
        
        // Utilise l'action dédiée
        final response = await _apiService.patch(
          '/sales/orders/$orderId/cancel/',
          data: {'reason': reason}
        );
        
        if (response.statusCode == 200) {
          print('✅ Commande annulée');
          await loadOrders(); // Recharger la liste
          return true;
        } else {
          print('❌ Erreur: ${response.statusCode}');
        }
      }
    } catch (e) {
      print('❌ Erreur lors de l\'annulation: $e');
    }
    return false;
  }

  // Créer une nouvelle commande
  Future<bool> createOrder(OrderModel order) async {
    try {
      if (AppConfig.isDemoMode) {
        // Simuler la création
        _orders.add(order);
        notifyListeners();
        return true;
      } else {
        // Créer une vente au lieu d'une commande
        final saleData = {
          'table': order.tableNumber,
          'status': 'pending',
          'payment_method': 'cash',
          'items': order.items.map((item) => {
            'product': item.id,
            'quantity': item.quantity,
            'unit_price': item.price,
          }).toList(),
          'notes': order.notes,
        };
        final response = await _apiService.post('/sales/', data: saleData);
        if (response.statusCode == 201) {
          await loadOrders();
          return true;
        }
      }
    } catch (e) {
      print('Erreur lors de la création de la commande: $e');
    }
    return false;
  }

  // Changer le filtre de statut
  void setFilterStatus(String status) {
    _filterStatus = status;
    notifyListeners();
  }

  // Obtenir les statistiques des commandes
  Map<String, int> get orderStats {
    return {
      'total': _orders.length,
      'pending': _orders.where((o) => o.status == 'pending').length,
      'preparing': _orders.where((o) => o.status == 'preparing').length,
      'ready': _orders.where((o) => o.status == 'ready').length,
      'completed': _orders.where((o) => o.status == 'completed').length,
    };
  }

  // Mapper le statut de vente Django vers le statut de commande mobile
  String _mapSaleStatusToOrderStatus(String saleStatus) {
    switch (saleStatus) {
      case 'pending':
        return 'pending';
      case 'preparing':
        return 'preparing';
      case 'ready':
      case 'served':
        return 'ready';
      case 'paid':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  // Mapper le statut de commande mobile vers le statut de vente Django
  String _mapOrderStatusToSaleStatus(String orderStatus) {
    switch (orderStatus) {
      case 'pending':
        return 'pending';
      case 'preparing':
        return 'preparing';
      case 'ready':
        return 'ready';
      case 'completed':
        return 'served';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  // ✅ NOUVEAU: Parser un montant qui peut être string ou number
  double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      try {
        return double.parse(value);
      } catch (e) {
        print('⚠️ Erreur parsing montant: $value -> $e');
        return 0.0;
      }
    }
    return 0.0;
  }
}
