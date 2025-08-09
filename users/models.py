from time import timezone
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models
import datetime
from django.core.files.base import ContentFile
from django.forms import ValidationError
import random
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display



class Education(models.Model):
    degree = models.CharField(max_length=100, unique=True)  # مدرک تحصیلی، مانند دکترا، کارشناسی ارشد، کارشناسی


    class Meta:
        verbose_name = "مدرک تحصیلی"
        verbose_name_plural = "مدارک تحصیلی"

    def __str__(self):
        return self.degree

class Specialty(models.Model):
    name = models.CharField(max_length=100, verbose_name="نام تخصص")

    class Meta:
        verbose_name = "تخصص"
        verbose_name_plural = "تخصص‌ها"

    def __str__(self):
        return self.name
# مدل جدید برای مدیریت لایسنس

class License(models.Model):
    name = models.CharField(max_length=100, verbose_name="نام لایسنس")
    max_users = models.PositiveIntegerField(default=1, verbose_name="حداکثر تعداد کاربران")
    price = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="قیمت")
    duration_days = models.PositiveIntegerField(default=365, verbose_name="مدت اعتبار (روز)")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "لایسنس"
        verbose_name_plural = "لایسنس‌ها"

    def __str__(self):
        return f"{self.name} - {self.max_users} کاربر"

    def get_remaining_users(self):
        """محاسبه تعداد کاربران باقیمانده"""
        from .models import Profile  # Import here to avoid circular import
        used_users = Profile.objects.count()
        return self.max_users - used_users

    def get_active_users(self):
        """محاسبه تعداد کاربران فعال"""
        from .models import Profile
        return Profile.objects.filter(user__is_active=True).count()


    

def generate_personal_number():
    return str(random.randint(1000, 9999))

class Role(models.Model):
    name = models.CharField(max_length=50, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "نقش"
        verbose_name_plural = "نقش‌ها"

# def upload_to(instance, filename):  
#     return 'photos/{year}/{month}/{day}/{post_id}_{filename}'.format(  
#         year=timezone.now().year, month=timezone.now().month, day=datetime.timezone.now().day,  
#         post_id=instance.post_id, filename=filename)  


class CustomUserManager(BaseUserManager):
    def create_user(self, personal_number="0001", username="admin", password="123", **extra_fields):
        extra_fields.setdefault("first_name", "admin")
        extra_fields.setdefault("last_name", "admin")
        extra_fields.setdefault("role", Role.objects.get_or_create(name="دکتر")[0])  # نقش پیش‌فرض دکتر
        extra_fields.setdefault("is_staff", False)
        extra_fields.setdefault("is_superuser", False)
        user = self.model(personal_number=personal_number, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, personal_number="0001", username="admin", password="123", **extra_fields):
        extra_fields.setdefault("first_name", "admin")
        extra_fields.setdefault("last_name", "admin")
        extra_fields.setdefault("role", Role.objects.get_or_create(name="دکتر")[0])
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("is_active", True)
        return self.create_user(personal_number, username, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100, default="")
    last_name = models.CharField(max_length=100, default="")
    username = models.CharField(max_length=50, unique=True)
    login_datetime = models.DateTimeField(auto_now=True)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, default=None)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    start_date = models.DateField(verbose_name="تاریخ شروع",default=datetime.date.today)
    end_date = models.DateField(verbose_name="تاریخ پایان",default=datetime.date.today)
    personal_number = models.CharField(max_length=50, default=generate_personal_number)
   

    class Meta:
        verbose_name = "کاربر"
        verbose_name_plural = "کاربران"
        
    def __str__(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username
    
    def get_full_name(self):
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.username

    def clean(self):
        if self.end_date < self.start_date:
            raise ValidationError("تاریخ پایان باید بعد از تاریخ شروع باشد!")

    
    

    objects = CustomUserManager()

    USERNAME_FIELD = "username"  # تغییر مقدار ورود به username
    REQUIRED_FIELDS = ["personal_number"]
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if self.is_superuser:
            self.is_active = True  # همیشه فعال باشد
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} - {self.personal_number}"




def user_directory_path(instance, filename):
    # فایل در مسیر MEDIA_ROOT/user_{id}/{filename} ذخیره می‌شود
    return f'user_{instance.profile.id}/{filename}'


