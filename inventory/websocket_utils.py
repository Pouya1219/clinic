import json
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

def send_websocket_message(message_type, data):
    """
    ارسال پیام به تمام کلاینت‌های متصل
    """
    channel_layer = get_channel_layer()
    if channel_layer:
        async_to_sync(channel_layer.group_send)(
            'inventory_updates',
            {
                'type': 'send_message',
                'message': {
                    'type': message_type,
                    'data': data
                }
            }
        )