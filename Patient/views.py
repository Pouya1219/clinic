from datetime import time, timedelta, timezone
import time 
import datetime
import json
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from .models import PatientRecord
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
import jdatetime
from django.db import transaction
from django.http import JsonResponse
from .models import PatientRecord, MedicalHistory, DentalProcedure,PatientCard
from django.db.models import Sum
from django.template.loader import render_to_string
from django.utils import timezone  # این درسته
from django.db.models import Sum
from datetime import date  # برای محاسبه سن
from django.shortcuts import render, get_object_or_404, redirect
from django.template.loader import render_to_string
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
import django_filters
from .models import PreviousTreatment,PatientRecord ,PatientInsurance ,InsuranceProvider,InsuranceType , TreatmentDetail,TreatmentType ,DiscountType ,Wallet
from django.urls import reverse
from appointments.models import Appointment
from django.http import JsonResponse
from django.core.serializers import serialize
import xlsxwriter  # برای اکسل
import pdfkit  # برای PDF
import os
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.db import transaction
import json
from django.utils import timezone
from django.contrib.auth.decorators import login_required
import json
from decimal import Decimal
from django.db import transaction
from django.http import JsonResponse, HttpResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_http_methods
from django.template.loader import render_to_string
from .models import PatientRecord, Wallet, WalletTransaction, Treatment, TreatmentPayment, InstallmentPlan, Installment
from django.db.models import Sum, F, Q, Value, DecimalField
from django.db.models.functions import Coalesce
from django.db.models.expressions import ExpressionWrapper
from settings.models import ClinicSetting
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from users.models import CustomUser , Profile , Role
from django.core.paginator import Paginator, EmptyPage, PageNotAnInteger


# یک تابع کمکی برای تبدیل تاریخ در بالای فایل ویو خود بسازید
def convert_persian_date_str_to_gregorian(persian_date_str):
    if not persian_date_str:
        return None
    try:
        year, month, day = map(int, persian_date_str.split('/'))
        return jdatetime.date(year, month, day).togregorian()
    except (ValueError, TypeError):
        return None

from .models import (
    PatientRecord, InsuranceProvider, TreatmentType, TreatmentDetail,
    Treatment, TreatmentPayment, InstallmentPlan, Installment
)



@require_http_methods(["GET"])
def get_discount_types(request):
    """دریافت لیست انواع تخفیف"""
    try:
        discount_types = DiscountType.objects.filter(is_active=True)
        data = [{
            'id': dt.id,
            'name': dt.name,
            'doctor_percentage': dt.doctor_percentage,
            'clinic_percentage': dt.clinic_percentage
        } for dt in discount_types]
        
        return JsonResponse({
            'success': True,
            'discount_types': data
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطا در دریافت انواع تخفیف: {str(e)}'
        }, status=400)


@login_required
def create_patient(request):
    if request.method == 'POST':
        try:
            with transaction.atomic():
                # تابع تبدیل تاریخ جلالی به میلادی
                def convert_to_miladi(shamsi_date):
                    if not shamsi_date:
                        return None
                    try:
                        year, month, day = map(int, shamsi_date.split('/'))
                        jalali_date = jdatetime.date(year, month, day)
                        return jalali_date.togregorian()
                    except ValueError:
                        raise ValueError("فرمت تاریخ نامعتبر است")

                # تبدیل تاریخ‌ها
                birth_date = convert_to_miladi(request.POST.get('birthday'))
                insurance_expiry = convert_to_miladi(request.POST.get('insurance_expiry_date'))

                # بررسی فیلدهای اجباری
                required_fields = {
                    'file_num': 'شماره پرونده',
                    'name': 'نام',
                    'family': 'نام خانوادگی',
                    #'contact_info': 'تلفن تماس'
                }
                
                missing_fields = [
                    field_name for field_key, field_name in required_fields.items()
                    if not request.POST.get(field_key)
                ]
                
                if missing_fields:
                    raise ValueError(f'فیلدهای {", ".join(missing_fields)} الزامی هستند')
                
                # تبدیل و اعتبارسنجی مقادیر عددی
                def clean_number(value, field_name):
                    if value and str(value).strip():
                        try:
                            return int(str(value).strip())
                        except ValueError:
                            return None
                    return None
                # تبدیل و اعتبارسنجی قد و وزن
                height = request.POST.get('height', '').strip()
                weight = request.POST.get('weight', '').strip()
                height = int(height) if height.isdigit() else None
                weight = int(weight) if weight.isdigit() else None
                pregnancy_month = clean_number(request.POST.get('pregnancy_month'), 'ماه بارداری')
                # بررسی ماه بارداری فقط اگر بیمار خانم باردار است
                is_pregnant = request.POST.get('is_pregnant') == 'on'
                if is_pregnant and pregnancy_month is not None:
                    if not (1 <= pregnancy_month <= 9):
                        raise ValueError('ماه بارداری باید بین 1 تا 9 باشد')
                else:
                    pregnancy_month = None
                # ایجاد رکورد بیمار
                patient = PatientRecord(
                    # اطلاعات اصلی
                    file_num=request.POST.get('file_num'),
                    name=request.POST.get('name'),
                    family=request.POST.get('family'),
                    national_code=request.POST.get('national_code'),
                    name_of_father=request.POST.get('name_of_father'),
                    
                    # اطلاعات تماس
                    contant_info=request.POST.get('contant_info'),
                    emergency_contact=request.POST.get('emergency_contact'),
                    family_number=request.POST.get('family_number'),
                    address=request.POST.get('address'),
                    email=request.POST.get('email'),
                    
                    
                    # اطلاعات شخصی
                    birthday=birth_date,
                    sex=request.POST.get('sex') == 'male',
                    marital_status=request.POST.get('marital_status'),
                    occupation=request.POST.get('occupation'),
                    blood_type=request.POST.get('blood_type'),
                    height=height,
                    weight=weight,
                    
                    # اطلاعات پزشکی
                    medications_info=request.POST.get('medications_info'),
                    allergy=request.POST.get('allergy'),
                    medicine_use=request.POST.get('medicine_use'),
                    afraid_of_dental=request.POST.get('afraid_of_dental'),
                    addiction_to_alcohol=request.POST.get('addiction_to_alcohol') == 'yes',
                    
                    # بیماری‌های خاص
                    has_heart_disease=request.POST.get('has_heart_disease') == 'on',
                    has_diabetes=request.POST.get('has_diabetes') == 'on',
                    has_blood_pressure=request.POST.get('has_blood_pressure') == 'on',
                    has_hepatitis=request.POST.get('has_hepatitis') == 'on',
                    is_pregnant=is_pregnant,
                    pregnancy_month=pregnancy_month,
                    
                    # اطلاعات بیمه
                    insurance=request.POST.get('insurance'),
                    insurance_type=request.POST.get('insurance_type'),
                    insurance_number=request.POST.get('insurance_number'),
                    insurance_expiry_date=insurance_expiry,
                    
                    # اطلاعات مراجعه
                    category=request.POST.get('category'),
                    color=request.POST.get('color'),
                    status=request.POST.get('status'),
                    introducer=request.POST.get('introducer'),
                    description=request.POST.get('description'),
                    
                    # ثبت کننده
                    registered_by=request.user
                )

                # آپلود تصویر پروفایل
                if 'profile_picture' in request.FILES:
                    patient.profile_picture = request.FILES['profile_picture']
                print("About to save patient:", patient.__dict__)  # چاپ داده‌های بیمار قبل از ذخیره
                patient.save()
                print("Patient saved successfully")  # چاپ پیام موفقیت
                
                messages.success(request, 'پرونده بیمار با موفقیت ایجاد شد.')
                return redirect('Patient:list')  # یا هر مسیر دیگری که می‌خواهید

        except ValueError as e:
            print(f"ValueError: {e}")  # چاپ خطای اعتبارسنجی
            messages.error(request, str(e))
        except Exception as e:
            print(f"Unexpected error: {e}")  # چاپ خطای غیرمنتظره
            messages.error(request, f'خطا در ثبت اطلاعات: {str(e)}')

    # در حالت GET، فرم خالی نمایش داده می‌شود
    context = {
        'today_shamsi': jdatetime.date.today().strftime('%Y/%m/%d'),
    }
    return render(request, 'patients/create_patient.html', context)

@login_required
def edit_patient(request, id):
    patient = get_object_or_404(PatientRecord, id=id)
    
    if request.method == 'POST':
        # کد مشابه create با تغییر patient.save() به patient.update()
        pass
    
    # تبدیل تاریخ‌ها به جلالی برای نمایش
    context = {
        'patient': patient,
        'birth_date_shamsi': jdatetime.date.fromgregorian(date=patient.birthday).strftime('%Y/%m/%d') if patient.birthday else '',
        'insurance_expiry_shamsi': jdatetime.date.fromgregorian(date=patient.insurance_expiry_date).strftime('%Y/%m/%d') if patient.insurance_expiry_date else '',
    }
    return render(request, 'patients/edit_patient.html', context)



@login_required
def patient_list(request):
    # دریافت پارامترهای جستجو و فیلتر
    #patient_filter = PatientFilter(request.GET, queryset=PatientRecord.objects.all())
    #filtered_patients = patient_filter.qs
    search_query = request.GET.get('search', '')
    
    page_size = request.GET.get('page_size', 10)
    page = request.GET.get('page', 1)
    if search_query:
        filtered_patients = PatientRecord.objects.filter(
            Q(name__icontains=search_query) |
            Q(family__icontains=search_query) |
            Q(file_num__icontains=search_query) |
            Q(national_code__icontains=search_query) |
            Q(contant_info__icontains=search_query)
        ).order_by('-create_date')[:10] # حداکثر 10 نتیجه
    else:
        filtered_patients = PatientRecord.objects.all().order_by('-create_date')

    # پایه کوئری
    records = PatientRecord.objects.all().order_by('-create_date')
    paginator = Paginator(filtered_patients, page_size)
    # آمارها
    total_records = PatientRecord.objects.count()
    inactive_patients = PatientRecord.objects.filter(status='inactive').count()
    # می‌توانید آمارهای دیگر را هم اضافه کنید
    
    # صفحه‌بندی
    paginator = Paginator(records, page_size)
    try:
        records_page = paginator.page(page)
    except PageNotAnInteger:
        records_page = paginator.page(1)
    except EmptyPage:
        records_page = paginator.page(paginator.num_pages)
    context = {
        'search_url': reverse('sr_search_dashboard'),
        'records': records_page,
        'total_records': total_records,
        'inactive_patients': inactive_patients,
        'page_size': page_size,
        # اضافه کردن متغیرهای مورد نیاز برای صفحه‌بندی
        'page_range': paginator.page_range,
        'total_pages': paginator.num_pages,
        'current_page': records_page.number,
        'has_previous': records_page.has_previous(),
        'has_next': records_page.has_next(),
        'previous_page': records_page.previous_page_number() if records_page.has_previous() else None,
        'next_page': records_page.next_page_number() if records_page.has_next() else None,
        'search_query': search_query, # برای نمایش مقدار جستجو در input
        #'filter': patient_filter,  # ارسال فیلتر به تمپلیت
    }
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        
        html = render_to_string('Patient/partials/_patient_table.html', context, request=request)
        return JsonResponse({'html': html})
    return render(request, 'patients/patient_list.html', context)



@csrf_exempt
@login_required
def search_patients(request):
    if request.method == 'POST':
        search_query = request.POST.get('search', '')
        patients = PatientRecord.objects.filter(
            Q(name__icontains=search_query) |
            Q(family__icontains=search_query) |
            Q(file_num__icontains=search_query) |
            Q(national_code__icontains=search_query) |
            Q(contant_info__icontains=search_query)
        )
        context = {'patients': patients}
        html = render_to_string('Patient/partials/_patient_search_results.html', context, request=request)
        return JsonResponse({'html': html})
    return JsonResponse({'html': ''})  # در صورت GET، رشته خالی برگردان



class PatientFilter(django_filters.FilterSet):
    name = django_filters.CharFilter(lookup_expr='icontains', label='نام')
    family = django_filters.CharFilter(lookup_expr='icontains', label='نام خانوادگی')
    # سایر فیلدهایی که می‌خواهید فیلتر کنید

    class Meta:
        model = PatientRecord
        fields = ['name', 'family', 'file_num', 'national_code', 'contant_info'] # یا هر فیلد دیگری

# Patient/views.py

