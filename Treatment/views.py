# from datetime import timezone
# from django.shortcuts import render, get_object_or_404
# from django.http import JsonResponse
# from django.views.decorators.http import require_http_methods
# from django.views.decorators.csrf import ensure_csrf_cookie
# from django.db import transaction
# import json

# from .models import Treatment, TreatmentPayment
# from Patient.models import PatientRecord, InsuranceProvider , TreatmentType ,TreatmentDetail
# from users.models import CustomUser
# from django.shortcuts import render, get_object_or_404
# from django.http import JsonResponse
# from django.views.decorators.http import require_http_methods
# from django.views.decorators.csrf import ensure_csrf_cookie
# from django.db import transaction
# import json
# from django.utils import timezone

# from .models import Treatment, TreatmentPayment, InstallmentPlan, Installment
# from Patient.models import PatientRecord, InsuranceProvider, TreatmentType, TreatmentDetail
# from users.models import CustomUser

# from django.shortcuts import render, get_object_or_404
# from django.contrib.auth.decorators import login_required
# from django.utils import timezone
# from Patient.models import PatientRecord, InsuranceProvider, TreatmentType
# from users.models import CustomUser

# @login_required
# def treatment_view(request, patient_id):
#     """نمایش صفحه درمان بیمار"""
#     print("Treatment view called for patient ID:", patient_id)
#     patient = get_object_or_404(PatientRecord, pk=patient_id)
#     doctors = CustomUser.objects.filter(role__name="دکتر")
#     assistants = CustomUser.objects.filter(role__name="دستیار")
#     insurance_providers = InsuranceProvider.objects.filter(is_active=True)
#     treatment_types = TreatmentType.objects.prefetch_related('details').all()
#     today = timezone.now().date()
#     print("Patient found:", patient)
#     # لیست نواحی صورت (برای چارت صورت در JavaScript)
#     facial_areas = [
#         {'name': 'forehead', 'label': 'پیشانی', 'icon': 'fa-head-side-forehead'},
#         {'name': 'glabella', 'label': 'بین ابروها', 'icon': 'fa-ellipsis-v'},
#         {'name': 'right_eyebrow', 'label': 'ابروی راست', 'icon': 'fa-eye-slash'},
#         {'name': 'left_eyebrow', 'label': 'ابروی چپ', 'icon': 'fa-eye'},
#         {'name': 'right_eye', 'label': 'چشم راست', 'icon': 'fa-eye'},
#         {'name': 'left_eye', 'label': 'چشم چپ', 'icon': 'fa-eye'},
#         {'name': 'nose', 'label': 'بینی', 'icon': 'fa-nose'},
#         {'name': 'right_cheek', 'label': 'گونه راست', 'icon': 'fa-grin-squint-right'},
#         {'name': 'left_cheek', 'label': 'گونه چپ', 'icon': 'fa-grin-squint'},
#         {'name': 'upper_lip', 'label': 'لب بالا', 'icon': 'fa-lips'},
#         {'name': 'lower_lip', 'label': 'لب پایین', 'icon': 'fa-meh-rolling-eyes'},
#         {'name': 'chin', 'label': 'چانه', 'icon': 'fa-user-injured'},
#         {'name': 'right_jaw', 'label': 'فک راست', 'icon': 'fa-bone'},
#         {'name': 'left_jaw', 'label': 'فک چپ', 'icon': 'fa-bone'},
#         {'name': 'neck', 'label': 'گردن', 'icon': 'fa-tshirt'},
#     ]

#     context = {
#         'patient': patient,
#         'doctors': doctors,
#         'assistants': assistants,
#         'insurance_providers': insurance_providers,
#         'treatment_types': treatment_types,
#         'today': today,
#         'facial_areas': facial_areas,
#     }
    
#     # بررسی اینکه آیا درخواست AJAX است یا خیر
#     if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
#         # اگر درخواست AJAX است، فقط محتوای تب را برگردان
#         return render(request, 'Treatment/treatment_view.html', context)
#     else:
#         # اگر درخواست معمولی است، صفحه کامل را برگردان
#         return render(request, 'Treatment/treatment_view.html', context)


# @require_http_methods(["POST"])
# def create_treatment(request):
#     """ایجاد درمان جدید"""
#     try:
#         data = json.loads(request.body)
        
