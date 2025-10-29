import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final ApiService _apiService = ApiService();
  
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = false;
  String _filter = 'all'; // all, unread, read
  
  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    setState(() => _isLoading = true);
    
    try {
      // Endpoint: GET /api/alerts/
      final response = await _apiService.get('/alerts/');
      
      if (response.statusCode == 200) {
        final results = response.data['results'] ?? [];
        
        setState(() {
          _notifications = results.map<Map<String, dynamic>>((alert) {
            return {
              'id': alert['id'],
              'type': alert['type'] ?? 'info',
              'message': alert['message'] ?? 'Notification',
              'product': alert['product']?['name'] ?? '',
              'productId': alert['product']?['id'],
              'isResolved': alert['is_resolved'] ?? false,
              'createdAt': alert['created_at'],
              'resolvedAt': alert['resolved_at'],
            };
          }).toList();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead(int alertId) async {
    try {
      // Endpoint: PATCH /api/alerts/{id}/
      await _apiService.patch('/alerts/alerts/$alertId/', data: {
        'is_resolved': true,
      });
      
      await _loadNotifications();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification marquée comme lue')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  Future<void> _deleteNotification(int alertId) async {
    try {
      // Endpoint: DELETE /api/alerts/{id}/
      await _apiService.delete('/alerts/alerts/$alertId/');
      
      await _loadNotifications();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Notification supprimée')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  List<Map<String, dynamic>> get _filteredNotifications {
    switch (_filter) {
      case 'unread':
        return _notifications.where((n) => !n['isResolved']).toList();
      case 'read':
        return _notifications.where((n) => n['isResolved']).toList();
      default:
        return _notifications;
    }
  }

  @override
  Widget build(BuildContext context) {
    final unreadCount = _notifications.where((n) => !n['isResolved']).length;
    
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Notifications'),
            if (unreadCount > 0)
              Text(
                '$unreadCount non lue${unreadCount > 1 ? 's' : ''}',
                style: const TextStyle(fontSize: 12),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadNotifications,
          ),
          if (unreadCount > 0)
            IconButton(
              icon: const Icon(Icons.done_all),
              onPressed: _markAllAsRead,
              tooltip: 'Tout marquer comme lu',
            ),
        ],
      ),
      body: Column(
        children: [
          // Filtres
          Container(
            padding: const EdgeInsets.all(16),
            child: SegmentedButton<String>(
              segments: const [
                ButtonSegment(
                  value: 'all',
                  label: Text('Toutes'),
                  icon: Icon(Icons.notifications),
                ),
                ButtonSegment(
                  value: 'unread',
                  label: Text('Non lues'),
                  icon: Icon(Icons.mark_email_unread),
                ),
                ButtonSegment(
                  value: 'read',
                  label: Text('Lues'),
                  icon: Icon(Icons.mark_email_read),
                ),
              ],
              selected: {_filter},
              onSelectionChanged: (Set<String> newSelection) {
                setState(() {
                  _filter = newSelection.first;
                });
              },
            ),
          ),
          
          // Liste des notifications
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredNotifications.isEmpty
                    ? _buildEmptyState()
                    : RefreshIndicator(
                        onRefresh: _loadNotifications,
                        child: ListView.builder(
                          itemCount: _filteredNotifications.length,
                          itemBuilder: (context, index) {
                            final notification = _filteredNotifications[index];
                            return _buildNotificationCard(notification);
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    String message;
    IconData icon;
    
    switch (_filter) {
      case 'unread':
        message = 'Aucune notification non lue';
        icon = Icons.mark_email_read;
        break;
      case 'read':
        message = 'Aucune notification lue';
        icon = Icons.inbox;
        break;
      default:
        message = 'Aucune notification';
        icon = Icons.notifications_none;
    }
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 64, color: Colors.grey),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(fontSize: 16, color: Colors.grey),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(Map<String, dynamic> notification) {
    final isUnread = !notification['isResolved'];
    final type = notification['type'];
    
    // Déterminer l'icône et la couleur selon le type
    IconData icon;
    Color color;
    
    switch (type) {
      case 'low_stock':
        icon = Icons.inventory_2;
        color = Colors.orange;
        break;
      case 'out_of_stock':
        icon = Icons.remove_shopping_cart;
        color = Colors.red;
        break;
      case 'high_sales':
        icon = Icons.trending_up;
        color = Colors.green;
        break;
      case 'expiring_soon':
        icon = Icons.schedule;
        color = Colors.amber;
        break;
      default:
        icon = Icons.info;
        color = Colors.blue;
    }
    
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: isUnread ? 4 : 1,
      color: isUnread ? Colors.blue.shade50 : null,
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color),
        ),
        title: Text(
          notification['message'],
          style: TextStyle(
            fontWeight: isUnread ? FontWeight.bold : FontWeight.normal,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (notification['product'].isNotEmpty)
              Text(
                'Produit: ${notification['product']}',
                style: const TextStyle(fontSize: 12),
              ),
            const SizedBox(height: 4),
            Text(
              _formatDate(notification['createdAt']),
              style: const TextStyle(fontSize: 11, color: Colors.grey),
            ),
          ],
        ),
        trailing: PopupMenuButton<String>(
          onSelected: (value) {
            switch (value) {
              case 'mark_read':
                _markAsRead(notification['id']);
                break;
              case 'delete':
                _showDeleteConfirmation(notification['id']);
                break;
              case 'view_product':
                if (notification['productId'] != null) {
                  _viewProduct(notification['productId']);
                }
                break;
            }
          },
          itemBuilder: (context) => [
            if (isUnread)
              const PopupMenuItem(
                value: 'mark_read',
                child: Row(
                  children: [
                    Icon(Icons.done, size: 20),
                    SizedBox(width: 8),
                    Text('Marquer comme lu'),
                  ],
                ),
              ),
            if (notification['productId'] != null)
              const PopupMenuItem(
                value: 'view_product',
                child: Row(
                  children: [
                    Icon(Icons.visibility, size: 20),
                    SizedBox(width: 8),
                    Text('Voir le produit'),
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
        ),
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return '';
    
    try {
      final date = DateTime.parse(dateStr);
      final now = DateTime.now();
      final difference = now.difference(date);
      
      if (difference.inMinutes < 1) {
        return 'À l\'instant';
      } else if (difference.inHours < 1) {
        return 'Il y a ${difference.inMinutes} min';
      } else if (difference.inDays < 1) {
        return 'Il y a ${difference.inHours}h';
      } else if (difference.inDays < 7) {
        return 'Il y a ${difference.inDays}j';
      } else {
        return DateFormat('dd/MM/yyyy HH:mm').format(date);
      }
    } catch (e) {
      return '';
    }
  }

  Future<void> _markAllAsRead() async {
    final unreadNotifications = _notifications.where((n) => !n['isResolved']).toList();
    
    try {
      for (var notification in unreadNotifications) {
        await _apiService.patch('/alerts/alerts/${notification['id']}/', data: {
          'is_resolved': true,
        });
      }
      
      await _loadNotifications();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Toutes les notifications marquées comme lues')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }

  void _showDeleteConfirmation(int alertId) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer la notification'),
        content: const Text('Êtes-vous sûr de vouloir supprimer cette notification ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _deleteNotification(alertId);
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }

  void _viewProduct(int productId) {
    // Navigation vers la page produit
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Voir produit #$productId')),
    );
    // TODO: Implémenter la navigation vers ProductDetailPage
  }
}
