import decimal
from django.db import models
from users.models import CustomUser  # ایمپورت مدل کاربر
import datetime
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image, ImageDraw, ImageFont
from django.db import models
from django.utils import timezone
from barcode.writer import ImageWriter
import barcode
from django.templatetags.static import static
from decimal import Decimal
from django.conf import settings
from django.db.models import Sum


class DiscountType(models.Model):
    name = models.CharField(max_length=100, verbose_name="نام نوع تخفیف")
    doctor_percentage = models.IntegerField(default=0, verbose_name="درصد سهم پزشک")
    clinic_percentage = models.IntegerField(default=0, verbose_name="درصد سهم کلینیک")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "نوع تخفیف"
        verbose_name_plural = "انواع تخفیف"

class PatientRecord(models.Model):
    # اطلاعات اصلی بیمار
    file_num = models.CharField(max_length=50, unique=True, verbose_name="شماره پرونده")
    name = models.CharField(max_length=100, verbose_name="نام")
    family = models.CharField(max_length=100, verbose_name="نام خانوادگی")
    national_code = models.CharField(max_length=10, unique=True, blank=True, null=True, verbose_name="کد ملی")
    name_of_father = models.CharField(max_length=100, blank=True, null=True, verbose_name="نام پدر")
    email = models.EmailField(max_length=254, blank=True, null=True, verbose_name="ایمیل")
    # اطلاعات تماس
    contant_info = models.CharField(max_length=150, blank=True, null=True, verbose_name="تلفن تماس")
    emergency_contact = models.CharField(max_length=150, blank=True, null=True, verbose_name="شماره اضطراری")
    family_number = models.CharField(max_length=150, blank=True, null=True, verbose_name="تلفن سرپرست")
    address = models.TextField(blank=True, null=True, verbose_name="آدرس")
    
    # اطلاعات شخصی
    birthday = models.DateField(blank=True, null=True, verbose_name="تاریخ تولد")
    sex = models.BooleanField(default=True, verbose_name="جنسیت")  # True = Male, False = Female
    marital_status = models.CharField(max_length=20, blank=True, null=True, verbose_name="وضعیت تاهل")
    occupation = models.CharField(max_length=100, blank=True, null=True, verbose_name="شغل")
    blood_type = models.CharField(max_length=5, blank=True, null=True, verbose_name="گروه خونی")
    height = models.PositiveIntegerField(blank=True, null=True, verbose_name="قد")
    weight = models.PositiveIntegerField(blank=True, null=True, verbose_name="وزن")
    
    # اطلاعات پزشکی
    medications_info = models.TextField(blank=True, null=True, verbose_name="سابقه بیماری‌های خاص")
    allergy = models.TextField(blank=True, null=True, verbose_name="حساسیت‌های دارویی یا غذایی")
    medicine_use = models.TextField(blank=True, null=True, verbose_name="داروهای مصرفی فعلی")
    afraid_of_dental = models.CharField(max_length=20, blank=True, null=True, verbose_name="میزان ترس از دندانپزشکی")
    addiction_to_alcohol = models.BooleanField(default=False, verbose_name="اعتیاد")
    
    # بیماری‌های خاص
    has_heart_disease = models.BooleanField(default=False, verbose_name="بیماری قلبی")
    has_diabetes = models.BooleanField(default=False, verbose_name="دیابت")
    has_blood_pressure = models.BooleanField(default=False, verbose_name="فشار خون")
    has_hepatitis = models.BooleanField(default=False, verbose_name="هپاتیت")
    is_pregnant = models.BooleanField(default=False, verbose_name="بارداری")
    pregnancy_month = models.PositiveIntegerField(blank=True, null=True, verbose_name="ماه بارداری")
    
    # اطلاعات بیمه
    insurance = models.CharField(max_length=100, blank=True, null=True, verbose_name="بیمه")
    insurance_type = models.CharField(max_length=100, blank=True, null=True, verbose_name="نوع بیمه")
    insurance_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="شماره بیمه")
    insurance_expiry_date = models.DateField(blank=True, null=True, verbose_name="تاریخ انقضای بیمه")
    
    # اطلاعات مراجعه
    category = models.CharField(max_length=100, blank=True, null=True, verbose_name="دسته بندی")
    color = models.CharField(max_length=50, blank=True, null=True, verbose_name="رنگ")
    status = models.CharField(max_length=100, blank=True, null=True, verbose_name="وضعیت")
    introducer = models.CharField(max_length=100, blank=True, null=True, verbose_name="معرف")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
    # اطلاعات سیستمی
    profile_picture = models.ImageField(upload_to="patient_profiles/", default="img/logo.png", blank=True, null=True, verbose_name="تصویر پروفایل")
    create_date = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    last_visit_date = models.DateField(blank=True, null=True, verbose_name="تاریخ آخرین مراجعه")
    next_visit_date = models.DateField(blank=True, null=True, verbose_name="تاریخ مراجعه بعدی")
    registered_by = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='registered_records',
        verbose_name="ثبت کننده"
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ آخرین بروزرسانی")
    updated_by = models.ForeignKey(
        'users.CustomUser',
        on_delete=models.SET_NULL,
        null=True,
        related_name='updated_records',
        verbose_name="بروزرسانی کننده"
    )
    

    class Meta:
        verbose_name = "پرونده بیمار"
        verbose_name_plural = "پرونده‌های بیماران"
        ordering = ['-create_date']  # مرتب‌سازی بر اساس تاریخ ایجاد (جدیدترین اول)

    def __str__(self):
        return f"{self.name} {self.family} - {self.file_num}"

    def get_age(self):
        if self.birthday:
            today = datetime.date.today()
            return today.year - self.birthday.year - ((today.month, today.day) < (self.birthday.month, self.birthday.day))
        return None
    
    def get_bmi(self):
        try:
            if self.height and self.weight and str(self.height).strip() and str(self.weight).strip():
            # تبدیل به عدد و بررسی معتبر بودن
                height = float(self.height)
                weight = float(self.weight)
            
                if height <= 0 or weight <= 0:
                    return None
                
                height_m = height / 100  # تبدیل سانتی‌متر به متر
                return round(weight / (height_m * height_m), 2)
            return None
        except (ValueError, TypeError):
            return None
    
    
    # وضعیت تأهل به صورت انتخابی
    marital_status = models.CharField(
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name="وضعیت تاهل"
    )
    
    
    # متدهای جدید
    def get_full_name(self):
        """برگرداندن نام کامل بیمار"""
        return f"{self.name} {self.family}"
    
    def get_insurance_status(self):
        """بررسی وضعیت بیمه"""
        if not self.insurance_expiry_date:
            return False
        return self.insurance_expiry_date >= datetime.date.today()
    
    def get_next_appointment_due(self):
        """بررسی زمان مراجعه بعدی"""
        if not self.next_visit_date:
            return None
        today = datetime.date.today()
        days_remaining = (self.next_visit_date - today).days
        return days_remaining

    
