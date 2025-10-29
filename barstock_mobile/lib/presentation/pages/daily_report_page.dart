import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:intl/intl.dart';

class DailyReportPage extends StatefulWidget {
  const DailyReportPage({super.key});

  @override
  _DailyReportPageState createState() => _DailyReportPageState();
}

class _DailyReportPageState extends State<DailyReportPage> {
  final ApiService _apiService = ApiService();
  
  Map<String, dynamic> _reportData = {};
  List<Map<String, dynamic>> _products = [];
  Map<String, List<dynamic>> _alerts = {};
  bool _isLoading = false;
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _loadDailyReport();
  }

  Future<void> _loadDailyReport() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    
    try {
      final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
      print('📅 Chargement rapport pour: $dateStr');
      
      // Charger le rapport détaillé depuis l'endpoint reports
      final reportResponse = await _apiService.get('/reports/daily-detailed/$dateStr/');
      
      if (!mounted) return;
      
      if (reportResponse.statusCode == 200) {
        final data = reportResponse.data;
        print('✅ Rapport chargé: ${data.keys}');
        print('🔍 Catégories disponibles: ${data['categories']?.keys}');
        
        setState(() {
          _reportData = {
            'date': dateStr,
            'totalRevenue': data['summary']?['total_revenue'] ?? 0,
            'totalProfit': data['summary']?['total_profit'] ?? 0,
            'totalCost': data['summary']?['total_cost'] ?? 0,
            'profitMargin': data['summary']?['profit_margin'] ?? 0,
            'totalSales': data['summary']?['total_sales'] ?? 0,
          };
          
          // Extraire les produits de toutes les catégories
          _products = [];
          if (data['categories'] != null) {
            (data['categories'] as Map).forEach((categoryName, categoryData) {
              print('📂 Catégorie: $categoryName - ${categoryData['products']?.length ?? 0} produits');
              if (categoryData['products'] != null) {
                for (var product in categoryData['products']) {
                  _products.add({
                    'name': product['name'] ?? 'Produit inconnu',
                    'category': categoryName,
                    'initialStock': product['stock_initial'] ?? 0,
                    'incoming': product['stock_entree'] ?? 0,
                    'outgoing': product['stock_vendu'] ?? 0,
                    'finalStock': product['stock_restant'] ?? 0,
                    'stockTotal': (product['stock_initial'] ?? 0) + (product['stock_entree'] ?? 0),
                    'price': product['prix_unitaire'] ?? 0,
                    'costPrice': product['prix_achat'] ?? 0,
                    'totalSales': product['stock_vendu'] ?? 0,
                    'revenue': product['revenue'] ?? 0,
                    'profit': product['benefice_total'] ?? 0,
                    'margin': product['marge_unitaire'] ?? 0,
                  });
                }
              }
            });
          }
          
          print('📦 ${_products.length} produits chargés au total');
          if (_products.isEmpty) {
            print('⚠️ ATTENTION: Aucun produit chargé! Vérifier les données backend.');
          }
        });
      } else {
        print('❌ Erreur HTTP: ${reportResponse.statusCode}');
      }
      
      // Charger les alertes
      if (!mounted) return;
      final alertsResponse = await _apiService.get('/alerts/?is_resolved=false');
      if (!mounted) return;
      
      if (alertsResponse.statusCode == 200) {
        final results = alertsResponse.data['results'] ?? [];
        setState(() {
          _alerts = {
            'low_stock': results.where((a) => a['type'] == 'low_stock').toList(),
            'out_of_stock': results.where((a) => a['type'] == 'out_of_stock').toList(),
            'high_sales': results.where((a) => a['type'] == 'high_sales').toList(),
          };
        });
      }
    } catch (e) {
      print('❌ Erreur chargement rapport: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Erreur: $e'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
    );
    
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
      _loadDailyReport();
    }
  }

  @override
  Widget build(BuildContext context) {
    final totalLowStock = (_alerts['low_stock']?.length ?? 0);
    final totalOutOfStock = (_alerts['out_of_stock']?.length ?? 0);
    final totalHighSales = (_alerts['high_sales']?.length ?? 0);
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rapport Quotidien'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadDailyReport,
          ),
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () {
              // TODO: Export PDF
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Export PDF à venir')),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadDailyReport,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sélecteur de date
                    Card(
                      child: ListTile(
                        leading: const Icon(Icons.calendar_today, color: Colors.blue),
                        title: const Text('Date du rapport'),
                        subtitle: Text(
                          DateFormat('EEEE d MMMM yyyy', 'fr_FR').format(_selectedDate),
                        ),
                        trailing: const Icon(Icons.arrow_drop_down),
                        onTap: _selectDate,
                      ),
                    ),
                    
                    const SizedBox(height: 16),
                    
                    // Statistiques principales
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 1.3,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      children: [
                        _buildStatCard(
                          'Chiffre d\'affaires',
                          '${_formatNumber(_reportData['totalRevenue'])} BIF',
                          Icons.attach_money,
                          Colors.green,
                        ),
                        _buildStatCard(
                          'Bénéfice total',
                          '${_formatNumber(_reportData['totalProfit'])} BIF',
                          Icons.trending_up,
                          Colors.blue,
                          subtitle: 'Marge: ${(_reportData['profitMargin'] ?? 0).toStringAsFixed(1)}%',
                        ),
                        _buildStatCard(
                          'Total ventes',
                          _reportData['totalSales']?.toString() ?? '0',
                          Icons.shopping_cart,
                          Colors.orange,
                          subtitle: 'articles',
                        ),
                        _buildStatCard(
                          'Alertes',
                          '${totalLowStock + totalOutOfStock}',
                          Icons.warning,
                          Colors.red,
                          subtitle: '$totalLowStock stock bas',
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Alertes
                    if (totalLowStock > 0 || totalOutOfStock > 0 || totalHighSales > 0) ...[
                      const Text(
                        'Alertes',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      
                      if (totalLowStock > 0)
                        _buildAlert(
                          '$totalLowStock produit(s) en stock faible',
                          Colors.orange,
                          Icons.warning,
                        ),
                      
                      if (totalOutOfStock > 0)
                        _buildAlert(
                          '$totalOutOfStock produit(s) en rupture de stock',
                          Colors.red,
                          Icons.error,
                        ),
                      
                      if (totalHighSales > 0)
                        _buildAlert(
                          '$totalHighSales produit(s) avec ventes exceptionnelles',
                          Colors.green,
                          Icons.check_circle,
                        ),
                      
                      const SizedBox(height: 24),
                    ],
                    
                    // Produits les plus vendus
                    if (_products.isNotEmpty) ...[
                      const Text(
                        'Top 5 - Produits les Plus Vendus',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildTopProductsChart(),
                      const SizedBox(height: 24),
                    ],
                    
                    // Évolution par catégorie
                    if (_products.isNotEmpty) ...[
                      const Text(
                        'Répartition par Catégorie',
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildCategoryPieChart(),
                      const SizedBox(height: 24),
                    ],
                    
                    // Rapport détaillé
                    const Text(
                      'Rapport Journalier Détaillé',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Rapport des mouvements de stock et ventes par produit',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Tableau des produits par catégorie
                    if (_products.isEmpty)
                      Card(
                        child: Padding(
                          padding: const EdgeInsets.all(32),
                          child: Center(
                            child: Column(
                              children: [
                                Icon(
                                  Icons.inbox,
                                  size: 64,
                                  color: Colors.grey[400],
                                ),
                                const SizedBox(height: 16),
                                Text(
                                  'Aucune donnée pour cette date',
                                  style: TextStyle(
                                    fontSize: 16,
                                    color: Colors.grey[600],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      )
                    else
                      ..._buildProductsByCategory(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color, {
    String? subtitle,
  }) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(icon, size: 24, color: color),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(
                fontSize: 12,
                color: Colors.grey,
              ),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 4),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 10,
                  color: Colors.grey[600],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAlert(String message, Color color, IconData icon) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildProductsByCategory() {
    final categories = <String>{};
    for (var product in _products) {
      categories.add(product['category'] ?? 'Autres');
    }
    
    final widgets = <Widget>[];
    
    for (var category in categories) {
      final categoryProducts = _products.where((p) => p['category'] == category).toList();
      
      // Calculer les totaux de la catégorie
      final categoryTotals = categoryProducts.fold<Map<String, num>>(
        {
          'initialStock': 0,
          'incoming': 0,
          'outgoing': 0,
          'finalStock': 0,
          'totalSales': 0,
          'revenue': 0,
          'profit': 0,
        },
        (acc, product) {
          acc['initialStock'] = (acc['initialStock'] ?? 0) + (product['initialStock'] ?? 0);
          acc['incoming'] = (acc['incoming'] ?? 0) + (product['incoming'] ?? 0);
          acc['outgoing'] = (acc['outgoing'] ?? 0) + (product['outgoing'] ?? 0);
          acc['finalStock'] = (acc['finalStock'] ?? 0) + (product['finalStock'] ?? 0);
          acc['totalSales'] = (acc['totalSales'] ?? 0) + (product['totalSales'] ?? 0);
          acc['revenue'] = (acc['revenue'] ?? 0) + (product['revenue'] ?? 0);
          acc['profit'] = (acc['profit'] ?? 0) + (product['profit'] ?? 0);
          return acc;
        },
      );
      
      widgets.add(
        Card(
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // En-tête de catégorie
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue.withValues(alpha: 0.1),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.category, color: Colors.blue),
                    const SizedBox(width: 8),
                    Text(
                      category,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              
              // Tableau des produits
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columnSpacing: 12,
                  horizontalMargin: 12,
                  headingRowColor: WidgetStateProperty.all(Colors.grey[100]),
                  columns: const [
                    DataColumn(label: Text('Produit', style: TextStyle(fontWeight: FontWeight.bold))),
                    DataColumn(label: Text('Prix', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                    DataColumn(label: Text('Stock Init', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                    DataColumn(label: Text('Entrée', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                    DataColumn(label: Text('Total', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                    DataColumn(label: Text('Conso', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                    DataColumn(label: Text('Restant', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                    DataColumn(label: Text('P.A.', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                    DataColumn(label: Text('P.V.', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                    DataColumn(label: Text('Vendu', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                    DataColumn(label: Text('CA', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                    DataColumn(label: Text('Bénéf', style: TextStyle(fontWeight: FontWeight.bold)), numeric: true),
                  ],
                  rows: [
                    ...categoryProducts.map((product) => DataRow(
                      cells: [
                        DataCell(Text(product['name'] ?? '')),
                        DataCell(Text(_formatNumber(product['price']))),
                        DataCell(Text('${product['initialStock'] ?? 0}')),
                        DataCell(Text('${product['incoming'] ?? 0}')),
                        DataCell(Text('${product['stockTotal'] ?? 0}')),
                        DataCell(Text('${product['outgoing'] ?? 0}')),
                        DataCell(Text('${product['finalStock'] ?? 0}')),
                        DataCell(Text(_formatNumber(product['costPrice']))),
                        DataCell(Text(_formatNumber(product['price']))),
                        DataCell(Text('${product['totalSales'] ?? 0}')),
                        DataCell(Text(_formatNumber(product['revenue']))),
                        DataCell(Text(_formatNumber(product['profit']))),
                      ],
                    )),
                    
                    // Sous-total de la catégorie
                    DataRow(
                      color: WidgetStateProperty.all(Colors.grey[200]),
                      cells: [
                        const DataCell(Text('Sous-total', style: TextStyle(fontWeight: FontWeight.bold))),
                        const DataCell(Text('-')),
                        DataCell(Text('${categoryTotals['initialStock']}', style: const TextStyle(fontWeight: FontWeight.bold))),
                        DataCell(Text('${categoryTotals['incoming']}', style: const TextStyle(fontWeight: FontWeight.bold))),
                        DataCell(Text('${(categoryTotals['initialStock'] ?? 0) + (categoryTotals['incoming'] ?? 0)}', style: const TextStyle(fontWeight: FontWeight.bold))),
                        DataCell(Text('${categoryTotals['outgoing']}', style: const TextStyle(fontWeight: FontWeight.bold))),
                        DataCell(Text('${categoryTotals['finalStock']}', style: const TextStyle(fontWeight: FontWeight.bold))),
                        const DataCell(Text('-')),
                        const DataCell(Text('-')),
                        DataCell(Text('${categoryTotals['totalSales']}', style: const TextStyle(fontWeight: FontWeight.bold))),
                        DataCell(Text(_formatNumber(categoryTotals['revenue']), style: const TextStyle(fontWeight: FontWeight.bold))),
                        DataCell(Text(_formatNumber(categoryTotals['profit']), style: const TextStyle(fontWeight: FontWeight.bold))),
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
    
    // Total général
    final grandTotals = _products.fold<Map<String, num>>(
      {
        'initialStock': 0,
        'incoming': 0,
        'outgoing': 0,
        'finalStock': 0,
        'totalSales': 0,
        'revenue': 0,
        'profit': 0,
      },
      (acc, product) {
        acc['initialStock'] = (acc['initialStock'] ?? 0) + (product['initialStock'] ?? 0);
        acc['incoming'] = (acc['incoming'] ?? 0) + (product['incoming'] ?? 0);
        acc['outgoing'] = (acc['outgoing'] ?? 0) + (product['outgoing'] ?? 0);
        acc['finalStock'] = (acc['finalStock'] ?? 0) + (product['finalStock'] ?? 0);
        acc['totalSales'] = (acc['totalSales'] ?? 0) + (product['totalSales'] ?? 0);
        acc['revenue'] = (acc['revenue'] ?? 0) + (product['revenue'] ?? 0);
        acc['profit'] = (acc['profit'] ?? 0) + (product['profit'] ?? 0);
        return acc;
      },
    );
    
    widgets.add(
      Card(
        color: Colors.blue[50],
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'TOTAL GÉNÉRAL',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.blue,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildTotalItem('Stock Initial', '${grandTotals['initialStock']}'),
                  _buildTotalItem('Entrées', '${grandTotals['incoming']}'),
                  _buildTotalItem('Sorties', '${grandTotals['outgoing']}'),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildTotalItem('Stock Final', '${grandTotals['finalStock']}'),
                  _buildTotalItem('Ventes', '${grandTotals['totalSales']}'),
                  _buildTotalItem('CA', '${_formatNumber(grandTotals['revenue'])} BIF'),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildTotalItem('Bénéfice', '${_formatNumber(grandTotals['profit'])} BIF', color: Colors.green),
                ],
              ),
            ],
          ),
        ),
      ),
    );
    
    return widgets;
  }

  Widget _buildTotalItem(String label, String value, {Color? color}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        Text(
          value,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color ?? Colors.black87,
          ),
        ),
      ],
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

  Widget _buildTopProductsChart() {
    // Trier les produits par quantité vendue (top 5)
    final topProducts = List<Map<String, dynamic>>.from(_products)
      ..sort((a, b) => (b['totalSales'] ?? 0).compareTo(a['totalSales'] ?? 0));
    
    final top5 = topProducts.take(5).toList();
    
    if (top5.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Center(
            child: Text(
              'Aucune vente pour cette date',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),
        ),
      );
    }
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ...top5.asMap().entries.map((entry) {
              final index = entry.key;
              final product = entry.value;
              final totalSales = product['totalSales'] ?? 0;
              final revenue = product['revenue'] ?? 0;
              final maxSales = top5.first['totalSales'] ?? 1;
              final percentage = (totalSales / maxSales * 100).clamp(0, 100);
              
              final colors = [
                Colors.blue,
                Colors.green,
                Colors.orange,
                Colors.purple,
                Colors.teal,
              ];
              
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            '${index + 1}. ${product['name']}',
                            style: const TextStyle(
                              fontWeight: FontWeight.w500,
                              fontSize: 14,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          '$totalSales vendus',
                          style: TextStyle(
                            color: colors[index],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        Expanded(
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: percentage / 100,
                              backgroundColor: Colors.grey[200],
                              valueColor: AlwaysStoppedAnimation<Color>(colors[index]),
                              minHeight: 8,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '${_formatNumber(revenue)} BIF',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryPieChart() {
    // Calculer les totaux par catégorie
    final categoryTotals = <String, double>{};
    
    for (var product in _products) {
      final category = product['category'] ?? 'Autres';
      final revenue = (product['revenue'] ?? 0).toDouble();
      categoryTotals[category] = (categoryTotals[category] ?? 0) + revenue;
    }
    
    if (categoryTotals.isEmpty) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Center(
            child: Text(
              'Aucune donnée de catégorie',
              style: TextStyle(color: Colors.grey[600]),
            ),
          ),
        ),
      );
    }
    
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.teal,
      Colors.pink,
      Colors.indigo,
      Colors.amber,
    ];
    
    final totalRevenue = categoryTotals.values.fold<double>(0, (sum, val) => sum + val);
    
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Légende
            ...categoryTotals.entries.toList().asMap().entries.map((entry) {
              final index = entry.key;
              final categoryEntry = entry.value;
              final category = categoryEntry.key;
              final revenue = categoryEntry.value;
              final percentage = (revenue / totalRevenue * 100);
              
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: colors[index % colors.length],
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        category,
                        style: const TextStyle(
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                    Text(
                      '${percentage.toStringAsFixed(1)}%',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      '${_formatNumber(revenue)} BIF',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }
}
