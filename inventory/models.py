# inventory/models.py - نسخه تمیز و حرفه‌ای

from django.db import models
from users.models import CustomUser, Profile
from django.core.validators import MinValueValidator
from decimal import Decimal
import uuid
from datetime import datetime
from django.conf import settings


class BaseModel(models.Model):
    """مدل پایه برای تمام مدل‌ها"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)  # 🔥 UUID اضافه شد
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="ایجاد شده توسط")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    class Meta:
        abstract = True

class Warehouse(BaseModel):
    """مدل انبارها"""
    name = models.CharField(max_length=100, verbose_name="نام انبار")
    code = models.CharField(max_length=20, unique=True, verbose_name="کد انبار")
    location = models.TextField(blank=True, null=True, verbose_name="آدرس انبار")
    manager = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True, blank=True, 
                               related_name='managed_warehouses', verbose_name="مدیر انبار")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
    class Meta:
        verbose_name = "انبار"
        verbose_name_plural = "انبارها"
        
    def __str__(self):
        return f"{self.name} ({self.code})"

class Category(BaseModel):
    """دسته‌بندی کالاها"""
    name = models.CharField(max_length=100, verbose_name="نام دسته")
    code = models.CharField(max_length=20, unique=True, verbose_name="کد دسته")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, 
                              related_name='children', verbose_name="دسته والد")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
    class Meta:
        verbose_name = "دسته‌بندی"
        verbose_name_plural = "دسته‌بندی‌ها"
        
    def __str__(self):
        return self.name

class UnitOfMeasure(BaseModel):
    """واحدهای اندازه‌گیری"""
    name = models.CharField(max_length=50, verbose_name="نام واحد")
    symbol = models.CharField(max_length=10, verbose_name="نماد واحد")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
    class Meta:
        verbose_name = "واحد اندازه‌گیری"
        verbose_name_plural = "واحدهای اندازه‌گیری"
        
    def __str__(self):
        return f"{self.name} ({self.symbol})"
# inventory/models.py - اضافه کن به مدل‌های موجود
class Unit(models.Model):
    """واحد اندازه‌گیری"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, verbose_name="نام واحد")
    symbol = models.CharField(max_length=10, verbose_name="نماد واحد", blank=True)
    description = models.TextField(blank=True, verbose_name="توضیحات")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")

    class Meta:
        verbose_name = "واحد"
        verbose_name_plural = "واحدها"
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.symbol})" if self.symbol else self.name

