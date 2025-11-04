from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.exceptions import PermissionDenied
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Sum, Count, Q, Avg
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta
from .models import Table, TableReservation, Sale, SaleItem
from .services import TableService, ReservationService
from .invoice_service import InvoiceService
from .serializers import (
    TableSerializer, TableListSerializer, TableReservationSerializer,
    SaleSerializer, SaleListSerializer, SaleCreateSerializer, SaleUpdateStatusSerializer
)
from accounts.permissions import IsAuthenticated, IsAdminOrGerant, CanViewSales, CanCreateSales

class TableListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des tables
    """
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated]  # Utiliser DRF standard
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['is_active', 'status', 'location']
    search_fields = ['number', 'name', 'location']
    ordering_fields = ['number', 'capacity', 'created_at']
    ordering = ['number']

    def perform_create(self, serializer):
        # Vérification simplifiée : tout utilisateur authentifié peut créer des tables
        # Si vous voulez restreindre, décommentez la ligne suivante
        # if not self.request.user.can_manage_tables():
        #     raise PermissionDenied("Permission insuffisante pour créer des tables.")
        serializer.save()

class TableDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour récupérer, modifier ou supprimer une table
    """
    queryset = Table.objects.all()
    serializer_class = TableSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        # Vérification simplifiée : tout utilisateur authentifié peut modifier des tables
        # if not self.request.user.can_manage_tables():
        #     raise PermissionDenied("Permission insuffisante pour modifier des tables.")
        serializer.save()

    def perform_destroy(self, instance):
        # Vérification simplifiée : tout utilisateur authentifié peut supprimer des tables
        # if not self.request.user.can_delete_tables():
        #     raise PermissionDenied("Permission insuffisante pour supprimer des tables.")

        # Vérifier qu'il n'y a pas de vente en cours
        if instance.is_occupied:
            raise PermissionDenied("Impossible de supprimer une table occupée.")

        instance.delete()

