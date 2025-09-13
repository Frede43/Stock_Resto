from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from django.http import HttpResponse
from django.utils import timezone
from io import BytesIO
import os
from decimal import Decimal

class PDFReportGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.title_style = ParagraphStyle(
            'CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            alignment=1,  # Center
            textColor=colors.darkblue
        )
        self.heading_style = ParagraphStyle(
            'CustomHeading',
            parent=self.styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.darkgreen
        )
    
    def create_header(self, doc_title):
        """Créer l'en-tête du document"""
        elements = []
        
        # Titre principal
        title = Paragraph(f"BarStock - {doc_title}", self.title_style)
        elements.append(title)
        
        # Date de génération
        date_str = timezone.now().strftime("%d/%m/%Y à %H:%M")
        date_para = Paragraph(f"Généré le {date_str}", self.styles['Normal'])
        elements.append(date_para)
        elements.append(Spacer(1, 20))
        
        return elements
    
    def generate_daily_report_pdf(self, daily_report, sales_data, stock_alerts):
        """Générer un rapport quotidien en PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        # En-tête
        elements.extend(self.create_header(f"Rapport Quotidien - {daily_report.date.strftime('%d/%m/%Y')}"))
        
        # Résumé des ventes
        elements.append(Paragraph("Résumé des Ventes", self.heading_style))
        
        sales_data_table = [
            ['Indicateur', 'Valeur'],
            ['Nombre de ventes', str(daily_report.total_sales_count)],
            ['Chiffre d\'affaires', f"{daily_report.total_sales:,.0f} BIF"],
            ['Bénéfice brut', f"{daily_report.total_profit:,.0f} BIF"],
            ['Ticket moyen', f"{daily_report.average_sale:,.0f} BIF"],
        ]
        
        sales_table = Table(sales_data_table, colWidths=[3*inch, 2*inch])
        sales_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(sales_table)
        elements.append(Spacer(1, 20))
        
        # Détail des ventes par produit
        if sales_data:
            elements.append(Paragraph("Détail des Ventes par Produit", self.heading_style))
            
            product_data = [['Produit', 'Quantité', 'Montant (BIF)']]
            for sale in sales_data:
                product_data.append([
                    sale['product_name'],
                    str(sale['quantity']),
                    f"{sale['total_amount']:,.0f}"
                ])
            
            product_table = Table(product_data, colWidths=[3*inch, 1*inch, 2*inch])
            product_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(product_table)
            elements.append(Spacer(1, 20))
        
        # Alertes de stock
        if stock_alerts:
            elements.append(Paragraph("Alertes de Stock", self.heading_style))
            
            alert_data = [['Produit', 'Stock Actuel', 'Stock Minimum', 'Type d\'Alerte']]
            for alert in stock_alerts:
                alert_data.append([
                    alert.product.name,
                    str(alert.product.current_stock),
                    str(alert.product.minimum_stock),
                    alert.get_alert_type_display()
                ])
            
            alert_table = Table(alert_data, colWidths=[2.5*inch, 1*inch, 1*inch, 1.5*inch])
            alert_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.red),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.lightyellow),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            elements.append(alert_table)
        
        # Générer le PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
    
    def generate_stock_report_pdf(self, products):
        """Générer un rapport de stock en PDF"""
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        # En-tête
        elements.extend(self.create_header("Rapport de Stock"))
        
        # Tableau des produits
        elements.append(Paragraph("État du Stock", self.heading_style))
        
        stock_data = [['Produit', 'Catégorie', 'Stock Actuel', 'Stock Min.', 'Valeur (BIF)', 'Statut']]
        
        for product in products:
            stock_value = product.current_stock * product.purchase_price
            status = "⚠️ Faible" if product.current_stock <= product.minimum_stock else "✅ OK"
            
            stock_data.append([
                product.name,
                product.category.name,
                str(product.current_stock),
                str(product.minimum_stock),
                f"{stock_value:,.0f}",
                status
            ])
        
        stock_table = Table(stock_data, colWidths=[2*inch, 1.5*inch, 0.8*inch, 0.8*inch, 1*inch, 0.9*inch])
        stock_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkblue),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightblue),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTSIZE', (0, 1), (-1, -1), 8)
        ]))
        
        elements.append(stock_table)
        
        # Statistiques générales
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("Statistiques Générales", self.heading_style))
        
        total_products = len(products)
        low_stock_count = sum(1 for p in products if p.current_stock <= p.minimum_stock)
        total_value = sum(p.current_stock * p.purchase_price for p in products)
        
        stats_data = [
            ['Nombre total de produits', str(total_products)],
            ['Produits en stock faible', str(low_stock_count)],
            ['Valeur totale du stock', f"{total_value:,.0f} BIF"],
            ['Pourcentage stock faible', f"{(low_stock_count/total_products*100):.1f}%" if total_products > 0 else "0%"]
        ]
        
        stats_table = Table(stats_data, colWidths=[3*inch, 2*inch])
        stats_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(stats_table)
        
        # Générer le PDF
        doc.build(elements)
        buffer.seek(0)
        return buffer