class Item(BaseModel):
    """مدل اصلی کالاها"""
    
    # اطلاعات پایه
    name = models.CharField(max_length=200, verbose_name="نام کالا")
    code = models.CharField(max_length=50, unique=True, verbose_name="کد کالا")
    barcode = models.CharField(max_length=100, unique=True, null=True, blank=True, verbose_name="بارکد")
    
    # دسته‌بندی و واحد
    category = models.ForeignKey(Category, on_delete=models.PROTECT, verbose_name="دسته‌بندی")
    primary_unit = models.ForeignKey(UnitOfMeasure, on_delete=models.PROTECT, 
                                   related_name='primary_items', verbose_name="واحد اصلی")
    
    # مشخصات فنی
    brand = models.CharField(max_length=100, blank=True, null=True, verbose_name="برند")
    model = models.CharField(max_length=100, blank=True, null=True, verbose_name="مدل")
    specifications = models.JSONField(default=dict, blank=True, verbose_name="مشخصات فنی")
    
    # موجودی و حدود
    min_stock_level = models.DecimalField(max_digits=15, decimal_places=3, 
                                        default=0, validators=[MinValueValidator(0)],
                                        verbose_name="حداقل موجودی")
    max_stock_level = models.DecimalField(max_digits=15, decimal_places=3, 
                                        default=0, validators=[MinValueValidator(0)],
                                        verbose_name="حداکثر موجودی")
    
    # آلارم هوشمند
    alert_threshold = models.DecimalField(max_digits=15, decimal_places=3, 
                                        default=5, validators=[MinValueValidator(0)],
                                        verbose_name="آستانه هشدار موجودی")
    enable_low_stock_alert = models.BooleanField(default=True, verbose_name="فعال‌سازی هشدار کمبود")
    
    # قیمت‌گذاری
    cost_method = models.CharField(max_length=20, choices=[
        ('FIFO', 'اول وارد، اول خارج'),
        ('LIFO', 'آخر وارد، اول خارج'),
        ('AVERAGE', 'میانگین موزون'),
    ], default='FIFO', verbose_name="روش قیمت‌گذاری")
    
    # ویژگی‌های خاص
    has_expiry = models.BooleanField(default=False, verbose_name="دارای تاریخ انقضا")
    has_serial = models.BooleanField(default=False, verbose_name="دارای شماره سریال")
    has_batch = models.BooleanField(default=True, verbose_name="دارای شماره بچ")
    
    # شرایط نگهداری
    storage_conditions = models.TextField(blank=True, null=True, verbose_name="شرایط نگهداری")
    storage_temperature_min = models.DecimalField(max_digits=5, decimal_places=2, 
                                                null=True, blank=True, verbose_name="حداقل دما")
    storage_temperature_max = models.DecimalField(max_digits=5, decimal_places=2, 
                                                null=True, blank=True, verbose_name="حداکثر دما")
    
    # انبارهای مجاز
    allowed_warehouses = models.ManyToManyField(Warehouse, blank=True, 
                                              verbose_name="انبارهای مجاز")
    
    # توضیحات
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    usage_instructions = models.TextField(blank=True, null=True, verbose_name="دستورالعمل استفاده")
    
    # تصاویر
    image = models.ImageField(upload_to='media/', blank=True, null=True, verbose_name="تصویر",default='default.jpg')
    
    class Meta:
        verbose_name = "کالا"
        verbose_name_plural = "کالاها"
        indexes = [
            models.Index(fields=['code']),
            models.Index(fields=['barcode']),
            models.Index(fields=['name']),
            models.Index(fields=['category']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['barcode'],
                condition=models.Q(barcode__isnull=False),
                name='unique_barcode_if_not_null'
            )
        ]
        
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    def generate_barcode(self):
        """تولید بارکد خودکار - فقط محاسبه"""
        if not self.barcode:
            base = f"200{self.pk:07d}"
            check_digit = self.calculate_ean13_check_digit(base)
            return base + str(check_digit)
        return self.barcode
    
    @staticmethod
    def calculate_ean13_check_digit(code):
        """محاسبه check digit برای EAN13"""
        odd_sum = sum(int(code[i]) for i in range(0, len(code), 2))
        even_sum = sum(int(code[i]) for i in range(1, len(code), 2))
        total = odd_sum + (even_sum * 3)
        return (10 - (total % 10)) % 10
    @property
    def current_stock(self):
        """محاسبه موجودی فعلی از جدول Inventory"""
        from django.db.models import Sum
        total = self.inventory_set.aggregate(
            total=Sum('quantity')
        )['total']
        return total or 0
    
    @property
    def is_low_stock(self):
        """آیا موجودی کم است؟"""
        return self.current_stock <= self.alert_threshold
    
    @property
    def is_out_of_stock(self):
        """آیا ناموجود است؟"""
        return self.current_stock == 0
    
    def get_total_stock_in_warehouse(self, warehouse):
        """موجودی در انبار خاص"""
        from django.db.models import Sum
        total = self.inventory_set.filter(
            warehouse=warehouse
        ).aggregate(
            total=Sum('quantity')
        )['total']
        return total or 0

class ItemUnit(BaseModel):
    """تبدیل واحدهای کالا (دو سطحه)"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='units', verbose_name="کالا")
    unit = models.ForeignKey(UnitOfMeasure, on_delete=models.PROTECT, verbose_name="واحد")
    conversion_factor = models.DecimalField(max_digits=15, decimal_places=6, 
                                          validators=[MinValueValidator(0.000001)],
                                          verbose_name="ضریب تبدیل")
    is_purchase_unit = models.BooleanField(default=False, verbose_name="واحد خرید")
    is_sales_unit = models.BooleanField(default=False, verbose_name="واحد فروش")
    
    class Meta:
        verbose_name = "واحد کالا"
        verbose_name_plural = "واحدهای کالا"
        unique_together = ['item', 'unit']
        
    def __str__(self):
        return f"{self.item.name} - {self.unit.name} (x{self.conversion_factor})"
    
    def convert_to_primary(self, quantity):
        """تبدیل مقدار به واحد اصلی"""
        return Decimal(str(quantity)) * self.conversion_factor
    
    def convert_from_primary(self, primary_quantity):
        """تبدیل از واحد اصلی به این واحد"""
        return Decimal(str(primary_quantity)) / self.conversion_factor

class ItemWarehouse(BaseModel):
    """تنظیمات کالا در هر انبار"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, verbose_name="کالا")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, verbose_name="انبار")
    
    # حدود موجودی در این انبار
    min_stock = models.DecimalField(max_digits=15, decimal_places=3, default=0, verbose_name="حداقل موجودی")
    max_stock = models.DecimalField(max_digits=15, decimal_places=3, default=0, verbose_name="حداکثر موجودی")
    
    # آلارم جداگانه برای هر انبار
    warehouse_alert_threshold = models.DecimalField(max_digits=15, decimal_places=3, 
                                                  null=True, blank=True,
                                                  validators=[MinValueValidator(0)],
                                                  verbose_name="آستانه هشدار در این انبار")
    
    # موقعیت در انبار
    location = models.CharField(max_length=100, blank=True, null=True, verbose_name="موقعیت در انبار")
    shelf = models.CharField(max_length=50, blank=True, null=True, verbose_name="قفسه")
    
    class Meta:
        verbose_name = "کالا در انبار"
        verbose_name_plural = "کالاها در انبار"
        unique_together = ['item', 'warehouse']
        
    def __str__(self):
        return f"{self.item.name} در {self.warehouse.name}"

