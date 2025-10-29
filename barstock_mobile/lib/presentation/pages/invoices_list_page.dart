import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import 'invoice_page.dart';

/// Page de liste des factures
/// 
/// Affiche toutes les factures (ventes payées) avec :
/// - Recherche par référence ou client
/// - Filtres par période
/// - Statistiques
/// - Accès rapide à chaque facture
class InvoicesListPage extends StatefulWidget {
  const InvoicesListPage({super.key});

  @override
  State<InvoicesListPage> createState() => _InvoicesListPageState();
}

class _InvoicesListPageState extends State<InvoicesListPage> {
  final ApiService _apiService = ApiService();
  
  List<Map<String, dynamic>> _invoices = [];
  bool _isLoading = false;
  String _searchQuery = '';
  DateTime? _startDate;
  DateTime? _endDate;
  
  @override
  void initState() {
    super.initState();
    _apiService.initialize();
    _loadInvoices();
  }

  /// Charger les factures (ventes payées uniquement)
  Future<void> _loadInvoices() async {
    print('🧾 ========== DÉBUT _loadInvoices() ==========');
    setState(() => _isLoading = true);
    
    try {
      // Construire les paramètres de requête
      final params = <String, dynamic>{
        'status': 'paid', // ✅ Uniquement les ventes payées
      };
      
      if (_startDate != null) {
        params['start_date'] = DateFormat('yyyy-MM-dd').format(_startDate!);
      }
      
      if (_endDate != null) {
        params['end_date'] = DateFormat('yyyy-MM-dd').format(_endDate!);
      }
      
      if (_searchQuery.isNotEmpty) {
        params['search'] = _searchQuery;
      }
      
      print('📊 Chargement factures avec filtres: $params');
      print('🔗 URL: /sales/');
      
      final response = await _apiService.get('/sales/', params: params);
      
      print('📡 Status code: ${response.statusCode}');
      
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? response.data ?? [];
        print('📦 ${results is List ? results.length : 0} factures reçues');
        
        setState(() {
          _invoices = (results is List ? results : [results]).map<Map<String, dynamic>>((sale) {
            return {
              'id': sale['id'],
              'reference': sale['reference'] ?? 'N/A',
              'tableName': sale['table_name'] ?? 'Sans table',
              'customerName': sale['customer_name'] ?? 'Client anonyme',
              'serverName': sale['server_name'] ?? 'Serveur',
              'paymentMethod': sale['payment_method'] ?? 'cash',
              'totalAmount': sale['total_amount'] ?? sale['final_amount'] ?? 0,
              'finalAmount': sale['final_amount'] ?? sale['total_amount'] ?? 0,
              'itemsCount': sale['items']?.length ?? 0,
              'createdAt': sale['created_at'],
              'paidAt': sale['paid_at'],
            };
          }).toList();
        });
        
        print('✅ ${_invoices.length} factures chargées');
        print('🏁 ========== FIN _loadInvoices() ==========\n');
      } else {
        print('❌ Erreur HTTP: ${response.statusCode}');
      }
    } catch (e, stackTrace) {
      print('💥 EXCEPTION dans _loadInvoices():');
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

  /// Filtrer les factures par recherche
  List<Map<String, dynamic>> get _filteredInvoices {
    if (_searchQuery.isEmpty) return _invoices;
    
    return _invoices.where((invoice) {
      final query = _searchQuery.toLowerCase();
      final reference = (invoice['reference'] ?? '').toString().toLowerCase();
      final customer = (invoice['customerName'] ?? '').toString().toLowerCase();
      
      return reference.contains(query) || customer.contains(query);
    }).toList();
  }

  /// Naviguer vers la page de facture
  void _navigateToInvoice(Map<String, dynamic> invoice) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => InvoicePage(
          saleId: invoice['id'],
          saleReference: invoice['reference'] ?? 'N/A',
        ),
      ),
    );
  }

  /// Afficher le sélecteur de dates
  Future<void> _showDatePicker(bool isStartDate) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: isStartDate ? (_startDate ?? DateTime.now()) : (_endDate ?? DateTime.now()),
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    
    if (picked != null) {
      setState(() {
        if (isStartDate) {
          _startDate = picked;
        } else {
          _endDate = picked;
        }
      });
      _loadInvoices();
    }
  }

  /// Réinitialiser les filtres
  void _resetFilters() {
    setState(() {
      _startDate = null;
      _endDate = null;
      _searchQuery = '';
    });
    _loadInvoices();
  }

  /// Obtenir l'icône de méthode de paiement
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

  /// Obtenir le label de méthode de paiement
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

  @override
  Widget build(BuildContext context) {
    final filteredInvoices = _filteredInvoices;
    final totalAmount = filteredInvoices.fold<double>(
      0.0,
      (sum, invoice) {
        final amount = invoice['finalAmount'];
        return sum + (amount is num ? amount.toDouble() : double.tryParse(amount.toString()) ?? 0.0);
      },
    );
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Factures'),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                builder: (context) => _buildFiltersSheet(),
              );
            },
            tooltip: 'Filtres',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadInvoices,
            tooltip: 'Actualiser',
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
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          setState(() => _searchQuery = '');
                        },
                      )
                    : null,
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
          
          // Filtres actifs
          if (_startDate != null || _endDate != null)
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.filter_alt, color: Colors.blue, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Période: ${_startDate != null ? DateFormat('dd/MM/yyyy').format(_startDate!) : '...'} - ${_endDate != null ? DateFormat('dd/MM/yyyy').format(_endDate!) : '...'}',
                      style: const TextStyle(color: Colors.blue),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: _resetFilters,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
          
          const SizedBox(height: 8),
          
          // Statistiques
          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green[50],
              borderRadius: BorderRadius.circular(10),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                Column(
                  children: [
                    Text(
                      '${filteredInvoices.length}',
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                    const Text('Factures'),
                  ],
                ),
                Container(
                  height: 40,
                  width: 1,
                  color: Colors.green[200],
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
          
          // Liste des factures
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : filteredInvoices.isEmpty
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
                              'Aucune facture trouvée',
                              style: TextStyle(
                                fontSize: 18,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadInvoices,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: filteredInvoices.length,
                          itemBuilder: (context, index) {
                            final invoice = filteredInvoices[index];
                            final createdAt = DateTime.parse(invoice['createdAt']);
                            final paidAt = invoice['paidAt'] != null 
                                ? DateTime.parse(invoice['paidAt']) 
                                : null;
                            
                            return Card(
                              margin: const EdgeInsets.only(bottom: 12),
                              child: ListTile(
                                contentPadding: const EdgeInsets.all(12),
                                leading: CircleAvatar(
                                  backgroundColor: Colors.green[100],
                                  child: Icon(
                                    _getPaymentMethodIcon(invoice['paymentMethod']),
                                    color: Colors.green[700],
                                  ),
                                ),
                                title: Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        invoice['reference'],
                                        style: const TextStyle(
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                        horizontal: 8,
                                        vertical: 4,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.green,
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: const Text(
                                        'Payée',
                                        style: TextStyle(
                                          color: Colors.white,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                subtitle: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const SizedBox(height: 4),
                                    Text('${invoice['customerName']} • ${invoice['tableName']}'),
                                    Text(
                                      'Créée: ${DateFormat('dd/MM/yyyy HH:mm').format(createdAt)}',
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey[600],
                                      ),
                                    ),
                                    if (paidAt != null)
                                      Text(
                                        'Payée: ${DateFormat('dd/MM/yyyy HH:mm').format(paidAt)}',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.green[700],
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                    const SizedBox(height: 4),
                                    Text(
                                      '${invoice['itemsCount']} article(s) • ${_getPaymentMethodLabel(invoice['paymentMethod'])}',
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
                                      '${NumberFormat('#,##0').format(invoice['finalAmount'])} BIF',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                        color: Colors.green,
                                      ),
                                    ),
                                    const SizedBox(height: 8),
                                    ElevatedButton.icon(
                                      onPressed: () => _navigateToInvoice(invoice),
                                      icon: const Icon(Icons.receipt, size: 16),
                                      label: const Text('Voir'),
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 12,
                                          vertical: 4,
                                        ),
                                        minimumSize: const Size(0, 32),
                                      ),
                                    ),
                                  ],
                                ),
                                onTap: () => _navigateToInvoice(invoice),
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

  /// Construire le sheet des filtres
  Widget _buildFiltersSheet() {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Filtrer par période',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          
          // Date de début
          ListTile(
            leading: const Icon(Icons.calendar_today),
            title: const Text('Date de début'),
            subtitle: Text(
              _startDate != null 
                  ? DateFormat('dd/MM/yyyy').format(_startDate!) 
                  : 'Non définie',
            ),
            trailing: _startDate != null
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      setState(() => _startDate = null);
                      Navigator.pop(context);
                      _loadInvoices();
                    },
                  )
                : null,
            onTap: () {
              Navigator.pop(context);
              _showDatePicker(true);
            },
          ),
          
          // Date de fin
          ListTile(
            leading: const Icon(Icons.calendar_today),
            title: const Text('Date de fin'),
            subtitle: Text(
              _endDate != null 
                  ? DateFormat('dd/MM/yyyy').format(_endDate!) 
                  : 'Non définie',
            ),
            trailing: _endDate != null
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      setState(() => _endDate = null);
                      Navigator.pop(context);
                      _loadInvoices();
                    },
                  )
                : null,
            onTap: () {
              Navigator.pop(context);
              _showDatePicker(false);
            },
          ),
          
          const SizedBox(height: 20),
          
          // Boutons
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _resetFilters();
                  },
                  child: const Text('Réinitialiser'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _loadInvoices();
                  },
                  child: const Text('Appliquer'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
