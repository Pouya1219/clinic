# inventory/api_views.py

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from .models import Item, Category, Warehouse, UnitOfMeasure, StockEntry, StockExit, Inventory
from .serializers import (
    ItemSerializer, CategorySerializer, WarehouseSerializer, UnitSerializer,
    StockEntrySerializer, StockExitSerializer, InventorySerializer
)
from .services import InventoryService
from django.db.models import Q, Sum, F
from rest_framework.permissions import AllowAny

class ItemListCreateView(generics.ListCreateAPIView):
    """
    لیست و ایجاد کالاها
    """
    queryset = Item.objects.filter(is_active=True)
    serializer_class = ItemSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # فیلترها
        search = self.request.query_params.get('search', '')
        category = self.request.query_params.get('category', '')
        warehouse = self.request.query_params.get('warehouse', '')
        stock_status = self.request.query_params.get('stock_status', '')
        
        # اعمال جستجو
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(code__icontains=search) | 
                Q(barcode__icontains=search)
            )
        
        # اعمال فیلتر دسته‌بندی
        if category:
            queryset = queryset.filter(category_id=category)
        
        # اعمال فیلتر انبار
        if warehouse:
            queryset = queryset.filter(inventory__warehouse_id=warehouse).distinct()
        
        # اعمال فیلتر وضعیت موجودی
        if stock_status:
            if stock_status == 'in_stock':
                queryset = queryset.filter(inventory__quantity__gt=F('min_stock_level'))
            elif stock_status == 'low_stock':
                queryset = queryset.filter(
                    inventory__quantity__gt=0,
                    inventory__quantity__lte=F('min_stock_level')
                )
            elif stock_status == 'out_of_stock':
                queryset = queryset.filter(inventory__quantity=0)
        
        # مرتب‌سازی
        sort_by = self.request.query_params.get('sort_by', 'name')
        sort_order = self.request.query_params.get('sort_order', 'asc')
        
        if sort_order == 'desc':
            sort_by = f'-{sort_by}'
        
        return queryset.order_by(sort_by)
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({
            'success': True,
            'message': 'کالا با موفقیت ایجاد شد',
            'item': serializer.data
        }, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class ItemRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    نمایش، ویرایش و حذف کالا
    """
    queryset = Item.objects.filter(is_active=True)
    serializer_class = ItemSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'item': serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'success': True,
            'message': 'کالا با موفقیت بروزرسانی شد',
            'item': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({
            'success': True,
            'message': 'کالا با موفقیت حذف شد'
        })


class ItemStockView(APIView):
    """
    موجودی کالا
    """
    def get(self, request, pk):
        item = get_object_or_404(Item, pk=pk, is_active=True)
        inventories = Inventory.objects.filter(item=item)
        
        data = []
        for inventory in inventories:
            data.append({
                'warehouse_id': inventory.warehouse.id,
                'warehouse_name': inventory.warehouse.name,
                'quantity': inventory.quantity,
                'value': inventory.value,
                'batch': inventory.batch
            })
        
        return Response({
            'success': True,
            'item_id': pk,
            'item_name': item.name,
            'inventories': data
        })


class ItemMovementsView(APIView):
    """
    حرکات کالا
    """
    def get(self, request, pk):
        item = get_object_or_404(Item, pk=pk, is_active=True)
        
        # دریافت ورودی‌ها
        entries = StockEntry.objects.filter(item=item).order_by('-entry_date')
        entry_serializer = StockEntrySerializer(entries, many=True)
        
        # دریافت خروجی‌ها
        exits = StockExit.objects.filter(item=item).order_by('-exit_date')
        exit_serializer = StockExitSerializer(exits, many=True)
        
        return Response({
            'success': True,
            'item_id': pk,
            'item_name': item.name,
            'entries': entry_serializer.data,
            'exits': exit_serializer.data
        })


class WarehouseListCreateView(generics.ListCreateAPIView):
    """
    لیست و ایجاد انبارها
    """
    queryset = Warehouse.objects.filter(is_active=True)
    serializer_class = WarehouseSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response({
            'success': True,
            'message': 'انبار با موفقیت ایجاد شد',
            'warehouse': serializer.data
        }, status=status.HTTP_201_CREATED, headers=headers)


class WarehouseRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    نمایش، ویرایش و حذف انبار
    """
    queryset = Warehouse.objects.filter(is_active=True)
    serializer_class = WarehouseSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'warehouse': serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        return Response({
            'success': True,
            'message': 'انبار با موفقیت بروزرسانی شد',
            'warehouse': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response({
            'success': True,
            'message': 'انبار با موفقیت حذف شد'
        })


class WarehouseInventoryView(APIView):
    """
    موجودی انبار
    """
    def get(self, request, pk):
        warehouse = get_object_or_404(Warehouse, pk=pk, is_active=True)
        inventories = Inventory.objects.filter(warehouse=warehouse)
        
        data = []
        for inventory in inventories:
            data.append({
                'item_id': inventory.item.id,
                'item_name': inventory.item.name,
                'item_code': inventory.item.code,
                'quantity': inventory.quantity,
                'value': inventory.value,
                'batch': inventory.batch,
                'unit': inventory.item.primary_unit.name
            })
        
        return Response({
            'success': True,
            'warehouse_id': pk,
            'warehouse_name': warehouse.name,
            'inventories': data
        })


class StockEntryListCreateView(generics.ListCreateAPIView):
    """
    لیست و ایجاد ورودی‌های انبار
    """
    queryset = StockEntry.objects.all()
    serializer_class = StockEntrySerializer
    
    def create(self, request, *args, **kwargs):
        try:
            # استفاده از سرویس انبارداری برای ایجاد ورودی
            entry_data = {
                'item': get_object_or_404(Item, pk=request.data.get('item')),
                'warehouse': get_object_or_404(Warehouse, pk=request.data.get('warehouse')),
                'quantity': float(request.data.get('quantity', 0)),
                'unit': get_object_or_404(UnitOfMeasure, pk=request.data.get('unit')),
                'unit_cost': float(request.data.get('unit_cost', 0)),
                'batch': request.data.get('batch'),
                'reference_document': request.data.get('reference_document'),
                'supplier': request.data.get('supplier'),
                'notes': request.data.get('notes'),
                'serial_numbers': request.data.getlist('serial_numbers', [])
            }
            
            entry = InventoryService.create_stock_entry(entry_data, request.user)
            serializer = self.get_serializer(entry)
            
            return Response({
                'success': True,
                'message': 'ورودی با موفقیت ثبت شد',
                'entry': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class StockEntryRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    نمایش، ویرایش و حذف ورودی انبار
    """
    queryset = StockEntry.objects.all()
    serializer_class = StockEntrySerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'entry': serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        # ویرایش ورودی انبار پیچیده است و نیاز به منطق خاص دارد
        # در اینجا فقط یک پیام خطا برمی‌گردانیم
        return Response({
            'success': False,
            'message': 'ویرایش ورودی انبار امکان‌پذیر نیست. لطفاً ورودی را حذف و دوباره ایجاد کنید.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        # حذف ورودی انبار نیاز به بروزرسانی موجودی دارد
        # در اینجا فقط یک پیام خطا برمی‌گردانیم
        return Response({
            'success': False,
            'message': 'حذف ورودی انبار امکان‌پذیر نیست.'
        }, status=status.HTTP_400_BAD_REQUEST)


class StockExitListCreateView(generics.ListCreateAPIView):
    """
    لیست و ایجاد خروجی‌های انبار
    """
    queryset = StockExit.objects.all()
    serializer_class = StockExitSerializer
    
    def create(self, request, *args, **kwargs):
        try:
            # استفاده از سرویس انبارداری برای ایجاد خروجی
            exit_data = {
                'item': get_object_or_404(Item, pk=request.data.get('item')),
                'warehouse': get_object_or_404(Warehouse, pk=request.data.get('warehouse')),
                'quantity': float(request.data.get('quantity', 0)),
                'unit': get_object_or_404(UnitOfMeasure, pk=request.data.get('unit')),
                'batch': request.data.get('batch'),
                'exit_type': request.data.get('exit_type', 'CONSUMPTION'),
                'recipient_name': request.data.get('recipient_name'),
                'recipient_department': request.data.get('recipient_department'),
                'reference_document': request.data.get('reference_document'),
                'notes': request.data.get('notes'),
                'serial_numbers': request.data.getlist('serial_numbers', [])
            }
            
            exit_obj = InventoryService.create_stock_exit(exit_data, request.user)
            serializer = self.get_serializer(exit_obj)
            
            return Response({
                'success': True,
                'message': 'خروجی با موفقیت ثبت شد',
                'exit': serializer.data
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'success': False,
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


class StockExitRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    """
    نمایش، ویرایش و حذف خروجی انبار
    """
    queryset = StockExit.objects.all()
    serializer_class = StockExitSerializer
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'exit': serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        # ویرایش خروجی انبار پیچیده است و نیاز به منطق خاص دارد
        # در اینجا فقط یک پیام خطا برمی‌گردانیم
        return Response({
            'success': False,
            'message': 'ویرایش خروجی انبار امکان‌پذیر نیست. لطفاً خروجی را حذف و دوباره ایجاد کنید.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    def destroy(self, request, *args, **kwargs):
        # حذف خروجی انبار نیاز به بروزرسانی موجودی دارد
        # در اینجا فقط یک پیام خطا برمی‌گردانیم
        return Response({
            'success': False,
            'message': 'حذف خروجی انبار امکان‌پذیر نیست.'
        }, status=status.HTTP_400_BAD_REQUEST)
