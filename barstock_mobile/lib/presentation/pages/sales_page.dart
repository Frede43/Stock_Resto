import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/api_service.dart';

class SalesPage extends StatefulWidget {
  const SalesPage({super.key});

  @override
  _SalesPageState createState() => _SalesPageState();
}

class _SalesPageState extends State<SalesPage> {
  final ApiService _apiService = ApiService();
  
  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _tables = [];
  final List<Map<String, dynamic>> _cartItems = [];
  
  int? _selectedTableId;
  String _paymentMethod = 'cash';
  String _customerName = 'Client';
  String _notes = '';
  bool _isLoading = false;
  
  final TextEditingController _customerNameController = TextEditingController();
  final TextEditingController _notesController = TextEditingController();
  
  @override
  void dispose() {
    _customerNameController.dispose();
    _notesController.dispose();
    super.dispose();
  }
  
  double get _totalAmount {
    return _cartItems.fold(0.0, (sum, item) {
      // Convertir le prix en double de manière sécurisée
      final priceValue = item['price'];
      final price = priceValue is num 
          ? priceValue.toDouble() 
          : (priceValue is String ? double.tryParse(priceValue) ?? 0.0 : 0.0);
      final quantity = (item['quantity'] ?? 0).toInt();
      return sum + (price * quantity);
    });
  }

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    
    try {
      // Charger les produits
      final productsResponse = await _apiService.get('/products/?is_active=true');
      if (productsResponse.statusCode == 200) {
        final results = productsResponse.data['results'] ?? productsResponse.data ?? [];
        _products = List<Map<String, dynamic>>.from(results);
      }
      
      // Charger les tables
      final tablesResponse = await _apiService.get('/sales/tables/');
      if (tablesResponse.statusCode == 200) {
        final results = tablesResponse.data['results'] ?? tablesResponse.data ?? [];
        _tables = List<Map<String, dynamic>>.from(results);
      }
    } catch (e) {
      print('Erreur chargement données: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _addToCart(Map<String, dynamic> product) {
    setState(() {
      final existingIndex = _cartItems.indexWhere((item) => item['id'] == product['id']);
      
      // Convertir le prix en double de manière sécurisée
      final sellingPrice = product['selling_price'];
      final price = sellingPrice is num 
          ? sellingPrice.toDouble() 
          : (sellingPrice is String ? double.tryParse(sellingPrice) ?? 0.0 : 0.0);
      
      if (existingIndex >= 0) {
        _cartItems[existingIndex]['quantity'] = (_cartItems[existingIndex]['quantity'] ?? 0) + 1;
      } else {
        _cartItems.add({
          'id': product['id'],
          'name': product['name'],
          'price': price,
          'quantity': 1,
        });
      }
    });
  }

  void _removeFromCart(int index) {
    setState(() {
      if (_cartItems[index]['quantity'] > 1) {
        _cartItems[index]['quantity']--;
      } else {
        _cartItems.removeAt(index);
      }
    });
  }

  /// Mettre à jour les stocks des produits après une vente
  Future<void> _updateProductStocks() async {
    try {
      print('🔄 Mise à jour des stocks locaux...');
      
      // Pour chaque produit vendu, mettre à jour son stock dans la liste locale
      for (var cartItem in _cartItems) {
        final productId = cartItem['id'];
        final quantitySold = cartItem['quantity'];
        
        // Trouver le produit dans la liste
        final productIndex = _products.indexWhere((p) => p['id'] == productId);
        
        if (productIndex != -1) {
          final currentStock = _products[productIndex]['current_stock'] ?? 0;
          final newStock = currentStock - quantitySold;
          
          // Mettre à jour le stock local
          setState(() {
            _products[productIndex]['current_stock'] = newStock > 0 ? newStock : 0;
          });
          
          print('   ✅ Produit ${_products[productIndex]['name']}: $currentStock → $newStock');
        }
      }
      
      print('✅ Stocks locaux mis à jour');
    } catch (e) {
      print('⚠️ Erreur mise à jour stocks locaux: $e');
      // Ne pas bloquer la vente si la mise à jour locale échoue
    }
  }

  Future<void> _createSale() async {
    if (_cartItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Le panier est vide')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      // Préparer les données de vente (comme dans le frontend web React)
      final items = _cartItems.map((item) {
        return {
          'product': item['id'],        // Integer - ID du produit
          'quantity': item['quantity'], // Integer - Quantité
          'notes': item['name'] ?? '',  // String - Nom du produit (optionnel)
        };
      }).toList();
      
      final Map<String, dynamic> saleData = {
        'payment_method': _paymentMethod,
        'customer_name': _customerName.isEmpty ? 'Client' : _customerName,
        'items': items,
      };
      
      // Ajouter la table seulement si elle est sélectionnée
      if (_selectedTableId != null) {
        saleData['table'] = _selectedTableId!;
      }
      
      // Ajouter les notes si remplies
      if (_notes.isNotEmpty) {
        saleData['notes'] = _notes;
      }
      
      // Note: Le serveur sera automatiquement l'utilisateur connecté côté backend
      
      print('📦 Données de vente à envoyer:');
      print('   Payment method: $_paymentMethod');
      print('   Table: $_selectedTableId');
      print('   Items count: ${items.length}');
      print('   Items détaillés:');
      for (var item in items) {
        print('     - Product ID: ${item['product']} (${item['product'].runtimeType})');
        print('       Quantity: ${item['quantity']} (${item['quantity'].runtimeType})');
        print('       Notes: ${item['notes']} (${item['notes'].runtimeType})');
      }

      final response = await _apiService.post('/sales/', data: saleData);
      
      if (response.statusCode == 201) {
        print('✅ Vente créée avec succès!');
        print('   Réponse: ${response.data}');
        
        // Mettre à jour les stocks des produits vendus
        await _updateProductStocks();
        
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Vente créée avec succès - Stocks mis à jour'),
            backgroundColor: Colors.green,
          ),
        );
        
        setState(() {
          _cartItems.clear();
          _selectedTableId = null;
          _customerName = 'Client';
          _notes = '';
          _customerNameController.clear();
          _notesController.clear();
        });
      } else {
        print('❌ Erreur ${response.statusCode}');
        print('   Réponse: ${response.data}');
      }
    } catch (e) {
      print('❌ Exception lors de la création de vente: $e');
      
      String errorMessage = 'Erreur lors de la création de la vente';
      
      // Extraire le vrai message d'erreur du backend
      if (e.toString().contains('DioException')) {
        try {
          // Extraire le message d'erreur de la réponse
          final dio = e as dynamic;
          
          // Vérifier si on a une réponse du serveur
          if (dio.response != null && dio.response.data != null) {
            final responseData = dio.response.data;
            
            print('🔍 Réponse erreur backend: $responseData');
            
            // Cas 1: Message d'erreur direct
            if (responseData is Map && responseData.containsKey('error')) {
              errorMessage = responseData['error'].toString();
            }
            // Cas 2: Erreurs de validation par champ
            else if (responseData is Map && responseData.containsKey('items')) {
              errorMessage = responseData['items'].toString();
            }
            // Cas 3: Message général
            else if (responseData is Map && responseData.containsKey('message')) {
              errorMessage = responseData['message'].toString();
            }
            // Cas 4: Erreur non-field
            else if (responseData is Map && responseData.containsKey('non_field_errors')) {
              errorMessage = responseData['non_field_errors'][0].toString();
            }
            // Cas 5: Detail (format DRF standard)
            else if (responseData is Map && responseData.containsKey('detail')) {
              errorMessage = responseData['detail'].toString();
            }
            // Cas 6: Afficher toute la réponse si format inconnu
            else if (responseData is String) {
              errorMessage = responseData;
            }
          }
          // Pas de réponse du serveur (problème réseau)
          else {
            errorMessage = 'Erreur de connexion au serveur';
          }
        } catch (parseError) {
          print('⚠️ Erreur lors du parsing: $parseError');
          errorMessage = 'Erreur de communication avec le serveur';
        }
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          duration: const Duration(seconds: 5),
        ),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Nouvelle Vente'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Row(
              children: [
                // Liste des produits (gauche)
                Expanded(
                  flex: 2,
                  child: Column(
                    children: [
                      // Barre de recherche
                      Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: 'Rechercher un produit...',
                            prefixIcon: const Icon(Icons.search),
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                          ),
                          onChanged: (value) {
                            // TODO: Implémenter la recherche
                          },
                        ),
                      ),
                      
                      // Grille de produits
                      Expanded(
                        child: GridView.builder(
                          padding: const EdgeInsets.all(8),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 3,
                            childAspectRatio: 0.8,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8,
                          ),
                          itemCount: _products.length,
                          itemBuilder: (context, index) {
                            final product = _products[index];
                            return _buildProductCard(product);
                          },
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Panier (droite)
                Expanded(
                  flex: 1,
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      border: Border(
                        left: BorderSide(color: Colors.grey[300]!),
                      ),
                    ),
                    child: Column(
                      children: [
                        // En-tête du panier
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.blue,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          child: const Row(
                            children: [
                              Icon(Icons.shopping_cart, color: Colors.white),
                              SizedBox(width: 8),
                              Text(
                                'Panier',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                        
                        // Sélection de table
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                          child: DropdownButtonFormField<int>(
                            decoration: const InputDecoration(
                              labelText: 'Table',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.table_restaurant),
                            ),
                            value: _selectedTableId,
                            items: _tables.map((table) {
                              return DropdownMenuItem<int>(
                                value: table['id'],
                                child: Text('Table ${table['number']}'),
                              );
                            }).toList(),
                            onChanged: (value) {
                              setState(() => _selectedTableId = value);
                            },
                          ),
                        ),
                        
                        // Nom du client
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
                          child: TextField(
                            controller: _customerNameController,
                            decoration: const InputDecoration(
                              labelText: 'Nom du client',
                              hintText: 'Entrez le nom du client',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.person),
                            ),
                            onChanged: (value) {
                              setState(() => _customerName = value);
                            },
                          ),
                        ),
                        
                        // Notes
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                          child: TextField(
                            controller: _notesController,
                            decoration: const InputDecoration(
                              labelText: 'Notes (optionnel)',
                              hintText: 'Remarques ou instructions',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.note),
                            ),
                            maxLines: 2,
                            onChanged: (value) {
                              setState(() => _notes = value);
                            },
                          ),
                        ),
                        
                        // Liste des articles
                        Expanded(
                          child: _cartItems.isEmpty
                              ? const Center(
                                  child: Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(
                                        Icons.shopping_cart_outlined,
                                        size: 64,
                                        color: Colors.grey,
                                      ),
                                      SizedBox(height: 16),
                                      Text(
                                        'Panier vide',
                                        style: TextStyle(color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                )
                              : ListView.builder(
                                  itemCount: _cartItems.length,
                                  itemBuilder: (context, index) {
                                    return _buildCartItem(_cartItems[index], index);
                                  },
                                ),
                        ),
                        
                        // Méthode de paiement
                        Padding(
                          padding: const EdgeInsets.all(16),
                          child: DropdownButtonFormField<String>(
                            decoration: const InputDecoration(
                              labelText: 'Méthode de paiement',
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.payment),
                            ),
                            initialValue: _paymentMethod,
                            items: const [
                              DropdownMenuItem(value: 'cash', child: Text('Espèces')),
                              DropdownMenuItem(value: 'card', child: Text('Carte')),
                              DropdownMenuItem(value: 'mobile', child: Text('Mobile Money')),
                            ],
                            onChanged: (value) {
                              setState(() => _paymentMethod = value!);
                            },
                          ),
                        ),
                        
                        // Total et bouton valider
                        Container(
                          padding: const EdgeInsets.all(16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.1),
                                blurRadius: 4,
                                offset: const Offset(0, -2),
                              ),
                            ],
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Total:',
                                    style: TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  Text(
                                    '${_formatNumber(_totalAmount)} BIF',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              SizedBox(
                                width: double.infinity,
                                height: 50,
                                child: ElevatedButton.icon(
                                  onPressed: _cartItems.isEmpty ? null : _createSale,
                                  icon: const Icon(Icons.check),
                                  label: const Text(
                                    'Valider la vente',
                                    style: TextStyle(fontSize: 16),
                                  ),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.green,
                                    foregroundColor: Colors.white,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildProductCard(Map<String, dynamic> product) {
    final stock = product['current_stock'] ?? 0;
    final isLowStock = stock < (product['minimum_stock'] ?? 10);
    
    return Card(
      child: InkWell(
        onTap: stock > 0 ? () => _addToCart(product) : null,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.blue[100],
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                ),
                child: const Center(
                  child: Icon(Icons.restaurant, size: 48, color: Colors.blue),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product['name'] ?? '',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
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
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartItem(Map<String, dynamic> item, int index) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['name'] ?? '',
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Text(
                    '${_formatNumber(item['price'])} BIF',
                    style: const TextStyle(color: Colors.green),
                  ),
                ],
              ),
            ),
            Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.remove_circle_outline),
                  onPressed: () => _removeFromCart(index),
                  color: Colors.red,
                ),
                Text(
                  '${item['quantity']}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add_circle_outline),
                  onPressed: () {
                    setState(() {
                      _cartItems[index]['quantity']++;
                    });
                  },
                  color: Colors.green,
                ),
              ],
            ),
          ],
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
        (Match m) => '${m[1]},',
      );
    } catch (e) {
      return '0';
    }
  }
}
