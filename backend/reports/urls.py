from django.urls import path
from . import views

app_name = 'reports'

urlpatterns = [
    # Rapports quotidiens
    path('daily/', views.DailyReportListCreateView.as_view(), name='daily_report_list_create'),
    path('daily/<int:pk>/', views.DailyReportDetailView.as_view(), name='daily_report_detail'),
    
    # Alertes de stock
    path('alerts/', views.StockAlertListCreateView.as_view(), name='stock_alert_list_create'),
    path('alerts/<int:pk>/', views.StockAlertDetailView.as_view(), name='stock_alert_detail'),
    path('alerts/<int:pk>/resolve/', views.resolve_stock_alert, name='resolve_alert'),
    path('alerts/generate/', views.generate_stock_alerts, name='generate_alerts'),
    path('alerts/unresolved/', views.unresolved_alerts, name='unresolved_alerts'),
    
    # Statistiques et résumés
    path('summary/', views.reports_summary, name='report_summary'),
    path('dashboard/stats/', views.dashboard_stats, name='dashboard_stats'),
    path('cashier/stats/', views.cashier_stats, name='cashier_stats'),
    path('daily-detailed/<str:date>/', views.daily_detailed_report, name='daily_detailed_report'),

    # Export PDF/Excel
    path('export/daily-report/<str:date_str>/pdf/', views.ExportDailyReportPDFView.as_view(), name='export-daily-report-pdf'),
    path('export/daily-report/<str:date_str>/excel/', views.ExportDailyReportExcelView.as_view(), name='export-daily-report-excel'),
    path('export/stock-report/pdf/', views.ExportStockReportPDFView.as_view(), name='export-stock-report-pdf'),
    path('export/stock-report/excel/', views.ExportStockReportExcelView.as_view(), name='export-stock-report-excel'),
    path('export/sales-report/excel/', views.ExportSalesReportPDFView.as_view(), name='export-sales-report-excel'),

    # Notifications en temps réel
    path('notifications/status/', views.NotificationStatusView.as_view(), name='notification-status'),
    path('notifications/trigger-stock-check/', views.TriggerStockCheckView.as_view(), name='trigger-stock-check'),
    path('notifications/test/', views.SendTestNotificationView.as_view(), name='send-test-notification'),
]
