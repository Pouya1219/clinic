# settings/models.py
from django.db import models
from django.core.cache import cache

class AppointmentSettings(models.Model):
    DURATION_CHOICES = [
        (15, '15 دقیقه'),
        (30, '30 دقیقه'),
        (45, '45 دقیقه'),
        (60, '60 دقیقه'),
    ]

    visit_duration = models.IntegerField(
        choices=DURATION_CHOICES,
        default=30,
        verbose_name="مدت زمان ویزیت"
    )
    allow_past_edit = models.BooleanField(
        default=False,
        verbose_name="امکان ویرایش روزهای گذشته"
    )
    show_patient_info = models.BooleanField(
        default=True,
        verbose_name="نمایش اطلاعات بیمار"
    )
    calendar_start_time = models.TimeField(
        default='12:00',
        verbose_name="ساعت شروع تقویم"
    )
    calendar_end_time = models.TimeField(
        default='11:59',
        verbose_name="ساعت پایان تقویم"
    )
    
    # تنظیمات رنگ‌ها
    normal_appointment_color = models.CharField(
        max_length=7,
        default='#d4edda',
        verbose_name="رنگ نوبت عادی"
    )
    emergency_appointment_color = models.CharField(
        max_length=7,
        default="#ed989f",
        verbose_name="رنگ نوبت اورژانسی"
    )
    pending_appointment_color = models.CharField(
        max_length=7,
        default='#fff3cd',
        verbose_name="رنگ نوبت در انتظار"
    )
    
    class Meta:
        verbose_name = "تنظیمات نوبت‌دهی"
        verbose_name_plural = "تنظیمات نوبت‌دهی"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # ذخیره در کش برای دسترسی سریع
        cache.set('appointment_settings', self)

    @classmethod
    def get_settings(cls):
        # دریافت از کش یا دیتابیس
        settings = cache.get('appointment_settings')
        if not settings:
            settings = cls.objects.first()
            if not settings:
                settings = cls.objects.create()
            cache.set('appointment_settings', settings)
        return settings
    

class ClinicSetting(models.Model):
    """
    این مدل برای نگهداری تنظیمات کلی کلینیک استفاده می‌شود.
    فقط یک رکورد از این مدل در دیتابیس وجود خواهد داشت.
    """
    # --- بخش اطلاعات اصلی کلینیک ---
    clinic_name = models.CharField(max_length=200, default="کلینیک ", verbose_name="نام کلینیک/مطب")
    clinic_logo = models.ImageField(upload_to='settings/logo/', null=True, blank=True, verbose_name="لوگوی کلینیک")
    
    # --- بخش اطلاعات تماس ---
    phone_number1 = models.CharField(max_length=20, blank=True, verbose_name="شماره تلفن اصلی")
    phone_number2 = models.CharField(max_length=20, blank=True, verbose_name="شماره تلفن دوم (اختیاری)")
    email = models.EmailField(blank=True, verbose_name="آدرس ایمیل")
    website = models.URLField(blank=True, verbose_name="وب‌سایت")
    
    # --- بخش آدرس ---
    province = models.CharField(max_length=100, blank=True, verbose_name="استان")
    city = models.CharField(max_length=100, blank=True, verbose_name="شهر")
    address = models.TextField(blank=True, verbose_name="آدرس دقیق")
    
    # --- بخش تنظیمات مالی و سیستمی ---
    currency_unit = models.CharField(max_length=20, default="ریال", verbose_name="واحد پولی")
    
    # --- بخش یادآوری‌ها ---
    notification_days_before = models.PositiveIntegerField(
        default=3,
        verbose_name="تعداد روز قبل برای نمایش یادآوری",
        help_text="یادآوری چک‌ها و اقساط، چند روز قبل از سررسید نمایش داده شوند؟"
    )

    def __str__(self):
        return self.clinic_name or "تنظیمات کلینیک"

    @classmethod
    def get_solo(cls):
        """
        این متد همیشه تنها رکورد تنظیمات را برمی‌گرداند یا اگر وجود نداشته باشد، آن را می‌سازد.
        """
        obj, created = cls.objects.get_or_create(pk=1)
        return obj

    class Meta:
        verbose_name = "تنظیمات کلینیک"
        verbose_name_plural = "تنظیمات کلینیک"