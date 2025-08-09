# inventory/routing.py
from django.urls import re_path
from . import consumers
from . import notification_consumers  # اضافه کردن import
from .consumers import InventoryConsumer  # اضافه کردن import مستقیم

websocket_urlpatterns = [
    re_path(r'^ws/notifications/$', notification_consumers.NotificationConsumer.as_asgi()),
    re_path(r'ws/inventory/$', InventoryConsumer.as_asgi()),
]
