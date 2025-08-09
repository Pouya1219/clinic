# inventory/migrations/XXXX_add_default_data.py

from django.db import migrations
import uuid
from django.utils import timezone

def add_default_categories(apps, schema_editor):
    Category = apps.get_model('inventory', 'Category')
    
    # دسته‌بندی‌های پیش‌فرض
    default_categories = [
        {
            'name': 'مواد دندانپزشکی',
            'code': 'DENTAL-MAT',
            'description': 'مواد مصرفی دندانپزشکی'
        },
        {
            'name': 'ابزار دندانپزشکی',
            'code': 'DENTAL-TOOL',
            'description': 'ابزار و تجهیزات دندانپزشکی'
        },
        {
            'name': 'لوازم مصرفی',
            'code': 'CONSUMABLE',
            'description': 'لوازم مصرفی عمومی'
        },
        {
            'name': 'تجهیزات',
            'code': 'EQUIPMENT',
            'description': 'تجهیزات پزشکی و دندانپزشکی'
        },
        {
            'name': 'داروها',
            'code': 'MEDICINE',
            'description': 'داروها و مواد دارویی'
        },
        {
            'name': 'مواد ضدعفونی',
            'code': 'DISINFECT',
            'description': 'مواد ضدعفونی کننده و شوینده'
        },
        {
            'name': 'لوازم اداری',
            'code': 'OFFICE',
            'description': 'لوازم اداری و مصرفی دفتری'
        },
        {
            'name': 'لوازم یکبار مصرف',
            'code': 'DISPOSABLE',
            'description': 'لوازم یکبار مصرف پزشکی'
        },
        {
            'name': 'ایمپلنت',
            'code': 'IMPLANT',
            'description': 'انواع ایمپلنت دندانی'
        },
        {
            'name': 'مواد ترمیمی',
            'code': 'RESTORATIVE',
            'description': 'مواد ترمیمی دندان'
        }
    ]
    
    for category_data in default_categories:
        Category.objects.get_or_create(
            code=category_data['code'],
            defaults={
                'id': uuid.uuid4(),
                'name': category_data['name'],
                'description': category_data['description'],
                'is_active': True,
                'created_at': timezone.now()
            }
        )

def add_default_units(apps, schema_editor):
    UnitOfMeasure = apps.get_model('inventory', 'UnitOfMeasure')
    
    # واحدهای پیش‌فرض
    default_units = [
        {
            'name': 'عدد',
            'symbol': 'عدد',
            'description': 'واحد شمارشی'
        },
        {
            'name': 'بسته',
            'symbol': 'بسته',
            'description': 'بسته‌بندی'
        },
        {
            'name': 'گرم',
            'symbol': 'g',
            'description': 'واحد وزن'
        },
        {
            'name': 'کیلوگرم',
            'symbol': 'kg',
            'description': 'واحد وزن'
        },
        {
            'name': 'میلی‌لیتر',
            'symbol': 'ml',
            'description': 'واحد حجم'
        },
        {
            'name': 'لیتر',
            'symbol': 'l',
            'description': 'واحد حجم'
        },
        {
            'name': 'متر',
            'symbol': 'm',
            'description': 'واحد طول'
        },
        {
            'name': 'سانتی‌متر',
            'symbol': 'cm',
            'description': 'واحد طول'
        },
        {
            'name': 'جعبه',
            'symbol': 'جعبه',
            'description': 'واحد بسته‌بندی'
        },
        {
            'name': 'سری',
            'symbol': 'سری',
            'description': 'مجموعه‌ای از اقلام مرتبط'
        },
        {
            'name': 'تیوب',
            'symbol': 'تیوب',
            'description': 'تیوب مواد دندانپزشکی'
        },
        {
            'name': 'سرنگ',
            'symbol': 'سرنگ',
            'description': 'سرنگ مواد دندانپزشکی'
        },
        {
            'name': 'ویال',
            'symbol': 'ویال',
            'description': 'ویال دارویی'
        },
        {
            'name': 'آمپول',
            'symbol': 'آمپول',
            'description': 'آمپول دارویی'
        },
        {
            'name': 'قرص',
            'symbol': 'قرص',
            'description': 'قرص دارویی'
        },
        {
            'name': 'کپسول',
            'symbol': 'کپسول',
            'description': 'کپسول دارویی'
        },
        {
            'name': 'رول',
            'symbol': 'رول',
            'description': 'رول مواد'
        },
        {
            'name': 'ست',
            'symbol': 'ست',
            'description': 'ست کامل'
        },
        {
            'name': 'پاکت',
            'symbol': 'پاکت',
            'description': 'پاکت مواد'
        },
        {
            'name': 'شیشه',
            'symbol': 'شیشه',
            'description': 'شیشه مواد'
        }
    ]
    
    for unit_data in default_units:
        UnitOfMeasure.objects.get_or_create(
            name=unit_data['name'],
            defaults={
                'id': uuid.uuid4(),
                'symbol': unit_data['symbol'],
                'description': unit_data['description'],
                'is_active': True,
                'created_at': timezone.now()
            }
        )

