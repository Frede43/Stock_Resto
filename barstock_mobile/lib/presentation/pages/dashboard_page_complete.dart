import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/dashboard_service.dart';
import '../../services/auth_service.dart';
import '../../core/config/app_config.dart';
import 'package:fl_chart/fl_chart.dart';
import 'sales_page.dart';
import 'sales_history_page.dart';
import 'products_page.dart';
import 'tables_page.dart';
import 'daily_report_page.dart';
import 'settings_page.dart';

class DashboardPageComplete extends StatefulWidget {
  const DashboardPageComplete({super.key});

  @override
  _DashboardPageCompleteState createState() => _DashboardPageCompleteState();
}

class _DashboardPageCompleteState extends State<DashboardPageComplete> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardService>().loadDashboardData();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Consumer<DashboardService>(
        builder: (context, dashboardService, child) {
          if (dashboardService.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          final stats = dashboardService.dashboardStats;
          final notifications = dashboardService.notifications;
          final topProducts = dashboardService.topProducts;

          return RefreshIndicator(
            onRefresh: () => dashboardService.loadDashboardData(),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // En-tête avec mode démo
                  if (AppConfig.isDemoMode)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: Colors.blue.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                            color: Colors.blue.withValues(alpha: 0.3)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.dashboard, color: Colors.blue),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'Tableau de bord en mode démo - Données simulées',
                              style: TextStyle(
                                color: Colors.blue,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Titre et bouton actualiser
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '📊 Dashboard Complet',
                            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Vue d\'ensemble en temps réel',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: Colors.grey[600],
                                ),
                          ),
                        ],
                      ),
                      IconButton(
                        onPressed: () => dashboardService.loadDashboardData(),
                        icon: const Icon(Icons.refresh),
                        tooltip: 'Actualiser',
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Statistiques principales (5 cartes)
                  Text(
                    'Statistiques du jour',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),

                  // Grille 2x3 pour les stats
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.3,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    children: [
                      _buildStatCard(
                        'Ventes du jour',
                        '${_formatNumber(stats['totalSales'])} BIF',
                        Icons.attach_money,
                        Colors.green,
                        subtitle: stats['salesChange']?.toString() ?? '+0%',
                      ),
                      _buildStatCard(
                        'Commandes',
                        stats['totalOrders']?.toString() ?? '0',
                        Icons.receipt_long,
                        Colors.blue,
                        subtitle: '${stats['totalOrders'] ?? 0} en attente',
                      ),
                      _buildStatCard(
                        'Produits',
                        stats['totalProducts']?.toString() ?? '0',
                        Icons.inventory,
                        Colors.orange,
                        subtitle: 'actifs',
                      ),
                      _buildStatCard(
                        'Alertes',
                        stats['lowStockAlerts']?.toString() ?? '0',
                        Icons.warning,
                        Colors.red,
                        subtitle: 'stock bas',
                      ),
                      _buildStatCard(
                        'Tables',
                        '${stats['occupiedTables'] ?? 0}/${stats['totalTables'] ?? 0}',
                        Icons.table_restaurant,
                        Colors.purple,
                        subtitle: stats['occupancyRate']?.toString() ?? '0%',
                      ),
                      _buildStatCard(
                        'Revenus',
                        '${_formatNumber(stats['totalSales'])} BIF',
                        Icons.trending_up,
                        Colors.teal,
                        subtitle: 'aujourd\'hui',
                      ),
                    ],
                  ),

                  const SizedBox(height: 32),

                  // Graphique des ventes
                  Text(
                    'Évolution des ventes',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  _buildSalesChart(),

                  const SizedBox(height: 32),

                  // Actions rapides
                  Text(
                    'Actions rapides',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),
                  _buildQuickActions(),

                  const SizedBox(height: 32),

                  // Notifications récentes
                  Text(
                    'Notifications récentes',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),

                  if (notifications.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Center(
                        child: Text(
                          'Aucune notification récente',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    )
                  else
                    ...notifications.take(5).map(
                          (notification) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor:
                                    _getNotificationColor(notification['type']),
                                child: Icon(
                                  _getNotificationIcon(notification['type']),
                                  color: Colors.white,
                                  size: 20,
                                ),
                              ),
                              title: Text(notification['title'] ?? ''),
                              subtitle: Text(notification['message'] ?? ''),
                              trailing: Text(
                                _formatTime(notification['timestamp']),
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey,
                                ),
                              ),
                            ),
                          ),
                        ),

                  const SizedBox(height: 32),

                  // Produits populaires
                  Text(
                    'Produits populaires',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),

                  if (topProducts.isEmpty)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Center(
                        child: Text(
                          'Aucun produit disponible',
                          style: TextStyle(color: Colors.grey),
                        ),
                      ),
                    )
                  else
                    ...topProducts.take(5).map(
                          (product) => Card(
                            margin: const EdgeInsets.only(bottom: 8),
                            child: ListTile(
                              leading: CircleAvatar(
                                backgroundColor: Colors.blue[100],
                                child: const Icon(
                                  Icons.restaurant,
                                  color: Colors.blue,
                                ),
                              ),
                              title: Text(product['name'] ?? ''),
                              subtitle: Text('${product['sales'] ?? 0} ventes'),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    '${_formatNumber(product['price'])} BIF',
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      color: Colors.green,
                                    ),
                                  ),
                                  Text(
                                    'Stock: ${product['stock'] ?? 0}',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.grey[600],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),

                  const SizedBox(height: 32),

                  // Produits en stock bas
                  Text(
                    '⚠️ Alertes stock bas',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                  ),
                  const SizedBox(height: 16),
                  _buildLowStockAlerts(stats),

                  const SizedBox(height: 32),
                ],
              ),
            ),
          );
        },
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
                  child: Icon(
                    icon,
                    size: 24,
                    color: color,
                  ),
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
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Ventes par heure',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.green.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    'Aujourd\'hui',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
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

  Widget _buildQuickActions() {
    return GridView.count(
      crossAxisCount: 3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.0,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      children: [
        _buildActionCard(
          'Nouvelle vente',
          Icons.add_shopping_cart,
          Colors.blue,
          () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const SalesPage()),
            );
          },
        ),
        _buildActionCard(
          'Historique',
          Icons.history,
          Colors.orange,
          () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const SalesHistoryPage()),
            );
          },
        ),
        _buildActionCard(
          'Produits',
          Icons.inventory,
          Colors.green,
          () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const ProductsPage()),
            );
          },
        ),
        _buildActionCard(
          'Tables',
          Icons.table_restaurant,
          Colors.purple,
          () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const TablesPage()),
            );
          },
        ),
        _buildActionCard(
          'Rapports',
          Icons.bar_chart,
          Colors.teal,
          () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const DailyReportPage()),
            );
          },
        ),
        _buildActionCard(
          'Paramètres',
          Icons.settings,
          Colors.grey,
          () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const SettingsPage()),
            );
          },
        ),
      ],
    );
  }

  Widget _buildActionCard(String title, IconData icon, Color color, VoidCallback onTap) {
    return Card(
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(
                icon,
                size: 32,
                color: color,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLowStockAlerts(Map<String, dynamic> stats) {
    final lowStockCount = stats['lowStockAlerts'] ?? 0;

    if (lowStockCount == 0) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.green.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: Colors.green.withValues(alpha: 0.3)),
        ),
        child: const Row(
          children: [
            Icon(Icons.check_circle, color: Colors.green),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Tous les produits ont un stock suffisant',
                style: TextStyle(color: Colors.green),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.red.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Icon(Icons.warning, color: Colors.red),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  '$lowStockCount produit(s) nécessitent un réapprovisionnement',
                  style: const TextStyle(
                    color: Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          ElevatedButton.icon(
            onPressed: () {
              // Navigation vers la page des produits en stock bas
            },
            icon: const Icon(Icons.inventory),
            label: const Text('Voir les produits'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Color _getNotificationColor(String? type) {
    switch (type) {
      case 'order':
        return Colors.blue;
      case 'payment':
        return Colors.green;
      case 'kitchen':
        return Colors.orange;
      case 'alert':
      case 'stock':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getNotificationIcon(String? type) {
    switch (type) {
      case 'order':
        return Icons.receipt_long;
      case 'payment':
        return Icons.payment;
      case 'kitchen':
        return Icons.restaurant;
      case 'alert':
      case 'stock':
        return Icons.warning;
      default:
        return Icons.notifications;
    }
  }

  String _formatTime(dynamic timestamp) {
    if (timestamp == null) return '';

    try {
      final DateTime dateTime;
      if (timestamp is String) {
        dateTime = DateTime.parse(timestamp);
      } else if (timestamp is int) {
        dateTime = DateTime.fromMillisecondsSinceEpoch(timestamp);
      } else {
        return '';
      }

      final now = DateTime.now();
      final difference = now.difference(dateTime);

      if (difference.inMinutes < 1) {
        return 'À l\'instant';
      } else if (difference.inMinutes < 60) {
        return 'Il y a ${difference.inMinutes}min';
      } else if (difference.inHours < 24) {
        return 'Il y a ${difference.inHours}h';
      } else {
        return 'Il y a ${difference.inDays}j';
      }
    } catch (e) {
      return '';
    }
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