@login_required
def patient_detail(request, id):
    patient = get_object_or_404(PatientRecord, id=id)
    
    # --- بخش ۱: داده‌های مالی و کیف پول (با روش بهینه Annotation) ---
    wallet, _  = Wallet.objects.get_or_create(patient=patient)
     # ۱. کل هزینه درمان‌های انجام شده (قسطی یا غیرقسطی)
    total_treatment_cost = patient.treatments.filter(is_treatment_plan=False).aggregate(
    total=Coalesce(Sum('payable_amount'), Value(0), output_field=DecimalField()))['total']
    total_installments_amount = InstallmentPlan.objects.filter(treatment__patient=patient).aggregate(total=Coalesce(Sum('total_amount'), Value(0), output_field=DecimalField()))['total']
    # ۲. کل مبلغ پرداخت شده توسط بیمار (از همه روش‌ها)
    total_paid_amount = TreatmentPayment.objects.filter(treatment__patient=patient,payment_status='paid').aggregate(
    total=Coalesce(Sum('amount'), Value(0), output_field=DecimalField()))['total']
    
    # ۳. محاسبه وضعیت نهایی (بدهی یا بستانکاری)
    patient_balance = total_paid_amount - total_treatment_cost
    
    total_debt = abs(patient_balance) if patient_balance < 0 else 0
    total_credit = patient_balance if patient_balance > 0 else 0
    
    open_treatments_qs = patient.treatments.filter(
    is_treatment_plan=False,
    has_installment_plan=False
    ).select_related('treatment_detail', 'doctor').annotate(
    paid_amount=Coalesce(
        Sum('payments__amount', filter=Q(payments__payment_status='paid')),
        Value(0),
        output_field=DecimalField()
    ),
    # [اصلاح شده] استفاده از ExpressionWrapper برای مشخص کردن نوع خروجی محاسبه
    remaining_amount=ExpressionWrapper(
        F('payable_amount') - F('paid_amount'),
        output_field=DecimalField())).filter(remaining_amount__gt=0)

    open_treatments_list = []
    for t in open_treatments_qs:
        open_treatments_list.append({
            'id': t.id,
            'description': t.treatment_detail.description,
            'date': t.treatment_date,
            'doctor_name': t.doctor.get_full_name() if t.doctor else '-',
            'payable_amount': t.payable_amount,
            'paid_amount': t.paid_amount,
            'remaining_amount': t.remaining_amount,
        })

    # تاریخچه تمام تراکنش‌ها
    transaction_history = []
    direct_payments = TreatmentPayment.objects.filter(treatment__patient=patient).select_related('treatment__treatment_detail', 'treatment__doctor').order_by('-payment_date')
    for payment in direct_payments:
        transaction_history.append({
            'id': payment.id,
            'type': payment.get_payment_method_display(),
            'date': payment.payment_date,
            'description': f"پرداخت برای: {payment.treatment.treatment_detail.description}",
            'amount': -payment.amount,
            'status': payment.payment_status,
            'status_display': payment.get_payment_status_display(),
            'doctor_name': payment.treatment.doctor.get_full_name() if payment.treatment.doctor else '-',
        })
    
    wallet_transactions = wallet.transactions.all().order_by('-timestamp')
    for tx in wallet_transactions:
        transaction_history.append({
            'type': 'کیف پول',
            'date': tx.timestamp.date(),
            'description': tx.description,
            'doctor_name': '-',
            'amount': tx.amount,
            'status': tx.get_transaction_type_display(),
        })
    
    transaction_history.sort(key=lambda x: x['date'], reverse=True)

    # --- بخش ۲: تمام داده‌های دیگر که شما نیاز داشتید ---
    # (این بخش بدون تغییر باقی می‌ماند)
    previous_treatments = PreviousTreatment.objects.filter(patient=patient).order_by('-visit_date')
    discount_types = DiscountType.objects.filter(is_active=True)
    doctors = Profile.objects.filter(role__name="پزشک")
    assistants = Profile.objects.filter(role__name="دستیار")
    #insurance_providers = InsuranceProvider.objects.filter(is_active=True)
    patient_active_insurances = PatientInsurance.objects.filter(patient=patient, is_active=True)
    treatment_types = TreatmentType.objects.prefetch_related('details').all()
    today = timezone.now().date()
    active_insurances_count = PatientInsurance.objects.filter(patient=patient, is_active=True).count()
    inactive_insurances_count = PatientInsurance.objects.filter(patient=patient, is_active=False).count()
    thirty_days_later = timezone.now().date() + timezone.timedelta(days=30)
    expiring_soon_count = PatientInsurance.objects.filter(
        patient=patient, 
        is_active=True,
        expiry_date__lte=thirty_days_later,
        expiry_date__gt=timezone.now().date()
    ).count()
    medical_history = MedicalHistory.objects.filter(patient=patient).order_by('-diagnosis_date')
    dental_procedures = DentalProcedure.objects.filter(patient=patient).order_by('-procedure_date')
    total_cost = dental_procedures.aggregate(total=Sum('cost'))['total'] or 0
    
    try:
        upcoming_appointments = Appointment.objects.filter(
            file_number=patient.file_num,
            date__gt=timezone.now().date()
        ).order_by('date')[:5]
    except ImportError:
        upcoming_appointments = []
        
    unpaid_installments = Installment.objects.filter(plan__treatment__patient=patient,is_paid=False).order_by('due_date')
    all_installment_plans = InstallmentPlan.objects.filter(treatment__patient=patient).order_by('-start_date')
    context = {
        'patient': patient,
        'age': patient.get_age(),
        'bmi': patient.get_bmi(),
        'insurance_active': patient.get_insurance_status(),
        'last_update': timezone.now(),
        'today': today,
        
        'previous_treatments': previous_treatments,
        'insurances': PatientInsurance.objects.filter(patient=patient),
        'medical_history': medical_history,
        'dental_procedures': dental_procedures,
        'total_cost': total_cost,
        'upcoming_appointments': upcoming_appointments,
        'active_insurances_count': active_insurances_count,
        'inactive_insurances_count': inactive_insurances_count,
        'expiring_soon_count': expiring_soon_count,

        'patient_active_insurances': patient_active_insurances,
        #'insurance_providers': insurance_providers,
        'treatment_types': treatment_types,
        'doctors': doctors,
        'assistants': assistants,
        'discount_types': discount_types,
        
        'wallet': wallet,
        'total_treatment_cost': total_treatment_cost,
        'total_paid_amount': total_paid_amount,
        'total_debt': total_debt,
        'total_credit': total_credit,
        
        'open_treatments': open_treatments_list,
        'transaction_history': transaction_history,
        'unpaid_installments': unpaid_installments,
        'all_installment_plans': all_installment_plans,
        'total_installments_amount': total_installments_amount,
        'patient_balance': patient_balance,
    }
    
    return render(request, 'patients/patient_detail.html', context)





@login_required
def edit_patient(request, id):
    patient = get_object_or_404(PatientRecord, id=id)
    
    if request.method == 'POST':
        try:
            # پردازش تصویر پروفایل
            if 'profile_picture' in request.FILES:
                patient.profile_picture = request.FILES['profile_picture']
            elif request.POST.get('remove_profile_picture'):
                # اگر کاربر خواست تصویر را حذف کند
                patient.profile_picture = 'default.jpg'  # یا هر تصویر پیش‌فرض دیگری
                
            # تابع تبدیل تاریخ شمسی به میلادی
            def convert_to_miladi(shamsi_date):
                if not shamsi_date:
                    return None
                try:
                    year, month, day = map(int, shamsi_date.split('/'))
                    jalali_date = jdatetime.date(year, month, day)
                    return jalali_date.togregorian()
                except (ValueError, TypeError):
                    return None

            # دریافت و تبدیل تاریخ تولد
            birth_date = convert_to_miladi(request.POST.get('birthday'))

            # بروزرسانی اطلاعات اصلی
            patient.name = request.POST.get('name')
            patient.family = request.POST.get('family')
            patient.national_code = request.POST.get('national_code')
            patient.name_of_father = request.POST.get('name_of_father')
            patient.birthday = birth_date
            patient.sex = request.POST.get('sex') == 'true'

            # اطلاعات تماس
            patient.contant_info = request.POST.get('contant_info')
            patient.emergency_contact = request.POST.get('emergency_contact')
            patient.family_number = request.POST.get('family_number')
            patient.address = request.POST.get('address')

            # اطلاعات شخصی
            patient.marital_status = request.POST.get('marital_status')
            patient.occupation = request.POST.get('occupation')
            patient.blood_type = request.POST.get('blood_type')
            
            # اطلاعات فیزیکی
            height = request.POST.get('height')
            weight = request.POST.get('weight')
            patient.height = int(height) if height and height.isdigit() else None
            patient.weight = int(weight) if weight and weight.isdigit() else None

            # اطلاعات بیمه
            patient.insurance_type = request.POST.get('insurance_type')
            patient.insurance_number = request.POST.get('insurance_number')
            patient.introducer = request.POST.get('introducer')

            # اطلاعات پزشکی
            patient.afraid_of_dental = request.POST.get('afraid_of_dental')
            patient.addiction_to_alcohol = request.POST.get('addiction_to_alcohol') == 'true'
            patient.medications_info = request.POST.get('medications_info')
            patient.allergy = request.POST.get('allergy')
            patient.medicine_use = request.POST.get('medicine_use')

            # بیماری‌های خاص
            patient.has_heart_disease = request.POST.get('has_heart_disease') == 'on'
            patient.has_diabetes = request.POST.get('has_diabetes') == 'on'
            patient.has_blood_pressure = request.POST.get('has_blood_pressure') == 'on'
            patient.has_hepatitis = request.POST.get('has_hepatitis') == 'on'

            # اطلاعات سیستمی
            patient.updated_at = timezone.now()
            patient.updated_by = request.user

            patient.save()
            
            # برای درخواست‌های AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'اطلاعات بیمار با موفقیت بروزرسانی شد.'
                })
                
            messages.success(request, 'اطلاعات بیمار با موفقیت بروزرسانی شد.')
            return redirect('Patient:patient_detail', id=patient.id)
            
        except Exception as e:
            print(f"Error saving patient: {e}")  # چاپ خطای دقیق
            
            # برای درخواست‌های AJAX
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'error': str(e)
                }, status=400)
                
            messages.error(request, f'خطا در بروزرسانی اطلاعات: {str(e)}')

    # تبدیل تاریخ‌ها به شمسی برای نمایش
    birth_date_shamsi = None
    if patient.birthday:
        birth_date_shamsi = jdatetime.date.fromgregorian(date=patient.birthday).strftime('%Y/%m/%d')

    context = {
        'patient': patient,
        'birth_date_shamsi': birth_date_shamsi,
    }
    
    # برای درخواست‌های AJAX
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        html = render_to_string('pation/tabs/__sub_tab_edit_pation.html', context, request=request)
        return JsonResponse({
            'success': True,
            'html': html
        })
        
    return render(request, 'pation/tabs/__sub_tab_edit_pation.html', context)




from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
@login_required
def generate_card(request):
    if request.method == 'POST':
        patient_id = request.POST.get('patient_id')
        try:
            patient = PatientRecord.objects.get(id=patient_id)
            card = PatientCard.objects.create(patient=patient)
            card.save()
            
            
            if hasattr(patient, 'patient_card'):
                if not patient.patient_card.card_image:
                    patient.patient_card.generate_card_image()
                    patient.patient_card.save()
                return JsonResponse({'success': False, 'error': 'برای این بیمار قبلاً کارت صادر شده است.'})
            
            card = PatientCard.objects.create(patient=patient)
            return JsonResponse({'success': True})
        except PatientRecord.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'بیمار یافت نشد.'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request.'})

@login_required
def deactivate_card(request, patient_id):
    patient = get_object_or_404(PatientRecord, id=patient_id)
    if hasattr(patient, 'patient_card'):
        card = patient.patient_card
        card.is_active = False
        card.save()
        messages.success(request, 'کارت بیمار با موفقیت غیرفعال شد.')
    else:
        messages.warning(request, 'این بیمار کارت ندارد.')
    return redirect('Patient:patient_detail', id=patient_id)

@login_required
def regenerate_card(request, patient_id):
    patient = get_object_or_404(PatientRecord, id=patient_id)
    if hasattr(patient, 'patient_card'):
        card = patient.patient_card
        card.generate_barcode()
        card.generate_qr_code()
        card.generate_card_image()
        card.save()
        messages.success(request, 'کارت بیمار با موفقیت تولید مجدد شد.')
    else:
        messages.warning(request, 'این بیمار کارت ندارد.')
    return redirect('Patient:patient_detail', id=patient_id)


@login_required
def activate_card(request, patient_id):
    patient = get_object_or_404(PatientRecord, id=patient_id)
    if hasattr(patient, 'patient_card'):
        card = patient.patient_card
        card.is_active = True
        card.save()
        messages.success(request, 'کارت بیمار با موفقیت فعال شد.')
    else:
        messages.warning(request, 'این بیمار کارت ندارد.')
    return redirect('Patient:patient_detail', id=patient_id)


@login_required
def generate_card_image(request, card_id):
    card = get_object_or_404(PatientCard, id=card_id)
    if request.method == 'POST':
        try:
            card.generate_card_image()
            card.save()
            return JsonResponse({'success': True, 'image_url': card.card_image.url})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request'})