class StockBatch(BaseModel):
    """مدل بچ/دسته کالاها"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='batches', verbose_name="کالا")
    batch_number = models.CharField(max_length=100, verbose_name="شماره بچ")
    production_date = models.DateField(null=True, blank=True, verbose_name="تاریخ تولید")
    expiry_date = models.DateField(null=True, blank=True, verbose_name="تاریخ انقضا")
    supplier = models.CharField(max_length=200, blank=True, null=True, verbose_name="تامین‌کننده")
    
    class Meta:
        verbose_name = "بچ کالا"
        verbose_name_plural = "بچ‌های کالا"
        unique_together = ['item', 'batch_number']
        
    def __str__(self):
        return f"{self.item.name} - بچ: {self.batch_number}"
    
    @property
    def is_expired(self):
        """چک کردن انقضا"""
        if self.expiry_date:
            from django.utils import timezone
            return self.expiry_date < timezone.now().date()
        return False
    
    @property
    def days_to_expiry(self):
        """روزهای باقی‌مانده تا انقضا"""
        if self.expiry_date:
            from django.utils import timezone
            delta = self.expiry_date - timezone.now().date()
            return delta.days
        return None

class StockEntry(BaseModel):
    """مدل ورودی انبار - فقط ذخیره داده"""
    
    # اطلاعات اصلی
    entry_number = models.CharField(max_length=50, unique=True, verbose_name="شماره ورودی")
    item = models.ForeignKey(Item, on_delete=models.PROTECT, verbose_name="کالا")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, verbose_name="انبار")
    batch = models.ForeignKey(StockBatch, on_delete=models.PROTECT, null=True, blank=True, verbose_name="بچ")
    
    # مقدار و واحد
    quantity = models.DecimalField(max_digits=15, decimal_places=3, 
                                 validators=[MinValueValidator(0.001)], verbose_name="مقدار")
    unit = models.ForeignKey(UnitOfMeasure, on_delete=models.PROTECT, verbose_name="واحد")
    unit_conversion_factor = models.DecimalField(max_digits=15, decimal_places=6, 
                                               default=1, verbose_name="ضریب تبدیل واحد")
    primary_quantity = models.DecimalField(max_digits=15, decimal_places=3, 
                                         verbose_name="مقدار به واحد اصلی")
    
    # قیمت‌گذاری
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, 
                                  validators=[MinValueValidator(0)], verbose_name="قیمت واحد")
    total_cost = models.DecimalField(max_digits=20, decimal_places=2, verbose_name="قیمت کل")
    
    # اطلاعات تکمیلی
    entry_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ورود")
    reference_document = models.CharField(max_length=100, blank=True, null=True, 
                                        verbose_name="شماره سند مرجع")
    supplier = models.CharField(max_length=200, blank=True, null=True, verbose_name="تامین‌کننده")
    notes = models.TextField(blank=True, null=True, verbose_name="یادداشت")
    
    # شماره سریال (برای اقلام سریالی)
    serial_numbers = models.JSONField(default=list, blank=True, verbose_name="شماره‌های سریال")
    
    class Meta:
        verbose_name = "ورودی انبار"
        verbose_name_plural = "ورودی‌های انبار"
        indexes = [
            models.Index(fields=['entry_date']),
            models.Index(fields=['item', 'warehouse']),
            models.Index(fields=['entry_number']),
        ]
        
    def __str__(self):
        return f"ورودی {self.entry_number} - {self.item.name}"

class StockExit(BaseModel):
    """مدل خروجی انبار - فقط ذخیره داده"""
    
    # اطلاعات اصلی
    exit_number = models.CharField(max_length=50, unique=True, verbose_name="شماره خروجی")
    item = models.ForeignKey(Item, on_delete=models.PROTECT, verbose_name="کالا")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, verbose_name="انبار")
    batch = models.ForeignKey(StockBatch, on_delete=models.PROTECT, null=True, blank=True, verbose_name="بچ")
    
    # مقدار و واحد
    quantity = models.DecimalField(max_digits=15, decimal_places=3, 
                                 validators=[MinValueValidator(0.001)], verbose_name="مقدار")
    unit = models.ForeignKey(UnitOfMeasure, on_delete=models.PROTECT, verbose_name="واحد")
    unit_conversion_factor = models.DecimalField(max_digits=15, decimal_places=6, 
                                               default=1, verbose_name="ضریب تبدیل واحد")
    primary_quantity = models.DecimalField(max_digits=15, decimal_places=3, 
                                         verbose_name="مقدار به واحد اصلی")
    
    # قیمت‌گذاری (محاسبه شده بر اساس FIFO/LIFO)
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="قیمت واحد")
    total_cost = models.DecimalField(max_digits=20, decimal_places=2, verbose_name="قیمت کل")
    
    # اطلاعات تکمیلی
    exit_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ خروج")
    exit_type = models.CharField(max_length=20, choices=[
        ('CONSUMPTION', 'مصرف'),
        ('TRANSFER', 'انتقال'),
        ('RETURN', 'برگشت'),
        ('WASTE', 'ضایعات'),
        ('ADJUSTMENT', 'تعدیل'),
    ], default='CONSUMPTION', verbose_name="نوع خروج")
    
    # تحویل‌گیرنده
    recipient_name = models.CharField(max_length=200, verbose_name="نام تحویل‌گیرنده")
    recipient_department = models.CharField(max_length=100, blank=True, null=True, 
                                          verbose_name="بخش تحویل‌گیرنده")
    recipient_signature = models.ImageField(upload_to='signatures/', blank=True, null=True, 
                                          verbose_name="امضای تحویل‌گیرنده")
    
    # اطلاعات مرجع
    reference_document = models.CharField(max_length=100, blank=True, null=True, 
                                        verbose_name="شماره سند مرجع")
    notes = models.TextField(blank=True, null=True, verbose_name="یادداشت")
    
    # شماره سریال (برای اقلام سریالی)
    serial_numbers = models.JSONField(default=list, blank=True, verbose_name="شماره‌های سریال")
    
    class Meta:
        verbose_name = "خروجی انبار"
        verbose_name_plural = "خروجی‌های انبار"
        indexes = [
            models.Index(fields=['exit_date']),
            models.Index(fields=['item', 'warehouse']),
            models.Index(fields=['exit_number']),
        ]
        
    def __str__(self):
        return f"خروجی {self.exit_number} - {self.item.name}"

class StockTransfer(BaseModel):
    """انتقال بین انبارها"""
    transfer_number = models.CharField(max_length=50, unique=True, verbose_name="شماره انتقال")
    item = models.ForeignKey(Item, on_delete=models.PROTECT, verbose_name="کالا")
    batch = models.ForeignKey(StockBatch, on_delete=models.PROTECT, null=True, blank=True, verbose_name="بچ")
    
    # انبار مبدا و مقصد
    from_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, 
                                     related_name='transfers_out', verbose_name="از انبار")
    to_warehouse = models.ForeignKey(Warehouse, on_delete=models.PROTECT, 
                                   related_name='transfers_in', verbose_name="به انبار")
    
    # مقدار
    quantity = models.DecimalField(max_digits=15, decimal_places=3, 
                                 validators=[MinValueValidator(0.001)], verbose_name="مقدار")
    unit = models.ForeignKey(UnitOfMeasure, on_delete=models.PROTECT, verbose_name="واحد")
    primary_quantity = models.DecimalField(max_digits=15, decimal_places=3, verbose_name="مقدار به واحد اصلی")
    
    # قیمت
    unit_cost = models.DecimalField(max_digits=15, decimal_places=2, verbose_name="قیمت واحد")
    total_cost = models.DecimalField(max_digits=20, decimal_places=2, verbose_name="قیمت کل")
    
    # وضعیت
    status = models.CharField(max_length=20, choices=[
        ('PENDING', 'در انتظار'),
        ('IN_TRANSIT', 'در حال انتقال'),
        ('COMPLETED', 'تکمیل شده'),
        ('CANCELLED', 'لغو شده'),
    ], default='PENDING', verbose_name="وضعیت")
    
    # تاریخ‌ها
    transfer_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ انتقال")
    completed_date = models.DateTimeField(null=True, blank=True, verbose_name="تاریخ تکمیل")
    
    # توضیحات
    notes = models.TextField(blank=True, null=True, verbose_name="یادداشت")
    
    class Meta:
        verbose_name = "انتقال انبار"
        verbose_name_plural = "انتقالات انبار"
        
    def __str__(self):
        return f"انتقال {self.transfer_number} - {self.item.name}"

class Inventory(BaseModel):
    """موجودی لحظه‌ای انبار"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, verbose_name="کالا")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, verbose_name="انبار")
    batch = models.ForeignKey(StockBatch, on_delete=models.CASCADE, null=True, blank=True, verbose_name="بچ")
    
    # موجودی
    quantity = models.DecimalField(max_digits=15, decimal_places=3, default=0, verbose_name="مقدار")
    value = models.DecimalField(max_digits=20, decimal_places=2, default=0, verbose_name="ارزش ریالی")
    
    # آخرین بروزرسانی
    last_updated = models.DateTimeField(auto_now=True, verbose_name="آخرین بروزرسانی")
    
    class Meta:
        verbose_name = "موجودی انبار"
        verbose_name_plural = "موجودی‌های انبار"
        unique_together = ['item', 'warehouse', 'batch']
        indexes = [
            models.Index(fields=['item', 'warehouse']),
            models.Index(fields=['quantity']),
        ]
        
    def __str__(self):
        return f"{self.item.name} در {self.warehouse.name} - {self.quantity}"
    
    @property
    def average_cost(self):
        """قیمت میانگین"""
        if self.quantity > 0:
            return self.value / self.quantity
        return 0

