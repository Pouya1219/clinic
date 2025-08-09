# Patient/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from .models import PatientRecord, PatientInsurance, Treatment

class PatientConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        print("WebSocket connect attempt!")
        self.patient_id = self.scope['url_route']['kwargs']['patient_id']
        self.room_group_name = f'patient_{self.patient_id}'

        # پیوستن به گروه
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        # پذیرش اتصال
        await self.accept()
        
        # ارسال پیام خوش‌آمدگویی
        await self.send(text_data=json.dumps({
            'message': 'Hello from server!'
        }))
        
        print(f"WebSocket connected for patient {self.patient_id}!")

    async def disconnect(self, close_code):
        print(f"WebSocket disconnected with code {close_code}")
        # خروج از گروه
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    # دریافت پیام از WebSocket
    async def receive(self, text_data):
        print(f"Received message: {text_data}")
        data = json.loads(text_data)
        message_type = data.get('type')
        
        # بر اساس نوع پیام، عملیات مختلفی انجام دهید
        if message_type == 'insurance_update':
            # به‌روزرسانی بیمه
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'insurance_update',
                    'message': data.get('message')
                }
            )
        elif message_type == 'treatment_update':
            # به‌روزرسانی درمان
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'treatment_update',
                    'message': data.get('message')
                }
            )

    # دریافت پیام از گروه و ارسال به WebSocket برای بیمه
    async def insurance_update(self, event):
        message = event['message']
        
        # ارسال پیام به WebSocket
        await self.send(text_data=json.dumps({
            'type': 'insurance_update',
            'message': message
        }))
    
    # دریافت پیام از گروه و ارسال به WebSocket برای درمان
    async def treatment_update(self, event):
        message = event['message']
        
        # ارسال پیام به WebSocket
        await self.send(text_data=json.dumps({
            'type': 'treatment_update',
            'message': message
        }))