class Profile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, null=True, blank=True)
    id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    personal_number = models.CharField(max_length=50, default=generate_personal_number)
    license = models.ForeignKey(License, on_delete=models.SET_NULL, null=True, blank=True)
    expiry_date = models.DateField(null=True, blank=True)
    is_published = models.BooleanField(default=True)
    register_date = models.DateTimeField(auto_now_add=True)
    is_activate = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    personal_number = models.CharField(max_length=50, default=generate_personal_number)
    medical_code = models.CharField(max_length=20, unique=True, blank=True, null=True)  # کد نظام پزشکی اختیاری
    national_code = models.CharField(max_length=10, unique=True, blank=True, null=True)
    phone = models.CharField(blank=True, max_length=15, null=True)
    mobile = models.CharField(blank=True, max_length=15, null=True)
    address = models.TextField(blank=True, null=True)
    postal_code = models.CharField(blank=True, max_length=10, null=True)
    sex = models.BooleanField(default=True)
    is_married = models.BooleanField(default=False)
    birth_date = models.DateField(verbose_name="تاریخ تولد",default=datetime.date.today)
    birthplace = models.CharField(max_length=100, blank=True, null=True)
    education = models.ForeignKey(Education, on_delete=models.SET_NULL, null=True, blank=True, default=None)
    specialty = models.ForeignKey(Specialty, on_delete=models.SET_NULL, null=True, blank=True, default=None)
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, default=None)
      # اضافه کردن فیلدهای درصد
    work_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        verbose_name="درصد کارکرد پزشک"
    )
    lab_expense_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        verbose_name="درصد هزینه لابراتوار"
    )
    material_expense_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        verbose_name="درصد هزینه مواد"
    )
    tax_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0.00,
        verbose_name="درصد مالیات"
    )

    def clean(self):
        super().clean()
    # بررسی هر درصد به صورت جداگانه
        percentages = {
            'درصد کارکرد پزشک': self.work_percentage,
            'درصد هزینه لابراتوار': self.lab_expense_percentage,
            'درصد هزینه مواد': self.material_expense_percentage,
            'درصد مالیات': self.tax_percentage
        }
    
        for name, value in percentages.items():
            if value > 100:
                raise ValidationError(f"{name} نمی‌تواند بیشتر از 100 باشد")

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def save(self, *args, **kwargs):
        if not self.user and self.license:
            # اگر نام کاربری و رمز عبور وارد شده باشد، یک کاربر جدید ایجاد می‌کنیم
            if hasattr(self, '_username') and hasattr(self, '_password'):
                user = CustomUser.objects.create_user(
                    username=self._username,
                    password=self._password,
                    personal_number=self.personal_number,
                    first_name=self.first_name,
                    last_name=self.last_name
                )
                self.user = user
                
                # تنظیم تاریخ انقضا بر اساس لایسنس
                if self.license:
                    self.expiry_date = datetime.date.today() + datetime.timedelta(days=self.license.duration_days)
        
        super().save(*args, **kwargs)

    def create_profile_with_user(self, username, password, **kwargs):
        """متد کمکی برای ایجاد پروفایل با کاربر"""
        self._username = username
        self._password = password
        for key, value in kwargs.items():
            setattr(self, key, value)
        self.save()

    def get_remaining_users(self):
        """تعداد کاربران مجاز باقیمانده"""
        if self.license:
            current_users = Profile.objects.filter(license=self.license).count()
            return self.license.max_users - current_users
        return 0

    def is_license_valid(self):
        """بررسی اعتبار لایسنس"""
        if not self.expiry_date:
            return False
        return self.expiry_date >= datetime.date.today()
    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    

    
#درصد های پزشک
class DoctorFinancialDetails(models.Model):
    doctor = models.OneToOneField(CustomUser, on_delete=models.CASCADE)  # ارتباط یک به یک با مدل پزشک
    work_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)  # درصد کارکرد پزشک
    lab_expense_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)  # هزینه لابراتوار
    material_expense_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)  # هزینه مواد مصرفی
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)  # درصد مالیات
    updated_at = models.DateTimeField(auto_now=True)  # ثبت زمان آخرین تغییرات

    
    def clean(self):
        total = (self.work_percentage + self.lab_expense_percentage + 
                 self.material_expense_percentage + self.tax_percentage)
        if total > 100:
            raise ValidationError('مجموع درصدها نمیتواند بیشتر از 100 باشد')
    def __str__(self):
        return f"اطلاعات مالی {self.doctor.username}"
    

    
