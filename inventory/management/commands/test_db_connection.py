# management/commands/test_db_connection.py
from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = 'Test database connection and show info'
    
    def handle(self, *args, **options):
        try:
            # تست اتصال
            with connection.cursor() as cursor:
                # نمایش اطلاعات دیتابیس
                cursor.execute("SELECT DB_NAME() as current_db")
                current_db = cursor.fetchone()[0]
                
                cursor.execute("SELECT @@VERSION as sql_version")
                sql_version = cursor.fetchone()[0]
                
                cursor.execute("SELECT SYSTEM_USER as current_user")
                current_user = cursor.fetchone()[0]
                
                # نمایش اطلاعات
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ اتصال به دیتابیس موفق!\n'
                        f'🗄️  دیتابیس فعلی: {current_db}\n'
                        f'👤 کاربر فعلی: {current_user}\n'
                        f'📋 نسخه SQL Server: {sql_version[:50]}...\n'
                    )
                )
                
                # بررسی دسترسی BACKUP
                cursor.execute("""
                    SELECT 
                        HAS_PERMS_BY_NAME(NULL, NULL, 'BACKUP DATABASE') as can_backup,
                        HAS_PERMS_BY_NAME(NULL, NULL, 'BACKUP LOG') as can_backup_log
                """)
                perms = cursor.fetchone()
                
                if perms[0]:
                    self.stdout.write('✅ دسترسی BACKUP DATABASE: دارد')
                else:
                    self.stdout.write('❌ دسترسی BACKUP DATABASE: ندارد')
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ خطا در اتصال: {str(e)}')
            )
