import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../services/sales_service.dart';

/// Bouton pour marquer une vente comme payée
/// 
/// Affiche un bouton vert avec le montant
/// Demande confirmation avant de marquer comme payé
/// Appelle l'API et affiche un toast de succès/erreur
class PayButton extends StatefulWidget {
  final Map<String, dynamic> sale;
  final VoidCallback onSuccess;
  final bool isCompact;
  
  const PayButton({
    super.key,
    required this.sale,
    required this.onSuccess,
    this.isCompact = false,
  });
  
  @override
  State<PayButton> createState() => _PayButtonState();
}

class _PayButtonState extends State<PayButton> {
  final SalesService _salesService = SalesService();
  bool _isLoading = false;
  
  /// Formater le montant en FBu
  String _formatAmount(dynamic amount) {
    final value = amount is num ? amount : (double.tryParse(amount.toString()) ?? 0);
    final formatter = NumberFormat('#,###', 'fr_FR');
    return '${formatter.format(value)} FBu';
  }
  
  /// Vérifier si la vente peut être payée
  bool get _canPay {
    final status = widget.sale['status'] ?? '';
    return status != 'paid' && status != 'cancelled' && status != 'completed';
  }
  
  /// Afficher le dialog de confirmation
  Future<bool> _showConfirmDialog() async {
    final amount = _formatAmount(widget.sale['totalAmount'] ?? widget.sale['finalAmount'] ?? 0);
    
    return await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.payment, color: Colors.green),
            SizedBox(width: 10),
            Text('Confirmer le paiement'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Vente: ${widget.sale['reference'] ?? 'N/A'}',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            Text(
              'Montant: $amount',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Colors.green,
              ),
            ),
            const SizedBox(height: 10),
            const Text('Confirmer le paiement ?'),
            const SizedBox(height: 5),
            const Text(
              'Le stock sera mis à jour automatiquement.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton.icon(
            onPressed: () => Navigator.pop(context, true),
            icon: const Icon(Icons.check),
            label: const Text('Confirmer'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.green,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    ) ?? false;
  }
  
  /// Gérer le paiement
  Future<void> _handlePay() async {
    // Demander confirmation
    final confirmed = await _showConfirmDialog();
    if (!confirmed) return;
    
    setState(() => _isLoading = true);
    
    try {
      // Appeler l'API
      final result = await _salesService.markAsPaid(widget.sale['id']);
      
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
                  child: Text('✅ Paiement enregistré ! Stock mis à jour.'),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
        
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
        setState(() => _isLoading = false);
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    // Ne pas afficher si la vente ne peut pas être payée
    if (!_canPay) return const SizedBox.shrink();
    
    final amount = _formatAmount(widget.sale['totalAmount'] ?? widget.sale['finalAmount'] ?? 0);
    
    if (widget.isCompact) {
      // Version compacte (icône seulement)
      return IconButton(
        onPressed: _isLoading ? null : _handlePay,
        icon: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.payment),
        color: Colors.green,
        tooltip: 'Payer - $amount',
      );
    }
    
    // Version complète (bouton avec texte)
    return ElevatedButton.icon(
      onPressed: _isLoading ? null : _handlePay,
      icon: _isLoading
          ? const SizedBox(
              width: 20,
              height: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            )
          : const Icon(Icons.payment),
      label: Text('PAYER - $amount'),
      style: ElevatedButton.styleFrom(
        backgroundColor: Colors.green,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
      ),
    );
  }
}
