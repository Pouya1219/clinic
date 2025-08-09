# inventory/management/commands/create_sample_units.py
from django.core.management.base import BaseCommand
from inventory.models import Unit

class Command(BaseCommand):
    help = 'Create sample units'

    def handle(self, *args, **options):
        units = [
            {'name': 'عدد', 'symbol': 'عدد'},
            {'name': 'کیلوگرم', 'symbol': 'کیلو'},
            {'name': 'گرم', 'symbol': 'گرم'},
            {'name': 'لیتر', 'symbol': 'لیتر'},
            {'name': 'متر', 'symbol': 'متر'},
            {'name': 'جفت', 'symbol': 'جفت'},
            {'name': 'بسته', 'symbol': 'بسته'},
            {'name': 'جعبه', 'symbol': 'جعبه'},
        ]
        
        for unit_data in units:
            Unit.objects.get_or_create(
                name=unit_data['name'],
                defaults={'symbol': unit_data['symbol']}
            )
        
        self.stdout.write(
            self.style.SUCCESS('Sample units created successfully!')
        )
