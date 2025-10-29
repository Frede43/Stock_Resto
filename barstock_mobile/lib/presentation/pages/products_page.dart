import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../widgets/product_form_dialog.dart';

class ProductsPage extends StatefulWidget {
  const ProductsPage({super.key});

  @override
  _ProductsPageState createState() => _ProductsPageState();
}

class _ProductsPageState extends State<ProductsPage> {
  final ApiService _apiService = ApiService();
  
  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _filteredProducts = [];
  bool _isLoading = false;
  String _searchQuery = '';
  String _filterStatus = 'all'; // all, active, low_stock

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    
    try {
      final response = await _apiService.get('/products/');
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        setState(() {
          _products = List<Map<String, dynamic>>.from(results);
          _applyFilters();
        });
      }
    } catch (e) {
      print('Erreur chargement produits: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredProducts = _products.where((product) {
        // Filtre par recherche
        final matchesSearch = _searchQuery.isEmpty ||
            (product['name'] ?? '').toLowerCase().contains(_searchQuery.toLowerCase());
        
        // Filtre par statut
        bool matchesStatus = true;
        if (_filterStatus == 'active') {
          matchesStatus = product['is_active'] == true;
        } else if (_filterStatus == 'low_stock') {
          final stock = product['current_stock'] ?? 0;
          final minStock = product['minimum_stock'] ?? 10;
          matchesStatus = stock < minStock;
        }
        
        return matchesSearch && matchesStatus;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Produits'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadProducts,
          ),
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: _showProductForm,
          ),
        ],
      ),
      body: Column(
        children: [
          // Barre de recherche et filtres
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'Rechercher un produit...',
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  onChanged: (value) {
                    setState(() => _searchQuery = value);
                    _applyFilters();
                  },
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      _buildFilterChip('Tous', 'all', Icons.inventory),
                      const SizedBox(width: 8),
                      _buildFilterChip('Actifs', 'active', Icons.check_circle),
                      const SizedBox(width: 8),
                      _buildFilterChip('Stock bas', 'low_stock', Icons.warning),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          // Statistiques rapides
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildQuickStat(
                  'Total',
                  _products.length.toString(),
                  Colors.blue,
                ),
                _buildQuickStat(
                  'Actifs',
                  _products.where((p) => p['is_active'] == true).length.toString(),
                  Colors.green,
                ),
                _buildQuickStat(
                  'Stock bas',
                  _products.where((p) {
                    final stock = p['current_stock'] ?? 0;
                    final minStock = p['minimum_stock'] ?? 10;
                    return stock < minStock;
                  }).length.toString(),
                  Colors.red,
                ),
              ],
            ),
          ),
          
          // Liste des produits
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredProducts.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.inventory_2_outlined,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Aucun produit trouvé',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _filteredProducts.length,
                        itemBuilder: (context, index) {
                          return _buildProductCard(_filteredProducts[index]);
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, IconData icon) {
    final isSelected = _filterStatus == value;
    
    return FilterChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16),
          const SizedBox(width: 4),
          Text(label),
        ],
      ),
      selected: isSelected,
      onSelected: (selected) {
        setState(() => _filterStatus = value);
        _applyFilters();
      },
      selectedColor: Colors.blue.withValues(alpha: 0.2),
    );
  }

  Widget _buildQuickStat(String label, String value, Color color) {
    return Column(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(25),
          ),
          child: Center(
            child: Text(
              value,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Colors.grey,
          ),
        ),
      ],
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product) {
    final stock = product['current_stock'] ?? 0;
    final minStock = product['minimum_stock'] ?? 10;
    final isLowStock = stock < minStock;
    final isActive = product['is_active'] == true;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: Colors.blue[100],
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.restaurant, color: Colors.blue, size: 32),
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
              '${_formatNumber(product['selling_price'])} BIF',
              style: const TextStyle(
                color: Colors.green,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
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
                  'Stock: $stock',
                  style: TextStyle(
                    fontSize: 12,
                    color: isLowStock ? Colors.red : Colors.grey,
                  ),
                ),
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: isActive
                        ? Colors.green.withValues(alpha: 0.1)
                        : Colors.grey.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    isActive ? 'Actif' : 'Inactif',
                    style: TextStyle(
                      fontSize: 10,
                      color: isActive ? Colors.green : Colors.grey,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: PopupMenuButton(
          itemBuilder: (context) => [
            const PopupMenuItem(
              value: 'edit',
              child: Row(
                children: [
                  Icon(Icons.edit, size: 20),
                  SizedBox(width: 8),
                  Text('Modifier'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'stock',
              child: Row(
                children: [
                  Icon(Icons.add_box, size: 20),
                  SizedBox(width: 8),
                  Text('Ajuster stock'),
                ],
              ),
            ),
            const PopupMenuItem(
              value: 'delete',
              child: Row(
                children: [
                  Icon(Icons.delete, size: 20, color: Colors.red),
                  SizedBox(width: 8),
                  Text('Supprimer', style: TextStyle(color: Colors.red)),
                ],
              ),
            ),
          ],
          onSelected: (value) {
            switch (value) {
              case 'edit':
                _showProductForm(product: product);
                break;
              case 'stock':
                _showStockAdjustment(product);
                break;
              case 'delete':
                _confirmDelete(product);
                break;
            }
          },
        ),
      ),
    );
  }

  String _formatNumber(dynamic number) {
    if (number == null) return '0';
    
    try {
      final num value = number is String ? double.parse(number) : number;
      return value.toStringAsFixed(0).replaceAllMapped(
        RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
        (Match m) => '${m[1]}',
      );
    } catch (e) {
      return '0';
    }
  }

  Future<void> _showProductForm({Map<String, dynamic>? product}) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => ProductFormDialog(product: product),
    );
    
    if (result == true) {
      _loadProducts();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              product == null ? 'Produit créé avec succès' : 'Produit modifié avec succès',
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  Future<void> _showStockAdjustment(Map<String, dynamic> product) async {
    final controller = TextEditingController();
    String adjustmentType = 'add'; // add or remove
    
    await showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text('Ajuster le stock - ${product['name']}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Stock actuel: ${product['current_stock']}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(
                    value: 'add',
                    label: Text('Ajouter'),
                    icon: Icon(Icons.add),
                  ),
                  ButtonSegment(
                    value: 'remove',
                    label: Text('Retirer'),
                    icon: Icon(Icons.remove),
                  ),
                ],
                selected: {adjustmentType},
                onSelectionChanged: (Set<String> newSelection) {
                  setState(() {
                    adjustmentType = newSelection.first;
                  });
                },
              ),
              const SizedBox(height: 20),
              TextField(
                controller: controller,
                decoration: const InputDecoration(
                  labelText: 'Quantité',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.number,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () async {
                final quantity = int.tryParse(controller.text);
                if (quantity == null || quantity <= 0) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Quantité invalide')),
                  );
                  return;
                }
                
                Navigator.pop(context);
                await _adjustStock(product, quantity, adjustmentType);
              },
              child: const Text('Confirmer'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _adjustStock(Map<String, dynamic> product, int quantity, String type) async {
    try {
      final currentStock = product['current_stock'] ?? 0;
      final newStock = type == 'add' ? currentStock + quantity : currentStock - quantity;
      
      if (newStock < 0) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Le stock ne peut pas être négatif'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }
      
      final response = await _apiService.put(
        '/products/${product['id']}/',
        data: {'current_stock': newStock},
      );
      
      if (response.statusCode == 200) {
        _loadProducts();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Stock ajusté avec succès'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  Future<void> _confirmDelete(Map<String, dynamic> product) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirmer la suppression'),
        content: Text(
          'Êtes-vous sûr de vouloir supprimer "${product['name']}" ?\n\n'
          'Cette action est irréversible.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
    
    if (confirmed == true) {
      await _deleteProduct(product);
    }
  }

  Future<void> _deleteProduct(Map<String, dynamic> product) async {
    try {
      final response = await _apiService.delete('/products/${product['id']}/');
      
      if (response.statusCode == 204 || response.statusCode == 200) {
        _loadProducts();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Produit supprimé avec succès'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}
