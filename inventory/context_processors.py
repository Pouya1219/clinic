# inventory/context_processors.py

from django.conf import settings

def websocket_settings(request):
    """
    اضافه کردن تنظیمات وب‌سوکت به context تمپلیت‌ها
    """
    # استفاده از همان پورت برای هر دو وب‌سوکت
    websocket_port = settings.WEBSOCKET_PORT
    
    return {
        'WEBSOCKET_URL': settings.WEBSOCKET_URL,
        'NOTIFICATIONS_WEBSOCKET_URL': f"ws://{settings.WEBSOCKET_HOST}:{websocket_port}/ws/notifications/",
    }
