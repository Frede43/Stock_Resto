import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/sales_service.dart';
import '../../services/api_service.dart';

/// Modal pour ajouter des articles à une vente existante
/// 
/// Permet de :
/// - Sélectionner des produits
/// - Définir la quantité
/// - Ajouter des notes
/// - Voir le récapitulatif avant validation
class AddItemsModal extends StatefulWidget {
  final Map<String, dynamic> sale;
  final VoidCallback onSuccess;
  
  const AddItemsModal({
    super.key,
    required this.sale,
    required this.onSuccess,
  });
  
  @override
  State<AddItemsModal> createState() => _AddItemsModalState();
}

class _AddItemsModalState extends State<AddItemsModal> {
  final ApiService _apiService = ApiService();
  final SalesService _salesService = SalesService();
  
  List<Map<String, dynamic>> _products = [];
  List<Map<String, dynamic>> _itemsToAdd = [];
  
  int? _selectedProductId;
  int _quantity = 1;
  String _notes = '';
  
  bool _isLoadingProducts = false;
  bool _isSubmitting = false;
  
  final TextEditingController _quantityController = TextEditingController(text: '1');
  final TextEditingController _notesController = TextEditingController();
  
  @override
  void initState() {
    super.initState();
    _loadProducts();
  }
  
  @override
  void dispose() {
    _quantityController.dispose();
    _notesController.dispose();
    super.dispose();
  }
  
  /// Charger la liste des produits
  Future<void> _loadProducts() async {
    setState(() => _isLoadingProducts = true);
    
    try {
      final response = await _apiService.get('/products/?is_active=true');
      
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        setState(() {
          _products = List<Map<String, dynamic>>.from(results);
        });
      }
    } catch (e) {
      print('Erreur chargement produits: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      setState(() => _isLoadingProducts = false);
    }
  }
  
  /// Formater le prix
  String _formatPrice(dynamic price) {
    final value = price is num ? price : (double.tryParse(price.toString()) ?? 0);
    final formatter = NumberFormat('#,###', 'fr_FR');
    return '${formatter.format(value)} FBu';
  }
  
  /// Ajouter un article à la liste
  void _addItem() {
    if (_selectedProductId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner un produit')),
      );
      return;
    }
    
