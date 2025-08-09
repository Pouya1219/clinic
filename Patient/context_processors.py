# Patient/context_processors.py
from django.utils import timezone
from datetime import timedelta
from Patient.models import TreatmentPayment, Installment
from settings.models import ClinicSetting # ایمپورت مدل تنظیمات

def notifications_processor(request):
    """
    این پردازشگر، یادآوری‌های مربوط به چک‌ها و اقساط را برای تمام صفحات آماده می‌کند.
    """
    if not request.user.is_authenticated:
        return {}

    try:
        # خواندن تنظیمات از دیتابیس
        settings = ClinicSetting.get_solo()
        notification_days = settings.notification_days_before

        today = timezone.now().date()
        future_date = today + timedelta(days=notification_days)
        
        # ۱. چک‌های در انتظار وصول که سررسیدشان نزدیک است
        upcoming_checks = TreatmentPayment.objects.filter(
            payment_status='pending',
            check_due_date__range=[today, future_date]
        ).select_related('treatment__patient').order_by('check_due_date')
        
        # ۲. اقساط پرداخت نشده که سررسیدشان نزدیک است
        upcoming_installments = Installment.objects.filter(
            is_paid=False,
            due_date__range=[today, future_date]
        ).select_related('plan__treatment__patient').order_by('due_date')

        return {
            'upcoming_checks': upcoming_checks,
            'upcoming_installments': upcoming_installments,
            'notifications_count': upcoming_checks.count() + upcoming_installments.count(),
        }
    except Exception:
        # اگر در زمان اجرای مایگریشن‌ها خطایی رخ دهد، این بخش از خطا جلوگیری می‌کند
        return {}
