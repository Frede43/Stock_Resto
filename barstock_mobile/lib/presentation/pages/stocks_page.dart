import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class StocksPage extends StatefulWidget {
  const StocksPage({super.key});

  @override
  State<StocksPage> createState() => _StocksPageState();
}

class _StocksPageState extends State<StocksPage> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  
  late TabController _tabController;
  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _movements = [];
  List<Map<String, dynamic>> _lowStockProducts = [];
  bool _isLoading = false;
  String _searchQuery = '';
  String _selectedCategory = 'all';
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      await Future.wait([
        _loadProducts(),
        _loadMovements(),
        _loadLowStockProducts(),
      ]);
    } catch (e) {
      print('❌ Erreur chargement données: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loadProducts() async {
    try {
      final response = await _apiService.get('/products/');
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        setState(() {
          _products = List<Map<String, dynamic>>.from(results);
        });
      }
    } catch (e) {
      print('❌ Erreur chargement produits: $e');
    }
  }

  Future<void> _loadMovements() async {
    try {
      final response = await _apiService.get('/inventory/movements/');
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        setState(() {
          _movements = List<Map<String, dynamic>>.from(results);
        });
      }
    } catch (e) {
      print('❌ Erreur chargement mouvements: $e');
    }
  }

  Future<void> _loadLowStockProducts() async {
    try {
      final response = await _apiService.get('/products/', params: {'low_stock': 'true'});
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        setState(() {
          _lowStockProducts = List<Map<String, dynamic>>.from(results);
        });
      }
    } catch (e) {
      print('❌ Erreur chargement stock bas: $e');
    }
  }

  Future<void> _showStockAdjustmentDialog(Map<String, dynamic> product) async {
    final quantityController = TextEditingController();
    final reasonController = TextEditingController();
    String movementType = 'in'; // in, out, adjustment
    
    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text('Ajuster Stock - ${product['name']}'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Stock actuel: ${product['current_stock']}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 20),
                
                // Type de mouvement
                SegmentedButton<String>(
                  segments: const [
                    ButtonSegment(
                      value: 'in',
                      label: Text('Entrée'),
                      icon: Icon(Icons.add_circle),
                    ),
                    ButtonSegment(
                      value: 'out',
                      label: Text('Sortie'),
                      icon: Icon(Icons.remove_circle),
                    ),
                    ButtonSegment(
                      value: 'adjustment',
                      label: Text('Ajustement'),
                      icon: Icon(Icons.tune),
                    ),
                  ],
                  selected: {movementType},
                  onSelectionChanged: (Set<String> newSelection) {
                    setState(() {
                      movementType = newSelection.first;
                    });
                  },
                ),
                const SizedBox(height: 20),
                
                // Quantité
                TextField(
                  controller: quantityController,
                  decoration: const InputDecoration(
                    labelText: 'Quantité',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.numbers),
                  ),
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),
                
                // Raison
                TextField(
                  controller: reasonController,
                  decoration: const InputDecoration(
                    labelText: 'Raison',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.note),
                  ),
                  maxLines: 2,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () async {
                final quantity = int.tryParse(quantityController.text);
                if (quantity == null || quantity <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Quantité invalide')),
                  );
                  return;
                }
                
                Navigator.pop(context);
                await _createStockMovement(
                  product,
                  quantity,
                  movementType,
                  reasonController.text,
                );
              },
              child: const Text('Confirmer'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _createStockMovement(
    Map<String, dynamic> product,
    int quantity,
    String movementType,
    String? reason,  // ✅ Peut être null
  ) async {
    try {
      // Mapper le type de mouvement vers une raison valide
      String validReason = reason ?? '';  // ✅ Gérer null
      if (validReason.isEmpty) {
        // Utiliser une raison par défaut selon le type de mouvement
        switch (movementType) {
          case 'in':
            validReason = 'purchase'; // Achat
            break;
          case 'out':
            validReason = 'sale'; // Vente
            break;
          case 'adjustment':
            validReason = 'correction'; // Correction
            break;
          default:
            validReason = 'inventory'; // Inventaire par défaut
        }
      }
      
      final movementData = {
        'product': product['id'],
        'quantity': quantity,
        'movement_type': movementType,
        'reason': validReason,
        'notes': '', // Champ optionnel
      };
      
      print('📦 Création mouvement de stock:');
      print('   - Produit: ${product['name']} (ID: ${product['id']})');
      print('   - Quantité: $quantity');
      print('   - Type: $movementType');
      print('   - Raison: $reason');
      print('   - Données envoyées: $movementData');
      
      final response = await _apiService.post(
        '/inventory/movements/',
        data: movementData,
      );
      
      print('✅ Réponse: ${response.statusCode}');
      print('   Données: ${response.data}');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('✅ Mouvement de stock enregistré'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
        _loadData();
      }
    } catch (e) {
      print('❌ Erreur création mouvement: $e');
      
      // Extraire les détails de l'erreur Dio
      String errorMessage = 'Erreur inconnue';
      if (e.toString().contains('DioException')) {
        try {
          final dioError = e as dynamic;
          if (dioError.response != null) {
            print('📍 Status: ${dioError.response?.statusCode}');
            print('📍 Response data: ${dioError.response?.data}');
            
            // Extraire le message d'erreur du backend
            final responseData = dioError.response?.data;
            if (responseData is Map) {
              // Chercher les erreurs de validation
              final errors = <String>[];
              responseData.forEach((key, value) {
                if (value is List) {
                  errors.add('$key: ${value.join(", ")}');
                } else {
                  errors.add('$key: $value');
                }
              });
              errorMessage = errors.join('\n');
            } else {
              errorMessage = responseData.toString();
            }
          }
        } catch (parseError) {
          print('⚠️ Erreur lors du parsing: $parseError');
        }
      }
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Erreur: $errorMessage'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 6),
          ),
        );
      }
    }
  }

  List<Map<String, dynamic>> get _filteredProducts {
    return _products.where((product) {
      final matchesSearch = _searchQuery.isEmpty ||
          (product['name'] ?? '').toLowerCase().contains(_searchQuery.toLowerCase());
      
      final matchesCategory = _selectedCategory == 'all' ||
          product['category'].toString() == _selectedCategory;
      
      return matchesSearch && matchesCategory;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Gestion des Stocks'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.inventory), text: 'Vue d\'ensemble'),
            Tab(icon: Icon(Icons.swap_horiz), text: 'Mouvements'),
            Tab(icon: Icon(Icons.warning), text: 'Alertes'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildOverviewTab(),
          _buildMovementsTab(),
          _buildAlertsTab(),
        ],
      ),
    );
  }

  Widget _buildOverviewTab() {
    final filteredProducts = _filteredProducts;
    final totalValue = filteredProducts.fold<double>(
      0.0,
      (sum, product) {
        final stock = product['current_stock'] ?? 0;
        final priceValue = product['purchase_price'];
        // Convertir le prix en double (peut être String ou num)
        final price = priceValue is num 
            ? priceValue.toDouble() 
            : (priceValue is String ? double.tryParse(priceValue) ?? 0.0 : 0.0);
        return sum + (stock * price);
      },
    );
    
    return Column(
      children: [
        // Barre de recherche
        Padding(
          padding: const EdgeInsets.all(16),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Rechercher un produit...',
              prefixIcon: const Icon(Icons.search),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              filled: true,
              fillColor: Colors.grey[100],
            ),
            onChanged: (value) {
              setState(() => _searchQuery = value);
            },
          ),
        ),
        
        // Statistiques
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.blue[400]!, Colors.blue[600]!],
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildStatItem(
                'Produits',
                filteredProducts.length.toString(),
                Icons.inventory,
              ),
              Container(width: 1, height: 40, color: Colors.white30),
              _buildStatItem(
                'Valeur Stock',
                '${NumberFormat('#,##0').format(totalValue)} BIF',
                Icons.attach_money,
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Liste des produits
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : filteredProducts.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            'Aucun produit trouvé',
                            style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                          ),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: _loadData,
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filteredProducts.length,
                        itemBuilder: (context, index) {
                          final product = filteredProducts[index];
                          final stock = product['current_stock'] ?? 0;
                          final minStock = product['minimum_stock'] ?? 10;
                          final isLowStock = stock < minStock;
                          
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ListTile(
                              leading: Container(
                                width: 50,
                                height: 50,
                                decoration: BoxDecoration(
                                  color: isLowStock ? Colors.red[100] : Colors.blue[100],
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Icon(
                                  Icons.inventory,
                                  color: isLowStock ? Colors.red : Colors.blue,
                                ),
                              ),
                              title: Text(
                                product['name'] ?? '',
                                style: const TextStyle(fontWeight: FontWeight.bold),
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Icon(
                                        Icons.inventory,
                                        size: 14,
                                        color: isLowStock ? Colors.red : Colors.grey,
                                      ),
                                      const SizedBox(width: 4),
                                      Text(
                                        'Stock: $stock ${product['unit'] ?? ''}',
                                        style: TextStyle(
                                          color: isLowStock ? Colors.red : Colors.grey,
                                          fontWeight: isLowStock ? FontWeight.bold : FontWeight.normal,
                                        ),
                                      ),
                                    ],
                                  ),
                                  if (isLowStock)
                                    Text(
                                      'Minimum: $minStock',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.red,
                                      ),
                                    ),
                                ],
                              ),
                              trailing: IconButton(
                                icon: const Icon(Icons.edit),
                                onPressed: () => _showStockAdjustmentDialog(product),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildMovementsTab() {
    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _movements.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.swap_horiz, size: 64, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text(
                      'Aucun mouvement enregistré',
                      style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                    ),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: _loadData,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _movements.length,
                  itemBuilder: (context, index) {
                    final movement = _movements[index];
                    final movementType = movement['movement_type'] ?? 'adjustment';
                    final quantity = movement['quantity'] ?? 0;
                    
                    IconData icon;
                    Color color;
                    String label;
                    
                    switch (movementType) {
                      case 'in':
                        icon = Icons.add_circle;
                        color = Colors.green;
                        label = 'Entrée';
                        break;
                      case 'out':
                        icon = Icons.remove_circle;
                        color = Colors.red;
                        label = 'Sortie';
                        break;
                      default:
                        icon = Icons.tune;
                        color = Colors.orange;
                        label = 'Ajustement';
                    }
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: color.withOpacity(0.2),
                          child: Icon(icon, color: color),
                        ),
                        title: Text(movement['product_name'] ?? 'Produit'),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text('$label: $quantity ${movement['unit'] ?? ''}'),
                            Text(
                              movement['reason'] ?? 'Aucune raison',
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                            ),
                            Text(
                              DateFormat('dd/MM/yyyy HH:mm').format(
                                DateTime.parse(movement['created_at']),
                              ),
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                            ),
                          ],
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text(
                              'Stock: ${movement['stock_after'] ?? 0}',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            Text(
                              'Avant: ${movement['stock_before'] ?? 0}',
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              );
  }

  Widget _buildAlertsTab() {
    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _lowStockProducts.isEmpty
            ? Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.check_circle, size: 64, color: Colors.green[400]),
                    const SizedBox(height: 16),
                    Text(
                      'Aucune alerte de stock',
                      style: TextStyle(fontSize: 18, color: Colors.grey[600]),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Tous les produits ont un stock suffisant',
                      style: TextStyle(fontSize: 14, color: Colors.grey[500]),
                    ),
                  ],
                ),
              )
            : RefreshIndicator(
                onRefresh: _loadData,
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _lowStockProducts.length,
                  itemBuilder: (context, index) {
                    final product = _lowStockProducts[index];
                    final stock = product['current_stock'] ?? 0;
                    final minStock = product['minimum_stock'] ?? 10;
                    final deficit = minStock - stock;
                    
                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      color: Colors.red[50],
                      child: ListTile(
                        leading: Container(
                          width: 50,
                          height: 50,
                          decoration: BoxDecoration(
                            color: Colors.red[100],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.warning, color: Colors.red),
                        ),
                        title: Text(
                          product['name'] ?? '',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        subtitle: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const SizedBox(height: 4),
                            Text(
                              'Stock actuel: $stock ${product['unit'] ?? ''}',
                              style: const TextStyle(color: Colors.red),
                            ),
                            Text(
                              'Stock minimum: $minStock',
                              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                            ),
                            Text(
                              'Déficit: $deficit ${product['unit'] ?? ''}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: Colors.red,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        trailing: ElevatedButton(
                          onPressed: () => _showStockAdjustmentDialog(product),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.red,
                            foregroundColor: Colors.white,
                          ),
                          child: const Text('Réapprovisionner'),
                        ),
                      ),
                    );
                  },
                ),
              );
  }

  Widget _buildStatItem(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 32),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: Colors.white70,
            fontSize: 12,
          ),
        ),
      ],
    );
  }
}