#         # ایجاد درمان جدید
#         treatment = Treatment(
#             patient_id=data.get('patient_id'),
#             treatment_date=data.get('treatment_date'),
#             next_visit_date=data.get('next_visit_date') if data.get('next_visit_date') else None,
#             treatment_type_id=data.get('treatment_type_id'),  # اصلاح شده
#             treatment_detail_id=data.get('treatment_detail_id'),  # اصلاح شده
#             treatment_areas=data.get('treatment_areas'),
#             area_type=data.get('area_type', 'teeth'),
#             doctor_id=data.get('doctor_id'),
#             assistant_id=data.get('assistant_id') if data.get('assistant_id') else None,
#             general_fee=data.get('general_fee'),
#             special_fee=data.get('special_fee'),
#             discount=data.get('discount', 0),
#             material_cost=data.get('material_cost', 0),
#             lab_cost=data.get('lab_cost', 0),
#             insurance_provider_id=data.get('insurance_provider_id') if data.get('insurance_provider_id') else None,
#             insurance_percentage=data.get('insurance_percentage', 0),
#             insurance_sent=data.get('insurance_sent', False),
#             is_completed=data.get('is_completed', False),
#             is_treatment_plan=data.get('is_treatment_plan', False),
#             insurance_paid=data.get('insurance_paid', False),
#             description=data.get('description', ''),
#         )
        
#         # محاسبه مبلغ قابل پرداخت
#         treatment.payable_amount = treatment.calculate_payable_amount()
        
#         treatment.save()
        
#         return JsonResponse({
#             'success': True,
#             'treatment_id': treatment.id,
#             'message': 'درمان با موفقیت ثبت شد'
#         })
    
#     except Exception as e:
#         return JsonResponse({
#             'success': False,
#             'message': f'خطا در ثبت درمان: {str(e)}'
#         }, status=400)


# @require_http_methods(["PUT"])
# def update_treatment(request, id):
#     """بروزرسانی درمان"""
#     try:
#         treatment = get_object_or_404(Treatment, pk=id)
#         data = json.loads(request.body)
        
#         # بروزرسانی فیلدها
#         treatment.treatment_date = data.get('treatment_date', treatment.treatment_date)
#         treatment.next_visit_date = data.get('next_visit_date') if data.get('next_visit_date') else None
#         treatment.treatment_type_id = data.get('treatment_type_id', treatment.treatment_type_id)  # اصلاح شده
#         treatment.treatment_detail_id = data.get('treatment_detail_id', treatment.treatment_detail_id)  # اصلاح شده
#         treatment.treatment_areas = data.get('treatment_areas', treatment.treatment_areas)
#         treatment.area_type = data.get('area_type', treatment.area_type)
#         treatment.doctor_id = data.get('doctor_id', treatment.doctor_id)
#         treatment.assistant_id = data.get('assistant_id') if data.get('assistant_id') else None
#         treatment.general_fee = data.get('general_fee', treatment.general_fee)
#         treatment.special_fee = data.get('special_fee', treatment.special_fee)
#         treatment.discount = data.get('discount', treatment.discount)
#         treatment.material_cost = data.get('material_cost', treatment.material_cost)
#         treatment.lab_cost = data.get('lab_cost', treatment.lab_cost)
#         treatment.insurance_provider_id = data.get('insurance_provider_id') if data.get('insurance_provider_id') else None
#         treatment.insurance_percentage = data.get('insurance_percentage', treatment.insurance_percentage)
#         treatment.insurance_sent = data.get('insurance_sent', treatment.insurance_sent)
#         treatment.is_completed = data.get('is_completed', treatment.is_completed)
#         treatment.is_treatment_plan = data.get('is_treatment_plan', treatment.is_treatment_plan)
#         treatment.insurance_paid = data.get('insurance_paid', treatment.insurance_paid)
#         treatment.description = data.get('description', treatment.description)
        
#         # محاسبه مبلغ قابل پرداخت
#         treatment.payable_amount = treatment.calculate_payable_amount()
        
#         treatment.save()
        
#         return JsonResponse({
#             'success': True,
#             'message': 'درمان با موفقیت بروزرسانی شد'
#         })
    
#     except Exception as e:
#         return JsonResponse({
#             'success': False,
#             'message': f'خطا در بروزرسانی درمان: {str(e)}'
#         }, status=400)


# @require_http_methods(["DELETE"])
# def delete_treatment(request, id):
#     """حذف درمان"""
#     try:
#         treatment = get_object_or_404(Treatment, pk=id)
#         treatment.delete()
        
#         return JsonResponse({
#             'success': True,
#             'message': 'درمان با موفقیت حذف شد'
#         })
    
#     except Exception as e:
#         return JsonResponse({
#             'success': False,
#             'message': f'خطا در حذف درمان: {str(e)}'
#         }, status=400)
# @require_http_methods(["GET"])
# def get_treatment(request, id):
#     """دریافت اطلاعات درمان"""
#     treatment = get_object_or_404(Treatment, pk=id)
    