class UserLicense(models.Model):
    """مدل برای نگهداری اطلاعات لایسنس هر کاربر"""
    user = models.ForeignKey('Profile', on_delete=models.CASCADE, verbose_name="کاربر")
    license = models.ForeignKey(License, on_delete=models.CASCADE, verbose_name="لایسنس")
    start_date = models.DateField(verbose_name="تاریخ شروع")
    end_date = models.DateField(verbose_name="تاریخ پایان")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "لایسنس کاربر"
        verbose_name_plural = "لایسنس‌های کاربران"

    def __str__(self):
        return f"{self.user} - {self.license}"
    
    
def validate_dates(start_date, end_date):
    if end_date < start_date:
        raise ValidationError(_('تاریخ پایان باید بعد از تاریخ شروع باشد'))

    

import qrcode
from io import BytesIO
from django.core.files import File
from django.utils import timezone



class PersonnelCard(models.Model):
    profile = models.OneToOneField(Profile, on_delete=models.CASCADE, related_name='personnel_card')
    card_number = models.CharField(max_length=10, unique=True, verbose_name="شماره کارت")
    avatar = models.ImageField(upload_to=user_directory_path, verbose_name="عکس پرسنلی",default='default.jpg')
    signature = models.ImageField(upload_to=user_directory_path, verbose_name="امضا", default='signature.jpg')
    qr_code = models.ImageField(upload_to=user_directory_path, blank=True, verbose_name="کد QR")
    issue_date = models.DateField(auto_now_add=True, verbose_name="تاریخ صدور")
    expiry_date = models.DateField(verbose_name="تاریخ انقضا")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    last_entry = models.DateTimeField(null=True, blank=True, verbose_name="آخرین ورود")
    last_exit = models.DateTimeField(null=True, blank=True, verbose_name="آخرین خروج")
    card_image = models.ImageField(upload_to=user_directory_path, blank=True, verbose_name="تصویر کارت")

    def generate_card_image(self):
        card_width = 856  # 85.6mm در 300dpi
        card_height = 540  # 53.98mm در 300dpi
        card = Image.new('RGB', (card_width, card_height), 'white')
        draw = ImageDraw.Draw(card)
    
        try:
        # لود فونت فارسی
            font_path = 'static/fonts/F_hamed.ttf'  # مسیر فونت را تنظیم کنید
            title_font = ImageFont.truetype(font_path, 40)
            normal_font = ImageFont.truetype(font_path, 30)
        
        # اضافه کردن عکس پرسنلی
            if self.avatar:
                avatar = Image.open(self.avatar.path)
                avatar = avatar.resize((150, 200))
                card.paste(avatar, (50, 50))
        
        # اضافه کردن اطلاعات
            text_x = 250
            draw.text((text_x, 50), f"{self.profile.first_name} {self.profile.last_name}", fill='black', font=title_font)
            draw.text((text_x, 100), f"سمت: {self.profile.role.name if self.profile.role else ''}", fill='black', font=normal_font)
            draw.text((text_x, 150), f"کد پرسنلی: {self.profile.personal_number}", fill='black', font=normal_font)
        
        # اضافه کردن QR کد
            if self.qr_code:
                qr = Image.open(self.qr_code.path)
                qr = qr.resize((150, 150))
                card.paste(qr, (650, 50))
        
        # اضافه کردن امضا
            if self.signature:
                signature = Image.open(self.signature.path)
                signature = signature.resize((150, 100))
                card.paste(signature, (50, 400))
        
        # ذخیره تصویر کارت
            blob = BytesIO()
            card.save(blob, 'PNG')
            self.card_image.save(f'card_{self.card_number}.png', File(blob), save=False)
        
        except Exception as e:
            print(f"Error generating card image: {str(e)}")


    
    
    def save(self, *args, **kwargs):
        if not self.card_number:
            self.card_number = self.generate_card_number()
        
        if not self.avatar and self.profile.avatar:
            self.avatar = self.profile.avatar
        if not self.signature and self.profile.signature:
            self.signature = self.profile.signature
            
        if not self.qr_code:
            self.generate_qr_code()
            
        if not self.card_image:
            self.generate_card_image()
            
        super().save(*args, **kwargs)

    class Meta:
        verbose_name = "کارت پرسنلی"
        verbose_name_plural = "کارت‌های پرسنلی"