# views.py
def sr_search_dashboard(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        query = request.GET.get('query', '')
        if len(query) >= 2:
            patients = PatientRecord.objects.filter(
                Q(name__icontains=query) |
                Q(family__icontains=query) |
                Q(national_code__icontains=query) |
                Q(file_num__icontains=query) |
                Q(contant_info__icontains=query)
            )[:10]

            data = []
            for patient in patients:
                data.append({
                    'id': patient.id,
                    'name': f"{patient.name} {patient.family}",
                    'file_num': patient.file_num,
                    'national_code': patient.national_code or '',
                    'contact': patient.contant_info or ''
                })
            return JsonResponse({'status': 'success', 'data': data})
    return JsonResponse({'status': 'error'})


@login_required
def get_insurance_types(request):
    """دریافت انواع بیمه"""
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        insurance_types = InsuranceType.objects.filter(
            providers__is_active=True
        ).distinct().values('id', 'name', 'code')
        
        return JsonResponse({
            'success': True,
            'insurance_types': list(insurance_types)
        })
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@login_required
def get_insurance_providers(request, type_id):
    """دریافت بیمه‌گران بر اساس نوع بیمه"""
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        providers = InsuranceProvider.objects.filter(
            insurance_type_id=type_id,
            is_active=True
        ).values('id', 'name', 'code')
        
        return JsonResponse({
            'success': True,
            'providers': list(providers)
        })
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@login_required
def add_patient_insurance(request):
    """افزودن بیمه جدید برای بیمار"""
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            patient_id = request.POST.get('patient_id')
            provider_id = request.POST.get('insurance_provider')
            insurance_number = request.POST.get('insurance_number')
            expiry_date_str = request.POST.get('expiry_date')
            coverage_percentage = request.POST.get('coverage_percentage')
            coverage_ceiling = request.POST.get('coverage_ceiling')
            is_primary = request.POST.get('is_primary') == 'on'
            is_active = request.POST.get('is_active', 'on') == 'on'
            notes = request.POST.get('notes', '')
            deactivate_others = request.POST.get('deactivate_others') == 'true'
            
            # تبدیل تاریخ شمسی به میلادی
            expiry_date = None
            if expiry_date_str:
                try:
                    year, month, day = map(int, expiry_date_str.split('/'))
                    jalali_date = jdatetime.date(year, month, day)
                    expiry_date = jalali_date.togregorian()
                except ValueError:
                    return JsonResponse({'success': False, 'error': 'فرمت تاریخ نامعتبر است'})
            
            # بررسی تاریخ انقضا
            if expiry_date and expiry_date < timezone.now().date():
                is_active = False  # بیمه منقضی شده را غیرفعال کن
            
            # بررسی وجود بیمار و بیمه‌گر
            patient = get_object_or_404(PatientRecord, id=patient_id)
            provider = get_object_or_404(InsuranceProvider, id=provider_id)
            
            # بررسی وجود بیمه فعال دیگر
            if is_active:
                active_insurances = PatientInsurance.objects.filter(patient=patient, is_active=True)
                if active_insurances.exists() and not deactivate_others:
                    return JsonResponse({
                        'success': False, 
                        'error': 'این بیمار در حال حاضر یک بیمه فعال دارد. برای فعال کردن این بیمه، باید بیمه قبلی غیرفعال شود.',
                        'require_confirmation': True
                    })
            
            # ایجاد بیمه جدید
            insurance = PatientInsurance.objects.create(
                patient=patient,
                insurance_provider=provider,
                insurance_number=insurance_number,
                expiry_date=expiry_date,
                coverage_percentage=coverage_percentage,
                coverage_ceiling=coverage_ceiling,
                is_primary=is_primary,
                is_active=is_active,
                notes=notes
            )
            
            # ارسال پیام به WebSocket برای به‌روزرسانی سایر تب‌ها
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'patient_{patient_id}',
                    {
                        'type': 'insurance_update',
                        'message': {
                        'status': 'updated'
                        }
                    }
                )
            except Exception as ws_error:
                # اگر خطایی در ارسال پیام WebSocket رخ داد، آن را لاگ کنید اما اجازه دهید عملیات ادامه یابد
                print(f"WebSocket error: {ws_error}")
                print(f"❌ WebSocket error on add: {ws_error}")
            
            # برگرداندن اطلاعات بیمه جدید
            return JsonResponse({
                'success': True,
                'insurance': {
                    'id': insurance.id,
                    'type_name': insurance.insurance_provider.insurance_type.name,
                    'provider_name': insurance.insurance_provider.name,
                    'number': insurance.insurance_number,
                    'expiry_date': jdatetime.date.fromgregorian(date=insurance.expiry_date).strftime('%Y/%m/%d') if insurance.expiry_date else '',
                    'coverage_percentage': insurance.coverage_percentage,
                    'coverage_ceiling': insurance.coverage_ceiling,
                    'is_active': insurance.is_active,
                    'is_primary': insurance.is_primary
                }
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@login_required
def get_insurance_details(request, insurance_id):
    """دریافت جزئیات بیمه"""
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            insurance = PatientInsurance.objects.get(id=insurance_id)
            
            return JsonResponse({
                'success': True,
                'insurance': {
                    'id': insurance.id,
                    'type_id': insurance.insurance_provider.insurance_type.id,
                    'provider_id': insurance.insurance_provider.id,
                    'number': insurance.insurance_number,
                    'coverage_ceiling': insurance.coverage_ceiling,
                    'expiry_date': jdatetime.date.fromgregorian(date=insurance.expiry_date).strftime('%Y/%m/%d'),
                    'coverage_percentage': insurance.coverage_percentage,
                    'is_active': insurance.is_active,
                    'is_primary': insurance.is_primary
                }
            })
        except PatientInsurance.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'بیمه مورد نظر یافت نشد'})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@login_required
