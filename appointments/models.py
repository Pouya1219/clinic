from django.db import models
from users.models import Profile, CustomUser  # اضافه کردن import
from schedules.models import WorkSchedule, Holiday
from django.core.exceptions import ValidationError
from datetime import datetime
from django.core.exceptions import ValidationError



class Unit(models.Model):
    name = models.CharField(max_length=50, unique=True, verbose_name="نام یونیت")
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children', verbose_name="یونیت والد")

    class Meta:
        verbose_name = "یونیت"
        verbose_name_plural = "یونیت‌ها"

    def __str__(self):
        return self.name
class Appointment(models.Model):
    doctor = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='doctor_appointments',  # این قبلاً تعریف شده
        verbose_name="پزشک"
    )
    
    treating_doctor = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='treated_appointments',  # این قبلاً تعریف شده
        verbose_name="پزشک معالج"
    )

    # فیلدهای اصلی
    first_name = models.CharField(max_length=100, verbose_name="نام", null=True, blank=True)
    last_name = models.CharField(max_length=100, verbose_name="نام خانوادگی", null=True, blank=True)
    national_code = models.CharField(max_length=10, verbose_name="کد ملی", null=True, blank=True)
    phone = models.CharField(max_length=11, verbose_name="شماره تماس", null=True, blank=True)
    file_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="شماره پرونده")
    date = models.DateField(verbose_name="تاریخ مراجعه", null=True, blank=True)
    time_from = models.TimeField(verbose_name="از ساعت", null=True, blank=True)
    time_to = models.TimeField(verbose_name="تا ساعت", null=True, blank=True)
    
    # فیلدهای وضعیت
    status = models.CharField(
        max_length=20, 
        choices=[
            ('normal', 'عادی'),
            ('emergency', 'اورژانسی'),
            ('pending', 'در انتظار'),
            ('visit', 'در حال ویزیت'),
            ('completed', 'تکمیل شده'),
            ('cancelled', 'لغو شده')
        ], 
        default='normal', 
        verbose_name="وضعیت"
    )
    visited = models.BooleanField(default=False, verbose_name="بیمار ویزیت شده")
    no_file = models.BooleanField(default=False, verbose_name="بدون پرونده")
    
    # فیلدهای ارتباطی
    unit = models.ForeignKey(
        'Unit', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        verbose_name="یونیت"
    )
    work_schedule = models.ForeignKey(
        'schedules.WorkSchedule',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="برنامه کاری"
    )
    
    # فیلدهای توضیحات
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    treatment_type = models.CharField(
        max_length=100, 
        verbose_name="نوع درمان", 
        blank=True, 
        null=True
    )
    treatment_description = models.TextField(
        verbose_name="شرح درمان", 
        blank=True, 
        null=True
    )
    referral = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        verbose_name="معرف"
    )
    
    # فیلدهای سیستمی
    created_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL, 
        null=True,
        related_name='created_appointments',  # اضافه کردن related_name یکتا
        verbose_name="ثبت کننده"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "نوبت"
        verbose_name_plural = "نوبت‌ها"
        ordering = ['-date', 'time_from']

    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.date} {self.time_from}"




def clean(self):
    """اعتبارسنجی مدل"""

    # تبدیل `self.time_from` و `self.time_to` از `string` به `datetime.time`
    time_format = "%H:%M"  # فرمت صحیح برای ساعت و دقیقه
    try:
        time_from_obj = datetime.strptime(self.time_from, time_format).time()
        time_to_obj = datetime.strptime(self.time_to, time_format).time()
    except ValueError:
        raise ValidationError("فرمت زمان نامعتبر است. لطفاً از فرمت HH:MM استفاده کنید.")

    # بررسی اعتبارسنجی‌های پایه
    if time_to_obj <= time_from_obj:
        raise ValidationError('زمان پایان باید بعد از زمان شروع باشد')

    if self.phone and not self.phone.isdigit():
        raise ValidationError('شماره تماس باید فقط شامل اعداد باشد')

    if self.national_code and not self.national_code.isdigit():
        raise ValidationError('کد ملی باید فقط شامل اعداد باشد')

    # بررسی انطباق با برنامه کاری پزشک
    if self.work_schedule:
        daily_schedule = self.work_schedule.daily_schedules.filter(
            day_of_week=self.date.weekday(),
            is_active=True
        ).first()
        
        holiday = self.work_schedule.holidays.filter(date=self.date).first()

        if holiday:
            raise ValidationError(f"این روز ({self.date}) تعطیل است.")

        elif daily_schedule:
            # بررسی شیفت صبح
            morning_valid = (
                time_from_obj >= daily_schedule.morning_start and 
                time_to_obj <= daily_schedule.morning_end
            )

            # بررسی شیفت عصر
            evening_valid = (
                daily_schedule.evening_start and 
                daily_schedule.evening_end and
                time_from_obj >= daily_schedule.evening_start and 
                time_to_obj <= daily_schedule.evening_end
            )

            if not (morning_valid or evening_valid):
                raise ValidationError("زمان انتخابی خارج از ساعت کاری پزشک است.")

        else:
            raise ValidationError("پزشک در این روز برنامه کاری ندارد.")

    class Meta:
        verbose_name = "نوبت"
        verbose_name_plural = "نوبت‌ها"
        ordering = ['-date', 'time_from']

    def save(self, *args, **kwargs):
        print(f"Saving appointment with ID: {self.id}")
        if not self.id:
            print("Warning: Appointment ID is empty!")
        self.clean()  # اجرای اعتبارسنجی‌ها قبل از ذخیره
        super().save(*args, **kwargs)
        
