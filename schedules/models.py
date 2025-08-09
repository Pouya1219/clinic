from django.db import models
from django.core.exceptions import ValidationError
import datetime
from users.models import Profile

class WorkSchedule(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE, related_name='work_schedules')
    title = models.CharField(max_length=100, verbose_name="عنوان برنامه")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "برنامه کاری"
        verbose_name_plural = "برنامه‌های کاری"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.profile.first_name} {self.profile.last_name} - {self.title}"

    def calculate_total_hours(self):
        """محاسبه کل ساعات کاری در هفته"""
        total_minutes = 0
        for day in self.daily_schedules.filter(is_active=True):
            total_minutes += day.calculate_daily_minutes()
        return round(total_minutes / 60, 1)  # تبدیل به ساعت با یک رقم اعشار

class DailySchedule(models.Model):
    DAYS_OF_WEEK = [
        (0, 'شنبه'),
        (1, 'یکشنبه'),
        (2, 'دوشنبه'),
        (3, 'سه‌شنبه'),
        (4, 'چهارشنبه'),
        (5, 'پنج‌شنبه'),
        (6, 'جمعه'),
    ]

    work_schedule = models.ForeignKey(
        WorkSchedule, 
        on_delete=models.CASCADE,
        related_name='daily_schedules'
    )
    day_of_week = models.IntegerField(choices=DAYS_OF_WEEK, verbose_name="روز هفته")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    # شیفت صبح
    morning_start = models.TimeField(verbose_name="شروع شیفت صبح")
    morning_end = models.TimeField(verbose_name="پایان شیفت صبح")
    
    # شیفت عصر
    evening_start = models.TimeField(verbose_name="شروع شیفت عصر")
    evening_end = models.TimeField(verbose_name="پایان شیفت عصر")

    class Meta:
        verbose_name = "برنامه روزانه"
        verbose_name_plural = "برنامه‌های روزانه"
        unique_together = ['work_schedule', 'day_of_week']
        ordering = ['day_of_week']

    def clean(self):
        # بررسی صحت زمان‌ها
        if self.morning_start and self.morning_end:
            if self.morning_start >= self.morning_end:
                raise ValidationError("زمان پایان شیفت صبح باید بعد از زمان شروع باشد")

        if self.evening_start and self.evening_end:
            if self.evening_start >= self.evening_end:
                raise ValidationError("زمان پایان شیفت عصر باید بعد از زمان شروع باشد")

        if self.morning_end and self.evening_start:
            if self.morning_end > self.evening_start:
                raise ValidationError("شیفت عصر باید بعد از شیفت صبح باشد")

    def calculate_daily_minutes(self):
        """محاسبه مجموع دقایق کاری روز"""
        if not self.is_active:
            return 0
            
        total_minutes = 0
        
        # محاسبه دقایق شیفت صبح
        morning_minutes = (
            datetime.datetime.combine(datetime.date.today(), self.morning_end) -
            datetime.datetime.combine(datetime.date.today(), self.morning_start)
        ).seconds / 60

        # محاسبه دقایق شیفت عصر
        evening_minutes = (
            datetime.datetime.combine(datetime.date.today(), self.evening_end) -
            datetime.datetime.combine(datetime.date.today(), self.evening_start)
        ).seconds / 60

        return morning_minutes + evening_minutes

    def __str__(self):
        return f"{self.get_day_of_week_display()} - {self.work_schedule.profile.first_name}"

class Holiday(models.Model):
    work_schedule = models.ForeignKey(
        WorkSchedule, 
        on_delete=models.CASCADE,
        related_name='holidays'
    )
    date = models.DateField(verbose_name="تاریخ تعطیلی")
    description = models.CharField(max_length=200, verbose_name="توضیحات", blank=True)
    class Meta:
        verbose_name = "تعطیلی"
        verbose_name_plural = "تعطیلات"
        unique_together = ['work_schedule', 'date']
        ordering = ['date']

    def __str__(self):
        return f"{self.date} - {self.description}"
