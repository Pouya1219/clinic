# inventory/notification_consumers.py

import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.db.models import Q, Count, Exists, OuterRef
from django.core.paginator import Paginator
from django.utils import timezone
from .models import Notification, NotificationStatus
from datetime import datetime


logger = logging.getLogger(__name__)



class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        logger.info(f"NotificationConsumer: Connection attempt from {self.scope['client']}")
        print(f"NotificationConsumer: Connection attempt from {self.scope['client']}")
        
        # پذیرش اتصال بدون بررسی احراز هویت (برای تست)
        await self.accept()
        logger.info(f"NotificationConsumer: Connection accepted")
        print(f"NotificationConsumer: Connection accepted")
        
        # ارسال پیام تست
        await self.send(text_data=json.dumps({
            'type': 'connection_established',
            'message': 'اتصال به سیستم اعلان‌ها برقرار شد',
            'timestamp': str(datetime.now())
        }))


    async def receive(self, text_data):
        try:
            logger.info(f"NotificationConsumer: Received message: {text_data}")
            print(f"NotificationConsumer: Received message: {text_data}")
            
            data = json.loads(text_data)
            
            # پاسخ به پیام ping
            if data.get('type') == 'ping':
                await self.send(text_data=json.dumps({
                    'type': 'pong',
                    'timestamp': data.get('timestamp')
                }))
            elif data.get('type') == 'get_initial_data':
                # ارسال داده‌های اولیه
                await self.send(text_data=json.dumps({
                    'type': 'initial_data',
                    'payload': {
                        'stats': {
                            'unread_count': 5,
                            'total_count': 10
                        },
                        'recent_notifications': [
                            {
                                'id': '1',
                                'title': 'اعلان تست',
                                'message': 'این یک اعلان تست است',
                                'icon': 'fas fa-bell',
                                'time_ago': '5 دقیقه پیش',
                                'is_read': False,
                                'url': '#'
                            }
                        ]
                    }
                }))
            else:
                await self.send(text_data=json.dumps({
                    'type': 'error',
                    'message': 'نوع پیام نامشخص است'
                }))
                
        except Exception as e:
            logger.error(f"NotificationConsumer: Error processing message: {e}")
            print(f"NotificationConsumer: Error processing message: {e}")
            await self.send(text_data=json.dumps({
                'type': 'error',
                'message': str(e)
            }))

    async def disconnect(self, close_code):
        if hasattr(self, 'user_group_name'):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)
        logger.info(f"User {self.user.username} disconnected.")

    

    # --- Handlers for client messages ---

    async def handle_get_notifications(self, payload):
        page = payload.get('page', 1)
        notifications_data, pagination = await self._get_paginated_notifications(page)
        await self.send_json({
            'type': 'notifications_list',
            'payload': {
                'notifications': notifications_data,
                'pagination': pagination
            }
        })

    async def handle_mark_notification_read(self, payload):
        notification_id = payload.get('notification_id')
        if not notification_id:
            return await self.send_error("شناسه اعلان الزامی است.")
        
        success = await self._mark_notification_as_read(notification_id)
        if success:
            await self.send_json({
                'type': 'notification_marked_read',
                'payload': {'notification_id': notification_id}
            })
            await self.send_notification_stats() # آمار را بروزرسانی کن

    async def handle_mark_all_notifications_read(self, payload):
        updated_count = await self._mark_all_as_read()
        await self.send_json({
            'type': 'all_notifications_marked_read',
            'payload': {'updated_count': updated_count}
        })
        await self.send_notification_stats()

    async def handle_unknown_message(self, payload):
        logger.warning(f"Unknown message type received from {self.user.username}")
        await self.send_error("نوع پیام ناشناخته است.")

    # --- Handlers for channel layer messages ---

    async def new_notification(self, event):
        """ Handler for sending a new notification to the client. """
        await self.send_json({
            'type': 'new_notification',
            'payload': event['payload']
        })
        await self.send_notification_stats() # آمار را بعد از اعلان جدید بروز کن

    # --- Database Operations (Async) ---

    @database_sync_to_async
    def _get_accessible_notifications_qs(self):
        """ Returns a queryset of notifications the user has access to. """
        user = self.user
        return Notification.objects.filter(
            Q(recipient=user) | 
            Q(is_global=True) |
            (Q(target_role__in=user.roles.all()) if hasattr(user, 'roles') and user.roles.exists() else Q()) |
            (Q(is_admin_only=True) & Q(user__is_staff=True))
        ).distinct()

    @database_sync_to_async
    def _get_paginated_notifications(self, page=1, per_page=10):
        """ Gets a paginated list of notifications for the user. """
        base_qs = self._get_accessible_notifications_qs().result() # .result() to get sync result
        
        read_status_subquery = NotificationStatus.objects.filter(
            notification=OuterRef('pk'), user=self.user, is_read=True
        )
        notifications_qs = base_qs.annotate(
            is_read_by_user=Exists(read_status_subquery)
        ).select_related('created_by').order_by('-created_at')

        paginator = Paginator(notifications_qs, per_page)
        page_obj = paginator.get_page(page)

        notifications_data = [{
            'id': str(n.id), 'title': n.title, 'message': n.message,
            'type': n.notification_type, 'priority': n.priority,
            'is_read': n.is_read_by_user, 'url': n.action_url or '#',
            'created_at': n.created_at.isoformat(), 'icon': n.get_type_icon(),
        } for n in page_obj]
        
        pagination_data = {
            'current_page': page_obj.number, 'total_pages': paginator.num_pages,
            'total_items': paginator.count, 'has_next': page_obj.has_next(),
        }
        return notifications_data, pagination_data

    @database_sync_to_async
    def _get_notification_stats(self):
        """ Gets notification stats for the user. """
        base_qs = self._get_accessible_notifications_qs().result()
        
        # تعداد کل اعلان‌های قابل دسترس
        total_count = base_qs.count()
        
        # تعداد اعلان‌های خوانده شده توسط کاربر
        read_count = NotificationStatus.objects.filter(
            user=self.user, is_read=True, notification__in=base_qs
        ).count()
        
        unread_count = total_count - read_count
        
        return {'total_count': total_count, 'unread_count': unread_count}

    @database_sync_to_async
    def _mark_notification_as_read(self, notification_id):
        """ Marks a single notification as read for the current user. """
        try:
            notification = Notification.objects.get(id=notification_id)
            # TODO: Check if user has access to this notification
            NotificationStatus.objects.update_or_create(
                notification=notification, user=self.user,
                defaults={'is_read': True, 'read_at': timezone.now()}
            )
            return True
        except Notification.DoesNotExist:
            return False

    @database_sync_to_async
    def _mark_all_as_read(self):
        """ Marks all accessible notifications as read for the current user. """
        accessible_notifications = self._get_accessible_notifications_qs().result()
        unread_notifications = accessible_notifications.exclude(
            statuses__user=self.user, statuses__is_read=True
        )
        
        statuses_to_create = [
            NotificationStatus(notification=n, user=self.user, is_read=True, read_at=timezone.now())
            for n in unread_notifications
        ]
        
        if statuses_to_create:
            NotificationStatus.objects.bulk_create(statuses_to_create, ignore_conflicts=True)
        
        return len(statuses_to_create)

    # --- Helper methods ---

    async def send_json(self, data):
        """ Sends a JSON message to the client. """
        await self.send(text_data=json.dumps(data))

    async def send_error(self, message, error_code=None):
        """ Sends an error message to the client. """
        await self.send_json({
            'type': 'error',
            'payload': {'message': message, 'error_code': error_code}
        })

    async def send_initial_data(self):
        """ Sends initial stats and recent notifications to the client upon connection. """
        stats = await self._get_notification_stats()
        recent_notifications, _ = await self._get_paginated_notifications(page=1, per_page=5)
        await self.send_json({
            'type': 'initial_data',
            'payload': {
                'stats': stats,
                'recent_notifications': recent_notifications
            }
        })

    async def send_notification_stats(self):
        """ Sends updated notification stats to the client. """
        stats = await self._get_notification_stats()
        await self.send_json({
            'type': 'notification_stats_updated',
            'payload': {'stats': stats}
        })
