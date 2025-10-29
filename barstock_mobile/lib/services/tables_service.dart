import 'dart:async';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class TablesService extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Map<String, dynamic>> _tables = [];
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get tables => _tables;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Charger toutes les tables
  Future<void> loadTables() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/sales/tables/');
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? [];
        _tables = List<Map<String, dynamic>>.from(
          results.map((table) => {
            'id': table['id'],
            'number': table['number'],
            'capacity': table['capacity'] ?? 4,
            'status': table['status'] ?? 'available',
            'location': table['location'] ?? '',
            'is_active': table['is_active'] ?? true,
            'server': table['server'],
            'customer': table['customer'],
            'occupied_since': table['occupied_since'],
            'notes': table['notes'],
          })
        );
        print('🪑 Tables chargées: ${_tables.length}');
      }
    } catch (e) {
      print('❌ Erreur lors du chargement des tables: $e');
      _error = 'Erreur de chargement des tables';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Mettre à jour le statut d'une table
  Future<bool> updateTableStatus(int tableId, String status, {String? customer, String? server}) async {
    try {
      final data = <String, dynamic>{
        'status': status,
      };
      
      if (customer != null) data['customer'] = customer;
      if (server != null) data['server'] = server;

      final response = await _apiService.patch('/sales/tables/$tableId/', data: data);
      if (response.statusCode == 200) {
        await loadTables();
        return true;
      }
    } catch (e) {
      print('❌ Erreur lors de la mise à jour de la table: $e');
    }
    return false;
  }

  // Occuper une table
  Future<bool> occupyTable(int tableId, {String? customer, String? server}) async {
    return await updateTableStatus(tableId, 'occupied', customer: customer, server: server);
  }

  // Libérer une table
  Future<bool> freeTable(int tableId) async {
    return await updateTableStatus(tableId, 'available');
  }

  // Mettre une table en nettoyage
  Future<bool> startCleaningTable(int tableId) async {
    return await updateTableStatus(tableId, 'cleaning');
  }

  // Terminer le nettoyage d'une table
  Future<bool> finishCleaningTable(int tableId) async {
    return await updateTableStatus(tableId, 'available');
  }

  // Obtenir les tables par statut
  List<Map<String, dynamic>> getTablesByStatus(String status) {
    return _tables.where((table) => table['status'] == status).toList();
  }

  // Statistiques des tables
  Map<String, int> get tableStats {
    return {
      'total': _tables.length,
      'available': _tables.where((t) => t['status'] == 'available').length,
      'occupied': _tables.where((t) => t['status'] == 'occupied').length,
      'reserved': _tables.where((t) => t['status'] == 'reserved').length,
      'cleaning': _tables.where((t) => t['status'] == 'cleaning').length,
    };
  }

  // Obtenir une table par numéro
  Map<String, dynamic>? getTableByNumber(String number) {
    try {
      return _tables.firstWhere((table) => table['number'] == number);
    } catch (e) {
      return null;
    }
  }

  // Vérifier la disponibilité d'une table
  bool isTableAvailable(int tableId) {
    try {
      final table = _tables.firstWhere((t) => t['id'] == tableId);
      return table['status'] == 'available' && table['is_active'] == true;
    } catch (e) {
      return false;
    }
  }
}