class MedicalHistory(models.Model):
    patient = models.ForeignKey(PatientRecord, on_delete=models.CASCADE, related_name='medical_histories', verbose_name="بیمار")
    condition = models.CharField(max_length=200, verbose_name="نام بیماری")
    diagnosis_date = models.DateField(verbose_name="تاریخ تشخیص")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        verbose_name = "سابقه پزشکی"
        verbose_name_plural = "سوابق پزشکی"
        ordering = ['-diagnosis_date']

class DentalProcedure(models.Model):
    patient = models.ForeignKey(PatientRecord, on_delete=models.CASCADE, related_name='dental_procedures', verbose_name="بیمار")
    procedure_date = models.DateField(verbose_name="تاریخ درمان")
    tooth_number = models.CharField(max_length=10, verbose_name="شماره دندان")
    procedure_type = models.CharField(max_length=100, verbose_name="نوع درمان")
    description = models.TextField(verbose_name="توضیحات")
    cost = models.DecimalField(max_digits=10, decimal_places=0, verbose_name="هزینه")
    performed_by = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, verbose_name="انجام دهنده")

    class Meta:
        verbose_name = "درمان دندانپزشکی"
        verbose_name_plural = "درمان‌های دندانپزشکی"
        ordering = ['-procedure_date']

class Prescription(models.Model):
    patient = models.ForeignKey(PatientRecord, on_delete=models.CASCADE, related_name='prescriptions', verbose_name="بیمار")
    date = models.DateField(verbose_name="تاریخ")
    medications = models.TextField(verbose_name="داروها")
    instructions = models.TextField(verbose_name="دستورات مصرف")
    prescribed_by = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, verbose_name="تجویز کننده")

    class Meta:
        verbose_name = "نسخه"
        verbose_name_plural = "نسخه‌ها"
        ordering = ['-date']

