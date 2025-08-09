# inventory/serializers.py

from rest_framework import serializers
from .models import Item, Category, Warehouse, UnitOfMeasure, StockEntry, StockExit, Inventory

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'parent', 'is_active']

class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitOfMeasure
        fields = ['id', 'name', 'symbol', 'description', 'is_active']

class WarehouseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Warehouse
        fields = ['id', 'name', 'location', 'manager', 'description', 'is_active']

class ItemSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    primary_unit_name = serializers.ReadOnlyField(source='primary_unit.name')
    current_stock = serializers.SerializerMethodField()
    
    class Meta:
        model = Item
        fields = [
            'id', 'name', 'code', 'barcode', 'category', 'category_name',
            'primary_unit', 'primary_unit_name', 'brand', 'model',
            'min_stock_level', 'max_stock_level', 'alert_threshold',
            'enable_low_stock_alert', 'cost_method', 'has_expiry',
            'has_serial', 'has_batch', 'storage_conditions',
            'storage_temperature_min', 'storage_temperature_max',
            'description', 'usage_instructions', 'image',
            'is_active', 'created_at', 'updated_at', 'created_by',
            'current_stock'
        ]
    
    def get_current_stock(self, obj):
        # محاسبه موجودی کل
        from django.db.models import Sum
        total = Inventory.objects.filter(item=obj).aggregate(total=Sum('quantity'))['total']
        return total or 0

class InventorySerializer(serializers.ModelSerializer):
    item_name = serializers.ReadOnlyField(source='item.name')
    item_code = serializers.ReadOnlyField(source='item.code')
    warehouse_name = serializers.ReadOnlyField(source='warehouse.name')
    
    class Meta:
        model = Inventory
        fields = [
            'id', 'item', 'item_name', 'item_code', 'warehouse',
            'warehouse_name', 'batch', 'quantity', 'value'
        ]

class StockEntrySerializer(serializers.ModelSerializer):
    item_name = serializers.ReadOnlyField(source='item.name')
    item_code = serializers.ReadOnlyField(source='item.code')
    warehouse_name = serializers.ReadOnlyField(source='warehouse.name')
    unit_name = serializers.ReadOnlyField(source='unit.name')
    
    class Meta:
        model = StockEntry
        fields = [
            'id', 'entry_number', 'item', 'item_name', 'item_code',
            'warehouse', 'warehouse_name', 'batch', 'quantity',
            'unit', 'unit_name', 'unit_conversion_factor', 'primary_quantity',
            'unit_cost', 'total_cost', 'entry_date', 'reference_document',
            'supplier', 'notes', 'serial_numbers', 'created_by', 'created_at'
        ]

class StockExitSerializer(serializers.ModelSerializer):
    item_name = serializers.ReadOnlyField(source='item.name')
    item_code = serializers.ReadOnlyField(source='item.code')
    warehouse_name = serializers.ReadOnlyField(source='warehouse.name')
    unit_name = serializers.ReadOnlyField(source='unit.name')
    
    class Meta:
        model = StockExit
        fields = [
            'id', 'exit_number', 'item', 'item_name', 'item_code',
            'warehouse', 'warehouse_name', 'batch', 'quantity',
            'unit', 'unit_name', 'unit_conversion_factor', 'primary_quantity',
            'unit_cost', 'total_cost', 'exit_date', 'exit_type',
            'recipient_name', 'recipient_department', 'reference_document',
            'notes', 'serial_numbers', 'created_by', 'created_at'
        ]
