import 'package:flutter/material.dart';

/// Badge pour afficher le statut d'une vente
/// 
/// Affiche un badge coloré avec une icône selon le statut
class StatusBadge extends StatelessWidget {
  final String status;
  final bool isCompact;
  
  const StatusBadge({
    super.key,
    required this.status,
    this.isCompact = false,
  });
  
  /// Configuration du badge selon le statut
  Map<String, dynamic> get _config {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          'label': 'En attente',
          'color': Colors.orange,
          'icon': Icons.schedule,
        };
      case 'preparing':
        return {
          'label': 'En préparation',
          'color': Colors.blue,
          'icon': Icons.restaurant,
        };
      case 'ready':
        return {
          'label': 'Prêt',
          'color': Colors.purple,
          'icon': Icons.check_circle_outline,
        };
      case 'served':
        return {
          'label': 'Servi',
          'color': Colors.cyan,
          'icon': Icons.room_service,
        };
      case 'paid':
        return {
          'label': 'Payé',
          'color': Colors.green,
          'icon': Icons.payment,
        };
      case 'completed':
        return {
          'label': 'Terminée',
          'color': Colors.green,
          'icon': Icons.check_circle,
        };
      case 'cancelled':
        return {
          'label': 'Annulée',
          'color': Colors.red,
          'icon': Icons.cancel,
        };
      default:
        return {
          'label': status,
          'color': Colors.grey,
          'icon': Icons.help_outline,
        };
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final config = _config;
    final color = config['color'] as Color;
    final icon = config['icon'] as IconData;
    final label = config['label'] as String;
    
    if (isCompact) {
      // Version compacte (icône seulement)
      return Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Icon(
          icon,
          size: 16,
          color: color,
        ),
      );
    }
    
    // Version complète (icône + texte)
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 16,
            color: color,
          ),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}

/// Widget pour afficher un badge de statut avec tooltip
class StatusBadgeWithTooltip extends StatelessWidget {
  final String status;
  final String? tooltip;
  final bool isCompact;
  
  const StatusBadgeWithTooltip({
    super.key,
    required this.status,
    this.tooltip,
    this.isCompact = false,
  });
  
  @override
  Widget build(BuildContext context) {
    final badge = StatusBadge(
      status: status,
      isCompact: isCompact,
    );
    
    if (tooltip != null) {
      return Tooltip(
        message: tooltip!,
        child: badge,
      );
    }
    
    return badge;
  }
}