def add_default_warehouse(apps, schema_editor):
    Warehouse = apps.get_model('inventory', 'Warehouse')
    
    # انبارهای پیش‌فرض
    default_warehouses = [
        {
            'name': 'انبار اصلی',
            'code': 'MAIN',
            'location': 'کلینیک اصلی',
            'description': 'انبار اصلی کلینیک'
        },
        {
            'name': 'انبار مواد مصرفی',
            'code': 'CONSUMABLES',
            'location': 'طبقه همکف',
            'description': 'انبار مواد مصرفی روزانه'
        },
        {
            'name': 'انبار تجهیزات',
            'code': 'EQUIPMENT',
            'location': 'طبقه اول',
            'description': 'انبار تجهیزات و دستگاه‌ها'
        },
        {
            'name': 'انبار داروها',
            'code': 'MEDICINE',
            'location': 'اتاق 105',
            'description': 'انبار داروها و مواد دارویی'
        }
    ]
    
    for warehouse_data in default_warehouses:
        Warehouse.objects.get_or_create(
            code=warehouse_data['code'],
            defaults={
                'id': uuid.uuid4(),
                'name': warehouse_data['name'],
                'location': warehouse_data['location'],
                'description': warehouse_data['description'],
                'is_active': True,
                'created_at': timezone.now()
            }
        )

def add_sample_items(apps, schema_editor):
    """اضافه کردن چند نمونه کالا"""
    Item = apps.get_model('inventory', 'Item')
    Category = apps.get_model('inventory', 'Category')
    UnitOfMeasure = apps.get_model('inventory', 'UnitOfMeasure')
    
    # دریافت دسته‌بندی‌ها و واحدها
    try:
        dental_mat_category = Category.objects.get(code='DENTAL-MAT')
        dental_tool_category = Category.objects.get(code='DENTAL-TOOL')
        medicine_category = Category.objects.get(code='MEDICINE')
        
        unit_piece = UnitOfMeasure.objects.get(name='عدد')
        unit_box = UnitOfMeasure.objects.get(name='جعبه')
        unit_tube = UnitOfMeasure.objects.get(name='تیوب')
        unit_set = UnitOfMeasure.objects.get(name='ست')
        
        # نمونه کالاها
        sample_items = [
            {
                'name': 'کامپوزیت دندانی A2',
                'code': 'COMP-A2',
                'category': dental_mat_category,
                'primary_unit': unit_tube,
                'min_stock_level': 5,
                'max_stock_level': 50,
                'has_expiry': True,
                'brand': 'Ivoclar',
                'description': 'کامپوزیت دندانی رنگ A2'
            },
            {
                'name': 'فرز الماسه',
                'code': 'BURS-001',
                'category': dental_tool_category,
                'primary_unit': unit_piece,
                'min_stock_level': 10,
                'max_stock_level': 100,
                'has_expiry': False,
                'brand': 'Mani',
                'description': 'فرز الماسه دندانپزشکی'
            },
            {
                'name': 'ست جراحی ایمپلنت',
                'code': 'IMPL-SET',
                'category': dental_tool_category,
                'primary_unit': unit_set,
                'min_stock_level': 1,
                'max_stock_level': 5,
                'has_expiry': False,
                'brand': 'Dentium',
                'description': 'ست کامل جراحی ایمپلنت'
            },
            {
                'name': 'آنتی بیوتیک آموکسی سیلین',
                'code': 'MED-AMOX',
                'category': medicine_category,
                'primary_unit': unit_box,
                'min_stock_level': 3,
                'max_stock_level': 20,
                'has_expiry': True,
                'brand': 'Farabi',
                'description': 'آنتی بیوتیک آموکسی سیلین 500 میلی گرم'
            }
        ]
        
        for item_data in sample_items:
            Item.objects.get_or_create(
                code=item_data['code'],
                defaults={
                    'id': uuid.uuid4(),
                    'name': item_data['name'],
                    'category': item_data['category'],
                    'primary_unit': item_data['primary_unit'],
                    'min_stock_level': item_data['min_stock_level'],
                    'max_stock_level': item_data['max_stock_level'],
                    'has_expiry': item_data['has_expiry'],
                    'brand': item_data['brand'],
                    'description': item_data['description'],
                    'is_active': True,
                    'created_at': timezone.now()
                }
            )
    except Exception as e:
        # در صورت خطا، فقط لاگ می‌کنیم و ادامه می‌دهیم
        print(f"Error adding sample items: {str(e)}")

def remove_default_data(apps, schema_editor):
    # این تابع در صورت rollback اجرا می‌شود
    # می‌توانیم خالی بگذاریم یا کدی برای حذف داده‌ها بنویسیم
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0002_unit'),  # نام آخرین میگریشن قبلی را اینجا قرار دهید
    ]

    operations = [
        migrations.RunPython(add_default_categories, remove_default_data),
        migrations.RunPython(add_default_units, remove_default_data),
        migrations.RunPython(add_default_warehouse, remove_default_data),
        migrations.RunPython(add_sample_items, remove_default_data),
    ]