def update_patient_insurance(request, insurance_id):
    """به‌روزرسانی بیمه بیمار"""
    if request.method in ['PUT', 'POST']:
        try:
            insurance = get_object_or_404(PatientInsurance, id=insurance_id)
            
            if request.method == 'PUT':
                data = json.loads(request.body)
            else:  # POST
                data = request.POST.dict()
            
            # به‌روزرسانی فیلدها
            if 'insurance_provider_id' in data:
                insurance.insurance_provider_id = data['insurance_provider_id']
            if 'insurance_number' in data:
                insurance.insurance_number = data['insurance_number']
            if 'coverage_percentage' in data:
                insurance.coverage_percentage = data['coverage_percentage']
            if 'coverage_ceiling' in data:
                insurance.coverage_ceiling = data['coverage_ceiling']
            if 'expiry_date' in data and data['expiry_date']:
                # تبدیل تاریخ شمسی به میلادی
                try:
                    year, month, day = map(int, data['expiry_date'].split('/'))
                    jalali_date = jdatetime.date(year, month, day)
                    insurance.expiry_date = jalali_date.togregorian()
                except ValueError:
                    return JsonResponse({'success': False, 'error': 'فرمت تاریخ نامعتبر است'})
            
            # بررسی وضعیت فعال بودن
            if 'is_active' in data:
                new_is_active = data['is_active'] in [True, 'true', 'True', '1', 1]
                
                # اگر بیمه فعال می‌شود
                if new_is_active:
                    # بررسی وجود بیمه فعال دیگر
                    other_active_insurances = PatientInsurance.objects.filter(
                        patient=insurance.patient, 
                        is_active=True
                    ).exclude(id=insurance_id)
                    
                    if other_active_insurances.exists():
                        # اگر بیمه دیگری فعال است، آیا باید آن‌ها را غیرفعال کنیم؟
                        deactivate_others = data.get('deactivate_others') in [True, 'true', 'True', '1', 1]
                        
                        if not deactivate_others:
                            # اگر کاربر نخواسته سایر بیمه‌ها غیرفعال شوند، نیاز به تأیید دارد
                            return JsonResponse({
                                'success': False, 
                                'error': 'این بیمار در حال حاضر یک بیمه فعال دارد. برای فعال کردن این بیمه، باید بیمه قبلی غیرفعال شود.',
                                'require_confirmation': True
                            })
                
                # تنظیم وضعیت فعال بودن
                insurance.is_active = new_is_active
            
            # ذخیره تغییرات با پارامتر deactivate_others
            deactivate_others = data.get('deactivate_others') in [True, 'true', 'True', '1', 1]
            insurance.save(deactivate_others=deactivate_others)
            
            # ارسال پیام به WebSocket برای به‌روزرسانی سایر تب‌ها
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'patient_{insurance.patient_id}',
                    {
                        'type': 'insurance_update',
                        'message': {
                        'status': 'updated',
                        }
                    }
                )
            except Exception as ws_error:
                print(f"WebSocket error: {ws_error}")
                print(f"❌ WebSocket error on add: {ws_error}")
            
            return JsonResponse({
                'success': True,
                'message': 'بیمه با موفقیت به‌روزرسانی شد',
                'insurance': {
                    'id': insurance.id,
                    'type_name': insurance.insurance_provider.insurance_type.name,
                    'provider_name': insurance.insurance_provider.name,
                    'number': insurance.insurance_number,
                    'expiry_date': jdatetime.date.fromgregorian(date=insurance.expiry_date).strftime('%Y/%m/%d') if insurance.expiry_date else '',
                    'coverage_percentage': insurance.coverage_percentage,
                    'coverage_ceiling': insurance.coverage_ceiling,
                    'is_active': insurance.is_active,
                    'is_primary': insurance.is_primary
                }
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request'})





@login_required
def get_patient_active_insurances(request, patient_id):
    """دریافت بیمه‌های فعال بیمار"""
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            patient = get_object_or_404(PatientRecord, id=patient_id)
            active_insurances = PatientInsurance.objects.filter(
                patient=patient,
                is_active=True
            ).select_related('insurance_provider', 'insurance_provider__insurance_type')
            
            insurances_data = []
            for insurance in active_insurances:
                insurances_data.append({
                    'id': insurance.id,
                    'provider_name': insurance.insurance_provider.name,
                    'type_name': insurance.insurance_provider.insurance_type.name,
                    'number': insurance.insurance_number,
                    'expiry_date': jdatetime.date.fromgregorian(date=insurance.expiry_date).strftime('%Y/%m/%d') if insurance.expiry_date else '',
                })
            
            return JsonResponse({
                'success': True,
                'insurances': insurances_data
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@login_required
def delete_patient_insurance(request, insurance_id):
    """حذف بیمه"""
    if request.method == 'POST' and request.headers.get('x-requested-with') == 'XMLHttpRequest':
        try:
            insurance = get_object_or_404(PatientInsurance, id=insurance_id)
            patient_id = insurance.patient.id
            
            # حذف بیمه
            insurance.delete()
            
            # ارسال پیام به WebSocket برای به‌روزرسانی سایر تب‌ها
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    f'patient_{patient_id}',
                    {
                        'type': 'insurance_update',
                        'message': {
                            'action': 'delete',
                            #'insurance_id': insurance_id
                        }
                    }
                )
            except Exception as ws_error:
                # اگر خطایی در ارسال پیام WebSocket رخ داد، آن را لاگ کنید اما اجازه دهید عملیات ادامه یابد
                print(f"WebSocket error: {ws_error}")
                print(f"❌ WebSocket error on add: {ws_error}")
            return JsonResponse({
                'success': True,
                'message': 'بیمه با موفقیت حذف شد'
            })
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Invalid request'})


@login_required
def get_treatment_types(request):
    """دریافت انواع درمان"""
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        treatment_types = TreatmentType.objects.all().values('id', 'title')
        return JsonResponse({'success': True, 'treatment_types': list(treatment_types)})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

@login_required
def get_treatment_details(request, type_id):
    """دریافت جزئیات درمان بر اساس نوع درمان"""
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        details = TreatmentDetail.objects.filter(
            treatment_type_id=type_id
        ).values(
            'id', 'description', 'international_code', 'public_tariff', 'special_tariff'
        )
        return JsonResponse({'success': True, 'details': list(details)})
    return JsonResponse({'success': False, 'error': 'Invalid request'})

from django.views.decorators.http import require_POST  # برای محدود کردن به POST


@login_required
@require_POST
def add_previous_treatment(request, patient_id):
    patient = get_object_or_404(PatientRecord, id=patient_id)

    try:
        doctor_name = request.POST.get('doctor_name')
        visit_date_shamsi = request.POST.get('visit_date')
        description = request.POST.get('description')

        # تبدیل تاریخ شمسی به میلادی
        try:
            year, month, day = map(int, visit_date_shamsi.split('/'))
            jalali_date = jdatetime.date(year, month, day)
            visit_date = jalali_date.togregorian()
        except ValueError:
            messages.error(request, 'فرمت تاریخ نامعتبر است') # برای درخواست غیر AJAX
            return redirect('Patient:patient_detail', id=patient_id) # تغییر به redirect برای نمایش پیام
            # return JsonResponse({'success': False, 'error': 'فرمت تاریخ نامعتبر است'}, status=400) # برای درخواست AJAX

        # ایجاد سابقه درمان
        previous_treatment = PreviousTreatment.objects.create(
            patient=patient,
            doctor_name=doctor_name,
            visit_date=visit_date,
            description=description
        )

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':  # بررسی درخواست AJAX
            return JsonResponse({
                'success': True,
                'treatment': {
                    'id': previous_treatment.id,
                    'doctor_name': previous_treatment.doctor_name,
                    'visit_date': visit_date_shamsi,
                    'description': previous_treatment.description
                }
            })
        else:
            messages.success(request, 'سابقه درمان با موفقیت اضافه شد.')
            return redirect('Patient:patient_detail', id=patient_id)

    except Exception as e:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest': # بررسی درخواست AJAX
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
        else:
            messages.error(request, str(e)) # برای درخواست غیر AJAX
            return redirect('Patient:patient_detail', id=patient_id) # تغییر به redirect برای نمایش پیام        
        


@login_required
@require_POST
def delete_previous_treatment(request, treatment_id):
    treatment = get_object_or_404(PreviousTreatment, id=treatment_id)
    patient_id = treatment.patient.id  # گرفتن id بیمار برای ریدایرکت

    try:
        treatment.delete()

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': True, 'message': 'سابقه درمان با موفقیت حذف شد.'})
        else:
            messages.success(request, 'سابقه درمان با موفقیت حذف شد.')
            return redirect('Patient:patient_detail', id=patient_id)

    except Exception as e:
        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'error': str(e)}, status=500)
        else:
            messages.error(request, f'خطا در حذف سابقه درمان: {str(e)}')
            return redirect('Patient:patient_detail', id=patient_id)



@login_required
def print_patient_record(request, patient_id):
    patient = get_object_or_404(PatientRecord, id=patient_id)
    previous_treatments = PreviousTreatment.objects.filter(patient=patient).order_by('-visit_date')
    insurances = PatientInsurance.objects.filter(patient=patient)
    treatments = DentalProcedure.objects.filter(patient=patient).order_by('-procedure_date')
    # ... (دریافت اطلاعات بیمه، درمان و ...) - از همان روش‌های patient_detail استفاده کنید
    # دریافت تنظیمات کلینیک
    clinic_settings = ClinicSetting.get_solo()
    
    context = {
        'patient': patient,
        'previous_treatments': previous_treatments,
        'insurances': insurances,
        'treatments': treatments,
        'clinic_name': clinic_settings.clinic_name,
        'clinic_phone': clinic_settings.phone_number1,
        'clinic_address': f"{clinic_settings.province}، {clinic_settings.city}، {clinic_settings.address}",
        'currency_unit': clinic_settings.currency_unit,
        'clinic_logo': clinic_settings.clinic_logo.url if clinic_settings.clinic_logo else None,
        'doctor_name': request.user.get_full_name() if request.user.is_authenticated else 'دکتر رضا احمدی', # نام پزشک - در حالت ایده‌آل از مدل User دریافت شود
        'print_date': jdatetime.date.today().strftime('%Y/%m/%d') # تاریخ شمسی امروز
        # ... (سایر اطلاعات مورد نیاز برای پرینت)
    }

    # تبدیل اشیاء QuerySet به JSON
    context['insurances_json'] = json.loads(serialize('json', context['insurances']))
    context['treatments_json'] = json.loads(serialize('json', context['treatments']))
    context['previous_treatments_json'] = json.loads(serialize('json', context['previous_treatments']))

    if request.GET.get('download') == 'excel':
        return generate_excel(request, context)
    elif request.GET.get('download') == 'pdf':
        return generate_pdf(request, context)
    else:
        return render(request, 'patients/print_patient_record.html', context)
    
def generate_excel(request, context):
    response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    response['Content-Disposition'] = f'attachment; filename="patient_record_{context["patient"].file_num}.xlsx"'

    workbook = xlsxwriter.Workbook(response, {'in_memory': True})
    worksheet = workbook.add_worksheet('Patient Record')

    # ... (اضافه کردن اطلاعات به worksheet)
    # مثال:
    worksheet.write(0, 0, 'شماره پرونده')
    worksheet.write(0, 1, context['patient'].file_num)
    # ... (بقیه اطلاعات)

    workbook.close()
    return response

def generate_pdf(request, context):
    html = render_to_string('patients/print_patient_record.html', context)
    options = {
        'page-size': 'A4',
        'margin-top': '0.75in',
        'margin-right': '0.75in',
        'margin-bottom': '0.75in',
        'margin-left': '0.75in',
        'encoding': "UTF-8",
        'no-outline': None
    }
    config = pdfkit.configuration(wkhtmltopdf=os.environ.get('WKHTMLTOPDF_PATH', 'C:\\Program Files\\wkhtmltopdf\\bin\\wkhtmltopdf.exe')) # مسیر wkhtmltopdf را اینجا وارد کنید
    pdf = pdfkit.from_string(html, False, options=options, configuration=config)

    response = HttpResponse(pdf, content_type='application/pdf')
    response['Content-Disposition'] = f'attachment; filename="patient_record_{context["patient"].file_num}.pdf"'
    return response



def get_insurance_data(request):
    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        insurance_types = list(InsuranceType.objects.values('id', 'name'))
        insurance_providers = list(InsuranceProvider.objects.values('id', 'name', 'insurance_type_id'))
        return JsonResponse({'insurance_types': insurance_types, 'insurance_providers': insurance_providers})
    return JsonResponse({'error': 'Invalid request.'}, status=400)



#------------darman treatment


@login_required
def treatment_view(request, patient_id):
    """نمایش صفحه درمان بیمار"""
    print("Treatment view called for patient ID:", patient_id)
    patient = get_object_or_404(PatientRecord, pk=patient_id)
    doctors = CustomUser.objects.filter(role__name="دکتر")
    assistants = CustomUser.objects.filter(role__name="دستیار")
    insurance_providers = InsuranceProvider.objects.filter(is_active=True)
    
    treatment_types = TreatmentType.objects.prefetch_related('details').all()
    
    today = timezone.now().date()
    print("Patient found:", patient)
    
     # دریافت بیمه‌های فعال بیمار
    patient_active_insurances = PatientInsurance.objects.filter(patient=patient, is_active=True)
    
    # ایجاد دیکشنری برای دسترسی سریع به اطلاعات بیمه بر اساس شناسه بیمه‌گر
    insurance_data = {}
    for insurance in patient_active_insurances:
        remaining = insurance.coverage_ceiling - insurance.used_coverage if insurance.coverage_ceiling is not None else None
        insurance_data[insurance.insurance_provider_id] = {
            'coverage_ceiling': insurance.coverage_ceiling,
            'used_coverage': insurance.used_coverage,
            'remaining': remaining
        }
        print(f"DEBUG: insurance_data[{insurance.insurance_provider_id}] = {insurance_data[insurance.insurance_provider_id]}")
    
    # اضافه کردن اطلاعات بیمه به درمان‌های موجود
    # اضافه کردن اطلاعات بیمه به درمان‌های موجود
    treatments = patient.treatments.all().order_by('-treatment_date')
    for treatment in treatments:
        if treatment.insurance_provider_id and treatment.insurance_provider_id in insurance_data:
            insurance_info = insurance_data[treatment.insurance_provider_id]
        # تبدیل به float یا Decimal برای اطمینان از اینکه None نیستند
            treatment.insurance_ceiling = float(insurance_info['coverage_ceiling']) if insurance_info['coverage_ceiling'] is not None else None
            treatment.insurance_used = float(insurance_info['used_coverage']) if insurance_info['used_coverage'] is not None else None
            treatment.insurance_remaining = float(insurance_info['remaining']) if insurance_info['remaining'] is not None else None
            print(f"DEBUG VIEW: Treatment ID={treatment.id}, insurance_ceiling={treatment.insurance_ceiling}, insurance_used={treatment.insurance_used}, insurance_remaining={treatment.insurance_remaining}")
        else:
            treatment.insurance_ceiling = None
            treatment.insurance_used = None
            treatment.insurance_remaining = None

    # لیست نواحی صورت (برای چارت صورت در JavaScript)
    facial_areas = [
        {'name': 'forehead', 'label': 'پیشانی', 'icon': 'fa-head-side-forehead'},
        {'name': 'glabella', 'label': 'بین ابروها', 'icon': 'fa-ellipsis-v'},
        {'name': 'right_eyebrow', 'label': 'ابروی راست', 'icon': 'fa-eye-slash'},
        {'name': 'left_eyebrow', 'label': 'ابروی چپ', 'icon': 'fa-eye'},
        {'name': 'right_eye', 'label': 'چشم راست', 'icon': 'fa-eye'},
        {'name': 'left_eye', 'label': 'چشم چپ', 'icon': 'fa-eye'},
        {'name': 'nose', 'label': 'بینی', 'icon': 'fa-nose'},
        {'name': 'right_cheek', 'label': 'گونه راست', 'icon': 'fa-grin-squint-right'},
        {'name': 'left_cheek', 'label': 'گونه چپ', 'icon': 'fa-grin-squint'},
        {'name': 'upper_lip', 'label': 'لب بالا', 'icon': 'fa-lips'},
        {'name': 'lower_lip', 'label': 'لب پایین', 'icon': 'fa-meh-rolling-eyes'},
        {'name': 'chin', 'label': 'چانه', 'icon': 'fa-user-injured'},
        {'name': 'right_jaw', 'label': 'فک راست', 'icon': 'fa-bone'},
        {'name': 'left_jaw', 'label': 'فک چپ', 'icon': 'fa-bone'},
        {'name': 'neck', 'label': 'گردن', 'icon': 'fa-tshirt'},
    ]

    context = {
        'patient': patient,
        'doctors': doctors,
        'assistants': assistants,
        'insurance_providers': insurance_providers,
        'treatment_types': treatment_types,
        'today': today,
        'facial_areas': facial_areas,
        'patient_active_insurances': patient_active_insurances,
        'treatments': treatments,
        'insurance_data': insurance_data,
    }
    
    # بررسی اینکه آیا درخواست AJAX است یا خیر
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        # اگر درخواست AJAX است، فقط محتوای تب را برگردان
        return render(request, 'patient/tabs/_tab_treatment.html', context)
    else:
        # اگر درخواست معمولی است، صفحه کامل را برگردان
        return render(request, 'patient/tabs/_tab_treatment.html', context)
@require_http_methods(["POST"])
def create_treatment(request):
    """ایجاد درمان جدید"""
    try:
        data = json.loads(request.body)
        print("Received data from client:", data)  # اضافه کردن لاگ برای بررسی داده‌های دریافتی
        
        # تبدیل تاریخ‌های شمسی به میلادی
        from django.utils.dateparse import parse_date
        from persiantools.jdatetime import JalaliDate
        from decimal import Decimal
        
        def convert_persian_date(persian_date_str):
            if not persian_date_str:
                return None
            try:
                # حذف کاراکترهای اضافی و تقسیم تاریخ
                parts = persian_date_str.replace('۰', '0').replace('۱', '1').replace('۲', '2').replace('۳', '3') \
                                      .replace('۴', '4').replace('۵', '5').replace('۶', '6').replace('۷', '7') \
                                      .replace('۸', '8').replace('۹', '9').split('/')
                
                if len(parts) != 3:
                    return None
                
                jyear = int(parts[0])
                jmonth = int(parts[1])
                jday = int(parts[2])
                
                # تبدیل به تاریخ میلادی
                gregorian_date = JalaliDate(jyear, jmonth, jday).to_gregorian()
                return gregorian_date
            except Exception as e:
                print(f"Error converting date: {e}")
                return None
        
        # تبدیل تاریخ‌های شمسی به میلادی
        treatment_date = convert_persian_date(data.get('treatment_date'))
        next_visit_date = convert_persian_date(data.get('next_visit_date'))
        
        # بررسی treatment_type_id
        treatment_type_id = data.get('treatment_type_id')
        treatment_detail_id = data.get('treatment_detail_id')
        
        if treatment_type_id is None and treatment_detail_id:
            from Patient.models import TreatmentDetail
            try:
                treatment_detail = TreatmentDetail.objects.get(id=treatment_detail_id)
                treatment_type_id = treatment_detail.treatment_type_id
            except TreatmentDetail.DoesNotExist:
                raise ValueError(f"جزئیات درمان با شناسه {treatment_detail_id} یافت نشد")
        
        # تبدیل مقادیر عددی به Decimal
        discount = Decimal(str(data.get('discount', 0)))
        material_cost = Decimal(str(data.get('material_cost', 0)))
        lab_cost = Decimal(str(data.get('lab_cost', 0)))
        insurance_percentage = Decimal(str(data.get('insurance_percentage', 0)))
        
        # بررسی حالت قیمت دستی - تبدیل به بولین
        is_manual_price_value = data.get('is_manual_price', False)
        # تبدیل مقادیر مختلف به بولین
        if isinstance(is_manual_price_value, str):
            is_manual_price = is_manual_price_value.lower() in ['true', '1', 'yes', 'y']
        else:
            is_manual_price = bool(is_manual_price_value)
        
        print(f"Original is_manual_price value: {data.get('is_manual_price')}, Converted to: {is_manual_price}")
        
        # تعیین قیمت‌ها بر اساس حالت دستی یا خودکار
        if is_manual_price:
            # استفاده از قیمت‌های دستی
            general_fee = Decimal(str(data.get('general_fee', 0)))
            special_fee = Decimal(str(data.get('special_fee', 0)))
            print(f"Using manual prices: general_fee={general_fee}, special_fee={special_fee}")
        else:
            # استفاده از قیمت‌های خودکار از شرح درمان
            from Patient.models import TreatmentDetail
            try:
                treatment_detail = TreatmentDetail.objects.get(id=treatment_detail_id)
                general_fee = treatment_detail.public_tariff
                special_fee = treatment_detail.special_tariff
                print(f"Using automatic prices from treatment detail: general_fee={general_fee}, special_fee={special_fee}")
            except TreatmentDetail.DoesNotExist:
                general_fee = Decimal('0')
                special_fee = Decimal('0')
                print(f"Treatment detail not found. Using default prices: general_fee={general_fee}, special_fee={special_fee}")
        
        # محاسبه مبلغ قابل پرداخت بر اساس تعرفه عمومی
        amount_after_discount = general_fee - discount
        insurance_amount = Decimal('0')
        
        if insurance_percentage > 0:
            insurance_amount = (amount_after_discount * insurance_percentage) / 100
        
        payable_amount = max(Decimal('0'), amount_after_discount - insurance_amount + material_cost + lab_cost)
        
        print(f"Calculated payable_amount: {payable_amount}")
        
        # ایجاد درمان جدید
        treatment = Treatment(
            patient_id=data.get('patient_id'),
            treatment_date=treatment_date,
            next_visit_date=next_visit_date,
            treatment_type_id=treatment_type_id,
            treatment_detail_id=treatment_detail_id,
            treatment_areas=data.get('treatment_areas'),
            area_type=data.get('area_type', 'teeth'),
            doctor_id=data.get('doctor_id'),
            assistant_id=data.get('assistant_id') if data.get('assistant_id') else None,
            general_fee=general_fee,
            special_fee=special_fee,
            discount=discount,
            discount_type_id=data.get('discount_type_id') if data.get('discount_type_id') else None,
            material_cost=material_cost,
            lab_cost=lab_cost,
            insurance_provider_id=data.get('insurance_provider_id') if data.get('insurance_provider_id') else None,
            insurance_percentage=insurance_percentage,
            insurance_sent=data.get('insurance_sent', False),
            is_completed=data.get('is_completed', False),
            is_treatment_plan=data.get('is_treatment_plan', False),
            insurance_paid=data.get('insurance_paid', False),
            description=data.get('description', ''),
            is_manual_price=is_manual_price,  # اضافه کردن فلگ قیمت دستی
            payable_amount=payable_amount,  # استفاده از مبلغ محاسبه شده
        )
        
        treatment.save()
        saved_treatment = Treatment.objects.get(id=treatment.id)
        print(f"VERIFICATION: Treatment ID {saved_treatment.id} saved with payable_amount={saved_treatment.payable_amount}")
        
        # بروزرسانی مقدار استفاده شده از بیمه - کد جدید
        if treatment.insurance_provider_id and treatment.insurance_percentage > 0:
            try:
                from Patient.models import PatientInsurance
                
                # پیدا کردن بیمه فعال بیمار
                patient_insurance = PatientInsurance.objects.get(
                    patient_id=treatment.patient_id,
                    insurance_provider_id=treatment.insurance_provider_id,
                    is_active=True
                ).first()
                if patient_insurance:
                # محاسبه مبلغ بیمه
                    insurance_amount = (amount_after_discount * insurance_percentage) / 100
                
                # بررسی سقف بیمه
                    if patient_insurance.coverage_ceiling:
                        remaining_coverage = patient_insurance.coverage_ceiling - patient_insurance.used_coverage
                    
                    # اگر مبلغ بیمه از سقف باقیمانده بیشتر است، مقدار استفاده شده را به اندازه باقیمانده افزایش می‌دهیم
                        if insurance_amount > remaining_coverage:
                            insurance_amount = remaining_coverage
                
                # بروزرسانی مقدار استفاده شده
                    patient_insurance.used_coverage += insurance_amount
                    patient_insurance.save()
                
                    print(f"Updated insurance used_coverage for patient {treatment.patient_id}, insurance {treatment.insurance_provider_id}: +{insurance_amount}")
                
            except PatientInsurance.DoesNotExist:
                print(f"No active insurance found for patient {treatment.patient_id} with provider {treatment.insurance_provider_id}")
            except Exception as e:
                print(f"Error updating insurance used_coverage: {str(e)}")
        
        # ارسال پیام به WebSocket برای به‌روزرسانی سایر تب‌ها
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            # دریافت اطلاعات نوع درمان و شرح درمان
            from Patient.models import TreatmentType, TreatmentDetail
            treatment_type_name = ""
            treatment_detail_desc = ""
            
            try:
                treatment_type = TreatmentType.objects.get(id=treatment_type_id)
                treatment_type_name = treatment_type.title
            except:
                pass
                
            try:
                treatment_detail = TreatmentDetail.objects.get(id=treatment_detail_id)
                treatment_detail_desc = treatment_detail.description
            except:
                pass
            
            # دریافت نام پزشک
            doctor_name = ""
            if treatment.doctor_id:
                from django.contrib.auth.models import User
                try:
                    doctor_user = User.objects.get(id=treatment.doctor_id)
                    doctor_name = f"{doctor_user.first_name} {doctor_user.last_name}"
                except:
                    pass
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'patient_{treatment.patient_id}',
                {
                    'type': 'treatment_update',
                    'message': {
                        'action': 'add',
                        'treatment': {
                            'id': treatment.id,
                            'treatment_type': treatment_type_name,
                            'treatment_detail': treatment_detail_desc,
                            'treatment_date': treatment_date.strftime('%Y-%m-%d') if treatment_date else '',
                            'doctor_name': doctor_name,
                            'general_fee': float(general_fee),
                            'special_fee': float(special_fee),
                            'discount': float(discount),
                            'payable_amount': float(payable_amount),
                            'is_completed': treatment.is_completed
                        }
                    }
                }
            )
            print("WebSocket message sent successfully for new treatment")
        except Exception as ws_error:
            # اگر خطایی در ارسال پیام WebSocket رخ داد، آن را لاگ کنید اما اجازه دهید عملیات ادامه یابد
            print(f"WebSocket error: {ws_error}")
        
        # اضافه کردن return برای برگرداندن HttpResponse
        return JsonResponse({
            'success': True,
            'treatment_id': treatment.id,
            'message': 'درمان با موفقیت ثبت شد',
            'payable_amount': float(payable_amount)  # اضافه کردن مبلغ قابل پرداخت به پاسخ
        })
    except Exception as e:
        import traceback
        print(f"Error creating treatment: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

    except Exception as e:
        import traceback
        print(f"Error creating treatment: {str(e)}")
        print(traceback.format_exc())  # چاپ جزئیات خطا
        return JsonResponse({
            'success': False,
            'message': f'خطا در ثبت درمان: {str(e)}'
        }, status=400)










@require_http_methods(["PUT"]) # یا POST
def update_treatment(request, id):
    """بروزرسانی درمان موجود"""
    try:
        treatment = get_object_or_404(Treatment, id=id)
        data = json.loads(request.body)
        # --- لاگ برای عیب‌یابی ---
        print("داده‌های دریافتی برای بروزرسانی:", data)
        # -------------------------
        treatment_type_id = data.get('treatment_type_id')
        treatment_detail_id = data.get('treatment_detail_id')
        # اگر treatment_type_id ارسال نشده بود، آن را از detail استخراج کن
        if not treatment_type_id and treatment_detail_id:
            from .models import TreatmentDetail
            try:
                detail = TreatmentDetail.objects.get(id=treatment_detail_id)
                treatment_type_id = detail.treatment_type_id
                print(f"شناسه نوع درمان از روی جزئیات استخراج شد: {treatment_type_id}")
            except TreatmentDetail.DoesNotExist:
                return JsonResponse({'success': False, 'message': 'جزئیات درمان نامعتبر است'}, status=400)
        
        # اگر هنوز هم treatment_type_id معتبر نیست، از مقدار قبلی استفاده کن
        if not treatment_type_id:
            treatment_type_id = treatment.treatment_type_id
            print(f"از شناسه نوع درمان قبلی استفاده شد: {treatment_type_id}")
        # تبدیل تاریخ‌های شمسی به میلادی
        from django.utils.dateparse import parse_date
        from persiantools.jdatetime import JalaliDate
        from decimal import Decimal
        
        def convert_persian_date(persian_date_str):
            if not persian_date_str:
                return None
            try:
                # حذف کاراکترهای اضافی و تقسیم تاریخ
                parts = persian_date_str.replace('۰', '0').replace('۱', '1').replace('۲', '2').replace('۳', '3') \
                                      .replace('۴', '4').replace('۵', '5').replace('۶', '6').replace('۷', '7') \
                                      .replace('۸', '8').replace('۹', '9').split('/')
                
                if len(parts) != 3:
                    return None
                
                jyear = int(parts[0])
                jmonth = int(parts[1])
                jday = int(parts[2])
                
                # تبدیل به تاریخ میلادی
                gregorian_date = JalaliDate(jyear, jmonth, jday).to_gregorian()
                return gregorian_date
            except Exception as e:
                print(f"Error converting date: {e}")
                return None
        
        # بروزرسانی فیلدهای درمان
        treatment.treatment_date = convert_persian_date(data.get('treatment_date')) or treatment.treatment_date
        treatment.next_visit_date = convert_persian_date(data.get('next_visit_date')) or treatment.next_visit_date
        treatment.treatment_type_id = treatment_type_id # استفاده از مقدار معتبر
        treatment.treatment_detail_id = data.get('treatment_detail_id', treatment.treatment_detail_id)
        treatment.treatment_areas = data.get('treatment_areas', treatment.treatment_areas)
        treatment.area_type = data.get('area_type', treatment.area_type)
        treatment.doctor_id = data.get('doctor_id', treatment.doctor_id)
        treatment.assistant_id = data.get('assistant_id', treatment.assistant_id)
        treatment.general_fee = Decimal(str(data.get('general_fee', treatment.general_fee)))
        treatment.special_fee = Decimal(str(data.get('special_fee', treatment.special_fee)))
        treatment.discount = Decimal(str(data.get('discount', treatment.discount)))
        treatment.discount_type_id = data.get('discount_type_id', treatment.discount_type_id)
        treatment.material_cost = Decimal(str(data.get('material_cost', treatment.material_cost)))
        treatment.lab_cost = Decimal(str(data.get('lab_cost', treatment.lab_cost)))
        treatment.insurance_provider_id = data.get('insurance_provider_id', treatment.insurance_provider_id)
        treatment.insurance_percentage = Decimal(str(data.get('insurance_percentage', treatment.insurance_percentage)))
        treatment.insurance_sent = data.get('insurance_sent', treatment.insurance_sent)
        treatment.is_completed = data.get('is_completed', treatment.is_completed)
        treatment.is_treatment_plan = data.get('is_treatment_plan', treatment.is_treatment_plan)
        treatment.insurance_paid = data.get('insurance_paid', treatment.insurance_paid)
        treatment.description = data.get('description', treatment.description)
        
        # محاسبه مجدد مبلغ قابل پرداخت
        treatment.payable_amount = treatment.calculate_payable_amount()
        
        treatment.save()
        
        # ارسال پیام به WebSocket برای به‌روزرسانی سایر تب‌ها
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            # دریافت اطلاعات نوع درمان و شرح درمان
            from Patient.models import TreatmentType, TreatmentDetail
            treatment_type_name = ""
            treatment_detail_desc = ""
            
            try:
                treatment_type = TreatmentType.objects.get(id=treatment.treatment_type_id)
                treatment_type_name = treatment_type.title
            except:
                pass
                
            try:
                treatment_detail = TreatmentDetail.objects.get(id=treatment.treatment_detail_id)
                treatment_detail_desc = treatment_detail.description
            except:
                pass
            
            # دریافت نام پزشک
            doctor_name = ""
            if treatment.doctor_id:
                from django.contrib.auth.models import User
                try:
                    doctor_user = User.objects.get(id=treatment.doctor_id)
                    doctor_name = f"{doctor_user.first_name} {doctor_user.last_name}"
                except:
                    pass
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'patient_{treatment.patient_id}',
                {
                    'type': 'treatment_update',
                    'message': {
                        'action': 'update',
                        'treatment': {
                            'id': treatment.id,
                            'treatment_type': treatment_type_name,
                            'treatment_detail': treatment_detail_desc,
                            'treatment_date': treatment.treatment_date.strftime('%Y-%m-%d') if treatment.treatment_date else '',
                            'doctor_name': doctor_name,
                            'general_fee': float(treatment.general_fee),
                            'special_fee': float(treatment.special_fee),
                            'discount': float(treatment.discount),
                            'payable_amount': float(treatment.payable_amount),
                            'is_completed': treatment.is_completed
                        }
                    }
                }
            )
            print("WebSocket message sent successfully for updated treatment")
        except Exception as ws_error:
            # اگر خطایی در ارسال پیام WebSocket رخ داد، آن را لاگ کنید اما اجازه دهید عملیات ادامه یابد
            print(f"WebSocket error: {ws_error}")
        
        return JsonResponse({'success': True, 'message': 'درمان با موفقیت بروزرسانی شد'})
    except Exception as e:
        import traceback
        print(f"Error updating treatment: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@require_http_methods(["DELETE", "POST"])
def delete_treatment(request, id):  # تغییر نام پارامتر به id
    """حذف درمان"""
    try:
        treatment = get_object_or_404(Treatment, id=id)
        patient_id = treatment.patient_id  # ذخیره شناسه بیمار قبل از حذف درمان
        
        # حذف درمان
        treatment.delete()
        
        # ارسال پیام به WebSocket برای به‌روزرسانی سایر تب‌ها
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'patient_{patient_id}',
                {
                    'type': 'treatment_update',
                    'message': {
                        'action': 'delete',
                        'treatment_id': id
                    }
                }
            )
            print("WebSocket message sent successfully for deleted treatment")
        except Exception as ws_error:
            # اگر خطایی در ارسال پیام WebSocket رخ داد، آن را لاگ کنید اما اجازه دهید عملیات ادامه یابد
            print(f"WebSocket error: {ws_error}")
        
        return JsonResponse({'success': True, 'message': 'درمان با موفقیت حذف شد'})
    except Exception as e:
        import traceback
        print(f"Error deleting treatment: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@require_http_methods(["GET"])
def get_treatment(request, id):
    """دریافت اطلاعات یک درمان خاص"""
    try:
        treatment = get_object_or_404(Treatment, id=id)
        
        doctor_name = f"{treatment.doctor.first_name} {treatment.doctor.last_name}" if treatment.doctor else ""
        assistant_name = f"{treatment.assistant.first_name} {treatment.assistant.last_name}" if treatment.assistant else ""

        # اضافه کردن لاگ برای عیب‌یابی
        print(f"Treatment ID: {treatment.id}, Payable Amount: {treatment.payable_amount}")
        
        data = {
            'id': treatment.id,
            'patient_id': treatment.patient.id,
            'treatment_date': treatment.treatment_date.strftime('%Y-%m-%d'),
            'next_visit_date': treatment.next_visit_date.strftime('%Y-%m-%d') if treatment.next_visit_date else None,
            'treatment_type_id': treatment.treatment_type.id,
            'treatment_detail_id': treatment.treatment_detail.id,
            'treatment_areas': treatment.treatment_areas,
            'doctor_id': treatment.doctor.id if treatment.doctor else None,
            'assistant_id': treatment.assistant.id if treatment.assistant else None,
            'general_fee': float(treatment.general_fee),
            'special_fee': float(treatment.special_fee),
            'discount': float(treatment.discount),
            'discount_type_id': treatment.discount_type.id if treatment.discount_type else None,
            'material_cost': float(treatment.material_cost),
            'lab_cost': float(treatment.lab_cost),
            'payable_amount': float(treatment.payable_amount),  # اطمینان از ارسال مبلغ قابل پرداخت
            'insurance_provider_id': treatment.insurance_provider.id if treatment.insurance_provider else None,
            'insurance_percentage': treatment.insurance_percentage,
            'insurance_sent': treatment.insurance_sent,
            'is_completed': treatment.is_completed,
            'is_treatment_plan': treatment.is_treatment_plan,
            'insurance_paid': treatment.insurance_paid,
            'description': treatment.description,
            'is_manual_price': treatment.is_manual_price,  # اضافه کردن فلگ قیمت دستی
        }
        
        # ارسال پیام به WebSocket برای اطلاع‌رسانی (اختیاری)
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            # دریافت نام کاربر فعلی
            user_name = request.user.get_full_name() or request.user.username
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'patient_{treatment.patient.id}',
                {
                    'type': 'treatment_update',
                    'message': {
                        'action': 'view',
                        'treatment_id': treatment.id,
                        'user': user_name,
                        'timestamp': timezone.now().isoformat()
                    }
                }
            )
            print(f"WebSocket notification sent for viewing treatment {treatment.id}")
        except Exception as ws_error:
            # اگر خطایی در ارسال پیام WebSocket رخ داد، آن را لاگ کنید اما اجازه دهید عملیات ادامه یابد
            print(f"WebSocket error: {ws_error}")
        
        return JsonResponse({'success': True, 'treatment': data})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@require_http_methods(["GET"])