class Appointment(models.Model):
    APPOINTMENT_STATUS = [
        ('pending', 'در انتظار'),
        ('confirmed', 'تایید شده'),
        ('cancelled', 'لغو شده'),
        ('completed', 'انجام شده'),
    ]

    patient = models.ForeignKey(PatientRecord, on_delete=models.CASCADE, related_name='appointments', verbose_name="بیمار")
    date = models.DateTimeField(verbose_name="تاریخ و ساعت")
    reason = models.CharField(max_length=200, verbose_name="علت مراجعه")
    status = models.CharField(max_length=50, choices=APPOINTMENT_STATUS, default='pending', verbose_name="وضعیت")
    doctor = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, verbose_name="پزشک")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    notes = models.TextField(blank=True, null=True, verbose_name="یادداشت‌ها")

    class Meta:
        verbose_name = "نوبت"
        verbose_name_plural = "نوبت‌ها"
        ordering = ['-date']

 # تغییر در import

from django.db import models
from django.utils import timezone
import qrcode
from io import BytesIO
from django.core.files import File
from PIL import Image, ImageDraw, ImageFont

class PatientCard(models.Model):
    patient = models.OneToOneField(PatientRecord, on_delete=models.CASCADE, related_name='patient_card')
    card_number = models.CharField(max_length=20, unique=True, verbose_name="شماره کارت")
    issue_date = models.DateField(auto_now_add=True, verbose_name="تاریخ صدور")
    expiry_date = models.DateField(verbose_name="تاریخ انقضا")
    signature = models.ImageField(upload_to='signatures/', blank=True, null=True, verbose_name="امضا")
    barcode = models.ImageField(upload_to='barcodes/', blank=True, verbose_name="بارکد")
    qr_code = models.ImageField(upload_to='qrcodes/', blank=True, verbose_name="کیوآر کد")
    card_image = models.ImageField(upload_to='patient_cards/', blank=True, verbose_name="تصویر کارت")
    is_active = models.BooleanField(default=True, verbose_name="فعال")

    class Meta:
        verbose_name = "کارت بیمار"
        verbose_name_plural = "کارت‌های بیماران"

    def generate_card_number(self):
        """تولید شماره کارت منحصر به فرد"""
        year = str(timezone.now().year)[2:]
        count = PatientCard.objects.count() + 1
        return f"PC{year}{count:04d}"

    def generate_barcode(self):
        """تولید بارکد"""
        try:
            ean = barcode.get_barcode_class('code128')
            ean_code = ean(self.card_number, writer=ImageWriter())
            buffer = BytesIO()
            ean_code.write(buffer)
            self.barcode.save(f'barcode_{self.card_number}.png', File(buffer), save=False)
        except Exception as e:
            print(f"Error generating barcode: {str(e)}")
            # ذخیره بارکد
            self.barcode.save(
                f'barcode_{self.card_number}.png',
                File(buffer),
                save=False
            )
        except Exception as e:
            print(f"Error generating barcode: {str(e)}")

    def generate_qr_code(self):
        """تولید QR کد با اطلاعات بیمار"""
        try:
            qr = qrcode.QRCode(
                version=1,
                error_correction=qrcode.constants.ERROR_CORRECT_L,
                box_size=10,
                border=4,
            )
            
            # اطلاعاتی که می‌خواهیم در QR کد ذخیره شود
            data = {
                'card_number': self.card_number,
                'patient_id': self.patient.id,
                'name': f"{self.patient.name} {self.patient.family}",
                'national_code': self.patient.national_code
            }
            
            qr.add_data(str(data))
            qr.make(fit=True)
            
            # ایجاد تصویر QR کد
            qr_image = qr.make_image(fill_color="black", back_color="white")
            buffer = BytesIO()
            qr_image.save(buffer, format='PNG')
            
            # ذخیره QR کد
            self.qr_code.save(
                f'qr_{self.card_number}.png',
                File(buffer),
                save=False
            )
        except Exception as e:
            print(f"Error generating QR code: {str(e)}")

    def generate_card_image(self):
        """تولید تصویر کارت"""
        try:
            font_path = static('fonts/F_hamed.ttf')
            
            card_width = int(1000)  # تبدیل سانتی‌متر به پیکسل (با فرض DPI 300)
            card_height = int(600)
            card = Image.new('RGB', (card_width, card_height), 'white')
            draw = ImageDraw.Draw(card)

            if self.patient.profile_picture:
                try:
                    profile_pic = Image.open(self.patient.profile_picture.path)
                except FileNotFoundError:
                    profile_pic = Image.open(static('img/logo.png'))  # مسیر تصویر پیش‌فرض
            else:
                profile_pic = Image.open(static('img/logo.png'))  # مسیر تصویر پیش‌فرض

            profile_pic.thumbnail((150, 150))
            card.paste(profile_pic, (50, 50))

        # اضافه کردن عکس بیمار (اگر وجود دارد)
            if self.patient.profile_picture:
                profile_pic = Image.open(self.patient.profile_picture.path)
                profile_pic.thumbnail((150, 150))  # تغییر اندازه بدون تغییر نسبت ابعاد
                card.paste(profile_pic, (50, 50))
            if self.barcode:
                barcode_img = Image.open(self.barcode.path)
                barcode_img.thumbnail((300, 100))
                card.paste(barcode_img, (50, card_height - 150))

        # اضافه کردن QR کد
            if self.qr_code:
                qr_img = Image.open(self.qr_code.path)
                qr_img.thumbnail((150, 150))
                card.paste(qr_img, (card_width - 200, 50))

        # ذخیره تصویر کارت
            buffer = BytesIO()
            card.save(buffer, format='PNG')
            self.card_image.save(f'card_{self.card_number}.png', File(buffer), save=False)
        except PatientRecord.DoesNotExist:
            print("Patient record not found.")
        except Exception as e:
            print(f"Error generating card image: {str(e)}")

    def save(self, *args, **kwargs):
        if not self.card_number:
            self.card_number = self.generate_card_number()
        
        if not self.expiry_date:
            self.expiry_date = timezone.now().date() + timezone.timedelta(days=365)

        if not self.barcode:
            self.generate_barcode()
            
        if not self.qr_code:
            self.generate_qr_code()
            
        if not self.card_image:
            self.generate_card_image()
            
        super().save(*args, **kwargs)