class SaleListCreateView(generics.ListCreateAPIView):
    """
    Vue pour lister et créer des ventes
    🔐 Filtrage par rôle:
    - Admin/Manager: Voient TOUTES les ventes
    - Caissier: Voit UNIQUEMENT ses propres ventes
    - Serveur: Voit UNIQUEMENT ses propres ventes
    """
    permission_classes = [CanViewSales]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'payment_method', 'table', 'server']
    search_fields = ['table__number', 'server__username', 'server__first_name', 'server__last_name', 'notes']
    ordering_fields = ['created_at', 'total_amount']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = Sale.objects.select_related('table', 'server', 'created_by').prefetch_related('items__product')

        # 🔐 FILTRAGE PAR RÔLE UTILISATEUR
        if self.request.user.is_authenticated and hasattr(self.request.user, 'role'):
            user_role = self.request.user.role
            
            # 👨‍💼 ADMIN : Voit TOUTES les ventes
            if user_role == 'admin':
                print(f"🔓 Admin {self.request.user.username} - Accès total à toutes les ventes")
                # Pas de filtre, voit tout
            
            # 👔 MANAGER : Voit TOUTES les ventes
            elif user_role == 'manager':
                print(f"🔓 Manager {self.request.user.username} - Accès total à toutes les ventes")
                # Pas de filtre, voit tout
            
            # 💰 CAISSIER : Voit UNIQUEMENT ses propres ventes
            elif user_role == 'cashier':
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(created_by=self.request.user) | Q(server=self.request.user)
                )
                print(f"🔒 Caissier {self.request.user.username} - Ventes filtrées: {queryset.count()}")
            
            # 🍽️ SERVEUR : Voit UNIQUEMENT ses propres ventes
            elif user_role == 'server':
                queryset = queryset.filter(server=self.request.user)
                print(f"🔒 Serveur {self.request.user.username} - Ventes filtrées: {queryset.count()}")

        # Filtre par statuts multiples (status__in)
        status_in = self.request.query_params.get('status__in')
        if status_in:
            statuses = [s.strip() for s in status_in.split(',')]
            queryset = queryset.filter(status__in=statuses)
            print(f"📊 Filtrage par statuts: {statuses}")

        # Filtres par date
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')

        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from)
            except ValueError:
                pass

        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to)
            except ValueError:
                pass

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return SaleCreateSerializer
        return SaleListSerializer

    def perform_create(self, serializer):
        # Temporairement désactivé pour le débogage
        # if not self.request.user.can_make_sales():
        #     raise PermissionDenied("Permission insuffisante pour créer des ventes.")
        sale = serializer.save()

        # Retourner les données complètes de la vente créée
        return sale

    def create(self, request, *args, **kwargs):
        """Override create pour retourner les données complètes"""
        print(f"🔍 Données reçues pour création de vente: {request.data}")
        print(f"🔍 User authentifié: {request.user}")
        print(f"🔍 Headers: {dict(request.headers)}")
        
        # Validation manuelle des données requises (seulement payment_method et items)
        required_fields = ['payment_method', 'items']
        missing_fields = [field for field in required_fields if field not in request.data or not request.data[field]]
        
        if missing_fields:
            error_msg = f"Champs manquants: {', '.join(missing_fields)}"
            print(f"❌ {error_msg}")
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
        
        # table, customer_name et server sont optionnels
        # Le serializer gère les valeurs par défaut
        
        # Vérifier que les items ne sont pas vides
        if not request.data.get('items') or len(request.data.get('items', [])) == 0:
            error_msg = "Aucun article dans la vente"
            print(f"❌ {error_msg}")
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print(f"❌ Erreurs de validation: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            sale = serializer.save()
            print(f"✅ Vente créée avec succès: {sale.reference}")
        except Exception as e:
            print(f"❌ Erreur lors de la création: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Créer automatiquement un Order pour la cuisine
        try:
            from orders.models import Order, OrderItem
            
            order = Order.objects.create(
                table=sale.table,
                server=sale.server or request.user,
                status='pending',
                priority='normal',
                total_amount=sale.total_amount,
                notes=sale.notes or ''
            )
            
            # Créer les OrderItems à partir des SaleItems
            for sale_item in sale.items.all():
                OrderItem.objects.create(
                    order=order,
                    product=sale_item.product,
                    quantity=sale_item.quantity,
                    unit_price=sale_item.unit_price,
                    notes=sale_item.notes or '',
                    status='pending'
                )
            
            print(f"✅ Order {order.order_number} créé automatiquement pour la vente {sale.reference}")
        except Exception as e:
            print(f"⚠️  Erreur création Order pour {sale.reference}: {e}")
            # Ne pas bloquer la vente si l'Order échoue

        # Générer automatiquement la facture après la création de la vente
        try:
            invoice_data = InvoiceService.auto_generate_invoice(sale)
            print(f"✅ Facture générée automatiquement pour la vente {sale.reference}")
        except Exception as e:
            print(f"⚠️  Erreur génération facture pour {sale.reference}: {e}")

        # Utiliser SaleSerializer pour retourner les données complètes avec l'URL de la facture
        response_serializer = SaleSerializer(sale)
        response_data = response_serializer.data

        # Ajouter l'URL de la facture dans la réponse
        response_data['invoice_url'] = f"/api/sales/{sale.id}/invoice/"

        headers = self.get_success_headers(response_data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)

class SaleDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Vue pour récupérer, modifier ou supprimer une vente
    """
    serializer_class = SaleSerializer
    permission_classes = [CanViewSales]

    def get_queryset(self):
        queryset = Sale.objects.select_related('table', 'server', 'created_by').prefetch_related('items__product')

        # Filtrage par rôle utilisateur
        if self.request.user.is_authenticated and hasattr(self.request.user, 'role'):
            # Les caissiers voient les ventes qu'ils ont créées OU où ils sont le serveur
            if self.request.user.role == 'cashier':
                from django.db.models import Q
                queryset = queryset.filter(
                    Q(server=self.request.user) | Q(created_by=self.request.user)
                )
            # Les serveurs ne voient que leurs propres ventes
            elif self.request.user.role == 'server':
                queryset = queryset.filter(server=self.request.user)
            # Admin et manager voient toutes les ventes (pas de filtre)

        return queryset

    def perform_update(self, serializer):
        # Seuls les gérants et admins peuvent modifier les ventes (seulement si authentifié)
        if (self.request.user.is_authenticated and 
            hasattr(self.request.user, 'can_manage_products') and 
            not self.request.user.can_manage_products()):
            raise PermissionDenied("Permission insuffisante pour modifier des ventes.")
        serializer.save()

    def perform_destroy(self, instance):
        if (self.request.user.is_authenticated and 
            hasattr(self.request.user, 'can_delete_records') and 
            not self.request.user.can_delete_records()):
            raise PermissionDenied("Permission insuffisante pour supprimer des ventes.")

        # Vérifier que la vente n'est pas payée
        if instance.status == 'paid':
            raise PermissionDenied("Impossible de supprimer une vente payée.")

        # Restaurer le stock des produits
        for item in instance.items.all():
            product = item.product
            product.current_stock += item.quantity
            product.save()

        instance.delete()


@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # Temporairement public pour debug
def update_sale_status(request, pk):
    """
    Vue pour mettre à jour le statut d'une vente
    """
    # Vérification des permissions seulement si authentifié
    if (request.user.is_authenticated and 
        hasattr(request.user, 'can_make_sales') and 
        not request.user.can_make_sales()):
        return Response(
            {'error': 'Permission insuffisante pour modifier le statut des ventes.'},
            status=status.HTTP_403_FORBIDDEN
        )

    try:
        sale = Sale.objects.get(pk=pk)

        # Les serveurs ne peuvent modifier que leurs propres ventes (seulement si authentifié)
        if (request.user.is_authenticated and 
            hasattr(request.user, 'role') and 
            request.user.role == 'serveur' and 
            sale.server != request.user):
            return Response(
                {'error': 'Vous ne pouvez modifier que vos propres ventes.'},
                status=status.HTTP_403_FORBIDDEN
            )

    except Sale.DoesNotExist:
        return Response(
            {'error': 'Vente introuvable.'},
            status=status.HTTP_404_NOT_FOUND
        )

    serializer = SaleUpdateStatusSerializer(sale, data=request.data, partial=True)
    if serializer.is_valid():
        updated_sale = serializer.save()

        # Si la vente est marquée comme payée, libérer la table
        if updated_sale.status == 'paid' and updated_sale.table:
            updated_sale.table.is_occupied = False
            updated_sale.table.current_sale_id = None
            updated_sale.table.save()

        return Response({
            'message': 'Statut de la vente mis à jour avec succès.',
            'sale': SaleSerializer(updated_sale).data
        })

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])  # Temporairement public pour debug
def cancel_sale(request, pk):
    """
    Vue pour annuler une vente
    """
    try:
        sale = Sale.objects.get(pk=pk)
        
        # Vérifier que la vente peut être annulée
        if sale.status == 'paid':
            return Response(
                {'error': 'Impossible d\'annuler une vente déjà payée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if sale.status == 'cancelled':
            return Response(
                {'error': 'Cette vente est déjà annulée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Restaurer le stock des produits
        for item in sale.items.all():
            product = item.product
            product.current_stock += item.quantity
            product.save()
        
        # Changer le statut à annulé
        sale.status = 'cancelled'
        sale.save()
        
        # Libérer la table si elle était occupée par cette vente
        if sale.table and sale.table.current_sale == sale:
            sale.table.is_occupied = False
            sale.table.current_sale = None
            sale.table.save()
        
        return Response({
            'success': True,
            'message': 'Vente annulée avec succès',
            'sale_id': sale.id,
            'new_status': sale.status
        })
        
    except Sale.DoesNotExist:
        return Response(
            {'error': 'Vente introuvable.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de l\'annulation: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sales_statistics(request):
    """
    Vue pour récupérer les statistiques des ventes
    """
    if not request.user.can_view_sales_history():
        return Response(
            {'error': 'Permission insuffisante pour voir les statistiques.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Période par défaut: aujourd'hui
    today = timezone.now().date()
    date_from = request.query_params.get('date_from', today)
    date_to = request.query_params.get('date_to', today)

    if isinstance(date_from, str):
        try:
            date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
        except ValueError:
            date_from = today

    if isinstance(date_to, str):
        try:
            date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
        except ValueError:
            date_to = today

    # Requête de base
    queryset = Sale.objects.filter(
        created_at__date__gte=date_from,
        created_at__date__lte=date_to
    )

    # Filtrage par rôle utilisateur pour les statistiques
    if hasattr(request.user, 'role'):
        # Les caissiers et serveurs ne voient que leurs propres statistiques
        if request.user.role in ['cashier', 'server']:
            queryset = queryset.filter(server=request.user)
        # Admin et manager voient toutes les statistiques (pas de filtre)

    # Calculs
    total_sales = queryset.count()
    paid_sales = queryset.filter(status='paid').count()
    pending_sales = queryset.filter(status='pending').count()

    total_revenue = queryset.filter(status='paid').aggregate(
        total=Sum('total_amount')
    )['total'] or 0

    total_discount = queryset.aggregate(
        total=Sum('discount_amount')
    )['total'] or 0

    # Ventes par méthode de paiement
    payment_methods = queryset.filter(status='paid').values('payment_method').annotate(
        count=Count('id'),
        total=Sum('total_amount')
    )

    # Top produits vendus
    top_products = SaleItem.objects.filter(
        sale__in=queryset,
        sale__status='paid'
    ).values(
        'product__name'
    ).annotate(
        quantity_sold=Sum('quantity'),
        revenue=Sum('unit_price')
    ).order_by('-quantity_sold')[:10]

    return Response({
        'period': {
            'date_from': date_from,
            'date_to': date_to
        },
        'summary': {
            'total_sales': total_sales,
            'paid_sales': paid_sales,
            'pending_sales': pending_sales,
            'total_revenue': total_revenue,
            'total_discount': total_discount,
            'average_sale': round(total_revenue / paid_sales, 2) if paid_sales > 0 else 0
        },
        'payment_methods': list(payment_methods),
        'top_products': list(top_products)
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def daily_sales_report(request):
    """
    Vue pour le rapport quotidien des ventes
    """
    if not request.user.can_generate_reports():
        return Response(
            {'error': 'Permission insuffisante pour générer des rapports.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Date par défaut: aujourd'hui
    today = timezone.now().date()
    report_date = request.query_params.get('date', today)

    if isinstance(report_date, str):
        try:
            report_date = datetime.strptime(report_date, '%Y-%m-%d').date()
        except ValueError:
            report_date = today

    # Ventes du jour
    daily_sales = Sale.objects.filter(created_at__date=report_date)

    # Statistiques générales
    stats = {
        'date': report_date,
        'total_sales': daily_sales.count(),
        'paid_sales': daily_sales.filter(status='paid').count(),
        'pending_sales': daily_sales.filter(status='pending').count(),
        'total_revenue': daily_sales.filter(status='paid').aggregate(
            total=Sum('total_amount')
        )['total'] or 0,
        'total_discount': daily_sales.aggregate(
            total=Sum('discount_amount')
        )['total'] or 0
    }

    # Ventes par serveur
    sales_by_server = daily_sales.values(
        'server__username',
        'server__first_name',
        'server__last_name'
    ).annotate(
        sales_count=Count('id'),
        revenue=Sum('total_amount', filter=Q(status='paid'))
    ).order_by('-revenue')

    # Ventes par heure
    sales_by_hour = []
    for hour in range(24):
        hour_sales = daily_sales.filter(
            created_at__hour=hour,
            status='paid'
        ).aggregate(
            count=Count('id'),
            revenue=Sum('total_amount')
        )

        sales_by_hour.append({
            'hour': f"{hour:02d}:00",
            'sales_count': hour_sales['count'] or 0,
            'revenue': hour_sales['revenue'] or 0
        })

    return Response({
        'stats': stats,
        'sales_by_server': list(sales_by_server),
        'sales_by_hour': sales_by_hour
    })


# ===== NOUVELLES VUES POUR TABLES ET RÉSERVATIONS =====

class TableListView(generics.ListAPIView):
    """Vue pour lister les tables avec informations détaillées"""
    queryset = Table.objects.filter(is_active=True)
    serializer_class = TableListSerializer
    permission_classes = [permissions.IsAuthenticated]  # Utiliser DRF standard
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'capacity', 'location']
    search_fields = ['number', 'location']
    ordering_fields = ['number', 'capacity']
    ordering = ['number']


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def occupy_table(request, table_id):
    """Occupe une table"""
    customer_name = request.data.get('customer_name', '')
    result = TableService.occupy_table(table_id, request.user, customer_name)

    if result['success']:
        return Response(result, status=status.HTTP_200_OK)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def free_table(request, table_id):
    """Libère une table"""
    result = TableService.free_table(table_id, request.user)

    if result['success']:
        return Response(result, status=status.HTTP_200_OK)
    else:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def table_status_summary(request):
    """Résumé du statut des tables"""
    summary = TableService.get_table_status_summary()
    return Response(summary)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def available_tables(request):
    """Tables disponibles pour un nombre de personnes"""
    party_size = int(request.GET.get('party_size', 1))
    date = request.GET.get('date')  # YYYY-MM-DD
    time_slot = request.GET.get('time')  # HH:MM

    tables = TableService.get_available_tables(party_size, date, time_slot)
    serializer = TableListSerializer(tables, many=True)
    return Response(serializer.data)


class TableReservationListCreateView(generics.ListCreateAPIView):
    """Vue pour lister et créer des réservations"""
    queryset = TableReservation.objects.all()
    serializer_class = TableReservationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['status', 'table', 'reservation_date', 'party_size']
    search_fields = ['customer_name', 'customer_phone', 'customer_email']
    ordering_fields = ['reservation_date', 'reservation_time', 'created_at']
    ordering = ['reservation_date', 'reservation_time']

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TableReservationDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Vue pour les détails d'une réservation"""
    queryset = TableReservation.objects.all()
    serializer_class = TableReservationSerializer
    permission_classes = [permissions.IsAuthenticated]


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def confirm_reservation(request, reservation_id):
    """Confirme une réservation"""
    try:
        reservation = TableReservation.objects.get(id=reservation_id)
        reservation.confirm(request.user)
        serializer = TableReservationSerializer(reservation)
        return Response(serializer.data)
    except TableReservation.DoesNotExist:
        return Response(
            {'error': 'Réservation non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def seat_reservation(request, reservation_id):
    """Installe les clients d'une réservation"""
    try:
        reservation = TableReservation.objects.get(id=reservation_id)

        if not reservation.table.is_available:
            return Response(
                {'error': f'Table {reservation.table.number} non disponible'},
                status=status.HTTP_400_BAD_REQUEST
            )

        reservation.seat(request.user)
        serializer = TableReservationSerializer(reservation)
        return Response(serializer.data)
    except TableReservation.DoesNotExist:
        return Response(
            {'error': 'Réservation non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def todays_reservations(request):
    """Réservations du jour"""
    reservations = ReservationService.get_todays_reservations()
    serializer = TableReservationSerializer(reservations, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def upcoming_reservations(request):
    """Réservations des prochaines heures"""
    hours = int(request.GET.get('hours', 2))
    reservations = ReservationService.get_upcoming_reservations(hours)
    serializer = TableReservationSerializer(reservations, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def table_analytics(request):
    """Analyse de l'utilisation des tables"""
    days = int(request.GET.get('days', 7))
    analytics = TableService.get_table_analytics(days)
    return Response(analytics)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def sales_stats(request):
    """Statistiques des ventes"""
    period = request.GET.get('period', 'today')
    
    # Définir la période
    now = timezone.now()
    if period == 'today':
        start_date = now.date()
        end_date = start_date
    elif period == 'week':
        start_date = now.date() - timedelta(days=7)
        end_date = now.date()
    elif period == 'month':
        start_date = now.date() - timedelta(days=30)
        end_date = now.date()
    else:
        start_date = now.date()
        end_date = start_date
    
    # Requête des ventes pour la période
    sales = Sale.objects.filter(
        created_at__date__gte=start_date,
        created_at__date__lte=end_date
    )
    
    # Calculer les statistiques
    stats = {
        'period': period,
        'start_date': start_date,
        'end_date': end_date,
        'total_sales': sales.count(),
        'total_revenue': sales.aggregate(total=Sum('total_amount'))['total'] or 0,
        'average_sale': sales.aggregate(avg=Avg('total_amount'))['avg'] or 0,
        'completed_sales': sales.filter(status='completed').count(),
        'pending_sales': sales.filter(status='pending').count(),
        'cancelled_sales': sales.filter(status='cancelled').count(),
        'payment_methods': {
            'cash': sales.filter(payment_method='cash').count(),
            'card': sales.filter(payment_method='card').count(),
            'mobile': sales.filter(payment_method='mobile').count(),
        },
        'top_products': list(
            SaleItem.objects.filter(sale__in=sales)
            .values('product__name')
            .annotate(
                quantity_sold=Sum('quantity'),
                revenue=Sum('total_price')
            )
            .order_by('-quantity_sold')[:5]
        )
    }

    return Response(stats)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])  # Temporairement public pour tests
def generate_invoice(request, pk):
    """
    Générer la facture d'une vente
    """
    try:
        sale = Sale.objects.get(pk=pk)

        # Générer les données de facture
        invoice_data = InvoiceService.generate_invoice_data(sale)

        # Retourner selon le format demandé
        format_type = request.GET.get('format', 'json')

        if format_type == 'html':
            html_content = InvoiceService.generate_invoice_html(sale)
            return HttpResponse(html_content, content_type='text/html')

        elif format_type == 'json':
            return Response({
                'success': True,
                'invoice': invoice_data
            })

        else:
            return Response(
                {'error': 'Format non supporté. Utilisez json ou html.'},
                status=status.HTTP_400_BAD_REQUEST
            )

    except Sale.DoesNotExist:
        return Response(
            {'error': 'Vente non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur génération facture: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def add_items_to_sale(request, sale_id):
    """
    Ajouter des articles à une vente existante (avant paiement)
    Permet au caissier d'ajouter des items si le client commande plus
    """
    try:
        sale = Sale.objects.get(id=sale_id)
        
        # Vérifier que la vente n'est pas déjà payée
        if sale.status == 'paid':
            return Response(
                {'error': 'Impossible d\'ajouter des articles à une vente déjà payée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Vérifier que la vente n'est pas annulée
        if sale.status == 'cancelled':
            return Response(
                {'error': 'Impossible d\'ajouter des articles à une vente annulée.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Récupérer les nouveaux items
        items_data = request.data.get('items', [])
        
        if not items_data:
            return Response(
                {'error': 'Aucun article à ajouter.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from products.models import Product
        from decimal import Decimal
        
        added_items = []
        
        # Ajouter chaque item
        for item_data in items_data:
            product_id = item_data.get('product')
            quantity = item_data.get('quantity', 1)
            notes = item_data.get('notes', '')
            
            try:
                product = Product.objects.get(id=product_id)
                
                # Vérifier le stock disponible
                if product.current_stock < quantity:
                    return Response(
                        {'error': f'Stock insuffisant pour {product.name}. Disponible: {product.current_stock}'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Vérifier si le produit existe déjà dans la vente
                existing_item = SaleItem.objects.filter(sale=sale, product=product).first()
                
                if existing_item:
                    # Mettre à jour la quantité existante
                    existing_item.quantity += quantity
                    if notes:
                        existing_item.notes = f"{existing_item.notes or ''}\n{notes}".strip()
                    existing_item.save()
                    
                    added_items.append({
                        'product': product.name,
                        'quantity': quantity,
                        'price': product.selling_price,
                        'action': 'updated'
                    })
                else:
                    # Créer un nouvel item
                    sale_item = SaleItem.objects.create(
                        sale=sale,
                        product=product,
                        quantity=quantity,
                        unit_price=product.selling_price,
                        notes=notes
                    )
                    
                    added_items.append({
                        'product': product.name,
                        'quantity': quantity,
                        'price': product.selling_price,
                        'action': 'added'
                    })
                
            except Product.DoesNotExist:
                return Response(
                    {'error': f'Produit avec ID {product_id} introuvable.'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Recalculer les totaux de la vente
        sale.subtotal = sum(item.quantity * item.unit_price for item in sale.items.all())
        sale.total_amount = sale.subtotal
        sale.save()
        
        # Ajouter les items au Order correspondant (si existe)
        try:
            from orders.models import Order, OrderItem as OrderItemModel
            
            # Trouver l'Order correspondant à cette Sale (même table, même serveur, status != served)
            order = Order.objects.filter(
                table=sale.table,
                server=sale.server,
                status__in=['pending', 'confirmed', 'preparing', 'ready']
            ).order_by('-created_at').first()
            
            if order:
                # Ajouter les nouveaux items à l'Order
                for item_data in items_data:
                    product_id = item_data.get('product')
                    quantity = item_data.get('quantity', 1)
                    notes = item_data.get('notes', '')
                    
                    product = Product.objects.get(id=product_id)
                    
                    # Vérifier si le produit existe déjà dans l'Order
                    existing_order_item = OrderItemModel.objects.filter(order=order, product=product).first()
                    
                    if existing_order_item:
                        # Mettre à jour la quantité
                        existing_order_item.quantity += quantity
                        if notes:
                            existing_order_item.notes = f"{existing_order_item.notes or ''}\n{notes}".strip()
                        existing_order_item.save()
                    else:
                        # Créer un nouvel OrderItem
                        OrderItemModel.objects.create(
                            order=order,
                            product=product,
                            quantity=quantity,
                            unit_price=product.selling_price,
                            notes=notes,
                            status='pending'
                        )
                
                # Recalculer le total de l'Order
                order.total_amount = sum(item.quantity * item.unit_price for item in order.items.all())
                order.save()
                
                print(f"✅ Order {order.order_number} mis à jour avec les nouveaux items")
            else:
                print(f"⚠️  Aucun Order trouvé pour la vente {sale.reference}")
        except Exception as e:
            print(f"⚠️  Erreur mise à jour Order: {e}")
            # Ne pas bloquer l'ajout si l'Order échoue
        
        # Régénérer la facture
        try:
            InvoiceService.auto_generate_invoice(sale)
        except Exception as e:
            print(f"⚠️ Erreur régénération facture: {e}")
        
        return Response({
            'message': f'{len(added_items)} article(s) ajouté(s) avec succès',
            'added_items': added_items,
            'new_total': sale.total_amount,
            'sale': SaleSerializer(sale).data
        })
    
    except Sale.DoesNotExist:
        return Response(
            {'error': 'Vente non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur lors de l\'ajout: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_sale_as_paid(request, sale_id):
    """
    Marque une vente comme payée et met à jour le stock
    """
    try:
        sale = Sale.objects.get(id=sale_id)

        # Vérifier que la vente n'est pas déjà payée
        if sale.status == 'paid':
            return Response(
                {'error': 'Cette vente est déjà payée.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier que la vente n'est pas annulée
        if sale.status == 'cancelled':
            return Response(
                {'error': 'Impossible de payer une vente annulée.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier le stock avant de marquer comme payé
        for item in sale.items.all():
            if item.product.current_stock < item.quantity:
                return Response(
                    {'error': f'Stock insuffisant pour {item.product.name}. Stock disponible: {item.product.current_stock}'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Marquer comme payé et mettre à jour le stock
        sale.mark_as_paid(request.user)

        # Sérialiser la vente mise à jour
        serializer = SaleSerializer(sale)

        return Response({
            'message': 'Vente marquée comme payée avec succès',
            'sale': serializer.data
        })

    except Sale.DoesNotExist:
        return Response(
            {'error': 'Vente non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {'error': f'Erreur lors du paiement: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def table_notifications(request):
    """
    Récupère les notifications récentes de libération de tables
    """
    from django.core.cache import cache
    
    # Récupérer les notifications récentes du cache
    notifications = cache.get('recent_table_notifications', [])
    
    # Filtrer les notifications des 5 dernières minutes si demandé
    if request.GET.get('recent_only') == 'true':
        from datetime import datetime, timedelta
        five_minutes_ago = timezone.now() - timedelta(minutes=5)
        notifications = [
            n for n in notifications
            if datetime.fromisoformat(n['freed_at'].replace('Z', '+00:00')) > five_minutes_ago
        ]
    
    return Response({
        'notifications': notifications,
        'count': len(notifications)
    })


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def table_sales_by_day(request, table_id):
    """
    Récupère l'historique des ventes d'une table groupées par jour
    """
    try:
        table = Table.objects.get(id=table_id)
    except Table.DoesNotExist:
        return Response(
            {'error': 'Table non trouvée'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Récupérer toutes les ventes de cette table
    sales = Sale.objects.filter(table=table).order_by('-created_at')
    
    # Grouper par jour
    from collections import defaultdict
    sales_by_day = defaultdict(list)
    
    for sale in sales:
        # Date au format YYYY-MM-DD
        day_key = sale.created_at.date().isoformat()
        sales_by_day[day_key].append({
            'id': sale.id,
            'reference': sale.reference,
            'customer_name': sale.customer_name,
            'total_amount': float(sale.total_amount) if sale.total_amount else 0,
            'status': sale.status,
            'payment_method': sale.payment_method,
            'created_at': sale.created_at.isoformat(),
            'items_count': sale.items.count(),
            'server': f"{sale.server.first_name} {sale.server.last_name}" if sale.server else None,
        })
    
    # Calculer les statistiques par jour
    daily_reports = []
    for day, day_sales in sorted(sales_by_day.items(), reverse=True):
        paid_sales = [s for s in day_sales if s['status'] == 'paid']
        total_revenue = sum(s['total_amount'] for s in paid_sales)
        
        daily_reports.append({
            'date': day,
            'sales_count': len(day_sales),
            'paid_count': len(paid_sales),
            'total_revenue': total_revenue,
            'sales': day_sales,
            'is_today': day == timezone.now().date().isoformat(),
        })
    
    return Response({
        'table': {
            'id': table.id,
            'number': table.number,
            'location': table.location,
        },
        'daily_reports': daily_reports,
        'total_sales': sales.count(),
    })


@api_view(['GET', 'POST'])
@permission_classes([permissions.AllowAny])  # Temporaire pour test 
def test_sales_endpoint(request):
    """
    Endpoint de test pour diagnostiquer les problèmes de création de vente
    """
    print(f"🧪 TEST ENDPOINT - Méthode: {request.method}")
    print(f"🧪 Données reçues: {request.data}")
    print(f"🧪 User: {request.user}")
    print(f"🧪 Headers: {dict(request.headers)}")
    
    if request.method == 'GET':
        return Response({
            'message': 'Endpoint de test fonctionnel',
            'user': str(request.user),
            'authenticated': request.user.is_authenticated
        })
    
    elif request.method == 'POST':
        return Response({
            'message': 'POST reçu avec succès',
            'data_received': request.data,
            'user': str(request.user),
            'authenticated': request.user.is_authenticated
        })
