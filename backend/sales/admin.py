from django.contrib import admin
from django.utils.html import format_html
from django.db.models import Sum, Count, Avg
from django.urls import reverse
from django.utils.safestring import mark_safe
from django.utils import timezone
from .models import Table, TableReservation, Sale, SaleItem


@admin.register(Table)
class TableAdmin(admin.ModelAdmin):
    """Administration des tables"""

    list_display = (
        'number', 'capacity', 'status_badge', 'location', 'occupation_info',
        'current_sale_info', 'sales_count', 'is_active'
    )
    list_filter = ('status', 'capacity', 'is_active', 'location')
    search_fields = ('number', 'location', 'notes')
    ordering = ('number',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('number', 'capacity', 'location', 'notes')
        }),
        ('Statut', {
            'fields': ('status', 'is_active')
        }),
        ('Occupation', {
            'fields': ('occupied_since', 'last_cleaned'),
            'classes': ('collapse',)
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at', 'occupied_since', 'last_cleaned')

    def status_badge(self, obj):
        """Affiche le statut avec un badge coloré"""
        colors = {
            'available': '#198754',    # Vert
            'occupied': '#dc3545',     # Rouge
            'reserved': '#fd7e14',     # Orange
            'cleaning': '#6c757d',     # Gris
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Statut'

    def occupation_info(self, obj):
        """Affiche les informations d'occupation"""
        if obj.is_occupied and obj.occupied_since:
            duration = obj.occupation_duration
            return format_html(
                '<span style="color: #fd7e14;">Occupée depuis {}</span><br>'
                '<small>{} min</small>',
                obj.occupied_since.strftime('%H:%M'),
                duration
            )
        elif obj.status == 'reserved':
            # Chercher la prochaine réservation
            next_reservation = obj.reservations.filter(
                status='confirmed',
                reservation_date__gte=timezone.now().date()
            ).first()
            if next_reservation:
                return format_html(
                    '<span style="color: #0d6efd;">Réservée</span><br>'
                    '<small>{} à {}</small>',
                    next_reservation.reservation_date,
                    next_reservation.reservation_time.strftime('%H:%M')
                )
        return '-'
    occupation_info.short_description = 'Occupation'

    def current_sale_info(self, obj):
        """Affiche les informations de la vente en cours"""
        current_sale = obj.current_sale
        if current_sale:
            return format_html(
                '<a href="{}" style="color: #198754;">Vente #{}</a><br>'
                '<small>{} BIF - {}</small>',
                reverse('admin:sales_sale_change', args=[current_sale.id]),
                current_sale.reference,
                current_sale.total_amount,
                current_sale.get_status_display()
            )
        return '-'
    current_sale_info.short_description = 'Vente en cours'

    def sales_count(self, obj):
        """Affiche le nombre de ventes pour cette table"""
        count = obj.sales.count()
        if count > 0:
            url = reverse('admin:sales_sale_changelist') + f'?table__id__exact={obj.id}'
            return format_html('<a href="{}">{} vente(s)</a>', url, count)
        return '0 vente'
    sales_count.short_description = 'Ventes'

    actions = ['mark_available', 'mark_cleaning', 'start_cleaning', 'finish_cleaning']

    def mark_available(self, request, queryset):
        """Marque les tables comme disponibles"""
        updated = queryset.update(status='available', occupied_since=None)
        self.message_user(request, f'{updated} table(s) marquée(s) comme disponible(s).')
    mark_available.short_description = "Marquer comme disponible"

    def mark_cleaning(self, request, queryset):
        """Marque les tables en nettoyage"""
        updated = queryset.update(status='cleaning')
        self.message_user(request, f'{updated} table(s) marquée(s) en nettoyage.')
    mark_cleaning.short_description = "Marquer en nettoyage"

    def start_cleaning(self, request, queryset):
        """Démarre le nettoyage des tables"""
        for table in queryset:
            table.start_cleaning(request.user)
        self.message_user(request, f'{queryset.count()} table(s) mise(s) en nettoyage.')
    start_cleaning.short_description = "Démarrer le nettoyage"

    def finish_cleaning(self, request, queryset):
        """Termine le nettoyage des tables"""
        for table in queryset:
            table.finish_cleaning(request.user)
        self.message_user(request, f'{queryset.count()} table(s) nettoyée(s).')
    finish_cleaning.short_description = "Terminer le nettoyage"


class SaleItemInline(admin.TabularInline):
    """Inline pour les articles de vente"""
    model = SaleItem
    extra = 0
    readonly_fields = ('total_price', 'profit_display')

    def profit_display(self, obj):
        """Affiche le profit pour cet article"""
        if obj.id:
            return f"{obj.profit} BIF"
        return "-"
    profit_display.short_description = 'Profit'


@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    """Administration des ventes"""

    list_display = (
        'reference', 'table', 'customer_name', 'server', 'status_badge',
        'total_amount', 'profit_display', 'payment_method_badge', 'created_at'
    )
    list_filter = (
        'status', 'payment_method', 'server', 'table', 'created_at', 'paid_at'
    )
    search_fields = ('reference', 'customer_name', 'server__username', 'table__number')
    ordering = ('-created_at',)

    fieldsets = (
        ('Informations générales', {
            'fields': ('reference', 'table', 'customer_name', 'server')
        }),
        ('Statut et paiement', {
            'fields': ('status', 'payment_method', 'notes')
        }),
        ('Montants (BIF)', {
            'fields': ('subtotal', 'tax_amount', 'discount_amount', 'total_amount')
        }),
        ('Dates', {
            'fields': ('created_at', 'updated_at', 'paid_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at', 'reference')
    inlines = [SaleItemInline]

    def status_badge(self, obj):
        """Affiche le statut avec un badge coloré"""
        colors = {
            'pending': '#6c757d',      # Gris
            'preparing': '#fd7e14',    # Orange
            'ready': '#ffc107',        # Jaune
            'served': '#0d6efd',       # Bleu
            'paid': '#198754',         # Vert
            'cancelled': '#dc3545',    # Rouge
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Statut'

    def payment_method_badge(self, obj):
        """Affiche le mode de paiement avec un badge"""
        if not obj.payment_method:
            return format_html('<span style="color: #6c757d;">Non défini</span>')

        colors = {
            'cash': '#198754',      # Vert
            'card': '#0d6efd',      # Bleu
            'mobile': '#6f42c1',    # Violet
            'credit': '#fd7e14',    # Orange
        }
        color = colors.get(obj.payment_method, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_payment_method_display()
        )
    payment_method_badge.short_description = 'Paiement'

    def profit_display(self, obj):
        """Affiche le profit de la vente"""
        profit = obj.profit
        return format_html('{} BIF', profit)
    profit_display.short_description = 'Profit'

    actions = ['mark_as_paid', 'mark_as_served', 'cancel_sales']

    def mark_as_paid(self, request, queryset):
        """Marque les ventes comme payées"""
        updated = queryset.update(status='paid', paid_at=timezone.now())
        self.message_user(request, f'{updated} vente(s) marquée(s) comme payée(s).')
    mark_as_paid.short_description = "Marquer comme payé"

    def mark_as_served(self, request, queryset):
        """Marque les ventes comme servies"""
        updated = queryset.update(status='served')
        self.message_user(request, f'{updated} vente(s) marquée(s) comme servie(s).')
    mark_as_served.short_description = "Marquer comme servi"

    def cancel_sales(self, request, queryset):
        """Annule les ventes sélectionnées"""
        updated = queryset.update(status='cancelled')
        self.message_user(request, f'{updated} vente(s) annulée(s).')
    cancel_sales.short_description = "Annuler les ventes"

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related('table', 'server').prefetch_related('items')


@admin.register(TableReservation)
class TableReservationAdmin(admin.ModelAdmin):
    """Administration des réservations de tables"""

    list_display = (
        'customer_name', 'table', 'party_size', 'reservation_date',
        'reservation_time', 'status_badge', 'is_today_badge', 'created_by'
    )
    list_filter = (
        'status', 'reservation_date', 'party_size', 'table', 'created_at'
    )
    search_fields = (
        'customer_name', 'customer_phone', 'customer_email',
        'table__number', 'special_requests'
    )
    ordering = ('-reservation_date', 'reservation_time')

    fieldsets = (
        ('Informations client', {
            'fields': ('customer_name', 'customer_phone', 'customer_email', 'party_size')
        }),
        ('Réservation', {
            'fields': ('table', 'reservation_date', 'reservation_time', 'duration_minutes')
        }),
        ('Statut', {
            'fields': ('status', 'special_requests', 'notes')
        }),
        ('Suivi', {
            'fields': ('created_by', 'confirmed_by', 'seated_at'),
            'classes': ('collapse',)
        }),
        ('Dates système', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    readonly_fields = ('created_at', 'updated_at', 'seated_at')

    def status_badge(self, obj):
        """Affiche le statut avec un badge coloré"""
        colors = {
            'pending': '#6c757d',      # Gris
            'confirmed': '#0d6efd',    # Bleu
            'seated': '#198754',       # Vert
            'completed': '#20c997',    # Teal
            'cancelled': '#dc3545',    # Rouge
            'no_show': '#fd7e14',      # Orange
        }
        color = colors.get(obj.status, '#6c757d')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; '
            'border-radius: 3px; font-size: 11px; font-weight: bold;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Statut'

    def is_today_badge(self, obj):
        """Indique si la réservation est pour aujourd'hui"""
        if obj.is_today:
            if obj.is_overdue:
                return format_html(
                    '<span style="background-color: #dc3545; color: white; padding: 3px 8px; '
                    'border-radius: 3px; font-size: 11px; font-weight: bold;">EN RETARD</span>'
                )
            else:
                return format_html(
                    '<span style="background-color: #ffc107; color: black; padding: 3px 8px; '
                    'border-radius: 3px; font-size: 11px; font-weight: bold;">AUJOURD\'HUI</span>'
                )
        elif obj.is_upcoming:
            return format_html(
                '<span style="background-color: #0d6efd; color: white; padding: 3px 8px; '
                'border-radius: 3px; font-size: 11px; font-weight: bold;">À VENIR</span>'
            )
        return '-'
    is_today_badge.short_description = 'Timing'

    actions = ['confirm_reservations', 'seat_customers', 'mark_no_show', 'cancel_reservations']

    def confirm_reservations(self, request, queryset):
        """Confirme les réservations sélectionnées"""
        confirmed = 0
        for reservation in queryset.filter(status='pending'):
            reservation.confirm(request.user)
            confirmed += 1
        self.message_user(request, f'{confirmed} réservation(s) confirmée(s).')
    confirm_reservations.short_description = "Confirmer les réservations"

    def seat_customers(self, request, queryset):
        """Installe les clients (réservations confirmées)"""
        seated = 0
        for reservation in queryset.filter(status='confirmed'):
            if reservation.table.is_available:
                reservation.seat(request.user)
                seated += 1
            else:
                self.message_user(
                    request,
                    f'Table {reservation.table.number} non disponible pour {reservation.customer_name}',
                    level='warning'
                )
        if seated > 0:
            self.message_user(request, f'{seated} client(s) installé(s).')
    seat_customers.short_description = "Installer les clients"

    def mark_no_show(self, request, queryset):
        """Marque comme absent"""
        updated = queryset.filter(status='confirmed').update(status='no_show')
        self.message_user(request, f'{updated} réservation(s) marquée(s) comme absent.')
    mark_no_show.short_description = "Marquer comme absent"

    def cancel_reservations(self, request, queryset):
        """Annule les réservations"""
        cancelled = 0
        for reservation in queryset.exclude(status__in=['completed', 'cancelled']):
            reservation.cancel("Annulé par l'administrateur")
            cancelled += 1
        self.message_user(request, f'{cancelled} réservation(s) annulée(s).')
    cancel_reservations.short_description = "Annuler les réservations"

    def save_model(self, request, obj, form, change):
        """Définit automatiquement l'utilisateur créateur"""
        if not change:  # Nouveau objet
            obj.created_by = request.user
        super().save_model(request, obj, form, change)

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related(
            'table', 'created_by', 'confirmed_by'
        )


@admin.register(SaleItem)
class SaleItemAdmin(admin.ModelAdmin):
    """Administration des articles de vente"""

    list_display = ('sale', 'product', 'quantity', 'unit_price', 'total_price', 'profit_display')
    list_filter = ('product__category', 'sale__status', 'created_at')
    search_fields = ('sale__reference', 'product__name')
    ordering = ('-created_at',)

    readonly_fields = ('total_price', 'profit_display', 'created_at')

    def profit_display(self, obj):
        """Affiche le profit pour cet article"""
        return f"{obj.profit} BIF"
    profit_display.short_description = 'Profit'

    def get_queryset(self, request):
        """Optimise les requêtes"""
        return super().get_queryset(request).select_related('sale', 'product')