class StockMovement(BaseModel):
    """تاریخچه حرکات انبار"""
    item = models.ForeignKey(Item, on_delete=models.CASCADE, verbose_name="کالا")
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE, verbose_name="انبار")
    batch = models.ForeignKey(StockBatch, on_delete=models.CASCADE, null=True, blank=True, verbose_name="بچ")
    
    # نوع حرکت
    movement_type = models.CharField(max_length=20, choices=[
        ('ENTRY', 'ورودی'),
        ('EXIT', 'خروجی'),
        ('TRANSFER_IN', 'انتقال ورودی'),
        ('TRANSFER_OUT', 'انتقال خروجی'),
        ('ADJUSTMENT', 'تعدیل'),
    ], verbose_name="نوع حرکت")
    
    # مقادیر
    quantity_before = models.DecimalField(max_digits=15, decimal_places=3, verbose_name="موجودی قبل")
    quantity_change = models.DecimalField(max_digits=15, decimal_places=3, verbose_name="تغییر مقدار")
    quantity_after = models.DecimalField(max_digits=15, decimal_places=3, verbose_name="موجودی بعد")
    
    value_before = models.DecimalField(max_digits=20, decimal_places=2, verbose_name="ارزش قبل")
    value_change = models.DecimalField(max_digits=20, decimal_places=2, verbose_name="تغییر ارزش")
    value_after = models.DecimalField(max_digits=20, decimal_places=2, verbose_name="ارزش بعد")
    
    # مرجع
    reference_id = models.PositiveIntegerField(verbose_name="شناسه مرجع")
    reference_type = models.CharField(max_length=50, verbose_name="نوع مرجع")
    
    # تاریخ
    movement_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ حرکت")
    
    class Meta:
        verbose_name = "حرکت انبار"
        verbose_name_plural = "حرکات انبار"
        indexes = [
            models.Index(fields=['item', 'warehouse']),
            models.Index(fields=['movement_date']),
            models.Index(fields=['movement_type']),
        ]
        
    def __str__(self):
        return f"{self.movement_type} - {self.item.name} - {self.quantity_change}"


