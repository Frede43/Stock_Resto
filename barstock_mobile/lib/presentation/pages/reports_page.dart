import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';

class ReportsPage extends StatefulWidget {
  const ReportsPage({super.key});

  @override
  _ReportsPageState createState() => _ReportsPageState();
}

class _ReportsPageState extends State<ReportsPage> {
  final ApiService _apiService = ApiService();
  
  Map<String, dynamic> _stats = {};
  bool _isLoading = false;
  String _selectedPeriod = 'today'; // today, week, month

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() => _isLoading = true);
    
    try {
      final response = await _apiService.get('/dashboard/stats/');
      if (response.statusCode == 200) {
        setState(() {
          _stats = response.data;
        });
      }
    } catch (e) {
      // Ignorer l'erreur silencieusement
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Rapports et Statistiques'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadReports,
          ),
          IconButton(
            icon: const Icon(Icons.download),
            onPressed: () {
              // TODO: Export PDF
            },
          ),
          
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadReports,
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Sélecteur de période
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Période',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 12),
                            SegmentedButton<String>(
                              segments: const [
                                ButtonSegment(
                                  value: 'today',
                                  label: Text('Aujourd\'hui'),
                                  icon: Icon(Icons.today),
                                ),
                                ButtonSegment(
                                  value: 'week',
                                  label: Text('Semaine'),
                                  icon: Icon(Icons.date_range),
                                ),
                                ButtonSegment(
                                  value: 'month',
                                  label: Text('Mois'),
                                  icon: Icon(Icons.calendar_month),
                                ),
                              ],
                              selected: {_selectedPeriod},
                              onSelectionChanged: (Set<String> newSelection) {
                                setState(() {
                                  _selectedPeriod = newSelection.first;
                                });
                              },
                            ),
                          ],
                        ),
                      ),
                    ),
                    
                    const SizedBox(height: 24),
                    
                    // Statistiques principales
                    const Text(
                      'Vue d\'ensemble',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      childAspectRatio: 1.5,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      children: [
                        _buildStatCard(
                          'Ventes totales',
                          '${_formatNumber(_stats['today_sales'])} BIF',
                          Icons.attach_money,
                          Colors.green,
                          subtitle: _stats['sales_change']?.toString() ?? '+0%',
                        ),
                        _buildStatCard(
                          'Commandes',
                          _stats['pending_orders']?.toString() ?? '0',
                          Icons.receipt_long,
                          Colors.blue,
                          subtitle: 'en attente',
                        ),
                        _buildStatCard(
                          'Produits vendus',
                          _stats['total_products']?.toString() ?? '0',
                          Icons.shopping_cart,
                          Colors.orange,
                          subtitle: 'articles',
                        ),
                        _buildStatCard(
                          'Taux occupation',
                          _stats['occupancy_rate']?.toString() ?? '0%',
                          Icons.table_restaurant,
                          Colors.purple,
                          subtitle: 'tables',
                        ),
                      ],
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Graphique des ventes
                    const Text(
                      'Évolution des ventes',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildSalesChart(),
                    
                    const SizedBox(height: 32),
                    
                    // Top produits
                    const Text(
                      'Produits les plus vendus',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildTopProducts(),
                    
                    const SizedBox(height: 32),
                    
                    // Méthodes de paiement
                    const Text(
                      'Méthodes de paiement',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildPaymentMethods(),
                    
                    const SizedBox(height: 32),
                    
                    // Actions
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              // TODO: Export PDF
                            },
                            icon: const Icon(Icons.picture_as_pdf),
                            label: const Text('Exporter PDF'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.red,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.all(16),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton.icon(
                            onPressed: () {
                              // TODO: Export Excel
                            },
                            icon: const Icon(Icons.table_chart),
                            label: const Text('Exporter Excel'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.all(16),
                            ),
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
                fontSize: 20,
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

  Widget _buildSalesChart() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            SizedBox(
              height: 200,
              child: LineChart(
                LineChartData(
                  gridData: const FlGridData(show: true),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 40,
                        getTitlesWidget: (value, meta) {
                          return Text(
                            '${(value / 1000).toInt()}k',
                            style: const TextStyle(fontSize: 10),
                          );
                        },
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (value, meta) {
                          const hours = ['8h', '10h', '12h', '14h', '16h', '18h', '20h', '22h'];
                          if (value.toInt() >= 0 && value.toInt() < hours.length) {
                            return Text(
                              hours[value.toInt()],
                              style: const TextStyle(fontSize: 10),
                            );
                          }
                          return const Text('');
                        },
                      ),
                    ),
                    rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                    topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  ),
                  borderData: FlBorderData(show: true),
                  lineBarsData: [
                    LineChartBarData(
                      spots: [
                        const FlSpot(0, 15000),
                        const FlSpot(1, 32000),
                        const FlSpot(2, 45000),
                        const FlSpot(3, 38000),
                        const FlSpot(4, 52000),
                        const FlSpot(5, 61000),
                        const FlSpot(6, 75000),
                        const FlSpot(7, 68000),
                      ],
                      isCurved: true,
                      color: Colors.green,
                      barWidth: 3,
                      dotData: const FlDotData(show: true),
                      belowBarData: BarAreaData(
                        show: true,
                        color: Colors.green.withValues(alpha: 0.1),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTopProducts() {
    final products = [
      {'name': 'Primus', 'sales': 150, 'revenue': 300000},
      {'name': 'Coca-Cola', 'sales': 120, 'revenue': 180000},
      {'name': 'Brochettes', 'sales': 80, 'revenue': 240000},
      {'name': 'Fanta', 'sales': 75, 'revenue': 112500},
      {'name': 'Chips', 'sales': 60, 'revenue': 90000},
    ];
    
    return Card(
      child: Column(
        children: products.map((product) {
          return ListTile(
            leading: const CircleAvatar(
              backgroundColor: Colors.blue,
              child: Icon(Icons.restaurant, color: Colors.white),
            ),
            title: Text(product['name'] as String),
            subtitle: Text('${product['sales']} ventes'),
            trailing: Text(
              '${_formatNumber(product['revenue'])} BIF',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildPaymentMethods() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildPaymentRow('Espèces', 65, Colors.green),
            const SizedBox(height: 12),
            _buildPaymentRow('Carte bancaire', 25, Colors.blue),
            const SizedBox(height: 12),
            _buildPaymentRow('Mobile Money', 10, Colors.orange),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentRow(String method, int percentage, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(method),
            Text(
              '$percentage%',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 4),
        LinearProgressIndicator(
          value: percentage / 100,
          backgroundColor: Colors.grey[200],
          valueColor: AlwaysStoppedAnimation<Color>(color),
          minHeight: 8,
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
}