    if (_quantity <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('La quantité doit être supérieure à 0')),
      );
      return;
    }
    
    final product = _products.firstWhere((p) => p['id'] == _selectedProductId);
    
    // Vérifier le stock
    final currentStock = product['current_stock'] ?? 0;
    if (currentStock < _quantity) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Stock insuffisant pour ${product['name']}. Disponible: $currentStock'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }
    
    setState(() {
      _itemsToAdd.add({
        'product': product['id'],
        'product_name': product['name'],
        'quantity': _quantity,
        'unit_price': product['selling_price'],
        'notes': _notes,
      });
      
      // Reset
      _selectedProductId = null;
      _quantity = 1;
      _notes = '';
      _quantityController.text = '1';
      _notesController.clear();
    });
  }
  
  /// Retirer un article de la liste
  void _removeItem(int index) {
    setState(() {
      _itemsToAdd.removeAt(index);
    });
  }
  
  /// Calculer le nouveau total
  double get _newTotal {
    final currentTotal = widget.sale['totalAmount'] ?? widget.sale['finalAmount'] ?? 0;
    final currentValue = currentTotal is num ? currentTotal.toDouble() : double.tryParse(currentTotal.toString()) ?? 0;
    
    final addedTotal = _itemsToAdd.fold<double>(0, (sum, item) {
      final price = item['unit_price'] is num ? item['unit_price'].toDouble() : double.tryParse(item['unit_price'].toString()) ?? 0;
      final qty = item['quantity'] ?? 0;
      return sum + (price * qty);
    });
    
    return currentValue + addedTotal;
  }
  
  /// Soumettre les articles
  Future<void> _submit() async {
    if (_itemsToAdd.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez ajouter au moins un article')),
      );
      return;
    }
    
    setState(() => _isSubmitting = true);
    
    try {
      // Préparer les données
      final items = _itemsToAdd.map((item) => {
        'product': item['product'],
        'quantity': item['quantity'],
        'notes': item['notes'],
      }).toList();
      
      // Appeler l'API
      final result = await _salesService.addItems(widget.sale['id'], items);
      
      if (!mounted) return;
      
      if (result['success']) {
        // Afficher toast de succès
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.white),
                SizedBox(width: 10),
                Expanded(
                  child: Text('✅ Articles ajoutés avec succès'),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
        
        // Fermer le modal
        Navigator.pop(context);
        
        // Appeler le callback de succès
        widget.onSuccess();
      } else {
        // Afficher toast d'erreur
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: Text('❌ Erreur: ${result['error']}'),
                ),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (!mounted) return;
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Erreur: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Dialog(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 600, maxHeight: 700),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Theme.of(context).primaryColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(4),
                  topRight: Radius.circular(4),
                ),
              ),
              child: Row(
                children: [
                  const Icon(Icons.add_shopping_cart, color: Colors.white),
                  const SizedBox(width: 10),
                  const Expanded(
                    child: Text(
                      'Ajouter des articles',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close, color: Colors.white),
                  ),
                ],
              ),
            ),
            
            // Body
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Info vente
                    Card(
                      color: Colors.blue.shade50,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Vente: ${widget.sale['reference'] ?? 'N/A'}',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                            Text('Total actuel: ${_formatPrice(widget.sale['totalAmount'] ?? widget.sale['finalAmount'] ?? 0)}'),
                          ],
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 20),
                    
                    // Sélection produit
                    if (_isLoadingProducts)
                      const Center(child: CircularProgressIndicator())
                    else ...[
                      const Text(
                        'Sélectionner un produit',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      DropdownButtonFormField<int>(
                        value: _selectedProductId,
                        decoration: const InputDecoration(
                          labelText: 'Produit',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.inventory_2),
                        ),
                        items: _products.map((product) {
                          return DropdownMenuItem<int>(
                            value: product['id'],
                            child: Text(
                              '${product['name']} - ${_formatPrice(product['selling_price'])}',
                            ),
                          );
                        }).toList(),
                        onChanged: (value) => setState(() => _selectedProductId = value),
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Quantité
                      TextField(
                        controller: _quantityController,
                        decoration: const InputDecoration(
                          labelText: 'Quantité',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.numbers),
                        ),
                        keyboardType: TextInputType.number,
                        onChanged: (value) => _quantity = int.tryParse(value) ?? 1,
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Notes
                      TextField(
                        controller: _notesController,
                        decoration: const InputDecoration(
                          labelText: 'Notes (optionnel)',
                          border: OutlineInputBorder(),
                          prefixIcon: Icon(Icons.note),
                        ),
                        maxLines: 2,
                        onChanged: (value) => _notes = value,
                      ),
                      
                      const SizedBox(height: 16),
                      
                      // Bouton ajouter
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _addItem,
                          icon: const Icon(Icons.add),
                          label: const Text('Ajouter à la liste'),
                        ),
                      ),
                    ],
                    
                    const SizedBox(height: 20),
                    
                    // Liste des items à ajouter
                    if (_itemsToAdd.isNotEmpty) ...[
                      const Divider(),
                      const Text(
                        'Articles à ajouter',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 10),
                      
                      ..._itemsToAdd.asMap().entries.map((entry) {
                        final index = entry.key;
                        final item = entry.value;
                        final total = (item['unit_price'] is num ? item['unit_price'].toDouble() : double.tryParse(item['unit_price'].toString()) ?? 0) * (item['quantity'] ?? 0);
                        
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: ListTile(
                            leading: CircleAvatar(
                              child: Text('${item['quantity']}x'),
                            ),
                            title: Text(item['product_name']),
                            subtitle: Text(
                              '${_formatPrice(item['unit_price'])} × ${item['quantity']} = ${_formatPrice(total)}',
                            ),
                            trailing: IconButton(
                              icon: const Icon(Icons.delete, color: Colors.red),
                              onPressed: () => _removeItem(index),
                            ),
                          ),
                        );
                      }),
                      
                      const Divider(),
                      
                      // Nouveau total
                      Card(
                        color: Colors.green.shade50,
                        child: Padding(
                          padding: const EdgeInsets.all(12),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Nouveau total:',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 16,
                                ),
                              ),
                              Text(
                                _formatPrice(_newTotal),
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                  color: Colors.green,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            
            // Footer
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                border: Border(top: BorderSide(color: Colors.grey.shade300)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: _isSubmitting ? null : () => Navigator.pop(context),
                    child: const Text('Annuler'),
                  ),
                  const SizedBox(width: 10),
                  ElevatedButton.icon(
                    onPressed: _isSubmitting || _itemsToAdd.isEmpty ? null : _submit,
                    icon: _isSubmitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Icon(Icons.check),
                    label: Text(_isSubmitting ? 'Ajout en cours...' : 'Valider'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.green,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
