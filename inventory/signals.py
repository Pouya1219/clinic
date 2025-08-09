# inventory/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import json

from .models import Item, Inventory, StockEntry, StockExit
from .services import InventoryService

@receiver(post_save, sender=Item)
def item_saved(sender, instance, created, **kwargs):
    """
    سیگنال ذخیره کالا
    """
    channel_layer = get_channel_layer()
    
    # تبدیل داده‌ها به دیکشنری
    current_stock = InventoryService.get_current_stock(instance)
    item_data = {
        'id': str(instance.id),
        'name': instance.name,
        'code': instance.code,
        'barcode': instance.barcode,
        'category': instance.category.name if instance.category else '',
        'primary_unit': instance.primary_unit.symbol if instance.primary_unit else '',
        'brand': instance.brand,
        'alert_threshold': float(instance.alert_threshold),
        'current_stock': float(current_stock),
        'created_at': instance.created_at.isoformat(),
        'image_url': instance.image.url if hasattr(instance, 'image') and instance.image else None,
    }
    
    # ارسال پیام به گروه انبار
    async_to_sync(channel_layer.group_send)(
        "inventory",
        {
            'type': 'inventory_update',
            'event_type': 'item_update',
            'data': {
                'item': item_data,
                'created': created
            }
        }
    )

@receiver(post_delete, sender=Item)
def item_deleted(sender, instance, **kwargs):
    """
    سیگنال حذف کالا
    """
    channel_layer = get_channel_layer()
    
    # ارسال پیام به گروه انبار
    async_to_sync(channel_layer.group_send)(
        "inventory",
        {
            'type': 'inventory_update',
            'event_type': 'item_delete',
            'data': {
                'item_id': str(instance.id)
            }
        }
    )

@receiver(post_save, sender=Inventory)
def inventory_saved(sender, instance, created, **kwargs):
    """
    سیگنال ذخیره موجودی
    """
    channel_layer = get_channel_layer()
    
    # تبدیل داده‌ها به دیکشنری
    inventory_data = {
        'item_id': str(instance.item.id),
        'warehouse': instance.warehouse.name if instance.warehouse else '',
        'batch': instance.batch.batch_number if instance.batch else None,
        'quantity': float(instance.quantity),
        'value': float(instance.value),
        'average_cost': float(instance.average_cost),
    }
    
    # ارسال پیام به گروه انبار
    async_to_sync(channel_layer.group_send)(
        "inventory",
        {
            'type': 'inventory_update',
            'event_type': 'inventory_update',
            'data': {
                'inventory': inventory_data,
                'created': created
            }
        }
    )

@receiver(post_save, sender=StockEntry)
def stock_entry_saved(sender, instance, created, **kwargs):
    """
    سیگنال ذخیره ورودی انبار
    """
    if created:  # فقط برای ورودی‌های جدید
        channel_layer = get_channel_layer()
        
        # محاسبه موجودی جدید
        current_stock = InventoryService.get_current_stock(instance.item)
        
        # ارسال پیام به گروه انبار
        async_to_sync(channel_layer.group_send)(
            "inventory",
            {
                'type': 'inventory_update',
                'event_type': 'stock_update',
                'data': {
                    'item_id': str(instance.item.id),
                    'new_stock': float(current_stock),
                    'entry_id': str(instance.id)
                }
            }
        )

@receiver(post_save, sender=StockExit)
def stock_exit_saved(sender, instance, created, **kwargs):
    """
    سیگنال ذخیره خروجی انبار
    """
    if created:  # فقط برای خروجی‌های جدید
        channel_layer = get_channel_layer()
        
        # محاسبه موجودی جدید
        current_stock = InventoryService.get_current_stock(instance.item)
        
        # ارسال پیام به گروه انبار
        async_to_sync(channel_layer.group_send)(
            "inventory",
            {
                'type': 'inventory_update',
                'event_type': 'stock_update',
                'data': {
                    'item_id': str(instance.item.id),
                    'new_stock': float(current_stock),
                    'exit_id': str(instance.id)
                }
            }
        )
