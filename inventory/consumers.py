# inventory/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from django.db.models import Q
from django.core.paginator import Paginator

class InventoryConsumer(AsyncWebsocketConsumer):
    """
    مصرف‌کننده وب‌سوکت برای سیستم انبارداری
    """
    
    async def connect(self):
        """
        اتصال به وب‌سوکت
        """
        # اضافه کردن به گروه انبار
        await self.channel_layer.group_add(
            "inventory",
            self.channel_name
        )
        
        # پذیرش اتصال
        await self.accept()
        
        # ارسال پیام خوش‌آمدگویی
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'اتصال به سیستم انبارداری برقرار شد',
            'timestamp': timezone.now().isoformat()
        }))
    
    async def disconnect(self, close_code):
        """
        قطع اتصال از وب‌سوکت
        """
        # حذف از گروه انبار
        await self.channel_layer.group_discard(
            "inventory",
            self.channel_name
        )
    
    async def receive(self, text_data):
        """
        دریافت پیام از کلاینت - بروزرسانی شده
        """
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            
            if message_type == 'get_low_stock_items':
                await self.send_low_stock_items()
            elif message_type == 'get_dashboard_stats':
                await self.send_dashboard_stats()
            elif message_type == 'get_items':
                page = text_data_json.get('page', 1)
                per_page = text_data_json.get('per_page', 20)
                sort_by = text_data_json.get('sort_by', 'name')
                sort_order = text_data_json.get('sort_order', 'asc')
                filters = text_data_json.get('filters', {})
                await self.send_items_list(page, per_page, sort_by, sort_order, filters)
            elif message_type == 'get_item_details':
                item_id = text_data_json.get('item_id')
                if item_id:
                    await self.send_item_details(item_id)
            # متدهای جدید انبار
            elif message_type == 'get_warehouses':
                await self.send_warehouses_list()
            elif message_type == 'get_warehouse_details':
                warehouse_id = text_data_json.get('warehouse_id')
                if warehouse_id:
                    await self.send_warehouse_details(warehouse_id)
            elif message_type == 'get_warehouse_inventory':
                warehouse_id = text_data_json.get('warehouse_id')
                if warehouse_id:
                    await self.send_warehouse_inventory(warehouse_id)
            elif message_type == 'get_stock_movements':
                filters = text_data_json.get('filters', {})
                await self.send_stock_movements(filters)
            elif message_type == 'create_stock_entry':
                entry_data = text_data_json.get('data', {})
                await self.handle_stock_entry_creation(entry_data)
            elif message_type == 'create_stock_exit':
                exit_data = text_data_json.get('data', {})
                await self.handle_stock_exit_creation(exit_data)
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'نوع پیام نامشخص است',
                    'timestamp': timezone.now().isoformat()
                }))
        except json.JSONDecodeError:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': 'فرمت پیام نامعتبر است',
                'timestamp': timezone.now().isoformat()
            }))
    
    @database_sync_to_async
    def get_items_list(self, page, per_page, sort_by, sort_order, filters):
        """
        دریافت لیست کالاها
        """
        from .models import Item
        from .services import InventoryService
    
    # دریافت کالاها
        items = Item.objects.select_related('category', 'primary_unit').filter(is_active=True)
    
    # اعمال فیلترها
        search = filters.get('search', '')
        if search:
            items = items.filter(
                Q(name__icontains=search) |
                Q(code__icontains=search) |
                Q(barcode__icontains=search)
            )
    
        category_id = filters.get('category', '')
        if category_id:
            items = items.filter(category_id=category_id)
    
        low_stock = filters.get('low_stock', '')
        if low_stock == '1':
            low_stock_item_ids = []
            for item in items:
                current_stock = InventoryService.get_current_stock(item)
                if current_stock <= item.alert_threshold:
                    low_stock_item_ids.append(item.id)
            items = items.filter(id__in=low_stock_item_ids)
    
    # مرتب‌سازی
        if sort_order == 'desc':
            sort_by = f'-{sort_by}'
        items = items.order_by(sort_by)
    
    # صفحه‌بندی
        paginator = Paginator(items, per_page)
        page_obj = paginator.get_page(page)
    
    # تبدیل به دیکشنری - تغییر نام id به item_id
        items_list = []
        for item_obj in page_obj:  # تغییر نام از item به item_obj
            current_stock = InventoryService.get_current_stock(item_obj)
            items_list.append({
                'item_id': str(item_obj.id),  # تغییر از 'id' به 'item_id'
                'name': item_obj.name,
                'code': item_obj.code,
                'barcode': item_obj.barcode,
                'category': item_obj.category.name if item_obj.category else '',
                'primary_unit': item_obj.primary_unit.symbol if item_obj.primary_unit else '',
                'brand': item_obj.brand,
                'alert_threshold': float(item_obj.alert_threshold),
                'current_stock': float(current_stock),
                'created_at': item_obj.created_at.isoformat(),
                'image_url': item_obj.image.url if hasattr(item_obj, 'image') and item_obj.image else None,
            })
    
    # اطلاعات صفحه‌بندی
        pagination = {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_items': paginator.count,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
        }
    
        return items_list, pagination
    
    async def send_items_list(self, page, per_page, sort_by, sort_order, filters):
        """
        ارسال لیست کالاها به کلاینت
        """
        try:
            items, pagination = await self.get_items_list(page, per_page, sort_by, sort_order, filters)
            
            await self.send(text_data=json.dumps({
                'type': 'items_list',
                'items': items,
                'pagination': pagination,
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            import traceback
            traceback.print_exc()
            
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'خطا در دریافت لیست کالاها: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))
    
    @database_sync_to_async
    def get_item_details(self, item_id):
        """
        دریافت جزئیات یک کالا
        """
        from .models import Item, Inventory, StockEntry, StockExit, ItemUnit
        from .services import InventoryService
        from django.shortcuts import get_object_or_404
    
    # دریافت کالا
        item_obj = get_object_or_404(Item, id=item_id)  # تغییر نام
    
    # موجودی در انبارها
        inventories = Inventory.objects.filter(item=item_obj).select_related('warehouse', 'batch')
    
    # آخرین ورودی‌ها
        recent_entries = StockEntry.objects.filter(item=item_obj).select_related(
            'warehouse', 'batch'
        ).order_by('-entry_date')[:10]
    
    # آخرین خروجی‌ها
        recent_exits = StockExit.objects.filter(item=item_obj).select_related(
            'warehouse', 'batch'
        ).order_by('-exit_date')[:10]
    
    # واحدهای تبدیل
        item_units = ItemUnit.objects.filter(item=item_obj).select_related('unit')
    
    # وضعیت آلارم
        current_stock = InventoryService.get_current_stock(item_obj)
    
        data = {
            'item': {
                'item_id': str(item_obj.id),  # تغییر از 'id' به 'item_id'
                'name': item_obj.name,
                'code': item_obj.code,
                'barcode': item_obj.barcode,
                'category': item_obj.category.name if item_obj.category else '',
                'primary_unit': item_obj.primary_unit.name if item_obj.primary_unit else '',
                'brand': item_obj.brand,
                'model': item_obj.model,
                'specifications': item_obj.specifications,
                'min_stock_level': float(item_obj.min_stock_level),
                'max_stock_level': float(item_obj.max_stock_level),
                'alert_threshold': float(item_obj.alert_threshold),
                'enable_low_stock_alert': item_obj.enable_low_stock_alert,
                'cost_method': item_obj.cost_method,
                'has_expiry': item_obj.has_expiry,
                'has_serial': item_obj.has_serial,
                'has_batch': item_obj.has_batch,
                'description': item_obj.description,
                'current_stock': float(current_stock),
                'created_at': item_obj.created_at.isoformat(),
                'image_url': item_obj.image.url if hasattr(item_obj, 'image') and item_obj.image else None,
            },
            'inventories': [{
                'warehouse': inv.warehouse.name,
                'batch': inv.batch.batch_number if inv.batch else None,
                'quantity': float(inv.quantity),
                'value': float(inv.value),
                'average_cost': float(inv.average_cost),
            } for inv in inventories],
            'recent_entries': [{
                'entry_number': entry.entry_number,
                'quantity': float(entry.quantity),
                'unit': entry.unit.symbol if entry.unit else '',
                'unit_cost': float(entry.unit_cost),
                'warehouse': entry.warehouse.name if entry.warehouse else '',
                'entry_date': entry.entry_date.isoformat(),
            } for entry in recent_entries],
            'recent_exits': [{
                'exit_number': exit.exit_number,
                'quantity': float(exit.quantity),
                'unit': exit.unit.symbol if exit.unit else '',
                'recipient_name': exit.recipient_name,
                'warehouse': exit.warehouse.name if exit.warehouse else '',
                'exit_date': exit.exit_date.isoformat(),
            } for exit in recent_exits],
            'item_units': [{
                'unit_name': unit.unit.name,
                'unit_symbol': unit.unit.symbol,
                'conversion_factor': float(unit.conversion_factor),
            } for unit in item_units]
        }
    
        return data
    
    async def send_item_details(self, item_id):
        """
        ارسال جزئیات یک کالا به کلاینت
        """
        try:
            item_data = await self.get_item_details(item_id)
            
            await self.send(text_data=json.dumps({
                'type': 'item_details',
                'data': item_data,
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            import traceback
            traceback.print_exc()
            
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'خطا در دریافت جزئیات کالا: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))
            
    
    @database_sync_to_async
    def get_warehouse_inventory(self, warehouse_id):
        """
        دریافت موجودی انبار
        """
        from .models import Warehouse, Inventory
        from django.shortcuts import get_object_or_404
        
        warehouse = get_object_or_404(Warehouse, id=warehouse_id, is_active=True)
        inventories = Inventory.objects.filter(warehouse=warehouse).select_related(
            'item', 'item__category', 'item__primary_unit', 'batch'
        ).filter(quantity__gt=0)
        
        inventory_list = []
        for inventory in inventories:
            inventory_list.append({
                'item_id': str(inventory.item.id),
                'item_name': inventory.item.name,
                'item_code': inventory.item.code,
                'category': inventory.item.category.name if inventory.item.category else '',
                'quantity': float(inventory.quantity),
                'unit': inventory.item.primary_unit.symbol if inventory.item.primary_unit else '',
                'value': float(inventory.value),
                'average_cost': float(inventory.average_cost),
                'batch_number': inventory.batch.batch_number if inventory.batch else None,
                'expiry_date': inventory.batch.expiry_date.isoformat() if inventory.batch and inventory.batch.expiry_date else None,
                'last_updated': inventory.last_updated.isoformat(),
            })
        
        return {
            'warehouse_id': warehouse_id,
            'warehouse_name': warehouse.name,
            'inventory': inventory_list
        }
    # متدهای مربوط به انبارها
    @database_sync_to_async
    def get_warehouses_list(self):
        """
        دریافت لیست انبارها
        """
        from .models import Warehouse, Inventory
        from django.db.models import Count, Sum
        
        warehouses = Warehouse.objects.filter(is_active=True).annotate(
            items_count=Count('inventory__item', distinct=True),
            total_value=Sum('inventory__value')
        )
        
        warehouses_list = []
        for warehouse in warehouses:
            warehouses_list.append({
                'id': str(warehouse.id),
                'name': warehouse.name,
                'code': warehouse.code,
                'location': warehouse.location or '',
                'manager_name': warehouse.manager.get_full_name() if warehouse.manager else '',
                'manager_id': str(warehouse.manager.id) if warehouse.manager else None,
                'description': warehouse.description or '',
                'items_count': warehouse.items_count or 0,
                'total_value': float(warehouse.total_value or 0),
                'created_at': warehouse.created_at.isoformat(),
            })
        
        return warehouses_list

    async def send_warehouses_list(self):
        """
        ارسال لیست انبارها به کلاینت
        """
        try:
            warehouses = await self.get_warehouses_list()
            
            await self.send(text_data=json.dumps({
                'type': 'warehouses_list',
                'warehouses': warehouses,
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'خطا در دریافت لیست انبارها: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))
    @database_sync_to_async
    def get_warehouse_details(self, warehouse_id):
        """دریافت جزئیات یک انبار """
        from .models import Warehouse, Inventory, StockEntry, StockExit
        from django.shortcuts import get_object_or_404
        from django.db.models import Count, Sum
    
        warehouse = get_object_or_404(Warehouse, id=warehouse_id, is_active=True)
    
    # آمار انبار
        stats = Inventory.objects.filter(warehouse=warehouse).aggregate(
            total_items=Count('item', distinct=True),
            total_quantity=Sum('quantity'),
            total_value=Sum('value')
        )
    
    # آخرین ورودی‌ها
        recent_entries = StockEntry.objects.filter(warehouse=warehouse).select_related(
            'item', 'unit'
        ).order_by('-entry_date')[:10]
    
    # آخرین خروجی‌ها
        recent_exits = StockExit.objects.filter(warehouse=warehouse).select_related(
            'item', 'unit'
        ).order_by('-exit_date')[:10]
    
        data = {
            'warehouse': {
                'id': str(warehouse.id),
                'name': warehouse.name,
                'code': warehouse.code,
                'location': warehouse.location or '',
                'manager_name': warehouse.manager.get_full_name() if warehouse.manager else '',
                'manager_id': str(warehouse.manager.id) if warehouse.manager else None,
                'description': warehouse.description or '',
                'created_at': warehouse.created_at.isoformat(),
            },
            'stats': {
                'total_items': stats['total_items'] or 0,
                'total_quantity': float(stats['total_quantity'] or 0),
                'total_value': float(stats['total_value'] or 0),
            },
            'recent_entries': [{
                'id': str(entry.id),
                'entry_number': entry.entry_number,
                'item_name': entry.item.name,
                'quantity': float(entry.quantity),
                'unit': entry.unit.symbol if entry.unit else '',
                'unit_cost': float(entry.unit_cost),
                'total_cost': float(entry.total_cost),
                'entry_date': entry.entry_date.isoformat(),
                'supplier': getattr(entry, 'supplier', '') or '',
            } for entry in recent_entries],
            'recent_exits': [{
                'id': str(exit.id),
                'exit_number': exit.exit_number,
                'item_name': exit.item.name,
                'quantity': float(exit.quantity),
                'unit': exit.unit.symbol if exit.unit else '',
                'recipient_name': getattr(exit, 'recipient_name', '') or '',
                'exit_date': exit.exit_date.isoformat(),
                'exit_type': getattr(exit, 'exit_type', '') or '',
            } for exit in recent_exits]
        }
        print("Received data  IN  consumers:", data)
        return data
    async def send_warehouse_details(self, warehouse_id):
        """
        ارسال جزئیات انبار به کلاینت
        """
        try:
            warehouse_data = await self.get_warehouse_details(warehouse_id)
            
            await self.send(text_data=json.dumps({
                'type': 'warehouse_details',
                'data': warehouse_data,
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'خطا در دریافت جزئیات انبار: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))
    async def send_warehouse_inventory(self, warehouse_id):
        """
        ارسال موجودی انبار به کلاینت
        """
        try:
            inventory_data = await self.get_warehouse_inventory(warehouse_id)
            
            await self.send(text_data=json.dumps({
                'type': 'warehouse_inventory',
                'data': inventory_data,
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'خطا در دریافت موجودی انبار: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))
    @database_sync_to_async
    def get_stock_movements(self, filters):
        """
        دریافت حرکات انبار
        """
        from .models import StockEntry, StockExit
        from django.db.models import Q
        from datetime import datetime, timedelta
        
        # فیلترهای تاریخ
        date_from = filters.get('date_from')
        date_to = filters.get('date_to')
        warehouse_id = filters.get('warehouse_id')
        item_id = filters.get('item_id')
        movement_type = filters.get('movement_type', 'all')  # all, entry, exit
        
        movements = []
        
        # ورودی‌ها
        if movement_type in ['all', 'entry']:
            entries = StockEntry.objects.select_related('item', 'warehouse', 'unit')
            
            if date_from:
                entries = entries.filter(entry_date__gte=date_from)
            if date_to:
                entries = entries.filter(entry_date__lte=date_to)
            if warehouse_id:
                entries = entries.filter(warehouse_id=warehouse_id)
            if item_id:
                entries = entries.filter(item_id=item_id)
            
            for entry in entries.order_by('-entry_date')[:50]:
                movements.append({
                    'id': str(entry.id),
                    'type': 'entry',
                    'document_number': entry.entry_number,
                    'item_name': entry.item.name,
                    'warehouse_name': entry.warehouse.name if entry.warehouse else '',
                    'quantity': float(entry.quantity),
                    'unit': entry.unit.symbol if entry.unit else '',
                    'unit_cost': float(entry.unit_cost),
                    'total_cost': float(entry.total_cost),
                    'date': entry.entry_date.isoformat(),
                    'supplier': entry.supplier,
                    'reference_document': entry.reference_document,
                })
        
        # خروجی‌ها
        if movement_type in ['all', 'exit']:
            exits = StockExit.objects.select_related('item', 'warehouse', 'unit')
            
            if date_from:
                exits = exits.filter(exit_date__gte=date_from)
            if date_to:
                exits = exits.filter(exit_date__lte=date_to)
            if warehouse_id:
                exits = exits.filter(warehouse_id=warehouse_id)
            if item_id:
                exits = exits.filter(item_id=item_id)
            
            for exit in exits.order_by('-exit_date')[:50]:
                movements.append({
                    'id': str(exit.id),
                    'type': 'exit',
                    'document_number': exit.exit_number,
                    'item_name': exit.item.name,
                    'warehouse_name': exit.warehouse.name if exit.warehouse else '',
                    'quantity': float(exit.quantity),
                    'unit': exit.unit.symbol if exit.unit else '',
                    'unit_cost': float(exit.unit_cost),
                    'total_cost': float(exit.total_cost),
                    'date': exit.exit_date.isoformat(),
                    'recipient_name': exit.recipient_name,
                    'exit_type': exit.exit_type,
                })
        
        # مرتب‌سازی بر اساس تاریخ
        movements.sort(key=lambda x: x['date'], reverse=True)
        
        return movements
    async def send_stock_movements(self, filters):
        """
        ارسال حرکات انبار به کلاینت
        """
        try:
            movements = await self.get_stock_movements(filters)
            
            await self.send(text_data=json.dumps({
                'type': 'stock_movements',
                'movements': movements,
                'timestamp': timezone.now().isoformat()
            }))
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': f'خطا در دریافت حرکات انبار: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))
    @database_sync_to_async
    def create_stock_entry(self, entry_data):
        """
        ایجاد ورودی انبار
        """
        from .models import Item, Warehouse, UnitOfMeasure
        from .services import InventoryService
        from django.shortcuts import get_object_or_404
        
        # تبدیل داده‌ها
        processed_data = {
            'item': get_object_or_404(Item, pk=entry_data.get('item_id')),
            'warehouse': get_object_or_404(Warehouse, pk=entry_data.get('warehouse_id')),
            'quantity': float(entry_data.get('quantity', 0)),
            'unit': get_object_or_404(UnitOfMeasure, pk=entry_data.get('unit_id')),
            'unit_cost': float(entry_data.get('unit_cost', 0)),
            'batch': entry_data.get('batch'),
            'reference_document': entry_data.get('reference_document'),
            'supplier': entry_data.get('supplier'),
            'notes': entry_data.get('notes'),
            'serial_numbers': entry_data.get('serial_numbers', [])
        }
        
        # ایجاد ورودی با استفاده از سرویس
        entry = InventoryService.create_stock_entry(processed_data, None)
        
        return {
            'id': str(entry.id),
            'entry_number': entry.entry_number,
            'item_name': entry.item.name,
            'warehouse_name': entry.warehouse.name,
            'quantity': float(entry.quantity),
            'unit_cost': float(entry.unit_cost),
            'total_cost': float(entry.total_cost),
            'entry_date': entry.entry_date.isoformat(),
        }
    async def handle_stock_entry_creation(self, entry_data):
        """
        مدیریت ایجاد ورودی انبار
        """
        try:
            entry = await self.create_stock_entry(entry_data)
            
            await self.send(text_data=json.dumps({
                'type': 'stock_entry_created',
                'success': True,
                'message': 'ورودی انبار با موفقیت ثبت شد',
                'entry': entry,
                'timestamp': timezone.now().isoformat()
            }))
            
            # ارسال بروزرسانی به سایر کلاینت‌ها
            await self.channel_layer.group_send(
                "inventory",
                {
                    'type': 'inventory_update',
                    'event_type': 'new_stock_entry',
                    'data': entry
                }
            )
            
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'stock_entry_error',
                'success': False,
                'message': f'خطا در ثبت ورودی: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))

    @database_sync_to_async
    def create_stock_exit(self, exit_data):
        """
        ایجاد خروجی انبار
        """
        from .models import Item, Warehouse, UnitOfMeasure
        from .services import InventoryService
        from django.shortcuts import get_object_or_404
        
        # تبدیل داده‌ها
        processed_data = {
            'item': get_object_or_404(Item, pk=exit_data.get('item_id')),
            'warehouse': get_object_or_404(Warehouse, pk=exit_data.get('warehouse_id')),
            'quantity': float(exit_data.get('quantity', 0)),
            'unit': get_object_or_404(UnitOfMeasure, pk=exit_data.get('unit_id')),
            'batch': exit_data.get('batch'),
            'exit_type': exit_data.get('exit_type', 'CONSUMPTION'),
            'recipient_name': exit_data.get('recipient_name'),
            'recipient_department': exit_data.get('recipient_department'),
            'reference_document': exit_data.get('reference_document'),
            'notes': exit_data.get('notes'),
            'serial_numbers': exit_data.get('serial_numbers', [])
        }
        
        # ایجاد خروجی با استفاده از سرویس
        exit_obj = InventoryService.create_stock_exit(processed_data, None)
        
        return {
            'id': str(exit_obj.id),
            'exit_number': exit_obj.exit_number,
            'item_name': exit_obj.item.name,
            'warehouse_name': exit_obj.warehouse.name,
            'quantity': float(exit_obj.quantity),
            'recipient_name': exit_obj.recipient_name,
            'exit_date': exit_obj.exit_date.isoformat(),
        }
    async def handle_stock_exit_creation(self, exit_data):
        """
        مدیریت ایجاد خروجی انبار
        """
        try:
            exit_obj = await self.create_stock_exit(exit_data)
            
            await self.send(text_data=json.dumps({
                'type': 'stock_exit_created',
                'success': True,
                'message': 'خروجی انبار با موفقیت ثبت شد',
                'exit': exit_obj,
                'timestamp': timezone.now().isoformat()
            }))
            
            # ارسال بروزرسانی به سایر کلاینت‌ها
            await self.channel_layer.group_send(
                "inventory",
                {
                    'type': 'inventory_update',
                    'event_type': 'new_stock_exit',
                    'data': exit_obj
                }
            )
            
        except Exception as e:
            await self.send(text_data=json.dumps({
                'type': 'stock_exit_error',
                'success': False,
                'message': f'خطا در ثبت خروجی: {str(e)}',
                'timestamp': timezone.now().isoformat()
            }))
    async def inventory_update(self, event):
        """
        ارسال بروزرسانی انبار به کلاینت
        """
        # ارسال پیام به کلاینت
        await self.send(text_data=json.dumps({
            'type': event['event_type'],
            'data': event['data'],
            'timestamp': timezone.now().isoformat()
        }))
    
    @database_sync_to_async
    def get_low_stock_items(self):
        """
        دریافت کالاهای کم موجود
        """
        # این متد باید با مدل‌های شما تطبیق داده شود
        # مثال:
        from .models import Item, Inventory
        from django.db.models import F
        
        low_stock_items = Item.objects.filter(
            is_active=True,
            inventory__quantity__gt=0,
            inventory__quantity__lte=F('min_stock_level')
        ).distinct()
        
        result = []
        for item in low_stock_items:
            inventory = Inventory.objects.filter(item=item).first()
            if inventory:
                result.append({
                    'id': str(item.id),
                    'name': item.name,
                    'code': item.code,
                    'current_stock': float(inventory.quantity),
                    'min_stock_level': float(item.min_stock_level),
                    'unit': item.primary_unit.name if item.primary_unit else ''
                })
        
        return result
    
    async def send_low_stock_items(self):
        """
        ارسال کالاهای کم موجود به کلاینت
        """
        low_stock_items = await self.get_low_stock_items()
        
        await self.send(text_data=json.dumps({
            'type': 'low_stock_items',
            'data': low_stock_items,
            'timestamp': timezone.now().isoformat()
        }))
    
    @database_sync_to_async
    def get_dashboard_stats(self):
        """
        دریافت آمار داشبورد
        """
        # این متد باید با مدل‌های شما تطبیق داده شود
        # مثال:
        from .models import Item, Inventory, StockEntry, StockExit
        from django.db.models import F, Sum, Count
        from django.utils import timezone
        
        today = timezone.now().date()
        
        # آمار کلی
        total_items = Item.objects.filter(is_active=True).count()
        
        # آمار امروز
        today_entries = StockEntry.objects.filter(entry_date__date=today).count()
        today_exits = StockExit.objects.filter(exit_date__date=today).count()
        
        # کالاهای کم موجود
        low_stock_items = Item.objects.filter(
            is_active=True,
            inventory__quantity__gt=0,
            inventory__quantity__lte=F('min_stock_level')
        ).distinct().count()
        
        # کالاهای ناموجود
        out_of_stock_items = Item.objects.filter(
            is_active=True,
            inventory__quantity=0
        ).distinct().count()
        
        # محاسبه ارزش کل موجودی
        total_value = Inventory.objects.filter(
            item__is_active=True
        ).aggregate(
            total=Sum('value')
        )['total'] or 0
        
        return {
            'total_items': total_items,
            'today_entries': today_entries,
            'today_exits': today_exits,
            'low_stock_items': low_stock_items,
            'out_of_stock_items': out_of_stock_items,
            'total_value': float(total_value)
        }
    
    async def send_dashboard_stats(self):
        """
        ارسال آمار داشبورد به کلاینت
        """
        stats = await self.get_dashboard_stats()
        
        await self.send(text_data=json.dumps({
            'type': 'dashboard_stats',
            'data': stats,
            'timestamp': timezone.now().isoformat()
        }))

