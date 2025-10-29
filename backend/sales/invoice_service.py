"""
Service de génération automatique de factures
"""

from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from django.conf import settings
from decimal import Decimal
import json


class InvoiceService:
    """Service pour générer des factures automatiquement"""
    
    @staticmethod
    def generate_invoice_data(sale):
        """Générer les données de facture pour une vente"""
        
        # Informations de l'entreprise (à personnaliser selon le restaurant)
        company_info = {
            'name': getattr(settings, 'RESTAURANT_NAME', 'Bar Stock Wise'),
            'address': getattr(settings, 'RESTAURANT_ADDRESS', 'Bujumbura, Burundi'),
            'phone': getattr(settings, 'RESTAURANT_PHONE', '+257 XX XX XX XX'),
            'email': 'contact@barstockwise.bi',
            'tax_number': 'NIF: 4000123456',  # Numéro d'Identification Fiscale Burundi
            'logo_url': '/static/images/logo.png',  # Logo du restaurant
            'website': 'www.barstockwise.bi'
        }
        
        # Informations client et vente
        customer_info = {
            'name': sale.customer_name or 'Client',
            'table': f"Table {sale.table.number}" if sale.table else 'À emporter',
            'table_location': sale.table.location if sale.table and sale.table.location else '',
            'date': sale.created_at.strftime('%d/%m/%Y'),
            'time': sale.created_at.strftime('%H:%M'),
            'datetime_full': sale.created_at.strftime('%d/%m/%Y à %H:%M'),
            'sale_id': sale.id,
            'reference': sale.reference
        }
        
        # Articles de la facture avec détails enrichis
        invoice_items = []
        subtotal = Decimal('0.00')
        total_quantity = 0

        for item in sale.items.all():
            item_total = item.quantity * item.unit_price
            subtotal += item_total
            total_quantity += item.quantity

            invoice_items.append({
                'name': item.product.name,
                'category': item.product.category.name if item.product.category else 'Divers',
                'quantity': item.quantity,
                'unit_price': float(item.unit_price),
                'total': float(item_total),
                'notes': item.notes or '',
                'product_code': item.product.code or f"P{item.product.id:04d}",
                'unit': 'pièce'  # Unité de mesure
            })
        
        # Calculs financiers (sans TVA)
        tax_amount = Decimal('0.00')  # Pas de TVA
        discount_amount = sale.discount_amount or Decimal('0.00')
        total_amount = subtotal - discount_amount
        
        # Informations sur le serveur
        server_info = {
            'name': sale.server.get_full_name() if sale.server else 'N/A',
            'username': sale.server.username if sale.server else 'N/A',
            'id': sale.server.id if sale.server else None
        }

        # Informations de paiement et statut
        payment_info = {
            'method': sale.get_payment_method_display() if sale.payment_method else 'Espèces',
            'method_code': sale.payment_method if sale.payment_method else 'cash',
            'status': sale.get_status_display() if hasattr(sale, 'get_status_display') else sale.status,
            'paid_at': sale.created_at.strftime('%d/%m/%Y à %H:%M'),
            'currency': 'BIF',  # Franc Burundais
            'currency_symbol': 'FBu'
        }

        invoice_data = {
            'invoice_number': sale.reference,
            'company': company_info,
            'customer': customer_info,
            'server': server_info,
            'payment': payment_info,
            'items': invoice_items,
            'summary': {
                'total_items': len(invoice_items),
                'total_quantity': total_quantity,
                'subtotal': float(subtotal),
                'tax_amount': float(tax_amount),
                'tax_rate': 0.0,  # 0% TVA au Burundi pour la restauration
                'discount_amount': float(discount_amount),
                'total_amount': float(total_amount),
                'amount_in_words': InvoiceService._amount_to_words(float(total_amount))
            },
            'metadata': {
                'created_at': sale.created_at.isoformat(),
                'generated_at': timezone.now().isoformat(),
                'version': '1.0',
                'system': 'BarStockWise'
            },
            'notes': sale.notes or '',
            'footer_message': 'Merci de votre visite ! À bientôt chez nous.'
        }
        
        return invoice_data

    @staticmethod
    def _amount_to_words(amount):
        """Convertir un montant en mots (français)"""
        try:
            # Conversion basique pour les montants en francs burundais
            if amount == 0:
                return "Zéro franc burundais"

            # Pour les montants simples, on peut utiliser une conversion basique
            units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"]
            teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"]
            tens = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"]

            # Conversion simplifiée pour les montants jusqu'à 999999
            if amount < 1000000:
                return f"{int(amount):,} francs burundais".replace(",", " ")
            else:
                return f"{int(amount):,} francs burundais".replace(",", " ")

        except Exception:
            return f"{int(amount):,} francs burundais".replace(",", " ")
    
    @staticmethod
    def generate_invoice_html(sale):
        """Générer le HTML de la facture"""
        
        invoice_data = InvoiceService.generate_invoice_data(sale)
        
        html_template = """
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Facture {{ invoice_number }}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
                .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
                .company-name { font-size: 24px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
                .company-info { font-size: 12px; color: #666; }
                .invoice-info { display: flex; justify-content: space-between; margin-bottom: 30px; }
                .customer-info, .invoice-details { width: 45%; }
                .section-title { font-weight: bold; color: #2563eb; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                .items-table th { background-color: #f8f9fa; font-weight: bold; }
                .items-table .number { text-align: right; }
                .totals { float: right; width: 300px; }
                .totals table { width: 100%; }
                .totals td { padding: 5px 10px; }
                .total-row { font-weight: bold; font-size: 16px; background-color: #f8f9fa; }
                .footer { clear: both; margin-top: 50px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
                .no-tax { color: #059669; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-name">{{ company.name }}</div>
                <div class="company-info">
                    {{ company.address }}<br>
                    Tél: {{ company.phone }} | Email: {{ company.email }}<br>
                    {{ company.tax_number }}
                </div>
            </div>
            
            <div class="invoice-info">
                <div class="customer-info">
                    <div class="section-title">Informations Client</div>
                    <strong>{{ customer.name }}</strong><br>
                    {{ customer.table }}<br>
                    Serveur: {{ server }}
                </div>
                <div class="invoice-details">
                    <div class="section-title">Détails Facture</div>
                    <strong>N° {{ invoice_number }}</strong><br>
                    Date: {{ customer.date }}<br>
                    Paiement: {{ payment_method }}<br>
                    Statut: {{ status }}
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Article</th>
                        <th class="number">Qté</th>
                        <th class="number">Prix Unit.</th>
                        <th class="number">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {% for item in items %}
                    <tr>
                        <td>
                            {{ item.name }}
                            {% if item.notes %}<br><small style="color: #666;">{{ item.notes }}</small>{% endif %}
                        </td>
                        <td class="number">{{ item.quantity }}</td>
                        <td class="number">{{ item.unit_price|floatformat:0 }} FBu</td>
                        <td class="number">{{ item.total|floatformat:0 }} FBu</td>
                    </tr>
                    {% endfor %}
                </tbody>
            </table>
            
            <div class="totals">
                <table>
                    <tr>
                        <td>Sous-total:</td>
                        <td class="number">{{ subtotal|floatformat:0 }} FBu</td>
                    </tr>
                    <tr>
                        <td class="no-tax">TVA (0%):</td>
                        <td class="number no-tax">{{ tax_amount|floatformat:0 }} FBu</td>
                    </tr>
                    {% if discount_amount > 0 %}
                    <tr>
                        <td>Remise:</td>
                        <td class="number">-{{ discount_amount|floatformat:0 }} FBu</td>
                    </tr>
                    {% endif %}
                    <tr class="total-row">
                        <td>TOTAL:</td>
                        <td class="number">{{ total_amount|floatformat:0 }} FBu</td>
                    </tr>
                </table>
            </div>
            
            <div class="footer">
                {% if notes %}
                <p><strong>Notes:</strong> {{ notes }}</p>
                {% endif %}
                <p>Merci de votre visite ! À bientôt chez {{ company.name }}</p>
                <p>Facture générée automatiquement le {{ customer.date }}</p>
            </div>
        </body>
        </html>
        """
        
        # Remplacer les variables dans le template
        html = html_template
        for key, value in invoice_data.items():
            if isinstance(value, dict):
                for subkey, subvalue in value.items():
                    html = html.replace(f"{{{{ {key}.{subkey} }}}}", str(subvalue))
            elif isinstance(value, list):
                # Gérer les items
                if key == 'items':
                    items_html = ""
                    for item in value:
                        items_html += f"""
                        <tr>
                            <td>
                                {item['name']}
                                {'<br><small style="color: #666;">' + item['notes'] + '</small>' if item['notes'] else ''}
                            </td>
                            <td class="number">{item['quantity']}</td>
                            <td class="number">{item['unit_price']:,.0f} FBu</td>
                            <td class="number">{item['total']:,.0f} FBu</td>
                        </tr>
                        """
                    html = html.replace("{% for item in items %}...{% endfor %}", items_html)
            else:
                html = html.replace(f"{{{{ {key} }}}}", str(value))
        
        # Nettoyer les balises template restantes
        html = html.replace("{% for item in items %}", "")
        html = html.replace("{% endfor %}", "")
        html = html.replace("{% if item.notes %}", "")
        html = html.replace("{% endif %}", "")
        html = html.replace("{% if discount_amount > 0 %}", "" if invoice_data['discount_amount'] <= 0 else "")
        html = html.replace("{% if notes %}", "" if not invoice_data['notes'] else "")
        html = html.replace("|floatformat:0", "")
        
        return html
    
    @staticmethod
    def generate_invoice_json(sale):
        """Générer les données de facture en JSON"""
        invoice_data = InvoiceService.generate_invoice_data(sale)
        return json.dumps(invoice_data, indent=2, ensure_ascii=False)
    
    @staticmethod
    def auto_generate_invoice(sale):
        """Générer automatiquement une facture lors de la validation d'une vente"""
        try:
            # Générer les données de facture
            invoice_data = InvoiceService.generate_invoice_data(sale)
            
            # Ici, on pourrait sauvegarder la facture en base de données
            # ou l'envoyer par email, etc.
            
            print(f"📄 Facture générée automatiquement pour la vente {sale.reference}")
            print(f"   Client: {invoice_data['customer']['name']}")
            print(f"   Total: {invoice_data['summary']['total_amount']:,.0f} FBu")
            print(f"   Articles: {len(invoice_data['items'])}")
            
            return invoice_data
            
        except Exception as e:
            print(f"❌ Erreur génération facture pour {sale.reference}: {e}")
            return None
