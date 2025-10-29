import 'dart:async';
import 'package:flutter/foundation.dart';
import 'api_service.dart';

class ProductsService extends ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _categories = [];
  bool _isLoading = false;
  String? _error;

  List<Map<String, dynamic>> get products => _products;
  List<Map<String, dynamic>> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Charger tous les produits
  Future<void> loadProducts({String? category}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      String endpoint = '/products/products/';
      if (category != null && category.isNotEmpty) {
        endpoint += '?category=$category';
      }

      final response = await _apiService.get(endpoint);
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? [];
        _products = List<Map<String, dynamic>>.from(
          results.map((product) => {
            'id': product['id'],
            'name': product['name'],
            'description': product['description'] ?? '',
            'selling_price': product['selling_price'] ?? 0.0,
            'purchase_price': product['purchase_price'] ?? 0.0,
            'current_stock': product['current_stock'] ?? 0,
            'min_stock': product['min_stock'] ?? 0,
            'category': product['category']?['name'] ?? 'Non classé',
            'category_id': product['category']?['id'],
            'is_available': product['is_available'] ?? true,
            'image': product['image'],
          })
        );
        print('📦 Produits chargés: ${_products.length}');
      }
    } catch (e) {
      print('❌ Erreur lors du chargement des produits: $e');
      _error = 'Erreur de chargement des produits';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Charger les catégories
  Future<void> loadCategories() async {
    try {
      final response = await _apiService.get('/products/categories/');
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? [];
        _categories = List<Map<String, dynamic>>.from(
          results.map((category) => {
            'id': category['id'],
            'name': category['name'],
            'description': category['description'] ?? '',
            'product_count': category['product_count'] ?? 0,
          })
        );
        print('🏷️ Catégories chargées: ${_categories.length}');
        notifyListeners();
      }
    } catch (e) {
      print('❌ Erreur lors du chargement des catégories: $e');
    }
  }

  // Rechercher des produits
  Future<void> searchProducts(String query) async {
    if (query.isEmpty) {
      await loadProducts();
      return;
    }

    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.get('/products/products/?search=$query');
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? [];
        _products = List<Map<String, dynamic>>.from(
          results.map((product) => {
            'id': product['id'],
            'name': product['name'],
            'description': product['description'] ?? '',
            'selling_price': product['selling_price'] ?? 0.0,
            'current_stock': product['current_stock'] ?? 0,
            'category': product['category']?['name'] ?? 'Non classé',
            'is_available': product['is_available'] ?? true,
          })
        );
      }
    } catch (e) {
      print('❌ Erreur lors de la recherche: $e');
      _error = 'Erreur de recherche';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Obtenir un produit par ID
  Future<Map<String, dynamic>?> getProductById(int id) async {
    try {
      final response = await _apiService.get('/products/products/$id/');
      if (response.statusCode == 200) {
        return response.data;
      }
    } catch (e) {
      print('❌ Erreur lors de la récupération du produit: $e');
    }
    return null;
  }

  // Filtrer les produits par disponibilité
  List<Map<String, dynamic>> get availableProducts {
    return _products.where((product) => product['is_available'] == true).toList();
  }

  // Filtrer les produits en rupture de stock
  List<Map<String, dynamic>> get outOfStockProducts {
    return _products.where((product) {
      final currentStock = product['current_stock'] ?? 0;
      final minStock = product['min_stock'] ?? 0;
      return currentStock <= minStock;
    }).toList();
  }
}