def list_treatments(request, patient_id):
    """دریافت لیست درمان‌های بیمار با اطلاعات کامل بیمه"""
    try:
        patient = get_object_or_404(PatientRecord, id=patient_id)
        treatments_qs = Treatment.objects.filter(patient_id=patient_id).order_by('-treatment_date')
        
        # دریافت اطلاعات بیمه‌های فعال بیمار برای دسترسی سریع
        patient_insurances = PatientInsurance.objects.filter(patient=patient, is_active=True)
        # لاگ کردن اطلاعات بیمه‌های فعال برای عیب‌یابی
        for insurance in patient_insurances:
            print(f"DEBUG API: Insurance ID={insurance.id}, Provider={insurance.insurance_provider}, coverage_ceiling={insurance.coverage_ceiling}, used_coverage={insurance.used_coverage}")
        insurance_map = {}
        for pi in patient_insurances:
            insurance_map[pi.insurance_provider_id] = pi

        data = []
        for treatment in treatments_qs:
            doctor_name = treatment.doctor.get_full_name() if treatment.doctor else ""
            assistant_name = treatment.assistant.get_full_name() if treatment.assistant else ""
            insurance_provider_name = treatment.insurance_provider.name if treatment.insurance_provider else ""
            
            # اطلاعات بیمه برای این درمان خاص
            insurance_ceiling = None
            insurance_used = None
            insurance_remaining = None
            
            if treatment.insurance_provider_id and treatment.insurance_provider_id in insurance_map:
                p_insurance = insurance_map[treatment.insurance_provider_id]
                insurance_ceiling = p_insurance.coverage_ceiling
                insurance_used = p_insurance.used_coverage
                
                if p_insurance.coverage_ceiling is not None:
                    insurance_remaining = p_insurance.coverage_ceiling - p_insurance.used_coverage
                    print(f"DEBUG API: Treatment ID={treatment.id}, insurance_ceiling={insurance_ceiling}, used_coverage={insurance_used}, insurance_remaining={insurance_remaining}")
            
            treatment_data = {
                'id': treatment.id,
                'treatment_date': treatment.treatment_date,
                'next_visit_date': treatment.next_visit_date,
                'treatment_areas': treatment.treatment_areas,
                'area_type': treatment.area_type,
                'treatment_type': {'id': treatment.treatment_type.id, 'title': treatment.treatment_type.title},
                'treatment_detail': {'id': treatment.treatment_detail.id, 'description': treatment.treatment_detail.description},
                'doctor': {'id': treatment.doctor.id if treatment.doctor else None, 'full_name': doctor_name},
                'assistant': {'id': treatment.assistant.id if treatment.assistant else None, 'full_name': assistant_name},
                'general_fee': float(treatment.general_fee),
                'special_fee': float(treatment.special_fee),
                'discount': float(treatment.discount),
                'material_cost': float(treatment.material_cost),
                'lab_cost': float(treatment.lab_cost),
                'payable_amount': float(treatment.payable_amount),
                'insurance_provider': {'id': treatment.insurance_provider.id if treatment.insurance_provider else None, 'name': insurance_provider_name},
                'insurance_percentage': treatment.insurance_percentage,
                'insurance_sent': treatment.insurance_sent,
                'insurance_paid': treatment.insurance_paid,
                'is_completed': treatment.is_completed,
                'is_treatment_plan': treatment.is_treatment_plan,
                'description': treatment.description,
                'is_manual_price': treatment.is_manual_price,
                # اضافه کردن فیلدهای جدید بیمه
                'insurance_ceiling': float(insurance_ceiling) if insurance_ceiling is not None else None,
                'insurance_used': float(insurance_used) if insurance_used is not None else None,
                'insurance_remaining': float(insurance_remaining) if insurance_remaining is not None else None,
            }
            data.append(treatment_data)
        
        # ارسال پیام به WebSocket برای اطلاع‌رسانی (اختیاری)
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            from django.utils import timezone
            
            # دریافت نام کاربر فعلی
            user_name = request.user.get_full_name() or request.user.username
            
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f'patient_{patient_id}',
                {
                    'type': 'treatment_update',
                    'message': {
                        'action': 'list_view',
                        'user': user_name,
                        'timestamp': timezone.now().isoformat()
                    }
                }
            )
            print(f"WebSocket notification sent for viewing treatment list of patient {patient_id}")
        except Exception as ws_error:
            # اگر خطایی در ارسال پیام WebSocket رخ داد، آن را لاگ کنید اما اجازه دهید عملیات ادامه یابد
            print(f"WebSocket error: {ws_error}")
            
        return JsonResponse({'success': True, 'treatments': data})
    
    except Exception as e:
        import traceback
        print(f"Error in list_treatments: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'message': f'خطا در دریافت لیست درمان‌ها: {str(e)}'}, status=400)

    
    except Exception as e:
        import traceback
        print(f"Error in list_treatments: {str(e)}")
        print(traceback.format_exc())
        return JsonResponse({'success': False, 'message': f'خطا در دریافت لیست درمان‌ها: {str(e)}'}, status=400)





@require_http_methods(["POST"])
def create_payment(request):
    """ایجاد پرداخت جدید"""
    try:
        data = json.loads(request.body)
        
        payment = TreatmentPayment(
            treatment_id=data.get('treatment_id'),
            amount=data.get('amount'),
            payment_date=data.get('payment_date'),
            payment_method=data.get('payment_method'),
            check_number=data.get('check_number'),
            check_date=data.get('check_date'),
            check_bank=data.get('check_bank'),
            description=data.get('description'),
        )
        
        payment.save()
        
        return JsonResponse({
            'success': True,
            'payment_id': payment.id,
            'message': 'پرداخت با موفقیت ثبت شد'
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطا در ثبت پرداخت: {str(e)}'
        }, status=400)


@require_http_methods(["GET"])
def get_insurance_provider(request, id):
    """دریافت اطلاعات بیمه‌گر"""
    insurance_provider = get_object_or_404(InsuranceProvider, pk=id)
    
    data = {
        'id': insurance_provider.id,
        'name': insurance_provider.name,
        'insurance_type': {
            'id': insurance_provider.insurance_type.id,
            'name': insurance_provider.insurance_type.name,
        },
        'code': insurance_provider.code,
        'default_percentage': 70,  # مقدار پیش‌فرض برای درصد پوشش بیمه
    }
    
    return JsonResponse(data)


@require_http_methods(["GET"])
def get_treatment_details(request, type_id):
    """دریافت جزئیات درمان‌های مربوط به یک نوع درمان"""
    details = TreatmentDetail.objects.filter(treatment_type_id=type_id)
    
    data = [{
        'id': detail.id,
        'description': detail.description,
        'international_code': detail.international_code,
        'public_tariff': str(detail.public_tariff),
        'special_tariff': str(detail.special_tariff),
    } for detail in details]
    
    return JsonResponse(data, safe=False)


@require_http_methods(["DELETE"])
def delete_payment(request, id):
    """حذف پرداخت"""
    try:
        payment = get_object_or_404(TreatmentPayment, pk=id)
        payment.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'پرداخت با موفقیت حذف شد'
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطا در حذف پرداخت: {str(e)}'
        }, status=400)