#     data = {
#         'id': treatment.id,
#         'patient_id': treatment.patient_id,
#         'treatment_date': treatment.treatment_date.strftime('%Y-%m-%d'),
#         'next_visit_date': treatment.next_visit_date.strftime('%Y-%m-%d') if treatment.next_visit_date else None,
#         'treatment_type_id': treatment.treatment_type_id,
#         'treatment_detail_id': treatment.treatment_detail_id,
#         'treatment_areas': treatment.treatment_areas,
#         'area_type': treatment.area_type,
#         'doctor_id': treatment.doctor_id,
#         'assistant_id': treatment.assistant_id,
#         'general_fee': float(treatment.general_fee),
#         'special_fee': float(treatment.special_fee),
#         'discount': float(treatment.discount),
#         'material_cost': float(treatment.material_cost),
#         'lab_cost': float(treatment.lab_cost),
#         'payable_amount': float(treatment.payable_amount),
#         'insurance_provider_id': treatment.insurance_provider_id,
#         'insurance_percentage': treatment.insurance_percentage,
#         'insurance_sent': treatment.insurance_sent,
#         'is_completed': treatment.is_completed,
#         'is_treatment_plan': treatment.is_treatment_plan,
#         'insurance_paid': treatment.insurance_paid,
#         'description': treatment.description,
#     }
    
#     return JsonResponse(data)


# @require_http_methods(["GET"])
# def list_treatments(request, patient_id):
#     """دریافت لیست درمان‌های بیمار"""
#     treatments = Treatment.objects.filter(patient_id=patient_id).order_by('-treatment_date')
    
#     data = [{
#         'id': treatment.id,
#         'treatment_date': treatment.treatment_date,
#         'treatment_type': treatment.treatment_type,
#         'treatment_description': treatment.treatment_description,
#         'treatment_areas': treatment.treatment_areas,
#         'doctor_name': treatment.doctor.get_full_name() if treatment.doctor else '',
#         'assistant_name': treatment.assistant.get_full_name() if treatment.assistant else '',
#         'general_fee': treatment.general_fee,
#         'special_fee': treatment.special_fee,
#         'discount': treatment.discount,
#         'material_cost': treatment.material_cost,
#         'lab_cost': treatment.lab_cost,
#         'payable_amount': treatment.payable_amount,
#         'insurance_sent': treatment.insurance_sent,
#         'is_completed': treatment.is_completed,
#         'next_visit_date': treatment.next_visit_date,
#         'is_treatment_plan': treatment.is_treatment_plan,
#     } for treatment in treatments]
    
#     return JsonResponse(data, safe=False)

# @require_http_methods(["POST"])
# def create_payment(request):
#     """ایجاد پرداخت جدید"""
#     try:
#         data = json.loads(request.body)
        
#         payment = TreatmentPayment(
#             treatment_id=data.get('treatment_id'),
#             amount=data.get('amount'),
#             payment_date=data.get('payment_date'),
#             payment_method=data.get('payment_method'),
#             check_number=data.get('check_number'),
#             check_date=data.get('check_date'),
#             check_bank=data.get('check_bank'),
#             description=data.get('description'),
#         )
        
#         payment.save()
        
#         return JsonResponse({
#             'success': True,
#             'payment_id': payment.id,
#             'message': 'پرداخت با موفقیت ثبت شد'
#         })
    
#     except Exception as e:
#         return JsonResponse({
#             'success': False,
#             'message': f'خطا در ثبت پرداخت: {str(e)}'
#         }, status=400)

# @require_http_methods(["GET"])
# def get_insurance_provider(request, id):
#     """دریافت اطلاعات بیمه‌گر"""
#     insurance_provider = get_object_or_404(InsuranceProvider, pk=id)
    
#     data = {
#         'id': insurance_provider.id,
#         'name': insurance_provider.name,
#         'insurance_type': {
#             'id': insurance_provider.insurance_type.id,
#             'name': insurance_provider.insurance_type.name,
#         },
#         'code': insurance_provider.code,
#         'default_percentage': 70,  # مقدار پیش‌فرض برای درصد پوشش بیمه
#     }
    
#     return JsonResponse(data)


# @require_http_methods(["GET"])
# def get_treatment_details(request, type_id):
#     """دریافت جزئیات درمان‌های مربوط به یک نوع درمان"""
#     details = TreatmentDetail.objects.filter(treatment_type_id=type_id)
    
#     data = [{
#         'id': detail.id,
#         'description': detail.description,
#         'international_code': detail.international_code,
#         'public_tariff': str(detail.public_tariff),
#         'special_tariff': str(detail.special_tariff),
#     } for detail in details]
    
#     return JsonResponse(data, safe=False)