class TreatmentType(models.Model):
    title = models.CharField(max_length=100, verbose_name="نوع درمان")

    def __str__(self):
        return self.title
class TreatmentDetail(models.Model):
    treatment_type = models.ForeignKey(TreatmentType, on_delete=models.CASCADE, related_name='details', db_index=True)
    description = models.CharField(max_length=200, verbose_name="شرح درمان")
    international_code = models.CharField(max_length=50, verbose_name="کد بین‌المللی", db_index=True)
    public_tariff = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="تعرفه عمومی")
    special_tariff = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="تعرفه تخصصی")

    def __str__(self):
        return self.description
    
class InsuranceType(models.Model):
    """نوع بیمه (درصدی، تعرفه‌ای، کلی)"""
    name = models.CharField(max_length=50, unique=True, verbose_name="نام نوع بیمه")
    code = models.CharField(max_length=20, unique=True, verbose_name="کد نوع بیمه")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
    class Meta:
        verbose_name = "نوع بیمه"
        verbose_name_plural = "انواع بیمه"
        
    def __str__(self):
        return self.name

class InsuranceProvider(models.Model):
    """شرکت بیمه‌گر"""
    name = models.CharField(max_length=100, verbose_name="نام بیمه‌گر")
    insurance_type = models.ForeignKey(InsuranceType, on_delete=models.CASCADE, related_name='providers', verbose_name="نوع بیمه")
    code = models.CharField(max_length=20, blank=True, null=True, verbose_name="کد بیمه‌گر")
    logo = models.ImageField(upload_to='insurance_logos/', blank=True, null=True, verbose_name="لوگو")
    contact_info = models.CharField(max_length=200, blank=True, null=True, verbose_name="اطلاعات تماس")
    website = models.URLField(blank=True, null=True, verbose_name="وب‌سایت")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    class Meta:
        verbose_name = "بیمه‌گر"
        verbose_name_plural = "بیمه‌گران"
        
    def __str__(self):
        return f"{self.name} ({self.insurance_type.name})"
class InsuranceTariff(models.Model):
    """تعرفه‌های بیمه برای درمان‌های مختلف"""
    insurance_provider = models.ForeignKey(InsuranceProvider, on_delete=models.CASCADE, related_name='tariffs', verbose_name="بیمه‌گر")
    treatment_detail = models.ForeignKey('TreatmentDetail', on_delete=models.CASCADE, related_name='insurance_tariffs', verbose_name="جزئیات درمان")
    tariff_amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ تعرفه")
    effective_date = models.DateField(verbose_name="تاریخ اعمال")
    expiry_date = models.DateField(blank=True, null=True, verbose_name="تاریخ انقضا")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    
    class Meta:
        verbose_name = "تعرفه بیمه"
        verbose_name_plural = "تعرفه‌های بیمه"
        unique_together = ('insurance_provider', 'treatment_detail')
        
    def __str__(self):
        return f"{self.insurance_provider.name} - {self.treatment_detail.description} - {self.tariff_amount}"
