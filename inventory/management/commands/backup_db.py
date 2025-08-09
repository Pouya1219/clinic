# management/commands/backup_db.py
from django.core.management.base import BaseCommand
from django.db import connection
import datetime
import os

class Command(BaseCommand):
    help = 'Backup SQL Server database'
    
    def handle(self, *args, **options):
        db_name = connection.settings_dict['NAME']
        today = datetime.datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = f'D:\\dental_clinic\\BackUp\\{db_name}_{today}.bak'
        
        # ایجاد پوشه
        backup_dir = os.path.dirname(backup_file)
        os.makedirs(backup_dir, exist_ok=True)
        
        self.stdout.write(f'🔄 شروع بک‌آپ از دیتابیس: {db_name}')
        self.stdout.write(f'📁 مسیر: {backup_file}')
        
        try:
            with connection.cursor() as cursor:
                # اجرای دستور بک‌آپ
                cursor.execute(f"""
                    BACKUP DATABASE [{db_name}] 
                    TO DISK = '{backup_file}'
                    WITH FORMAT, INIT, COMPRESSION
                """)
                
                # اگه اینجا رسید یعنی موفق بوده
                self.stdout.write('✅ دستور SQL اجرا شد')
            
            # بررسی فایل
            if os.path.exists(backup_file):
                size_mb = os.path.getsize(backup_file) / (1024 * 1024)
                self.stdout.write(
                    self.style.SUCCESS(f'✅ بک‌آپ موفق! حجم: {size_mb:.1f} MB')
                )
                os.startfile(backup_dir)
            else:
                # اگه فایل وجود نداره، ممکنه جای دیگه ذخیره شده باشه
                self.stdout.write('⚠️ فایل در مسیر مورد نظر یافت نشد')
                
                # جستجو در مسیرهای احتمالی
                possible_paths = [
                    f'C:\\Program Files\\Microsoft SQL Server\\MSSQL16.MSSQLSERVER\\MSSQL\\Backup\\{db_name}_{today}.bak',
                    f'C:\\Program Files\\Microsoft SQL Server\\MSSQL15.MSSQLSERVER\\MSSQL\\Backup\\{db_name}_{today}.bak',
                    f'C:\\Backup\\{db_name}_{today}.bak',
                ]
                
                for path in possible_paths:
                    if os.path.exists(path):
                        self.stdout.write(f'✅ فایل یافت شد در: {path}')
                        os.startfile(os.path.dirname(path))
                        return
                
                self.stdout.write('❌ فایل در هیچ مسیری یافت نشد')
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ خطا: {str(e)}'))
            
            # راهنمایی
            self.stdout.write(
                self.style.WARNING(
                    '💡 احتمالاً مشکل از:\n'
                    '1. دسترسی SQL Server به پوشه\n'
                    '2. فضای دیسک کم\n'
                    '3. نام فایل نامعتبر\n'
                    '4. SQL Server Service در حال اجرا نیست'
                )
            )