# inventory/models.py

# در انتهای فایل models.py اضافه کنید:

class ActivityLog(models.Model):
    """مدل برای ثبت فعالیت‌های کاربران"""
    
    ACTION_CHOICES = [
        ('CREATE_CATEGORY', 'ایجاد دسته‌بندی'),
        ('UPDATE_CATEGORY', 'بروزرسانی دسته‌بندی'),
        ('DELETE_CATEGORY', 'حذف دسته‌بندی'),
        ('CREATE_ITEM', 'ایجاد کالا'),
        ('UPDATE_ITEM', 'بروزرسانی کالا'),
        ('DELETE_ITEM', 'حذف کالا'),
        ('CREATE_UNIT', 'ایجاد واحد'),
        ('UPDATE_UNIT', 'بروزرسانی واحد'),
        ('DELETE_UNIT', 'حذف واحد'),
        ('CREATE_WAREHOUSE', 'ایجاد انبار'),
        ('UPDATE_WAREHOUSE', 'بروزرسانی انبار'),
        ('DELETE_WAREHOUSE', 'حذف انبار'),
        ('CREATE_STOCK_ENTRY', 'ثبت ورودی انبار'),
        ('UPDATE_STOCK_ENTRY', 'بروزرسانی ورودی انبار'),
        ('DELETE_STOCK_ENTRY', 'حذف ورودی انبار'),
        ('CREATE_STOCK_EXIT', 'ثبت خروجی انبار'),
        ('UPDATE_STOCK_EXIT', 'بروزرسانی خروجی انبار'),
        ('DELETE_STOCK_EXIT', 'حذف خروجی انبار'),
        ('LOGIN', 'ورود به سیستم'),
        ('LOGOUT', 'خروج از سیستم'),
        ('VIEW_REPORT', 'مشاهده گزارش'),
        ('EXPORT_DATA', 'خروجی گرفتن از داده‌ها'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='activity_logs',
        verbose_name='کاربر'
    )
    action = models.CharField(
        max_length=50, 
        choices=ACTION_CHOICES,
        verbose_name='عمل انجام شده'
    )
    details = models.JSONField(
        default=dict, 
        blank=True,
        verbose_name='جزئیات'
    )
    ip_address = models.GenericIPAddressField(
        null=True, 
        blank=True,
        verbose_name='آدرس IP'
    )
    user_agent = models.TextField(
        blank=True,
        verbose_name='User Agent'
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاریخ ایجاد'
    )
    
    class Meta:
        verbose_name = 'لاگ فعالیت'
        verbose_name_plural = 'لاگ‌های فعالیت'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['action', '-created_at']),
            models.Index(fields=['-created_at']),
        ]
    
    def __str__(self):
        return f"{self.user.username} - {self.get_action_display()} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
    
    def get_action_display_persian(self):
        """نمایش فارسی عمل انجام شده"""
        return dict(self.ACTION_CHOICES).get(self.action, self.action)
    
    def get_details_summary(self):
        """خلاصه جزئیات برای نمایش"""
        if not self.details:
            return ''
        
        summary_parts = []
        
        # نام آیتم
        if 'category_name' in self.details:
            summary_parts.append(f"دسته‌بندی: {self.details['category_name']}")
        elif 'item_name' in self.details:
            summary_parts.append(f"کالا: {self.details['item_name']}")
        elif 'unit_name' in self.details:
            summary_parts.append(f"واحد: {self.details['unit_name']}")
        elif 'warehouse_name' in self.details:
            summary_parts.append(f"انبار: {self.details['warehouse_name']}")
        
        # مقدار
        if 'quantity' in self.details:
            summary_parts.append(f"مقدار: {self.details['quantity']}")
        
        return ' | '.join(summary_parts)