class PatientInsurance(models.Model):
    """بیمه بیمار"""
    patient = models.ForeignKey(PatientRecord, on_delete=models.CASCADE, related_name='insurances', verbose_name="بیمار")
    insurance_provider = models.ForeignKey(InsuranceProvider, on_delete=models.CASCADE, verbose_name="بیمه‌گر")
    insurance_number = models.CharField(max_length=50, verbose_name="شماره بیمه")
    expiry_date = models.DateField(verbose_name="تاریخ انقضا")
    coverage_percentage = models.PositiveIntegerField(blank=True, null=True, verbose_name="درصد پوشش")
    is_primary = models.BooleanField(default=False, verbose_name="بیمه اصلی")
    is_active = models.BooleanField(default=True, verbose_name="فعال")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    coverage_ceiling = models.DecimalField(
        max_digits=12, 
        decimal_places=0, 
        null=True, 
        blank=True, 
        verbose_name="سقف پوشش (ریال)"
    )
    used_coverage = models.DecimalField(
        max_digits=12, 
        decimal_places=0, 
        default=0, 
        verbose_name="مقدار استفاده شده از بیمه (ریال)"
    )
    notes = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
    class Meta:
        verbose_name = "بیمه بیمار"
        verbose_name_plural = "بیمه‌های بیماران"
    
    def save(self, *args, **kwargs):
    # بررسی تاریخ انقضا و غیرفعال کردن بیمه‌های منقضی شده
        if self.expiry_date and self.expiry_date < timezone.now().date():
            self.is_active = False
    
    # بررسی تعداد بیمه‌های بیمار
    # اگر این تنها بیمه بیمار است یا بیمه اصلی است، همیشه فعال نگه داریم
        if self.pk:  # اگر بیمه قبلاً ذخیره شده باشد (ویرایش)
            insurance_count = PatientInsurance.objects.filter(patient=self.patient).exclude(pk=self.pk).count()
            if insurance_count == 0 or self.is_primary:
                self.is_active = True
        else:  # اگر بیمه جدید است (ایجاد)
            if PatientInsurance.objects.filter(patient=self.patient).count() == 0 or self.is_primary:
                self.is_active = True
    
    # اگر این بیمه فعال است، سایر بیمه‌ها را غیرفعال کنیم
        deactivate_others = kwargs.pop('deactivate_others', True)  # پیش‌فرض را True قرار می‌دهیم
        if self.is_active and deactivate_others:
        # غیرفعال کردن سایر بیمه‌های فعال بیمار
            PatientInsurance.objects.filter(
                patient=self.patient, 
                is_active=True
            ).exclude(pk=self.pk).update(is_active=False)
    
        super().save(*args, **kwargs)


    def __str__(self):
        return f"{self.patient} - {self.insurance_provider}"
        
    def is_expired(self):
        """بررسی انقضای بیمه"""
        return self.expiry_date < timezone.now().date()



class PreviousTreatment(models.Model):
    patient = models.ForeignKey('PatientRecord', on_delete=models.CASCADE, related_name='previous_treatments')
    doctor_name = models.CharField(max_length=255, verbose_name="نام پزشک")
    visit_date = models.DateField(verbose_name="تاریخ مراجعه")
    description = models.TextField(verbose_name="شرح درمان")

    class Meta:
        verbose_name = "سابقه درمان قبلی"
        verbose_name_plural = "سوابق درمان قبلی"

    def __str__(self):
        return f"{self.patient.get_full_name()} - {self.doctor_name} - {self.visit_date}"



