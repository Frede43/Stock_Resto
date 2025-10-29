import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../services/dashboard_service.dart';
import '../../core/config/app_config.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  _DashboardPageState createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
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

                  // Statistiques principales
                  Text(
                    'Statistiques du jour',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 16),

                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 1.5,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                    children: [
                      _buildStatCard(
                        'Ventes du jour',
                        '${_formatNumber(stats['totalSales'])} BIF',
                        Icons.attach_money,
                        Colors.green,
                      ),
                      _buildStatCard(
                        'Commandes',
                        stats['totalOrders']?.toString() ?? '0',
                        Icons.receipt_long,
                        Colors.blue,
                      ),
                      _buildStatCard(
                        'Produits',
                        stats['totalProducts']?.toString() ?? '0',
                        Icons.inventory,
                        Colors.orange,
                      ),
                      _buildStatCard(
                        'Tables occupées',
                        '${stats['occupiedTables']?.toString() ?? '0'}/${stats['totalTables']?.toString() ?? '0'}',
                        Icons.table_restaurant,
                        Colors.purple,
                      ),
                    ],
                  ),

                  const SizedBox(height: 24),

                  // Notifications récentes
                  Text(
                    'Notifications récentes',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
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

                  const SizedBox(height: 24),

                  // Produits populaires
                  Text(
                    'Produits populaires',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
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
                              trailing: Text(
                                '${_formatNumber(product['price'])} BIF',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.green,
                                ),
                              ),
                            ),
                          ),
                        ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) {
    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              size: 32,
              color: color,
            ),
            const SizedBox(height: 8),
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
              textAlign: TextAlign.center,
            ),
          ],
        ),
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
