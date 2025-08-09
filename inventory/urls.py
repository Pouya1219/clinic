from django.urls import path, include
from . import views


app_name = 'inventory'

urlpatterns = [
    
    # ==================== داشبورد ====================
    path('', views.dashboard, name='dashboard'), 
    
    # ==================== مدیریت کالاها ====================
    # صفحات HTML
    path('items/', views.item_list_page, name='item_list_page'),
    path('items/<uuid:item_id>/', views.item_detail_page, name='item_detail_page'),
    path('items/<uuid:item_id>/update/', views.ItemView.as_view(), name='update_item'),

    
    # API endpoints
    path('api/items/', views.ItemView.as_view(), name='api_item_list'),
    path('api/items/create/', views.ItemView.as_view(), name='api_item_create'),
    path('api/items/<uuid:item_id>/', views.ItemView.as_view(), name='api_item_detail'),
    path('api/items/<uuid:item_id>/update/', views.ItemView.as_view(), name='api_item_update'),
    path('api/items/<uuid:item_id>/delete/', views.ItemView.as_view(), name='api_item_delete'),
        # ==================== API های کمکی ====================
    path('api/search/items/', views.api_search_items, name='api_search_items'),
    path('api/items/<uuid:item_id>/units/', views.api_item_units, name='api_item_units'),
    path('api/items/<uuid:item_id>/batches/', views.api_item_batches, name='api_item_batches'),
    path('api/items/<uuid:item_id>/stock/', views.api_check_stock, name='api_check_stock'),
    
    # ==================== مدیریت ورودی انبار ====================
    # صفحات HTML
    path('entries/', views.stock_entry_list_page, name='stock_entry_list_page'),
    path('entries/create/', views.stock_entry_list_page, name='stock_entry_create_page'),
    path('entries/<uuid:entry_id>/', views.stock_entry_list_page, name='stock_entry_detail_page'),
    
    # API endpoints
    path('api/entries/', views.StockEntryView.as_view(), name='api_stock_entry_list'),
    path('api/entries/create/', views.StockEntryView.as_view(), name='api_stock_entry_create'),
    path('api/entries/<uuid:entry_id>/', views.StockEntryView.as_view(), name='api_stock_entry_detail'),
    path('api/entries/<uuid:entry_id>/update/', views.StockEntryView.as_view(), name='api_stock_entry_update'),
    path('api/entries/<uuid:entry_id>/delete/', views.StockEntryView.as_view(), name='api_stock_entry_delete'),
    
    # ==================== مدیریت خروجی انبار ====================
    # صفحات HTML
    path('inventory/', views.stock_exit_list_page, name='stock_exit_list_page'),
    path('exits/create/', views.stock_exit_list_page, name='stock_exit_create_page'),
    path('exits/<uuid:exit_id>/', views.stock_exit_list_page, name='stock_exit_detail_page'),
    
    # API endpoints
    path('api/exits/', views.StockExitView.as_view(), name='api_stock_exit_list'),
    path('api/exits/create/', views.StockExitView.as_view(), name='api_stock_exit_create'),
    path('api/exits/<uuid:exit_id>/', views.StockExitView.as_view(), name='api_stock_exit_detail'),
    path('api/exits/<uuid:exit_id>/update/', views.StockExitView.as_view(), name='api_stock_exit_update'),
    path('api/exits/<uuid:exit_id>/delete/', views.StockExitView.as_view(), name='api_stock_exit_delete'),
    
    # ==================== مدیریت انبارها ====================
    # صفحات HTML
    path('warehouses/', views.WarehouseView.as_view(), name='warehouse_list'),
    path('warehouses/<uuid:warehouse_id>/', views.WarehouseView.as_view(), name='warehouse_detail'),
    path('warehouses/<uuid:warehouse_id>/edit/', views.WarehouseView.as_view(), name='warehouse_edit'),
    path('warehouses/<uuid:warehouse_id>/delete/', views.WarehouseView.as_view(), name='warehouse_delete'),
    
    # یا اگر می‌خواهید URL های جداگانه برای عملیات مختلف:
    path('warehouses/create/', views.WarehouseView.as_view(), name='warehouse_create'),
    # API endpoints
    path('api/warehouses/', views.WarehouseView.as_view(), name='api_warehouse_list'),
    path('api/warehouses/create/', views.WarehouseView.as_view(), name='api_warehouse_create'),
    path('api/warehouses/<uuid:warehouse_id>/', views.WarehouseView.as_view(), name='api_warehouse_detail'),
    path('api/warehouses/<uuid:warehouse_id>/update/', views.WarehouseView.as_view(), name='api_warehouse_update'),
    path('api/warehouses/<uuid:warehouse_id>/delete/', views.WarehouseView.as_view(), name='api_warehouse_delete'),
    path('api/warehouse-managers/', views.get_warehouse_managers, name='api_warehouse_managers'),
    # path('api/warehouses/', views.WarehouseView.as_view(), name='api_warehouses'),
    # path('api/warehouses/<uuid:warehouse_id>/detail/', views.WarehouseView.as_view(), name='warehouse_api_detail'),
    # یا برای صفحات HTML
    path('api/warehouses/', views.WarehouseView.as_view(), name='warehouse_list'),
    path('api/warehouses/create/', views.WarehouseView.as_view(), name='warehouse_create'),
    path('api/warehouses/<uuid:warehouse_id>/', views.WarehouseView.as_view(), name='warehouse_detail'),
    path('api/warehouses/<uuid:warehouse_id>/edit/', views.WarehouseView.as_view(), name='warehouse_edit'),
    path('api/warehouses/<uuid:warehouse_id>/delete/', views.WarehouseView.as_view(), name='warehouse_delete'),
    path('api/warehouses/<uuid:warehouse_id>/info/', views.WarehouseView.as_view(), name='warehouse_info'),
    path('api/warehouses/<uuid:warehouse_id>/detail/', views.WarehouseView.as_view(), name='warehouse_detail'),
    
    
    # ==================== مدیریت موجودی ====================
    # صفحات HTML
    path('inventory/', views.inventory_list_page, name='inventory_list_page'),
    
    # API endpoints
    path('api/inventory/', views.inventory_list, name='api_inventory_list'),
    
    # ==================== گزارشات ====================
    # صفحات HTML
    path('reports/', views.reports_page, name='reports_page'),
    path('reports/low-stock/', views.reports_page, name='low_stock_report_page'),
    path('reports/expiry/', views.reports_page, name='expiry_report_page'),
    path('reports/movements/', views.reports_page, name='movements_report_page'),
    
    # API endpoints
    path('api/reports/low-stock/', views.low_stock_report, name='api_low_stock_report'),
    path('api/reports/expiry/', views.expiry_report, name='api_expiry_report'),
    path('api/reports/movements/', views.stock_movement_report, name='api_movement_report'),
    

    
    # ==================== مدیریت دسته‌بندی‌ها ====================
    path('api/categories/', views.CategoryView.as_view(), name='api_category_list'),
    path('api/categories/create/', views.CategoryView.as_view(), name='api_category_create'),
    path('api/categories/<uuid:category_id>/', views.CategoryView.as_view(), name='api_category_detail'),
    path('api/categories/<uuid:category_id>/update/', views.CategoryView.as_view(), name='api_category_update'),
    path('api/categories/<uuid:category_id>/delete/', views.CategoryView.as_view(), name='api_category_delete'),
    
    # ==================== مدیریت واحدهای اندازه‌گیری ====================
    path('api/units/', views.UnitView.as_view(), name='api_unit_list'),
    path('api/units/create/', views.UnitView.as_view(), name='api_unit_create'),
    path('api/units/<uuid:unit_id>/', views.UnitView.as_view(), name='api_unit_detail'),
    path('api/units/<uuid:unit_id>/update/', views.UnitView.as_view(), name='api_unit_update'),
    path('api/units/<uuid:unit_id>/delete/', views.UnitView.as_view(), name='api_unit_delete'),
    
    # ==================== مدیریت بچ‌ها ====================
    path('api/batches/', views.BatchView.as_view(), name='api_batch_list'),
    path('api/batches/create/', views.BatchView.as_view(), name='api_batch_create'),
    path('api/batches/<uuid:batch_id>/', views.BatchView.as_view(), name='api_batch_detail'),
    path('api/batches/<uuid:batch_id>/update/', views.BatchView.as_view(), name='api_batch_update'),
    path('api/batches/<uuid:batch_id>/delete/', views.BatchView.as_view(), name='api_batch_delete'),
    
    # ==================== عملیات خاص ====================
    # انتقال بین انبارها
    path('api/transfer/', views.StockTransferView.as_view(), name='api_stock_transfer'),
    path('api/transfer/<uuid:transfer_id>/', views.StockTransferView.as_view(), name='api_transfer_detail'),
    
    # تنظیم موجودی
    path('api/adjustment/', views.StockAdjustmentView.as_view(), name='api_stock_adjustment'),
    path('api/adjustment/<uuid:adjustment_id>/', views.StockAdjustmentView.as_view(), name='api_adjustment_detail'),
    
    # بارکد و QR کد
    path('api/items/<uuid:item_id>/barcode/', views.generate_barcode, name='api_generate_barcode'),
    path('api/items/<uuid:item_id>/qrcode/', views.generate_qrcode, name='api_generate_qrcode'),
    
    # ==================== Export/Import ====================
    path('api/export/items/', views.export_items, name='api_export_items'),
    path('api/export/inventory/', views.export_inventory, name='api_export_inventory'),
    path('api/export/movements/', views.export_movements, name='api_export_movements'),
    path('api/import/items/', views.import_items, name='api_import_items'),
    
    # ==================== Dashboard APIs ====================
    path('api/dashboard/stats/', views.dashboard_stats, name='api_dashboard_stats'),
    path('api/dashboard/charts/', views.dashboard_charts, name='api_dashboard_charts'),
    path('api/dashboard/alerts/', views.dashboard_alerts, name='api_dashboard_alerts'),
    
    # ==================== Advanced Search ====================
    path('api/search/advanced/', views.advanced_search, name='api_advanced_search'),
    path('api/search/suggestions/', views.search_suggestions, name='api_search_suggestions'),
    
    # ==================== Bulk Operations ====================
    path('api/bulk/items/update/', views.bulk_update_items, name='api_bulk_update_items'),
    path('api/bulk/items/delete/', views.bulk_delete_items, name='api_bulk_delete_items'),
    path('api/bulk/entries/create/', views.bulk_create_entries, name='api_bulk_create_entries'),
    path('api/bulk/exits/create/', views.bulk_create_exits, name='api_bulk_create_exits'),
    # ==================== Notifications API & Page ====================
    # این ویو صفحه اصلی اعلان‌ها را رندر می‌کند
    path('notifications/', views.NotificationPageView.as_view(), name='notifications_page'),

    # این API لیست اعلان‌ها را برمی‌گرداند و اعلان جدید ایجاد می‌کند
    path('api/notifications/', views.NotificationAPIView.as_view(), name='notifications_api_list'),

    # این API برای عملیات روی یک اعلان خاص است (مثلا حذف)
    path('api/notifications/<uuid:notification_id>/', views.NotificationDetailAPIView.as_view(), name='notification_api_detail'),

    # این API برای عملیات دسته‌ای (مثل خواندن همه) است
    path('api/notifications/actions/', views.NotificationActionAPIView.as_view(), name='notification_api_actions'),

    # این API برای خروجی گرفتن است
    path('api/notifications/export/', views.export_notifications, name='export_notifications'),
    # ==================== Settings ====================
    path('api/settings/', views.InventorySettingsView.as_view(), name='api_inventory_settings'),
    path('api/settings/backup/', views.create_backup, name='api_create_backup'),
    path('api/settings/restore/', views.restore_backup, name='api_restore_backup'),
    
    # ==================== Mobile API ====================
    path('api/mobile/', include([
        path('login/', views.mobile_login, name='api_mobile_login'),
        path('scan/', views.mobile_scan, name='api_mobile_scan'),
        path('quick-entry/', views.mobile_quick_entry, name='api_mobile_quick_entry'),
        path('quick-exit/', views.mobile_quick_exit, name='api_mobile_quick_exit'),
        path('inventory-check/', views.mobile_inventory_check, name='api_mobile_inventory_check'),
    ])),
    
    
    
    # ==================== File Upload ====================
    path('api/upload/item-image/', views.upload_item_image, name='api_upload_item_image'),
    path('api/upload/document/', views.upload_document, name='api_upload_document'),
    
    # ==================== Print & PDF ====================
    path('api/print/barcode/<uuid:item_id>/', views.print_barcode, name='api_print_barcode'),
    path('api/print/entry/<uuid:entry_id>/', views.print_entry_receipt, name='api_print_entry_receipt'),
    path('api/print/exit/<uuid:exit_id>/', views.print_exit_receipt, name='api_print_exit_receipt'),
    path('api/pdf/inventory-report/', views.pdf_inventory_report, name='api_pdf_inventory_report'),
    
    # ==================== Integration APIs ====================
    # برای اتصال به سیستم‌های خارجی
    path('api/integration/erp/', views.erp_integration, name='api_erp_integration'),
    path('api/integration/accounting/', views.accounting_integration, name='api_accounting_integration'),
    path('api/integration/webhook/', views.webhook_handler, name='api_webhook_handler'),
    #path('js/config.js', views.config_js, name='config_js'),
    
]

# ==================== URL Patterns برای Development ====================
from django.conf import settings
from django.conf.urls.static import static

if settings.DEBUG:
    # برای نمایش فایل‌های media در development
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
    # API Documentation (Swagger/OpenAPI)
    urlpatterns += [
        path('api/docs/', views.api_documentation, name='api_docs'),
        path('api/schema/', views.api_schema, name='api_schema'),
    ]