class Treatment(models.Model):
    """مدل اصلی درمان"""
    patient = models.ForeignKey(PatientRecord, on_delete=models.CASCADE, related_name='treatments', verbose_name="بیمار")
    treatment_date = models.DateField(verbose_name="تاریخ درمان")
    next_visit_date = models.DateField(null=True, blank=True, verbose_name="تاریخ مراجعه بعدی")
    
    # نوع درمان و شرح (ارتباط با مدل‌های موجود)
    treatment_type = models.ForeignKey(TreatmentType, on_delete=models.PROTECT, related_name='treatments', verbose_name="نوع درمان")
    treatment_detail = models.ForeignKey(TreatmentDetail, on_delete=models.PROTECT, related_name='treatments', verbose_name="شرح درمان")
    
    # دندان‌ها یا نواحی درمان
    treatment_areas = models.CharField(max_length=200, verbose_name="نواحی درمان")
    area_type = models.CharField(max_length=50, default="teeth", verbose_name="نوع ناحیه")  # teeth, face, body
    
    # پزشک و دستیار
    doctor = models.ForeignKey('users.Profile', on_delete=models.SET_NULL, null=True, related_name='treatments_as_doctor', verbose_name="پزشک معالج")
    assistant = models.ForeignKey('users.Profile', on_delete=models.SET_NULL, null=True, blank=True, related_name='treatments_as_assistant', verbose_name="دستیار پزشک")
    
    # هزینه‌ها (از مدل TreatmentDetail خوانده می‌شود)
    general_fee = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="تعرفه عمومی")
    special_fee = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="تعرفه تخصصی")
    discount = models.DecimalField(max_digits=10, decimal_places=0, default=0, verbose_name="مبلغ تخفیف")
    discount_type = models.ForeignKey(DiscountType, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="نوع تخفیف")
    material_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="هزینه مواد")
    lab_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="هزینه لابراتوار")
    payable_amount = models.DecimalField(max_digits=12, decimal_places=0,default=Decimal('0.00'), verbose_name="مبلغ قابل پرداخت")
    
    
    # بیمه
    insurance_provider = models.ForeignKey(InsuranceProvider, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="بیمه‌گر")
    insurance_percentage = models.PositiveIntegerField(default=0, verbose_name="درصد بیمه")
    insurance_sent = models.BooleanField(default=False, verbose_name="ارسال شده به بیمه")
    insurance_paid = models.BooleanField(default=False, verbose_name="از بیمه مبلغ دریافت شده")
    
    # وضعیت
    is_completed = models.BooleanField(default=False, verbose_name="درمان انجام شده")
    is_treatment_plan = models.BooleanField(default=False, verbose_name="طرح درمان")
    
    # اطلاعات سیستمی
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    has_installment_plan = models.BooleanField(default=False, verbose_name="دارای طرح اقساط")
    is_manual_price = models.BooleanField(default=False, verbose_name="قیمت دستی")
    
    
    class Meta:
        verbose_name = "درمان"
        verbose_name_plural = "درمان‌ها"
        ordering = ['-treatment_date']
    
    def __str__(self):
        return f"{self.patient} - {self.treatment_detail.description} - {self.treatment_date}"
    
    def calculate_payable_amount(self):
        """محاسبه مبلغ قابل پرداخت"""
        # استفاده از تعرفه عمومی به جای تعرفه تخصصی
        base_amount = self.general_fee  # اصلاح شده
    
        # کسر تخفیف
        amount_after_discount = base_amount - self.discount
    
        # کسر سهم بیمه
        insurance_amount = 0
        if self.insurance_provider and self.insurance_percentage > 0:
            insurance_amount = (amount_after_discount * self.insurance_percentage) / 100
    
        # اضافه کردن هزینه‌های مواد و لابراتوار
        final_amount = amount_after_discount - insurance_amount + self.material_cost + self.lab_cost
    
        return max(0, final_amount)  # مبلغ نباید منفی باشد
    
    def save(self, *args, **kwargs):
    # تنظیم خودکار تعرفه‌ها از مدل TreatmentDetail فقط اگر قیمت دستی نباشد
        if self.treatment_detail and not self.id and not self.is_manual_price:
            self.general_fee = self.treatment_detail.public_tariff
            self.special_fee = self.treatment_detail.special_tariff

    # تنظیم خودکار treatment_type_id اگر خالی باشد
        if self.treatment_detail and not self.treatment_type_id:
            self.treatment_type_id = self.treatment_detail.treatment_type_id

    # تبدیل مقادیر به Decimal با اطمینان از داشتن فرمت صحیح
        try:
        # تابع کمکی برای تبدیل ایمن به Decimal
            def ensure_decimal_format(value):
                if not isinstance(value, Decimal):
                # تبدیل به رشته و اطمینان از داشتن نقطه اعشار
                    value_str = str(value)
                    if '.' not in value_str:
                        value_str += '.0'
                    return Decimal(value_str)
                return value
        
            self.general_fee = ensure_decimal_format(self.general_fee)
            self.special_fee = ensure_decimal_format(self.special_fee)
            self.discount = ensure_decimal_format(self.discount)
            self.material_cost = ensure_decimal_format(self.material_cost)
            self.lab_cost = ensure_decimal_format(self.lab_cost)
        except (ValueError, decimal.InvalidOperation) as e:
            print(f"Error converting values to Decimal: {e}")
        # در صورت خطا، مقادیر پیش‌فرض را تنظیم کنید
            self.general_fee = Decimal('0.0')
            self.special_fee = Decimal('0.0')
            self.discount = Decimal('0.0')
            self.material_cost = Decimal('0.0')
            self.lab_cost = Decimal('0.0')

    # محاسبه مبلغ قابل پرداخت بر اساس تعرفه عمومی
        base_amount = self.general_fee
        amount_after_discount = base_amount - self.discount
        insurance_amount = Decimal('0.0')
        if self.insurance_provider and self.insurance_percentage > 0:
            insurance_amount = (amount_after_discount * self.insurance_percentage) / 100
        self.payable_amount = max(Decimal('0.0'), amount_after_discount - insurance_amount + self.material_cost + self.lab_cost)

        super().save(*args, **kwargs)
        if self.insurance_provider and self.insurance_percentage > 0:
            try:
            # پیدا کردن بیمه فعال بیمار
                patient_insurance = PatientInsurance.objects.filter(
                    patient=self.patient,
                    insurance_provider=self.insurance_provider,
                    is_active=True
                ).first()
            
                if patient_insurance:
                    # محاسبه مبلغ بیمه
                    insurance_amount = (amount_after_discount * self.insurance_percentage) / 100
                
                # بررسی سقف بیمه
                    if patient_insurance.coverage_ceiling is not None:
                        remaining_coverage = patient_insurance.coverage_ceiling - patient_insurance.used_coverage
                    
                    # اگر مبلغ بیمه از سقف باقیمانده بیشتر است، مقدار استفاده شده را به اندازه باقیمانده افزایش می‌دهیم
                        if insurance_amount > remaining_coverage:
                            insurance_amount = remaining_coverage
                
                # بروزرسانی مقدار استفاده شده
                # اگر این یک رکورد جدید است، مقدار استفاده شده را افزایش می‌دهیم
                    if not kwargs.get('update_fields'):  # اگر update_fields مشخص نشده، یعنی این یک ایجاد جدید است
                        patient_insurance.used_coverage += insurance_amount
                        patient_insurance.save(update_fields=['used_coverage'])
                        print(f"Updated insurance used_coverage for patient {self.patient_id}, insurance {self.insurance_provider_id}: +{insurance_amount}")
        
            except Exception as e:
                import traceback
                print(f"Error updating insurance used_coverage: {str(e)}")
                print(traceback.format_exc())

    def __str__(self):
        return f"{self.treatment} - {self.amount} - {self.payment_date}"

