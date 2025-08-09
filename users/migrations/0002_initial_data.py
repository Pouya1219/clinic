# users/migrations/0002_initial_data.py
from django.db import migrations

def create_initial_data(apps, schema_editor):
    Role = apps.get_model('users', 'Role')
    Specialty = apps.get_model('users', 'Specialty')
    Education = apps.get_model('users', 'Education')

    # ایجاد نقش‌ها
    roles = [
        'پزشک',
        'دستیار',
        'منشی',
        'مدیر',
        'متخصص',
        'پرستار',
        'انباردار',
        'پذیرش',
        'نظافتچی',
        'حسابدار',
        'مالی',
        'انتظامات',
    ]
    for role_name in roles:
        Role.objects.create(name=role_name)

    # ایجاد تخصص‌ها
    specialties = [
        'دندان‌پزشکی عمومی',
        'ارتودنسی',
        'ایمپلنتولوژی',
        'اندودانتیکس (درمان ریشه)',
        'پروتزهای دندانی',
        'جراحی دهان و فک و صورت',
        'دندان‌پزشکی کودکان',
        'پریودانتیکس (بیماری‌های لثه)',
        'رادیولوژی دهان و فک و صورت',
        'ایمپلنت',
        'زیبایی',
        'کودکان',
        'پوست و مو',
        'ریشه'
    ]
    for specialty_name in specialties:
        Specialty.objects.create(name=specialty_name)

    # ایجاد مدارک تحصیلی
    education_degrees = [
        'دیپلم',
        'کاردانی',
        'کارشناسی',
        'کارشناسی ارشد',
        'دکتری حرفه‌ای',
        'دکتری تخصصی',
        'فوق تخصص',
        'فلوشیپ',
        'پسا دکتری'
    ]
    for degree in education_degrees:
        Education.objects.create(degree=degree)

def remove_initial_data(apps, schema_editor):
    Role = apps.get_model('users', 'Role')
    Specialty = apps.get_model('users', 'Specialty')
    Education = apps.get_model('users', 'Education')
    
    Role.objects.all().delete()
    Specialty.objects.all().delete()
    Education.objects.all().delete()

class Migration(migrations.Migration):
    dependencies = [
        ('users', '0001_initial'),  # نام آخرین migration قبلی
    ]

    operations = [
        migrations.RunPython(create_initial_data, remove_initial_data),
    ]