@require_http_methods(["GET"])
def get_payment_history(request, treatment_id):
    """دریافت تاریخچه پرداخت‌های یک درمان"""
    try:
        treatment = get_object_or_404(Treatment, pk=treatment_id)
        payments = treatment.payments.all().order_by('-payment_date')
        
        payment_data = [{
            'id': payment.id,
            'amount': float(payment.amount),
            'payment_date': payment.payment_date.strftime('%Y-%m-%d'),
            'payment_method': payment.payment_method,
            'payment_method_display': payment.get_payment_method_display(),
            'payment_status': payment.payment_status,
            'payment_status_display': payment.get_payment_status_display(),
            'refund_date': payment.refund_date.strftime('%Y-%m-%d') if payment.refund_date else None,
            'refund_reason': payment.refund_reason or '',
            'description': payment.description or '',
            'check_number': payment.check_number,
            'check_date': payment.check_date.strftime('%Y-%m-%d') if payment.check_date else None,
            'check_bank': payment.check_bank,
        } for payment in payments]
        
        # محاسبه مجموع پرداخت‌های معتبر (عودت نشده)
        valid_payments = [p for p in payments if p.payment_status != 'refunded']
        total_paid = sum(payment.amount for payment in valid_payments)
        
        treatment_data = {
            'id': treatment.id,
            'treatment_date': treatment.treatment_date.strftime('%Y-%m-%d'),
            'treatment_type': {
                'id': treatment.treatment_type.id,
                'title': treatment.treatment_type.title
            },
            'treatment_detail': {
                'id': treatment.treatment_detail.id,
                'description': treatment.treatment_detail.description
            },
            'payable_amount': float(treatment.payable_amount),
            'doctor': treatment.doctor.get_full_name() if treatment.doctor else '',
        }
        
        return JsonResponse({
            'treatment': treatment_data,
            'payments': payment_data,
            'total_paid': float(total_paid),
            'remaining': float(treatment.payable_amount) - float(total_paid)
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطا در دریافت تاریخچه پرداخت: {str(e)}'
        }, status=400)


@require_http_methods(["GET"])
def get_installment_plan(request, plan_id):
    """دریافت جزئیات طرح اقساطی"""
    try:
        plan = get_object_or_404(InstallmentPlan, pk=plan_id)
        installments = plan.installments.all().order_by('due_date')
        
        installment_data = [{
            'id': installment.id,
            'amount': float(installment.amount),
            'due_date': installment.due_date.strftime('%Y-%m-%d'),
            'is_paid': installment.is_paid,
            'payment_date': installment.payment_date.strftime('%Y-%m-%d') if installment.payment_date else None
        } for installment in installments]
        
        treatment_data = {
            'id': plan.treatment.id,
            'treatment_date': plan.treatment.treatment_date.strftime('%Y-%m-%d'),
            'treatment_type': {
                'id': plan.treatment.treatment_type.id,
                'title': plan.treatment.treatment_type.title
            },
            'treatment_detail': {
                'id': plan.treatment.treatment_detail.id,
                'description': plan.treatment.treatment_detail.description
            },
            'doctor': plan.treatment.doctor.get_full_name() if plan.treatment.doctor else '',
        }
        
        return JsonResponse({
            'id': plan.id,
            'treatment': treatment_data,
            'total_amount': float(plan.total_amount),
            'down_payment': float(plan.down_payment),
            'installment_count': plan.installment_count,
            'installment_amount': float(plan.installment_amount),
            'start_date': plan.start_date.strftime('%Y-%m-%d'),
            'created_at': plan.created_at.strftime('%Y-%m-%d'),
            'installments': installment_data,
            'paid_count': sum(1 for installment in installments if installment.is_paid),
            'remaining_count': sum(1 for installment in installments if not installment.is_paid)
        })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطا در دریافت جزئیات طرح اقساطی: {str(e)}'
        }, status=400)