class InstallmentPlan(models.Model):
    """مدل طرح اقساط"""
    treatment = models.OneToOneField(Treatment, on_delete=models.CASCADE, related_name='installment_plan', verbose_name="درمان")
    total_amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ کل")
    down_payment = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="پیش پرداخت")
    installment_count = models.PositiveIntegerField(verbose_name="تعداد اقساط")
    installment_amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ هر قسط")
    start_date = models.DateField(verbose_name="تاریخ شروع اقساط")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    
    class Meta:
        verbose_name = "طرح اقساط"
        verbose_name_plural = "طرح‌های اقساط"
    
    def __str__(self):
        return f"{self.treatment} - {self.installment_count} قسط"
    
    def calculate_installment_amount(self):
        """محاسبه مبلغ هر قسط"""
        remaining = self.total_amount - self.down_payment
        return remaining / self.installment_count if self.installment_count > 0 else 0

class Installment(models.Model):
    """مدل قسط"""
    plan = models.ForeignKey(InstallmentPlan, on_delete=models.CASCADE, related_name='installments', verbose_name="طرح اقساط")
    amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ")
    due_date = models.DateField(verbose_name="تاریخ سررسید")
    is_paid = models.BooleanField(default=False, verbose_name="پرداخت شده")
    payment_date = models.DateField(null=True, blank=True, verbose_name="تاریخ پرداخت")
    is_reminder_seen = models.BooleanField(default=False, verbose_name="یادآوری دیده شده؟")
    
    class Meta:
        verbose_name = "قسط"
        verbose_name_plural = "اقساط"
        ordering = ['due_date']
    
    def __str__(self):
        status = "پرداخت شده" if self.is_paid else "پرداخت نشده"
        return f"{self.plan.treatment} - قسط {self.amount} - {self.due_date} - {status}"
    
    
    