# inventory/models.py - اضافه کن به انتهای فایل

class Notification(BaseModel):
    """مدل اعلانات سیستم"""
    
    NOTIFICATION_TYPES = [
        ('LOW_STOCK', 'موجودی کم'),
        ('OUT_OF_STOCK', 'اتمام موجودی'),
        ('EXPIRY_WARNING', 'هشدار انقضا'),
        ('EXPIRED_ITEM', 'کالای منقضی'),
        ('STOCK_ENTRY', 'ورودی انبار'),
        ('STOCK_EXIT', 'خروجی انبار'),
        ('STOCK_TRANSFER', 'انتقال انبار'),
        ('SYSTEM_ALERT', 'هشدار سیستم'),
        ('USER_ACTION', 'عمل کاربر'),
        ('INVENTORY_ADJUSTMENT', 'تعدیل موجودی'),
        ('BATCH_EXPIRY', 'انقضای بچ'),
        ('WAREHOUSE_ALERT', 'هشدار انبار'),
    ]
    
    PRIORITY_LEVELS = [
        ('LOW', 'کم'),
        ('MEDIUM', 'متوسط'),
        ('HIGH', 'بالا'),
        ('CRITICAL', 'بحرانی'),
    ]
    
    STATUS_CHOICES = [
        ('UNREAD', 'خوانده نشده'),
        ('READ', 'خوانده شده'),
        ('ARCHIVED', 'آرشیو شده'),
        ('DISMISSED', 'نادیده گرفته شده'),
    ]
    
    # اطلاعات اصلی
    title = models.CharField(max_length=200, verbose_name="عنوان")
    message = models.TextField(verbose_name="پیام")
    notification_type = models.CharField(
        max_length=30, 
        choices=NOTIFICATION_TYPES,
        verbose_name="نوع اعلان"
    )
    priority = models.CharField(
        max_length=10, 
        choices=PRIORITY_LEVELS,
        default='MEDIUM',
        verbose_name="اولویت"
    )
    status = models.CharField(
        max_length=15, 
        choices=STATUS_CHOICES,
        default='UNREAD',
        verbose_name="وضعیت"
    )
    
    recipient = models.ForeignKey(CustomUser,on_delete=models.CASCADE,related_name='notifications',null=True,blank=True,verbose_name="گیرنده")

    
    # ارجاع به آبجکت مرتبط
    related_item = models.ForeignKey(
        Item, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name="کالای مرتبط"
    )
    related_warehouse = models.ForeignKey(
        Warehouse, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name="انبار مرتبط"
    )
    related_batch = models.ForeignKey(
        StockBatch, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True,
        verbose_name="بچ مرتبط"
    )
    
    # داده‌های اضافی
    metadata = models.JSONField(
        default=dict, 
        blank=True,
        verbose_name="متادیتا"
    )
    
    # تاریخ‌ها
    read_at = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name="تاریخ خواندن"
    )
    expires_at = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name="تاریخ انقضا"
    )
    
    # لینک عمل
    action_url = models.URLField(
        blank=True, 
        null=True,
        verbose_name="لینک عمل"
    )
    action_text = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        verbose_name="متن عمل"
    )
    target_role = models.ForeignKey('users.Role', on_delete=models.SET_NULL, null=True, blank=True, related_name='role_notifications')
    is_global = models.BooleanField(default=False, help_text="آیا این اعلان برای همه کاربران قابل مشاهده است؟")
    is_admin_only = models.BooleanField(default=False, help_text="آیا این اعلان فقط برای ادمین‌ها است؟")
    
    
    
    
    class Meta:
        verbose_name = "اعلان"
        verbose_name_plural = "اعلانات"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient', 'status', 'created_at']),
            models.Index(fields=['notification_type', 'created_at']),
            models.Index(fields=['priority', 'created_at']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['related_item', 'created_at']),
            models.Index(fields=['related_warehouse', 'created_at']),
            models.Index(fields=['expires_at']),
        ]
    
    # inventory/models.py -> class Notification

    def __str__(self):
        # اگر گیرنده مشخص بود نامش را نشان بده، وگرنه نوع اعلان را مشخص کن
        recipient_info = self.recipient.username if self.recipient else f"گروهی ({self.notification_type})"
        return f"{self.title} - ({recipient_info})"

    
    def mark_as_read(self):
        """علامت‌گذاری به عنوان خوانده شده"""
        if self.status == 'UNREAD':
            self.status = 'READ'
            from django.utils import timezone
            self.read_at = timezone.now()
            self.save(update_fields=['status', 'read_at'])
    
    def mark_as_unread(self):
        """علامت‌گذاری به عنوان خوانده نشده"""
        self.status = 'UNREAD'
        self.read_at = None
        self.save(update_fields=['status', 'read_at'])
    
    def archive(self):
        """آرشیو کردن اعلان"""
        self.status = 'ARCHIVED'
        self.save(update_fields=['status'])
    
    def dismiss(self):
        """نادیده گرفتن اعلان"""
        self.status = 'DISMISSED'
        self.save(update_fields=['status'])
    
    @property
    def is_expired(self):
        """چک کردن انقضای اعلان"""
        if self.expires_at:
            from django.utils import timezone
            return timezone.now() > self.expires_at
        return False
    
    @property
    def age_in_hours(self):
        """سن اعلان به ساعت"""
        from django.utils import timezone
        delta = timezone.now() - self.created_at
        return delta.total_seconds() / 3600
    
    def get_priority_color(self):
        """رنگ بر اساس اولویت"""
        colors = {
            'LOW': 'success',
            'MEDIUM': 'info', 
            'HIGH': 'warning',
            'CRITICAL': 'danger'
        }
        return colors.get(self.priority, 'secondary')
    
    def get_type_icon(self):
        """آیکون بر اساس نوع"""
        icons = {
            'LOW_STOCK': 'fas fa-exclamation-triangle',
            'OUT_OF_STOCK': 'fas fa-times-circle',
            'EXPIRY_WARNING': 'fas fa-clock',
            'EXPIRED_ITEM': 'fas fa-ban',
            'STOCK_ENTRY': 'fas fa-arrow-down',
            'STOCK_EXIT': 'fas fa-arrow-up',
            'STOCK_TRANSFER': 'fas fa-exchange-alt',
            'SYSTEM_ALERT': 'fas fa-bell',
            'USER_ACTION': 'fas fa-user',
            'INVENTORY_ADJUSTMENT': 'fas fa-edit',
            'BATCH_EXPIRY': 'fas fa-calendar-times',
            'WAREHOUSE_ALERT': 'fas fa-warehouse',
        }
        return icons.get(self.notification_type, 'fas fa-info-circle')
    @property
    def is_read(self):
        """آیا اعلان خوانده شده است؟"""
        return self.status == 'READ'


