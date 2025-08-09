# inventory/notification_service.py

import logging
import uuid
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.db.models import Q
from .models import Notification

logger = logging.getLogger(__name__)

class NotificationService:
    """
    سرویس مرکزی برای ایجاد و ارسال اعلان‌ها
    این کلاس تمام منطق ایجاد اعلان و ارسال آن به کاربران را مدیریت می‌کند
    """
    
    @staticmethod
    def create_notification(title, message, notification_type='INFO', priority='MEDIUM', 
                           action_url=None, metadata=None, created_by=None, 
                           recipient=None, is_global=False, is_admin_only=False, target_role=None):
        """
        ایجاد یک اعلان جدید و ارسال آن به کاربران هدف
        
        Args:
            title (str): عنوان اعلان
            message (str): متن اعلان
            notification_type (str): نوع اعلان (INFO, WARNING, ERROR, SUCCESS, ...)
            priority (str): اولویت اعلان (LOW, MEDIUM, HIGH, CRITICAL)
            action_url (str, optional): لینک مرتبط با اعلان
            metadata (dict, optional): داده‌های اضافی به صورت دیکشنری
            created_by (User, optional): کاربر ایجاد کننده اعلان
            recipient (User, optional): کاربر گیرنده اعلان (اگر اعلان شخصی است)
            is_global (bool): آیا اعلان برای همه کاربران است؟
            is_admin_only (bool): آیا اعلان فقط برای ادمین‌ها است؟
            target_role (Role, optional): نقش هدف برای اعلان
            
        Returns:
            Notification: آبجکت اعلان ایجاد شده
        """
        try:
            # تبدیل UUID ها به رشته در metadata
            if metadata is not None:
                for key, value in metadata.items():
                    if isinstance(value, uuid.UUID):
                        metadata[key] = str(value)
            
            # ایجاد اعلان در دیتابیس
            notification = Notification.objects.create(
                title=title,
                message=message,
                notification_type=notification_type,
                priority=priority,
                action_url=action_url,
                metadata=metadata or {},
                created_by=created_by,
                recipient=recipient,
                is_global=is_global,
                is_admin_only=is_admin_only,
                target_role=target_role
            )
            
            logger.info(f"اعلان با موفقیت ایجاد شد. ID: {notification.id}")
            
            # تعیین کاربران هدف
            target_users = NotificationService._get_target_users(notification)
            
            # ارسال اعلان به کاربران هدف
            NotificationService._send_notification_to_users(notification, target_users)
            
            return notification
            
        except Exception as e:
            logger.error(f"خطا در ایجاد اعلان: {str(e)}", exc_info=True)
            return None
    
    @staticmethod
    def _get_target_users(notification):
        """
        تعیین کاربران هدف برای یک اعلان
        
        Args:
            notification (Notification): آبجکت اعلان
            
        Returns:
            list: لیست کاربران هدف
        """
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # اگر اعلان شخصی است، فقط کاربر گیرنده
        if notification.recipient:
            return [notification.recipient]
        
        users_query = Q()
        
        # اگر اعلان برای همه است
        if notification.is_global:
            # همه کاربران فعال
            users_query |= Q(is_active=True)
        
        # اگر اعلان فقط برای ادمین‌ها است
        if notification.is_admin_only:
            users_query &= Q(is_staff=True) | Q(is_superuser=True)
        
        # اگر اعلان برای یک نقش خاص است
        if notification.target_role:
            # کاربرانی که این نقش را دارند
            if hasattr(User, 'roles'):  # اگر مدل کاربر فیلد roles دارد
                users_query &= Q(roles=notification.target_role)
        
        # اجرای کوئری و دریافت کاربران
        if users_query:
            return list(User.objects.filter(users_query).distinct())
        
        return []
    
    @staticmethod
    def _send_notification_to_users(notification, users):
        """
        ارسال اعلان به کاربران از طریق WebSocket
        
        Args:
            notification (Notification): آبجکت اعلان
            users (list): لیست کاربران هدف
        """
        try:
            # تبدیل اعلان به دیکشنری برای ارسال
            notification_data = {
                'id': str(notification.id),
                'title': notification.title,
                'message': notification.message,
                'type': notification.notification_type,
                'priority': notification.priority,
                'is_read': False,
                'url': notification.action_url or '#',
                'created_at': notification.created_at.isoformat(),
                'time_ago': f"{int(notification.age_in_hours)} ساعت پیش",
                'icon': notification.get_type_icon(),
                'color_class': notification.get_priority_color(),
                'created_by': notification.created_by.username if notification.created_by else 'سیستم',
            }
            
            # دریافت channel layer
            channel_layer = get_channel_layer()
            
            # ارسال به هر کاربر
            for user in users:
                try:
                    async_to_sync(channel_layer.group_send)(
                        f"user_{user.id}",  # نام گروه کاربر
                        {
                            "type": "new_notification",  # نام متد در consumer
                            "payload": notification_data
                        }
                    )
                    logger.info(f"اعلان به کاربر {user.id} ارسال شد")
                except Exception as e:
                    logger.error(f"خطا در ارسال اعلان به کاربر {user.id}: {str(e)}")
                    
        except Exception as e:
            logger.error(f"خطا در ارسال اعلان‌ها: {str(e)}", exc_info=True)
