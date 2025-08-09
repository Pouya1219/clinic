# management/commands/list_backups.py
from django.core.management.base import BaseCommand
import os
import glob
from datetime import datetime

class Command(BaseCommand):
    help = 'List all backup files'
    
    def handle(self, *args, **options):
        # جستجو در چندین مسیر ممکن
        search_paths = [
            'D:\\dental_clinic\\BackUp\\*.bak',
            'D:\\dental_clinic\\backups\\*.bak',
            'D:\\dental_clinic\\*.bak',
            'C:\\BackUp\\*.bak',
        ]
        
        found_files = []
        
        for pattern in search_paths:
            files = glob.glob(pattern)
            found_files.extend(files)
        
        if found_files:
            self.stdout.write(self.style.SUCCESS('📁 فایل‌های بک‌آپ یافت شده:'))
            for file_path in found_files:
                file_size = os.path.getsize(file_path) / (1024 * 1024)  # MB
                mod_time = datetime.fromtimestamp(os.path.getmtime(file_path))
                
                self.stdout.write(
                    f'📄 {os.path.basename(file_path)}\n'
                    f'   📁 مسیر: {file_path}\n'
                    f'   📊 حجم: {file_size:.2f} MB\n'
                    f'   📅 تاریخ: {mod_time.strftime("%Y-%m-%d %H:%M:%S")}\n'
                )
        else:
            self.stdout.write(self.style.WARNING('❌ هیچ فایل بک‌آپی یافت نشد!'))