class NotificationSettings(BaseModel):
    """تنظیمات اعلانات کاربر"""
    
    user = models.OneToOneField(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='notification_settings',
        verbose_name="کاربر"
    )
    
    # تنظیمات کلی
    email_notifications = models.BooleanField(default=True, verbose_name="اعلان ایمیل")
    sms_notifications = models.BooleanField(default=False, verbose_name="اعلان پیامک")
    browser_notifications = models.BooleanField(default=True, verbose_name="اعلان مرورگر")
    
    # تنظیمات موجودی
    low_stock_alerts = models.BooleanField(default=True, verbose_name="هشدار موجودی کم")
    out_of_stock_alerts = models.BooleanField(default=True, verbose_name="هشدار اتمام موجودی")
    expiry_alerts = models.BooleanField(default=True, verbose_name="هشدار انقضا")
    
    # تنظیمات حرکات
    entry_notifications = models.BooleanField(default=False, verbose_name="اعلان ورودی")
    exit_notifications = models.BooleanField(default=False, verbose_name="اعلان خروجی")
    transfer_notifications = models.BooleanField(default=True, verbose_name="اعلان انتقال")
    
    # تنظیمات زمانی
    quiet_hours_start = models.TimeField(null=True, blank=True, verbose_name="شروع ساعات سکوت")
    quiet_hours_end = models.TimeField(null=True, blank=True, verbose_name="پایان ساعات سکوت")
    
    # انبارهای مورد نظر
    watched_warehouses = models.ManyToManyField(
        Warehouse,
        blank=True,
        verbose_name="انبارهای تحت نظر"
    )
    
    # کالاهای مورد نظر
    watched_items = models.ManyToManyField(
        Item,
        blank=True,
        verbose_name="کالاهای تحت نظر"
    )
    
    class Meta:
        verbose_name = "تنظیمات اعلان"
        verbose_name_plural = "تنظیمات اعلانات"
    
    def __str__(self):
        return f"تنظیمات اعلان - {self.user.username}"
    
    def should_notify(self, notification_type, current_time=None):
        """چک کردن اینکه آیا باید اعلان ارسال شود یا نه"""
        if current_time is None:
            from django.utils import timezone
            current_time = timezone.now().time()
        
        # چک کردن ساعات سکوت
        if self.quiet_hours_start and self.quiet_hours_end:
            if self.quiet_hours_start <= current_time <= self.quiet_hours_end:
                return False
        
        # چک کردن نوع اعلان
        type_settings = {
            'LOW_STOCK': self.low_stock_alerts,
            'OUT_OF_STOCK': self.out_of_stock_alerts,
            'EXPIRY_WARNING': self.expiry_alerts,
            'EXPIRED_ITEM': self.expiry_alerts,
            'STOCK_ENTRY': self.entry_notifications,
            'STOCK_EXIT': self.exit_notifications,
            'STOCK_TRANSFER': self.transfer_notifications,
        }
        
        return type_settings.get(notification_type, True)


