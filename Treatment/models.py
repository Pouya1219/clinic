# from django.db import models
# from Patient.models import PatientRecord, InsuranceProvider, TreatmentType, TreatmentDetail
# from users.models import CustomUser
# from django.utils import timezone

# class Treatment(models.Model):
#     """مدل اصلی درمان"""
#     patient = models.ForeignKey(PatientRecord, on_delete=models.CASCADE, related_name='treatments', verbose_name="بیمار")
#     treatment_date = models.DateField(verbose_name="تاریخ درمان")
#     next_visit_date = models.DateField(null=True, blank=True, verbose_name="تاریخ مراجعه بعدی")
    
#     # نوع درمان و شرح (ارتباط با مدل‌های موجود)
#     treatment_type = models.ForeignKey(TreatmentType, on_delete=models.PROTECT, related_name='treatments', verbose_name="نوع درمان")
#     treatment_detail = models.ForeignKey(TreatmentDetail, on_delete=models.PROTECT, related_name='treatments', verbose_name="شرح درمان")
    
#     # دندان‌ها یا نواحی درمان
#     treatment_areas = models.CharField(max_length=200, verbose_name="نواحی درمان")
#     area_type = models.CharField(max_length=50, default="teeth", verbose_name="نوع ناحیه")  # teeth, face, body
    
#     # پزشک و دستیار
#     doctor = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='treatments_as_doctor', verbose_name="پزشک معالج")
#     assistant = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='treatments_as_assistant', verbose_name="دستیار پزشک")
    
#     # هزینه‌ها (از مدل TreatmentDetail خوانده می‌شود)
#     general_fee = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="تعرفه عمومی")
#     special_fee = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="تعرفه تخصصی")
#     discount = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="تخفیف")
#     material_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="هزینه مواد")
#     lab_cost = models.DecimalField(max_digits=12, decimal_places=0, default=0, verbose_name="هزینه لابراتوار")
#     payable_amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ قابل پرداخت")
    
#     # بیمه
#     insurance_provider = models.ForeignKey(InsuranceProvider, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="بیمه‌گر")
#     insurance_percentage = models.PositiveIntegerField(default=0, verbose_name="درصد بیمه")
#     insurance_sent = models.BooleanField(default=False, verbose_name="ارسال شده به بیمه")
#     insurance_paid = models.BooleanField(default=False, verbose_name="از بیمه مبلغ دریافت شده")
    
#     # وضعیت
#     is_completed = models.BooleanField(default=False, verbose_name="درمان انجام شده")
#     is_treatment_plan = models.BooleanField(default=False, verbose_name="طرح درمان")
    
#     # اطلاعات سیستمی
#     created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
#     updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    
#     class Meta:
#         verbose_name = "درمان"
#         verbose_name_plural = "درمان‌ها"
#         ordering = ['-treatment_date']
    
#     def __str__(self):
#         return f"{self.patient} - {self.treatment_detail.description} - {self.treatment_date}"
    
#     def calculate_payable_amount(self):
#         """محاسبه مبلغ قابل پرداخت"""
#         # استفاده از تعرفه تخصصی
#         base_amount = self.special_fee
        
#         # کسر تخفیف
#         amount_after_discount = base_amount - self.discount
        
#         # کسر سهم بیمه
#         insurance_amount = 0
#         if self.insurance_provider and self.insurance_percentage > 0:
#             insurance_amount = (amount_after_discount * self.insurance_percentage) / 100
        
#         # اضافه کردن هزینه‌های مواد و لابراتوار
#         final_amount = amount_after_discount - insurance_amount + self.material_cost + self.lab_cost
        
#         return max(0, final_amount)  # مبلغ نباید منفی باشد
    
#     def save(self, *args, **kwargs):
#         # تنظیم خودکار تعرفه‌ها از مدل TreatmentDetail
#         if self.treatment_detail and not self.id:  # فقط برای رکوردهای جدید
#             self.general_fee = self.treatment_detail.public_tariff
#             self.special_fee = self.treatment_detail.special_tariff
        
#         # محاسبه مبلغ قابل پرداخت
#         self.payable_amount = self.calculate_payable_amount()
        
#         super().save(*args, **kwargs)

# class TreatmentPayment(models.Model):
#     """مدل پرداخت درمان"""
#     treatment = models.ForeignKey(Treatment, on_delete=models.CASCADE, related_name='payments', verbose_name="درمان")
#     amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ")
#     payment_date = models.DateField(verbose_name="تاریخ پرداخت")
#     payment_method = models.CharField(max_length=50, verbose_name="روش پرداخت")  # نقدی، کارت، چک
    
#     # اطلاعات چک
#     check_number = models.CharField(max_length=50, null=True, blank=True, verbose_name="شماره چک")
#     check_date = models.DateField(null=True, blank=True, verbose_name="تاریخ چک")
#     check_bank = models.CharField(max_length=100, null=True, blank=True, verbose_name="بانک چک")
    
#     description = models.TextField(blank=True, null=True, verbose_name="توضیحات")
    
#     class Meta:
#         verbose_name = "پرداخت درمان"
#         verbose_name_plural = "پرداخت‌های درمان"
#         ordering = ['-payment_date']
    
#     def __str__(self):
#         return f"{self.treatment} - {self.amount} - {self.payment_date}"

# class InstallmentPlan(models.Model):
#     """مدل طرح اقساط"""
#     treatment = models.OneToOneField(Treatment, on_delete=models.CASCADE, related_name='installment_plan', verbose_name="درمان")
#     total_amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ کل")
#     down_payment = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="پیش پرداخت")
#     installment_count = models.PositiveIntegerField(verbose_name="تعداد اقساط")
#     installment_amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ هر قسط")
#     start_date = models.DateField(verbose_name="تاریخ شروع اقساط")
    
#     created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
#     updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ بروزرسانی")
    
#     class Meta:
#         verbose_name = "طرح اقساط"
#         verbose_name_plural = "طرح‌های اقساط"
    
#     def __str__(self):
#         return f"{self.treatment} - {self.installment_count} قسط"
    
#     def calculate_installment_amount(self):
#         """محاسبه مبلغ هر قسط"""
#         remaining = self.total_amount - self.down_payment
#         return remaining / self.installment_count if self.installment_count > 0 else 0

# class Installment(models.Model):
#     """مدل قسط"""
#     plan = models.ForeignKey(InstallmentPlan, on_delete=models.CASCADE, related_name='installments', verbose_name="طرح اقساط")
#     amount = models.DecimalField(max_digits=12, decimal_places=0, verbose_name="مبلغ")
#     due_date = models.DateField(verbose_name="تاریخ سررسید")
#     is_paid = models.BooleanField(default=False, verbose_name="پرداخت شده")
#     payment_date = models.DateField(null=True, blank=True, verbose_name="تاریخ پرداخت")
    
#     class Meta:
#         verbose_name = "قسط"
#         verbose_name_plural = "اقساط"
#         ordering = ['due_date']
    
#     def __str__(self):
#         status = "پرداخت شده" if self.is_paid else "پرداخت نشده"
#         return f"{self.plan.treatment} - قسط {self.amount} - {self.due_date} - {status}"