@require_http_methods(["POST"])
def pay_installment(request, installment_id):
    """پرداخت قسط"""
    try:
        installment = get_object_or_404(Installment, pk=installment_id)
        
        # اگر قبلاً پرداخت شده باشد، خطا برگردان
        if installment.is_paid:
            return JsonResponse({
                'success': False,
                'message': 'این قسط قبلاً پرداخت شده است'
            }, status=400)
        
        with transaction.atomic():
            # ثبت پرداخت قسط
            installment.is_paid = True
            installment.payment_date = timezone.now().date()
            installment.save()
            
            # ایجاد رکورد پرداخت
            TreatmentPayment.objects.create(
                treatment=installment.plan.treatment,
                amount=installment.amount,
                payment_date=installment.payment_date,
                payment_method='cash',
                description=f'پرداخت قسط شماره {installment.id} از طرح اقساطی'
            )
            
            return JsonResponse({
                'success': True,
                'message': 'قسط با موفقیت پرداخت شد'
            })
    
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'خطا در پرداخت قسط: {str(e)}'
        }, status=400)

# Patient/views.py

@require_http_methods(["POST"])
@transaction.atomic # تضمین می‌کند که هر دو عملیات با هم انجام شوند
def refund_payment(request, payment_id):
    """ویو برای عودت وجه یک پرداخت و بازگرداندن آن به کیف پول بیمار"""
    try:
        payment = get_object_or_404(TreatmentPayment.objects.select_related('treatment__patient'), id=payment_id)
        
        if payment.payment_status == 'refunded':
            return JsonResponse({'success': False, 'message': 'این پرداخت قبلاً عودت داده شده است.'}, status=400)

        data = json.loads(request.body)
        reason = data.get('reason', 'بدون دلیل مشخص')

        # ۱. بروزرسانی وضعیت پرداخت
        payment.payment_status = 'refunded'
        payment.refund_date = timezone.now().date()
        payment.refund_reason = reason
        payment.save()

        # ۲. بازگرداندن مبلغ به کیف پول بیمار
        wallet, _ = Wallet.objects.get_or_create(patient=payment.treatment.patient)
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=payment.amount, # مبلغ مثبت است چون واریز به کیف پول است
            transaction_type='REFUND',
            description=f"عودت وجه برای پرداخت شماره {payment.id} - دلیل: {reason}",
            related_payment=payment,
            created_by=request.user
        )

        return JsonResponse({'success': True, 'message': 'مبلغ با موفقیت به کیف پول بیمار عودت داده شد.'})

    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)




# --- ویوهای جدید برای سیستم پرداخت ---


