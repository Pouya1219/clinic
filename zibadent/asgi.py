# zibadent/asgi.py
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'zibadent.settings')
django.setup() 
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from Patient.routing import websocket_urlpatterns as patient_websocket_urlpatterns
from inventory.routing import websocket_urlpatterns as inventory_websocket_urlpatterns
from colorama import init
init()

# برای دیباگ، مسیرها را چاپ کنیم
print("Patient WebSocket URLs:", patient_websocket_urlpatterns)
print("Inventory WebSocket URLs:", inventory_websocket_urlpatterns)

# ترکیب مسیرهای وب‌سوکت هر دو اپ
combined_websocket_urlpatterns = patient_websocket_urlpatterns + inventory_websocket_urlpatterns
print("Combined WebSocket URLs:", combined_websocket_urlpatterns)

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": AuthMiddlewareStack(
        URLRouter(
            combined_websocket_urlpatterns
        )
    ),
})
