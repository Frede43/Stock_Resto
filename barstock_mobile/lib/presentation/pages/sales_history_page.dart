import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../widgets/status_badge.dart';
import '../widgets/pay_button.dart';
import '../widgets/add_items_modal.dart';
import 'invoice_page.dart';

class SalesHistoryPage extends StatefulWidget {
  const SalesHistoryPage({super.key});

  @override
  State<SalesHistoryPage> createState() => _SalesHistoryPageState();
}

class _SalesHistoryPageState extends State<SalesHistoryPage> {
  final ApiService _apiService = ApiService();
  
  List<Map<String, dynamic>> _sales = [];
  bool _isLoading = false;
  String _searchQuery = '';
  String _statusFilter = 'all'; // all, paid, pending, cancelled
  String _paymentMethodFilter = 'all'; // all, cash, card, mobile, credit
  DateTime? _startDate;
  DateTime? _endDate;
  
  @override
  void initState() {
    super.initState();
    _apiService.initialize(); // ✅ Initialiser l'API service
    _loadSales();
  }

  Future<void> _loadSales() async {
    print('🚀 ========== DÉBUT _loadSales() ==========');
    setState(() => _isLoading = true);
    
    try {
      // Construire les paramètres de requête
      final params = <String, dynamic>{};
      
      if (_statusFilter != 'all') {
        params['status'] = _statusFilter;
      }
      
      if (_paymentMethodFilter != 'all') {
        params['payment_method'] = _paymentMethodFilter;
      }
      
      if (_startDate != null) {
        params['start_date'] = DateFormat('yyyy-MM-dd').format(_startDate!);
      }
      
      if (_endDate != null) {
        params['end_date'] = DateFormat('yyyy-MM-dd').format(_endDate!);
      }
      
      if (_searchQuery.isNotEmpty) {
        params['search'] = _searchQuery;
      }
      
      print('📊 Chargement historique ventes avec filtres: $params');
      print('🔗 URL: /sales/');
      
      final response = await _apiService.get('/sales/', params: params);
      
      print('📡 Status code: ${response.statusCode}');
      print('📦 Type de données: ${response.data.runtimeType}');
      
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        print('📦 ${results is List ? results.length : 0} ventes reçues');
        
        setState(() {
          _sales = (results is List ? results : [results]).map<Map<String, dynamic>>((sale) {
            return {
              'id': sale['id'],
              'reference': sale['reference'] ?? 'N/A',
              'table': sale['table'],
              'tableName': sale['table_name'] ?? 'Sans table',
              'customerName': sale['customer_name'] ?? 'Client anonyme',
              'serverName': sale['server_name'] ?? 'Serveur',
              'paymentMethod': sale['payment_method'] ?? 'cash',
              'status': sale['status'] ?? 'pending',
              'totalAmount': sale['total_amount'] ?? sale['final_amount'] ?? 0,
              'discountAmount': sale['discount_amount'] ?? 0,
              'finalAmount': sale['final_amount'] ?? sale['total_amount'] ?? 0,
              'itemsCount': sale['items']?.length ?? 0,
              'items': sale['items'] ?? [],
              'notes': sale['notes'] ?? '',
              'createdAt': sale['created_at'],
              'paidAt': sale['paid_at'],
            };
          }).toList();
        });
        
        print('✅ ${_sales.length} ventes chargées');
        print('🏁 ========== FIN _loadSales() ==========\n');
      } else {
        print('❌ Erreur HTTP: ${response.statusCode}');
        print('❌ Message: ${response.data}');
      }
    } catch (e, stackTrace) {
      print('💥 EXCEPTION dans _loadSales():');
      print('❌ Erreur: $e');
      print('📍 Stack trace: $stackTrace');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur de chargement: ${e.toString()}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 5),
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  List<Map<String, dynamic>> get _filteredSales {
    return _sales.where((sale) {
      // Filtre par recherche (référence ou client)
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final reference = (sale['reference'] ?? '').toString().toLowerCase();
        final customer = (sale['customerName'] ?? '').toString().toLowerCase();
        
        if (!reference.contains(query) && !customer.contains(query)) {
          return false;
        }
      }
      
      return true;
    }).toList();
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'paid':
        return Colors.green;
      case 'pending':
        return Colors.orange;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'paid':
        return 'Payée';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulée';
      default:
        return status;
    }
  }

  String _getPaymentMethodLabel(String method) {
    switch (method) {
      case 'cash':
        return 'Espèces';
      case 'card':
        return 'Carte';
      case 'mobile':
        return 'Mobile Money';
      case 'credit':
        return 'Crédit';
      default:
        return method;
    }
  }

  IconData _getPaymentMethodIcon(String method) {
    switch (method) {
      case 'cash':
        return Icons.money;
      case 'card':
        return Icons.credit_card;
      case 'mobile':
        return Icons.phone_android;
      case 'credit':
        return Icons.account_balance_wallet;
      default:
        return Icons.payment;
    }
  }

  /// Afficher le modal d'ajout d'articles
  void _showAddItemsModal(Map<String, dynamic> sale) {
    showDialog(
      context: context,
      builder: (context) => AddItemsModal(
        sale: sale,
        onSuccess: _loadSales,
      ),
    );
  }
  
  /// Naviguer vers la page de facture
  void _navigateToInvoice(Map<String, dynamic> sale) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => InvoicePage(
          saleId: sale['id'],
          saleReference: sale['reference'] ?? 'N/A',
        ),
      ),
    );
  }

  Future<void> _showSaleDetails(Map<String, dynamic> sale) async {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Détails de la vente',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const Divider(),
              const SizedBox(height: 10),
              
              // Informations générales
              _buildInfoRow('Référence', sale['reference']),
              _buildInfoRow('Date', DateFormat('dd/MM/yyyy HH:mm').format(DateTime.parse(sale['createdAt']))),
              _buildInfoRow('Table', sale['tableName']),
              _buildInfoRow('Client', sale['customerName']),
              _buildInfoRow('Serveur', sale['serverName']),
              _buildInfoRow('Méthode paiement', _getPaymentMethodLabel(sale['paymentMethod'])),
              _buildInfoRow('Statut', _getStatusLabel(sale['status'])),
              
              const SizedBox(height: 20),
              const Divider(),
              
              // Articles
              Text(
                'Articles (${sale['itemsCount']})',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 10),
              
              ...List.generate(sale['items'].length, (index) {
                final item = sale['items'][index];
                final unitPrice = item['unit_price'] is num 
                    ? item['unit_price'].toDouble() 
                    : double.tryParse(item['unit_price']?.toString() ?? '0') ?? 0.0;
                final totalPrice = item['total_price'] is num 
                    ? item['total_price'].toDouble() 
                    : double.tryParse(item['total_price']?.toString() ?? '0') ?? 0.0;
                final quantity = item['quantity'] ?? 1;
                
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      child: Text('$quantity'),
                    ),
                    title: Text(item['product_name'] ?? 'Produit'),
                    subtitle: Text('${NumberFormat('#,##0').format(unitPrice)} BIF x $quantity'),
                    trailing: Text(
                      '${NumberFormat('#,##0').format(totalPrice)} BIF',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ),
                );
              }),
              
              const SizedBox(height: 20),
              const Divider(),
              
              // Totaux
              _buildTotalRow('Sous-total', sale['totalAmount']),
              if (_getNumericValue(sale['discountAmount']) > 0)
                _buildTotalRow('Réduction', sale['discountAmount'], isDiscount: true),
              _buildTotalRow('Total', sale['finalAmount'], isTotal: true),
              
              // Notes
              if (sale['notes'] != null && sale['notes'].toString().isNotEmpty) ...[
                const SizedBox(height: 20),
                const Divider(),
                Text(
                  'Notes',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 10),
                Text(sale['notes']),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.grey,
              fontSize: 14,
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  /// Convertir une valeur en nombre de manière sécurisée
  double _getNumericValue(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString()) ?? 0.0;
  }

  Widget _buildTotalRow(String label, dynamic amount, {bool isDiscount = false, bool isTotal = false}) {
    final amountValue = _getNumericValue(amount);
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              color: isDiscount ? Colors.red : null,
            ),
          ),
          Text(
            '${isDiscount ? '-' : ''}${NumberFormat('#,##0').format(amountValue)} BIF',
            style: TextStyle(
              fontSize: isTotal ? 18 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
              color: isDiscount ? Colors.red : (isTotal ? Colors.green : null),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _showFilters() async {
    await showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Filtres',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              
              // Statut
              DropdownButtonFormField<String>(
                value: _statusFilter,
                decoration: const InputDecoration(
                  labelText: 'Statut',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'all', child: Text('Tous')),
                  DropdownMenuItem(value: 'paid', child: Text('Payées')),
                  DropdownMenuItem(value: 'pending', child: Text('En attente')),
                  DropdownMenuItem(value: 'cancelled', child: Text('Annulées')),
                ],
                onChanged: (value) {
                  setModalState(() => _statusFilter = value!);
                },
              ),
              const SizedBox(height: 15),
              
              // Méthode de paiement
              DropdownButtonFormField<String>(
                value: _paymentMethodFilter,
                decoration: const InputDecoration(
                  labelText: 'Méthode de paiement',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'all', child: Text('Toutes')),
                  DropdownMenuItem(value: 'cash', child: Text('Espèces')),
                  DropdownMenuItem(value: 'card', child: Text('Carte')),
                  DropdownMenuItem(value: 'mobile', child: Text('Mobile Money')),
                  DropdownMenuItem(value: 'credit', child: Text('Crédit')),
                ],
                onChanged: (value) {
                  setModalState(() => _paymentMethodFilter = value!);
                },
              ),
              const SizedBox(height: 20),
              
              // Boutons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        setState(() {
                          _statusFilter = 'all';
                          _paymentMethodFilter = 'all';
                          _startDate = null;
                          _endDate = null;
                        });
                        Navigator.pop(context);
                        _loadSales();
                      },
                      child: const Text('Réinitialiser'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        _loadSales();
                      },
                      child: const Text('Appliquer'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredSales = _filteredSales;
    final totalAmount = filteredSales.fold<double>(
      0.0,
      (sum, sale) {
        final amount = sale['finalAmount'];
        return sum + (amount is num ? amount.toDouble() : double.tryParse(amount.toString()) ?? 0.0);
      },
    );
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Historique des Ventes'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: _showFilters,
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadSales,
          ),
        ],
      ),
      body: Column(
        children: [
          // Barre de recherche
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              decoration: InputDecoration(
                hintText: 'Rechercher par référence ou client...',
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
              color: Colors.blue[50],
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Text(
                      '${filteredSales.length}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.blue,
                      ),
                    ),
                    const Text('Ventes'),
                  ],
                ),
                Container(
                  height: 40,
                  width: 1,
                  color: Colors.blue[200],
                ),
                Column(
                  children: [
                    Text(
                      '${NumberFormat('#,##0').format(totalAmount)} BIF',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                    const Text('Total'),
                  ],
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Liste des ventes
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : filteredSales.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.receipt_long,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Aucune vente trouvée',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadSales,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filteredSales.length,
                          itemBuilder: (context, index) {
                            final sale = filteredSales[index];
                            final createdAt = DateTime.parse(sale['createdAt']);
                            
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(12),
                                leading: CircleAvatar(
                                  backgroundColor: _getStatusColor(sale['status']).withOpacity(0.2),
                                  child: Icon(
                                    _getPaymentMethodIcon(sale['paymentMethod']),
                                    color: _getStatusColor(sale['status']),
                                  ),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        sale['reference'],
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    StatusBadge(status: sale['status']),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text('${sale['customerName']} • ${sale['tableName']}'),
                                    Text(
                                      DateFormat('dd/MM/yyyy HH:mm').format(createdAt),
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${sale['itemsCount']} article(s) • ${_getPaymentMethodLabel(sale['paymentMethod'])}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                  ],
                                ),
                                trailing: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${NumberFormat('#,###', 'fr_FR').format(sale['finalAmount'])} FBu',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        // Bouton Facture
                                        IconButton(
                                          icon: const Icon(Icons.receipt, size: 20),
                                          onPressed: () => _navigateToInvoice(sale),
                                          tooltip: 'Voir facture',
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                        ),
                                        const SizedBox(width: 8),
                                        // Bouton Ajouter (si pas payé)
                                        if (sale['status'] != 'paid' && sale['status'] != 'cancelled')
                                          IconButton(
                                            icon: const Icon(Icons.add_shopping_cart, size: 20),
                                            onPressed: () => _showAddItemsModal(sale),
                                            tooltip: 'Ajouter articles',
                                            padding: EdgeInsets.zero,
                                            constraints: const BoxConstraints(),
                                          ),
                                        const SizedBox(width: 8),
                                        // Bouton Payer
                                        PayButton(
                                          sale: sale,
                                          onSuccess: _loadSales,
                                          isCompact: true,
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                onTap: () => _showSaleDetails(sale),
                              ),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }
}