class TreatmentPayment(models.Model):
    """مدل پرداخت درمان"""
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'نقدی'),
        ('card', 'کارت به کارت'),
        ('pos', 'کارتخوان'),
        ('wallet', 'کیف پول'),
        ('down_payment', 'پیش پرداخت'), 
        ('installment', 'قسطی'),
        ('check', 'چک'),    
    ]
    
    PAYMENT_STATUS_CHOICES = [
        ('paid', 'پرداخت شده'),
        ('refunded', 'عودت داده شده'),
        ('pending', 'در انتظار'),
        ('pending', 'در انتظار وصول'),
    ]
    
    treatment = models.ForeignKey(Treatment, on_delete=models.CASCADE, related_name='payments', verbose_name="درمان")
    amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ")
    payment_date = models.DateField(verbose_name="تاریخ پرداخت")
    payment_method = models.CharField(max_length=50, choices=PAYMENT_METHOD_CHOICES, default='cash', verbose_name="روش پرداخت")
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='paid', verbose_name="وضعیت پرداخت")
    refund_date = models.DateField(null=True, blank=True, verbose_name="تاریخ عودت")
    refund_reason = models.TextField(blank=True, null=True, verbose_name="دلیل عودت")
    
    # اطلاعات چک
    check_number = models.CharField(max_length=50, null=True, blank=True, verbose_name="شماره چک")
    check_date = models.DateField(null=True, blank=True, verbose_name="تاریخ چک")
    check_bank = models.CharField(max_length=100, null=True, blank=True, verbose_name="بانک چک")
    
    description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    check_number = models.CharField(max_length=50, blank=True, null=True, verbose_name="شماره چک/صیادی")
    check_issuer = models.CharField(max_length=100, blank=True, null=True, verbose_name="صادر کننده چک")
    check_bank = models.CharField(max_length=50, blank=True, null=True, verbose_name="نام بانک")
    check_issue_date = models.DateField(blank=True, null=True, verbose_name="تاریخ صدور چک")
    check_due_date = models.DateField(blank=True, null=True, verbose_name="تاریخ سررسید چک")
    is_reminder_seen = models.BooleanField(default=False, verbose_name="یادآوری دیده شده؟")
    
    
    class Meta:
        verbose_name = "پرداخت درمان"
        verbose_name_plural = "پرداخت‌های درمان"
        ordering = ['-payment_date']
    
    def __str__(self):
        status_text = dict(self.PAYMENT_STATUS_CHOICES).get(self.payment_status, '')
        return f"{self.treatment} - {self.amount} - {self.payment_date} - {status_text}"
    
    @property
    def is_refunded(self):
        return self.payment_status == 'refunded'




class Wallet(models.Model):
    """مدل کیف پول بیمار"""
    patient = models.OneToOneField(PatientRecord, on_delete=models.CASCADE, related_name='wallet', verbose_name="بیمار")
    balance = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="موجودی")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "کیف پول"
        verbose_name_plural = "کیف پول‌ها"

    def __str__(self):
        return f"کیف پول {self.patient.get_full_name()} - موجودی: {self.balance}"

    def update_balance(self):
        """موجودی کیف پول را بر اساس تراکنش‌ها بروزرسانی می‌کند"""
        total_transactions = self.transactions.aggregate(total=Sum('amount'))['total'] or 0
        self.balance = total_transactions
        self.save()

class WalletTransaction(models.Model):
    """مدل تراکنش‌های کیف پول"""
    TRANSACTION_TYPES = [
        ('DEPOSIT', 'واریز'),
        ('PAYMENT', 'پرداخت درمان'),
        ('REFUND', 'عودت وجه'),
        ('TRANSFER_OUT', 'انتقال به غیر'),
        ('TRANSFER_IN', 'دریافت از غیر'),
        ('REFUND', 'عودت وجه'),
    ]

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name='transactions', verbose_name="کیف پول")
    amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ") # مثبت برای واریز، منفی برای برداشت
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, verbose_name="نوع تراکنش")
    description = models.TextField(verbose_name="توضیحات")
    related_treatment = models.ForeignKey(Treatment, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="درمان مرتبط")
    created_by = models.ForeignKey('users.CustomUser', on_delete=models.SET_NULL, null=True, verbose_name="ثبت کننده")
    timestamp = models.DateTimeField(auto_now_add=True)
    related_payment = models.ForeignKey(TreatmentPayment,on_delete=models.SET_NULL,null=True,blank=True,related_name='refund_transaction',verbose_name="پرداخت عودت داده شده")

    class Meta:
        verbose_name = "تراکنش کیف پول"
        verbose_name_plural = "تراکنش‌های کیف پول"
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.get_transaction_type_display()} - {self.amount} - {self.wallet.patient.get_full_name()}"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # بعد از هر ذخیره، موجودی کیف پول را بروزرسانی کن
        self.wallet.update_balance()