@require_http_methods(["POST"])
@transaction.atomic
def deposit_to_wallet(request, patient_id):
    """ویو برای شارژ کردن کیف پول بیمار"""
    try:
        patient = get_object_or_404(PatientRecord, id=patient_id)
        wallet, _ = Wallet.objects.get_or_create(patient=patient)
        data = json.loads(request.body)
        amount = Decimal(data.get('amount', '0'))

        if amount <= 0:
            return JsonResponse({'success': False, 'message': 'مبلغ باید مثبت باشد'}, status=400)

        WalletTransaction.objects.create(
            wallet=wallet,
            amount=amount,
            transaction_type='DEPOSIT',
            description=data.get('description', 'شارژ کیف پول'),
            created_by=request.user
        )
        return JsonResponse({'success': True, 'message': 'کیف پول با موفقیت شارژ شد'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@require_http_methods(["POST"])
@transaction.atomic
def pay_from_wallet(request, treatment_id):
    """ویو برای پرداخت هزینه درمان از کیف پول"""
    try:
        treatment = get_object_or_404(Treatment, id=treatment_id)
        wallet = Wallet.objects.get(patient=treatment.patient)
        data = json.loads(request.body)
        amount = Decimal(data.get('amount', '0'))

        if amount <= 0:
            return JsonResponse({'success': False, 'message': 'مبلغ باید مثبت باشد'}, status=400)
        if wallet.balance < amount:
            return JsonResponse({'success': False, 'message': 'موجودی کیف پول کافی نیست'}, status=400)

        # ثبت تراکنش برداشت از کیف پول
        WalletTransaction.objects.create(
            wallet=wallet,
            amount=-amount,
            transaction_type='PAYMENT',
            description=f"پرداخت برای: {treatment.treatment_detail.description}",
            related_treatment=treatment,
            created_by=request.user
        )
        # ثبت پرداخت برای درمان
        TreatmentPayment.objects.create(
            treatment=treatment,
            amount=amount,
            payment_date=timezone.now().date(),
            payment_method='wallet',
            payment_status='paid'
        )
        return JsonResponse({'success': True, 'message': 'پرداخت از کیف پول با موفقیت انجام شد'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@require_http_methods(["POST"])
@transaction.atomic
def transfer_from_wallet(request, patient_id):
    """ویو برای انتقال وجه از کیف پول یک بیمار به بیمار دیگر"""
    try:
        sender_patient = get_object_or_404(PatientRecord, id=patient_id)
        sender_wallet = Wallet.objects.get(patient=sender_patient)
        data = json.loads(request.body)
        amount = Decimal(data.get('amount', '0'))
        recipient_file_num = data.get('recipient_file_num')

        if not recipient_file_num:
            return JsonResponse({'success': False, 'message': 'شماره پرونده گیرنده الزامی است'}, status=400)
        
        recipient_patient = get_object_or_404(PatientRecord, file_num=recipient_file_num)
        recipient_wallet, _ = Wallet.objects.get_or_create(patient=recipient_patient)

        if sender_wallet.balance < amount:
            return JsonResponse({'success': False, 'message': 'موجودی کیف پول فرستنده کافی نیست'}, status=400)

        # تراکنش برداشت از فرستنده
        WalletTransaction.objects.create(
            wallet=sender_wallet,
            amount=-amount,
            transaction_type='TRANSFER_OUT',
            description=f"انتقال به بیمار: {recipient_patient.get_full_name()}",
            created_by=request.user
        )
        # تراکنش واریز به گیرنده
        WalletTransaction.objects.create(
            wallet=recipient_wallet,
            amount=amount,
            transaction_type='TRANSFER_IN',
            description=f"دریافت از بیمار: {sender_patient.get_full_name()}",
            created_by=request.user
        )
        return JsonResponse({'success': True, 'message': 'انتقال وجه با موفقیت انجام شد'})
    except PatientRecord.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'بیمار گیرنده یافت نشد'}, status=404)
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)


@require_http_methods(["POST"])
def create_direct_payment(request, treatment_id):
    try:
        treatment = get_object_or_404(Treatment, id=treatment_id)
        data = json.loads(request.body)
        
        payment_method = data.get('payment_method', 'pos')
        
        # اگر روش پرداخت چک باشد، وضعیت را "در انتظار وصول" قرار بده
        payment_status = 'pending' if payment_method == 'check' else 'paid'

        TreatmentPayment.objects.create(
            treatment=treatment,
            amount=Decimal(data.get('amount', '0')),
            payment_date=timezone.now().date(),
            payment_method=payment_method,
            description=data.get('description', ''),
            payment_status=payment_status,
            # ذخیره اطلاعات چک
            check_number=data.get('check_number'),
            check_issuer=data.get('check_issuer'),
            check_bank=data.get('check_bank'),
            check_issue_date=convert_persian_date_str_to_gregorian(data.get('check_issue_date')),
            check_due_date=convert_persian_date_str_to_gregorian(data.get('check_due_date')),
        )
        return JsonResponse({'success': True, 'message': 'پرداخت با موفقیت ثبت شد'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

@login_required
def insurance_view(request, patient_id):
    """نمایش صفحه بیمه بیمار"""
    patient = get_object_or_404(PatientRecord, pk=patient_id)
    
    # دریافت بیمه‌های بیمار
    insurances = PatientInsurance.objects.filter(patient=patient)
    
    # دریافت انواع بیمه و بیمه‌گران
    insurance_types = InsuranceType.objects.all()
    insurance_providers = InsuranceProvider.objects.filter(is_active=True)
    
    context = {
        'patient': patient,
        'insurances': insurances,
        'insurance_types': insurance_types,
        'insurance_providers': insurance_providers,
        'today': timezone.now().date(),
    }
    
    # بررسی اینکه آیا درخواست AJAX است یا خیر
    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        # اگر درخواست AJAX است، فقط محتوای تب را برگردان
        return render(request, 'pation/tabs/__sub_tab_insurance.html', context)
    else:
        # اگر درخواست معمولی است، صفحه کامل را برگردان
        return render(request, 'pation/tabs/__sub_tab_insurance.html', context)



@require_http_methods(["POST"])
@transaction.atomic
def create_installment_plan(request, treatment_id):
    """ویو برای ایجاد طرح اقساط با بررسی عدم تکرار و تاریخ پرداخت صحیح"""
    try:
        treatment = get_object_or_404(Treatment, id=treatment_id)
        
        if InstallmentPlan.objects.filter(treatment=treatment).exists():
            return JsonResponse({
                'success': False, 
                'message': 'برای این درمان از قبل یک طرح اقساط تعریف شده است.'
            }, status=400)

        data = json.loads(request.body)
        
        down_payment = Decimal(data.get('down_payment', '0'))
        installment_count = int(data.get('installment_count', 1))
        interval_days = int(data.get('interval_days', 30))
        
        remaining_amount = treatment.payable_amount - down_payment
        if remaining_amount < 0 or installment_count <= 0: # اگر پیش پرداخت بیشتر از کل مبلغ بود
            return JsonResponse({'success': False, 'message': 'مبلغ پیش پرداخت نمی‌تواند بیشتر از کل مبلغ درمان باشد.'}, status=400)
        
        # اگر با پیش پرداخت کل مبلغ تسویه شد، طرح اقساط نساز
        if remaining_amount == 0 and down_payment > 0:
             TreatmentPayment.objects.create(
                treatment=treatment,
                amount=down_payment,
                payment_date=timezone.now().date(), # تاریخ امروز
                payment_method='down_payment',
                description='تسویه کامل با پیش پرداخت',
                payment_status='paid'
            )
             treatment.has_installment_plan = True # برای اینکه از لیست درمان‌های باز خارج شود
             treatment.save()
             return JsonResponse({'success': True, 'message': 'مبلغ با پیش پرداخت به طور کامل تسویه شد.'})

        installment_amount = round(remaining_amount / installment_count)

        plan = InstallmentPlan.objects.create(
            treatment=treatment,
            total_amount=treatment.payable_amount,
            down_payment=down_payment,
            installment_count=installment_count,
            installment_amount=installment_amount,
            start_date=timezone.now().date()
        )
        
        treatment.has_installment_plan = True
        treatment.save()
        
        for i in range(installment_count):
            due_date = timezone.now().date() + timedelta(days=((i + 1) * interval_days))
            Installment.objects.create(
                plan=plan,
                amount=installment_amount,
                due_date=due_date
            )
        
        if down_payment > 0:
            TreatmentPayment.objects.create(
                treatment=treatment,
                amount=down_payment,
                payment_date=timezone.now().date(), # [اصلاح شده] تاریخ امروز اضافه شد
                payment_method='down_payment',
                description='پیش پرداخت طرح اقساط',
                payment_status='paid'
            )

        return JsonResponse({'success': True, 'message': 'طرح اقساط با موفقیت ایجاد شد'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)





# Patient/views.py

@require_http_methods(["GET"])
def render_financial_tab(request, patient_id):
    """
    [نسخه نهایی] این ویو HTML تب پرداخت را با داده‌های کامل برای رفرش داینامیک برمی‌گرداند.
    """
    patient = get_object_or_404(PatientRecord, id=patient_id)
    
    # --- بخش ۱: داده‌های مالی و کیف پول ---
    wallet, _ = Wallet.objects.get_or_create(patient=patient)
     # ۱. کل هزینه درمان‌های انجام شده (قسطی یا غیرقسطی)
    total_treatment_cost = patient.treatments.filter(is_treatment_plan=False).aggregate(
    total=Coalesce(Sum('payable_amount'), Value(0), output_field=DecimalField()))['total']
    
    # ۲. کل مبلغ پرداخت شده توسط بیمار (از همه روش‌ها)
    total_paid_amount = TreatmentPayment.objects.filter(treatment__patient=patient,payment_status='paid').aggregate(
    total=Coalesce(Sum('amount'), Value(0), output_field=DecimalField()))['total']
    total_installments_amount = InstallmentPlan.objects.filter(treatment__patient=patient).aggregate(total=Coalesce(Sum('total_amount'), Value(0), output_field=DecimalField()))['total']

    # ۳. محاسبه وضعیت نهایی (بدهی یا بستانکاری)
    patient_balance = total_paid_amount - total_treatment_cost
    
    total_debt = abs(patient_balance) if patient_balance < 0 else 0
    total_credit = patient_balance if patient_balance > 0 else 0
    # [اصلاح شده] اضافه کردن نام پزشک به درمان‌های باز
    open_treatments_qs = patient.treatments.filter(
    is_treatment_plan=False,
    has_installment_plan=False
    ).select_related('treatment_detail', 'doctor').annotate(
    paid_amount=Coalesce(
        Sum('payments__amount', filter=Q(payments__payment_status='paid')),
        Value(0),
        output_field=DecimalField()
    ),
    # [اصلاح شده] استفاده از ExpressionWrapper برای مشخص کردن نوع خروجی محاسبه
    remaining_amount=ExpressionWrapper(
        F('payable_amount') - F('paid_amount'),
        output_field=DecimalField())).filter(remaining_amount__gt=0)

    # تبدیل QuerySet به لیست دیکشنری‌ها با تمام اطلاعات لازم
    open_treatments_list = []
    for t in open_treatments_qs:
        open_treatments_list.append({
            'id': t.id,
            'description': t.treatment_detail.description,
            'date': t.treatment_date,
            'payable_amount': t.payable_amount,
            'paid_amount': t.paid_amount,
            'remaining_amount': t.remaining_amount,
            'doctor_name': t.doctor.get_full_name() if t.doctor else '-',
        })

    #total_debt = sum(t['remaining_amount'] for t in open_treatments_list)

    # --- بخش ۲: تاریخچه و اقساط ---
    # (این بخش‌ها می‌توانند مثل قبل باقی بمانند چون ساختار داده ساده‌تری دارند)
    transaction_history = []
    direct_payments = TreatmentPayment.objects.filter(treatment__patient=patient).select_related('treatment__treatment_detail', 'treatment__doctor').order_by('-payment_date')
    for payment in direct_payments:
        transaction_history.append({
            'id': payment.id,
            'type': payment.get_payment_method_display(),
            'date': payment.payment_date,
            'description': f"پرداخت برای: {payment.treatment.treatment_detail.description}",
            'amount': -payment.amount,
            'status': payment.payment_status,
            'status_display': payment.get_payment_status_display(),
            'doctor_name': payment.treatment.doctor.get_full_name() if payment.treatment.doctor else '-',
        })
    
    wallet_transactions = wallet.transactions.all().order_by('-timestamp')
    for tx in wallet_transactions:
        transaction_history.append({
            'doctor_name': '-',
            'type': 'کیف پول',
            'date': tx.timestamp.date(),
            'description': tx.description,
            'amount': tx.amount,
            'status': tx.get_transaction_type_display(),
        })
    
    transaction_history.sort(key=lambda x: x['date'], reverse=True)

    unpaid_installments = Installment.objects.filter(plan__treatment__patient=patient, is_paid=False).select_related('plan__treatment__treatment_detail').order_by('due_date')
    all_installment_plans = InstallmentPlan.objects.filter(treatment__patient=patient).select_related('treatment__treatment_detail').order_by('-start_date')

    # --- بخش ۳: ساخت context ---
    context = {
        'patient': patient,
         # [داده‌های مالی جدید و صحیح]
        'wallet': wallet,
        'total_treatment_cost': total_treatment_cost,
        'total_paid_amount': total_paid_amount,
        'total_debt': total_debt,
        'total_credit': total_credit,
        
        'open_treatments': open_treatments_list, # ارسال لیست دیکشنری‌ها
        'transaction_history': transaction_history,
        'unpaid_installments': unpaid_installments,
        'all_installment_plans': all_installment_plans,
        'total_installments_amount': total_installments_amount,
        'patient_balance': patient_balance,
    }
    
    return render(request, 'pation/partials/_payment_dashboard_content.html', context)



@require_http_methods(["GET"])
def get_installment_plan_details(request, plan_id):
    """
    [نسخه نهایی] این ویو تمپلیت جزئیات یک طرح اقساط را رندر کرده و به صورت HTML برمی‌گرداند.
    """
    try:
        # با prefetch_related، تمام اقساط را در یک کوئری اضافه دریافت می‌کنیم تا بهینه‌تر باشد
        plan = get_object_or_404(InstallmentPlan.objects.prefetch_related('installments'), id=plan_id)
        
        context = {
            'plan': plan
        }
        
        # تمپلیت partial را با context داده شده رندر می‌کند
        return render(request, 'pation/partials/_installment_details_partial.html', context)
        
    except Exception as e:
        # در صورت بروز خطا، یک پیام HTML ساده و مناسب برای نمایش در مودال برمی‌گردانیم
        error_message = f'<div class="alert alert-danger text-center m-3">خطا در بارگذاری اطلاعات: {str(e)}</div>'
        return HttpResponse(error_message, status=400)



@require_http_methods(["DELETE"]) # فقط درخواست DELETE را قبول می‌کند
@transaction.atomic
def delete_payment(request, payment_id):
    """ویو برای حذف کامل یک رکورد پرداخت"""
    try:
        payment = get_object_or_404(TreatmentPayment, id=payment_id)
        payment.delete()
        return JsonResponse({'success': True, 'message': 'پرداخت با موفقیت حذف شد.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)

# Patient/views.py

def print_financial_statement(request, patient_id):
    """ویو برای آماده‌سازی و نمایش صورتحساب جهت پرینت حرارتی"""
    patient = get_object_or_404(PatientRecord, id=patient_id)
    
    # تمام محاسبات مالی را دوباره انجام می‌دهیم تا مستقل باشد
    total_treatment_cost = patient.treatments.filter(is_treatment_plan=False).aggregate(total=Coalesce(Sum('payable_amount'), Value(0), output_field=DecimalField()))['total']
    total_paid_amount = TreatmentPayment.objects.filter(treatment__patient=patient, payment_status='paid').aggregate(total=Coalesce(Sum('amount'), Value(0), output_field=DecimalField()))['total']
    patient_balance = total_paid_amount - total_treatment_cost
    
    # تاریخچه تراکنش‌ها
    transaction_history = []
    all_payments = TreatmentPayment.objects.filter(treatment__patient=patient).order_by('payment_date')
    for payment in all_payments:
        transaction_history.append(f"{payment.payment_date.strftime('%y/%m/%d')} - {payment.get_payment_method_display()}: {int(payment.amount):,}")

    context = {
        'patient': patient,
        'today': jdatetime.date.today().strftime('%Y/%m/%d'),
        'total_treatment_cost': total_treatment_cost,
        'total_paid_amount': total_paid_amount,
        'patient_balance': patient_balance,
        'transaction_history': transaction_history,
    }
    return render(request, 'pation/prints/thermal_print_statement.html', context)


# Patient/views.py

@require_http_methods(["POST"])
def clear_check_payment(request, payment_id):
    """ویو برای وصول کردن یک چک و تغییر وضعیت آن به 'پرداخت شده'"""
    try:
        payment = get_object_or_404(TreatmentPayment, id=payment_id, payment_method='check')
        
        if payment.payment_status != 'pending':
            return JsonResponse({'success': False, 'message': 'این چک در وضعیت قابل وصول نیست.'}, status=400)

        # وضعیت پرداخت را به 'پرداخت شده' تغییر بده
        payment.payment_status = 'paid'
        payment.save(update_fields=['payment_status'])

        return JsonResponse({'success': True, 'message': 'چک با موفقیت وصول شد.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)





# Patient/views.py

def reminders_center_view(request):
    settings = ClinicSetting.get_solo()
    notification_days = settings.notification_days_before
    today = timezone.now().date()
    future_date = today + timedelta(days=notification_days)

    reminder_type = request.GET.get('type', 'all')
    seen_status = request.GET.get('seen', 'all')

    checks_qs = TreatmentPayment.objects.filter(
        payment_status='pending', check_due_date__range=[today, future_date]
    ).select_related('treatment__patient')

    installments_qs = Installment.objects.filter(
        is_paid=False, due_date__range=[today, future_date]
    ).select_related('plan__treatment__patient')

    if seen_status == 'seen':
        checks_qs = checks_qs.filter(is_reminder_seen=True)
        installments_qs = installments_qs.filter(is_reminder_seen=True)
    elif seen_status == 'unseen':
        checks_qs = checks_qs.filter(is_reminder_seen=False)
        installments_qs = installments_qs.filter(is_reminder_seen=False)

    # [مهم] ساختن یک لیست یکپارچه از دیکشنری‌ها
    reminders_list = []
    if reminder_type == 'all' or reminder_type == 'check':
        for check in checks_qs:
            reminders_list.append({
                'type_code': 'check',
                'type_name': 'چک',
                'reminder_id': check.id,
                'patient_id': check.treatment.patient.id,
                'patient_name': check.treatment.patient.get_full_name(),
                'patient_phone': check.treatment.patient.contant_info,
                'amount': check.amount,
                'due_date': check.check_due_date,
                'is_seen': check.is_reminder_seen,
            })
    
    if reminder_type == 'all' or reminder_type == 'installment':
        for inst in installments_qs:
            reminders_list.append({
                'type_code': 'installment',
                'type_name': 'قسط',
                'reminder_id': inst.id,
                'patient_id': inst.plan.treatment.patient.id, # مسیر صحیح برای قسط
                'patient_name': inst.plan.treatment.patient.get_full_name(),
                'patient_phone': inst.plan.treatment.patient.contant_info,
                'amount': inst.amount,
                'due_date': inst.due_date,
                'is_seen': inst.is_reminder_seen,
            })

    # مرتب‌سازی نهایی بر اساس تاریخ سررسید
    reminders_list.sort(key=lambda x: x['due_date'])

    context = {
        'reminders': reminders_list, # ارسال لیست جدید
        'filter_type': reminder_type,
        'filter_seen': seen_status,
    }
    return render(request, 'Patient/reminders_center.html', context)


# ویو جدید برای علامت زدن
@require_http_methods(["POST"])
def mark_reminder_as_seen(request):
    try:
        data = json.loads(request.body)
        reminder_type = data.get('type')
        reminder_id = data.get('id')

        if reminder_type == 'check':
            item = get_object_or_404(TreatmentPayment, id=reminder_id)
        elif reminder_type == 'installment':
            item = get_object_or_404(Installment, id=reminder_id)
        else:
            return JsonResponse({'success': False, 'message': 'نوع یادآوری نامعتبر است.'}, status=400)
        
        item.is_reminder_seen = True
        item.save(update_fields=['is_reminder_seen'])
        
        return JsonResponse({'success': True, 'message': 'با موفقیت علامت زده شد.'})
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)}, status=400)
    
    
@login_required
def print_treatment(request, treatment_id):
    """نمایش صفحه پرینت درمان"""
    try:
        treatment = get_object_or_404(Treatment, id=treatment_id)
        
        # دریافت تنظیمات کلینیک
        clinic_settings = ClinicSetting.get_solo()
        
        # دریافت اطلاعات بیمه بیمار - اصلاح شده
        patient_insurance = None
        if treatment.insurance_provider:
            try:
                patient_insurance = PatientInsurance.objects.filter(
                    patient=treatment.patient,
                    insurance_provider=treatment.insurance_provider,
                    is_active=True
                ).first()  # فقط اولین رکورد را برمی‌گرداند
            except Exception as e:
                print(f"Error getting patient insurance: {str(e)}")
        
        context = {
            'treatment': treatment,
            'patient': treatment.patient,
            'patient_insurance': patient_insurance,
            'clinic_name': clinic_settings.clinic_name,
            'clinic_phone': clinic_settings.phone_number1,
            'clinic_address': f"{clinic_settings.province}، {clinic_settings.city}، {clinic_settings.address}",
            'currency_unit': clinic_settings.currency_unit,
            'clinic_logo': clinic_settings.clinic_logo.url if clinic_settings.clinic_logo else None,
            'print_date': jdatetime.date.today().strftime('%Y/%m/%d'),
            'doctor_name': treatment.doctor.get_full_name() if treatment.doctor else request.user.get_full_name()
        }
        
        return render(request, 'pation/prints/print_treatment.html', context)
    except Exception as e:
        import traceback
        print(f"Error in print_treatment: {str(e)}")
        print(traceback.format_exc())
        return HttpResponse(f"خطا در چاپ درمان: {str(e)}", status=500)


@login_required
def generate_invoice(request, treatment_id):
    """تولید فاکتور درمان"""
    try:
        
        import time
        treatment = get_object_or_404(Treatment, id=treatment_id)
        
        # دریافت تنظیمات کلینیک
        clinic_settings = ClinicSetting.get_solo()
        
        # دریافت اطلاعات بیمه بیمار - اصلاح شده
        patient_insurance = None
        if treatment.insurance_provider:
            try:
                patient_insurance = PatientInsurance.objects.filter(
                    patient=treatment.patient,
                    insurance_provider=treatment.insurance_provider,
                    is_active=True
                ).first()  # فقط اولین رکورد را برمی‌گرداند
            except Exception as e:
                print(f"Error getting patient insurance: {str(e)}")
        
        # دریافت پرداخت‌های مربوط به این درمان
        payments = treatment.payments.filter(payment_status='paid')
        total_paid = payments.aggregate(total=Sum('amount'))['total'] or 0
        
        context = {
            'treatment': treatment,
            'patient': treatment.patient,
            'patient_insurance': patient_insurance,
            'payments': payments,
            'total_paid': total_paid,
            'remaining': treatment.payable_amount - total_paid,
            'invoice_number': f"INV-{treatment.id}-{int(time.time())}",  # شماره فاکتور منحصر به فرد
            'invoice_date': jdatetime.date.today().strftime('%Y/%m/%d'),
            'clinic_name': clinic_settings.clinic_name,
            'clinic_phone': clinic_settings.phone_number1,
            'clinic_address': f"{clinic_settings.province}، {clinic_settings.city}، {clinic_settings.address}",
            'currency_unit': clinic_settings.currency_unit,
            'clinic_logo': clinic_settings.clinic_logo.url if clinic_settings.clinic_logo else None,
            'doctor_name': treatment.doctor.get_full_name() if treatment.doctor else request.user.get_full_name()
        }
        
        return render(request, 'pation/prints/invoice_treatment.html', context)
    except Exception as e:
        import traceback
        print(f"Error in generate_invoice: {str(e)}")
        print(traceback.format_exc())
        return HttpResponse(f"خطا در تولید فاکتور: {str(e)}", status=500)
