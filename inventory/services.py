# inventory/services.py - منطق کسب‌وکار

from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from .models import *
import logging
logger = logging.getLogger(__name__)


class InventoryService:
    """سرویس مدیریت موجودی"""
    
    @staticmethod
    def generate_entry_number():
        """تولید شماره ورودی خودکار"""
        today = timezone.now().date()
        prefix = f"EN{today.strftime('%Y%m%d')}"
        
        last_entry = StockEntry.objects.filter(
            entry_number__startswith=prefix
        ).order_by('-entry_number').first()
        
        if last_entry:
            last_number = int(last_entry.entry_number[-4:])
            new_number = last_number + 1
        else:
            new_number = 1
            
        return f"{prefix}{new_number:04d}"
    
    @staticmethod
    def generate_exit_number():
        """تولید شماره خروجی خودکار"""
        today = timezone.now().date()
        prefix = f"EX{today.strftime('%Y%m%d')}"
        
        last_exit = StockExit.objects.filter(
            exit_number__startswith=prefix
        ).order_by('-exit_number').first()
        
        if last_exit:
            last_number = int(last_exit.exit_number[-4:])
            new_number = last_number + 1
        else:
            new_number = 1
            
        return f"{prefix}{new_number:04d}"
    
    @staticmethod
    def calculate_unit_conversion(item, from_unit, quantity):
        """محاسبه تبدیل واحد"""
        if from_unit == item.primary_unit:
            return quantity, Decimal('1')
        
        try:
            item_unit = ItemUnit.objects.get(item=item, unit=from_unit)
            primary_quantity = item_unit.convert_to_primary(quantity)
            return primary_quantity, item_unit.conversion_factor
        except ItemUnit.DoesNotExist:
            return quantity, Decimal('1')
    
    @staticmethod
    @transaction.atomic
    def create_stock_entry(data, user):
        """ایجاد ورودی انبار"""
        
        # محاسبه تبدیل واحد
        primary_quantity, conversion_factor = InventoryService.calculate_unit_conversion(
            data['item'], data['unit'], data['quantity']
        )
        
        # ایجاد ورودی
        entry = StockEntry.objects.create(
            entry_number=data.get('entry_number') or InventoryService.generate_entry_number(),
            item=data['item'],
            warehouse=data['warehouse'],
            batch=data.get('batch'),
            quantity=data['quantity'],
            unit=data['unit'],
            unit_conversion_factor=conversion_factor,
            primary_quantity=primary_quantity,
            unit_cost=data['unit_cost'],
            total_cost=data['quantity'] * data['unit_cost'],
            reference_document=data.get('reference_document'),
            supplier=data.get('supplier'),
            notes=data.get('notes'),
            serial_numbers=data.get('serial_numbers', []),
            created_by=user
        )
        
        # بروزرسانی موجودی
        InventoryService.update_inventory_on_entry(entry)
        
        # ثبت حرکت
        InventoryService.record_stock_movement(
            item=entry.item,
            warehouse=entry.warehouse,
            batch=entry.batch,
            movement_type='ENTRY',
            quantity_change=primary_quantity,
            value_change=entry.total_cost,
            reference_id=entry.pk,
            reference_type='StockEntry'
        )
        
        return entry
    
    @staticmethod
    @transaction.atomic
    def create_stock_exit(data, user):
        """ایجاد خروجی انبار"""
        
        # محاسبه تبدیل واحد
        primary_quantity, conversion_factor = InventoryService.calculate_unit_conversion(
            data['item'], data['unit'], data['quantity']
        )
        
        # چک موجودی
        if not InventoryService.check_stock_availability(
            data['item'], data['warehouse'], data.get('batch'), primary_quantity
        ):
            raise ValueError("موجودی کافی برای خروج وجود ندارد!")
        
        # محاسبه قیمت خروج
        unit_cost = InventoryService.calculate_exit_cost(
            data['item'], data['warehouse'], data.get('batch'), primary_quantity
        )
        
        # ایجاد خروجی
        exit_obj = StockExit.objects.create(
            exit_number=data.get('exit_number') or InventoryService.generate_exit_number(),
            item=data['item'],
            warehouse=data['warehouse'],
            batch=data.get('batch'),
            quantity=data['quantity'],
            unit=data['unit'],
            unit_conversion_factor=conversion_factor,
            primary_quantity=primary_quantity,
            unit_cost=unit_cost,
            total_cost=data['quantity'] * unit_cost,
            exit_type=data.get('exit_type', 'CONSUMPTION'),
            recipient_name=data['recipient_name'],
            recipient_department=data.get('recipient_department'),
            reference_document=data.get('reference_document'),
            notes=data.get('notes'),
            serial_numbers=data.get('serial_numbers', []),
            created_by=user
        )
        
        # بروزرسانی موجودی
        InventoryService.update_inventory_on_exit(exit_obj)
        
        # ثبت حرکت
        InventoryService.record_stock_movement(
            item=exit_obj.item,
            warehouse=exit_obj.warehouse,
            batch=exit_obj.batch,
            movement_type='EXIT',
            quantity_change=-primary_quantity,
            value_change=-exit_obj.total_cost,
            reference_id=exit_obj.pk,
            reference_type='StockExit'
        )
        
        return exit_obj
    
    @staticmethod
    def update_inventory_on_entry(entry):
        """بروزرسانی موجودی پس از ورودی"""
        inventory, created = Inventory.objects.get_or_create(
            item=entry.item,
            warehouse=entry.warehouse,
            batch=entry.batch,
            defaults={
                'quantity': Decimal('0'),
                'value': Decimal('0')
            }
        )
        
        inventory.quantity += entry.primary_quantity
        inventory.value += entry.total_cost
        inventory.save()
    
    @staticmethod
    def update_inventory_on_exit(exit_obj):
        """بروزرسانی موجودی پس از خروجی"""
        try:
            inventory = Inventory.objects.get(
                item=exit_obj.item,
                warehouse=exit_obj.warehouse,
                batch=exit_obj.batch
            )
            
            inventory.quantity -= exit_obj.primary_quantity
            inventory.value -= exit_obj.total_cost
            
            if inventory.quantity <= 0:
                inventory.delete()
            else:
                inventory.save()
                
        except Inventory.DoesNotExist:
            raise ValueError("موجودی برای خروج یافت نشد!")
    
    @staticmethod
    def check_stock_availability(item, warehouse, batch, required_quantity):
        """چک موجودی کافی"""
        try:
            inventory = Inventory.objects.get(
                item=item,
                warehouse=warehouse,
                batch=batch
            )
            return inventory.quantity >= required_quantity
        except Inventory.DoesNotExist:
            return False
    
    @staticmethod
    def calculate_exit_cost(item, warehouse, batch, quantity):
        """محاسبه قیمت خروج بر اساس روش انتخابی"""
        if item.cost_method == 'FIFO':
            return InventoryService.calculate_fifo_cost(item, warehouse, batch)
        elif item.cost_method == 'LIFO':
            return InventoryService.calculate_lifo_cost(item, warehouse, batch)
        else:  # AVERAGE
            return InventoryService.calculate_average_cost(item, warehouse, batch)
    
    @staticmethod
    def calculate_fifo_cost(item, warehouse, batch):
        """محاسبه قیمت FIFO"""
        entries = StockEntry.objects.filter(
            item=item,
            warehouse=warehouse,
            batch=batch
        ).order_by('entry_date')
        
        if entries.exists():
            return entries.first().unit_cost
        return Decimal('0')
    
    @staticmethod
    def calculate_lifo_cost(item, warehouse, batch):
        """محاسبه قیمت LIFO"""
        entries = StockEntry.objects.filter(
            item=item,
            warehouse=warehouse,
            batch=batch
        ).order_by('-entry_date')
        
        if entries.exists():
            return entries.first().unit_cost
        return Decimal('0')
    
    @staticmethod
    def calculate_average_cost(item, warehouse, batch):
        """محاسبه قیمت میانگین موزون"""
        try:
            inventory = Inventory.objects.get(
                item=item,
                warehouse=warehouse,
                batch=batch
            )
            if inventory.quantity > 0:
                return inventory.value / inventory.quantity
        except Inventory.DoesNotExist:
            pass
        return Decimal('0')
    
    @staticmethod
    def record_stock_movement(item, warehouse, batch, movement_type, 
                            quantity_change, value_change, reference_id, reference_type):
        """ثبت حرکت انبار"""
        
        # دریافت موجودی قبل
        try:
            inventory = Inventory.objects.get(
                item=item,
                warehouse=warehouse,
                batch=batch
            )
            quantity_before = inventory.quantity - quantity_change
            value_before = inventory.value - value_change
            quantity_after = inventory.quantity
            value_after = inventory.value
        except Inventory.DoesNotExist:
            quantity_before = Decimal('0')
            value_before = Decimal('0')
            quantity_after = quantity_change
            value_after = value_change
        
        StockMovement.objects.create(
            item=item,
            warehouse=warehouse,
            batch=batch,
            movement_type=movement_type,
            quantity_before=quantity_before,
            quantity_change=quantity_change,
            quantity_after=quantity_after,
            value_before=value_before,
            value_change=value_change,
            value_after=value_after,
            reference_id=reference_id,
            reference_type=reference_type
        )
    
    @staticmethod
    def get_low_stock_items(warehouse=None):
        """دریافت کالاهای کم موجودی"""
        items = Item.objects.filter(enable_low_stock_alert=True)
        low_stock_items = []
        
        for item in items:
            current_stock = InventoryService.get_current_stock(item, warehouse)
            if current_stock <= item.alert_threshold:
                low_stock_items.append({
                    'item': item,
                    'current_stock': current_stock,
                    'alert_threshold': item.alert_threshold,
                    'status': 'critical' if current_stock == 0 else 'warning'
                })
        
        return low_stock_items
    
    @staticmethod
    def get_current_stock(item, warehouse=None):
        """دریافت موجودی فعلی"""
        if warehouse:
            total = Inventory.objects.filter(
                item=item, 
                warehouse=warehouse
            ).aggregate(total=models.Sum('quantity'))['total']
        else:
            total = Inventory.objects.filter(
                item=item
            ).aggregate(total=models.Sum('quantity'))['total']
        
        return total or Decimal('0')