# مدل برای ذخیره تاریخچه ارسال اعلانات
class NotificationDelivery(models.Model):
    """تاریخچه ارسال اعلانات"""
    
    DELIVERY_METHODS = [
        ('BROWSER', 'مرورگر'),
        ('EMAIL', 'ایمیل'),
        ('SMS', 'پیامک'),
        ('PUSH', 'Push Notification'),
    ]
    
    DELIVERY_STATUS = [
        ('PENDING', 'در انتظار'),
        ('SENT', 'ارسال شده'),
        ('DELIVERED', 'تحویل شده'),
        ('FAILED', 'ناموفق'),
        ('BOUNCED', 'برگشت خورده'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(
        Notification,
        on_delete=models.CASCADE,
        related_name='deliveries',
        verbose_name="اعلان"
    )
    method = models.CharField(
        max_length=10,
        choices=DELIVERY_METHODS,
        verbose_name="روش ارسال"
    )
    status = models.CharField(
        max_length=15,
        choices=DELIVERY_STATUS,
        default='PENDING',
        verbose_name="وضعیت ارسال"
    )
    recipient_address = models.CharField(
        max_length=255,
        verbose_name="آدرس گیرنده"
    )
    sent_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="زمان ارسال"
    )
    delivered_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="زمان تحویل"
    )
    error_message = models.TextField(
        blank=True,
        verbose_name="پیام خطا"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = "تحویل اعلان"
        verbose_name_plural = "تحویل اعلانات"
        indexes = [
            models.Index(fields=['notification', 'method']),
            models.Index(fields=['status', '-created_at']),
        ]
    
    def __str__(self):
        return f"{self.notification.title} - {self.method} - {self.status}"


class NotificationStatus(models.Model):
    """
    وضعیت خوانده شدن اعلان توسط کاربر
    """
    notification = models.ForeignKey(
        Notification, 
        on_delete=models.CASCADE, 
        related_name='statuses',
        verbose_name="اعلان"
    )
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='notification_statuses',
        verbose_name="کاربر"
    )
    is_read = models.BooleanField(
        default=False,
        verbose_name="خوانده شده"
    )
    read_at = models.DateTimeField(
        null=True, 
        blank=True,
        verbose_name="زمان خواندن"
    )
    
    class Meta:
        unique_together = ('notification', 'user')
        verbose_name = 'وضعیت اعلان'
        verbose_name_plural = 'وضعیت‌های اعلان'
        
    def __str__(self):
        return f"{self.notification.title} - {self.user.username} - {'خوانده شده' if self.is_read else 'خوانده نشده'}"