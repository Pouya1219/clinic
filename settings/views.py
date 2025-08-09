# settings/views.py
import json
from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import AppointmentSettings
from .forms import AppointmentSettingsForm
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import ensure_csrf_cookie
from django.core.exceptions import ValidationError
from django.db import transaction
from django.views.decorators.csrf import csrf_exempt
from Patient.models import InsuranceType, InsuranceProvider, TreatmentType, TreatmentDetail
from django.views.decorators.csrf import ensure_csrf_cookie
from .models import ClinicSetting
from .forms import ClinicSettingForm



@login_required
def settings_view(request):
    settings = AppointmentSettings.get_settings()
    
    if request.method == 'POST':
        form = AppointmentSettingsForm(request.POST, instance=settings)
        if form.is_valid():
            form.save()
            messages.success(request, 'تنظیمات با موفقیت ذخیره شد')
            return redirect('settings_app:settings_view')
    else:
        form = AppointmentSettingsForm(instance=settings)

    context = {
        'form': form,
        'active_tab': request.GET.get('tab', 'appointment')
    }
    return render(request, 'settings/settings.html', context)

@login_required
def get_settings_json(request):
    settings = AppointmentSettings.get_settings()
    data = {
        'visit_duration': settings.visit_duration,
        'allow_past_edit': settings.allow_past_edit,
        'show_patient_info': settings.show_patient_info,
        'calendar_start_time': settings.calendar_start_time.strftime('%H:%M'),
        'calendar_end_time': settings.calendar_end_time.strftime('%H:%M'),
        'colors': {
            'normal': settings.normal_appointment_color,
            'emergency': settings.emergency_appointment_color,
            'pending': settings.pending_appointment_color,
        }
    }
    return JsonResponse(data)




@ensure_csrf_cookie
def tree_view(request):
    """نمایش صفحه اصلی درختواره"""
    insurance_types = InsuranceType.objects.all().prefetch_related('providers')
    treatment_types = TreatmentType.objects.all().prefetch_related('details')
    print(f"Insurance types count: {insurance_types.count()}")
    for ins_type in insurance_types:
        print(f"  - {ins_type.name}: {ins_type.providers.count()} providers")
    
    print(f"Treatment types count: {treatment_types.count()}")
    for treat_type in treatment_types:
        print(f"  - {treat_type.title}: {treat_type.details.count()} details")
    context = {
        'insurance_types': insurance_types,
        'treatment_types': treatment_types,
    }
    
    return render(request, 'settings_app/tree_view.html', context)

# ویوهای فرم

def insurance_type_form(request, id=None):
    """نمایش فرم نوع بیمه"""
    insurance_type = None
    if id and id != 'new':
        insurance_type = get_object_or_404(InsuranceType, pk=id)
    
    return render(request, 'settings_app/forms/insurance_type_form.html', {
        'insurance_type': insurance_type,
    })

def insurance_provider_form(request, id=None, parent_id=None):
    """نمایش فرم بیمه‌گر"""
    provider = None
    if id and id != 'new':
        provider = get_object_or_404(InsuranceProvider, pk=id)
    
    # دریافت تمام انواع بیمه
    insurance_types = InsuranceType.objects.all()
    
    # اگر parent_id وجود دارد، نوع بیمه مربوطه را پیدا کن
    parent_insurance_type = None
    if parent_id:
        try:
            parent_insurance_type = InsuranceType.objects.get(pk=parent_id)
            print(f"Found parent insurance type: {parent_insurance_type}")
        except InsuranceType.DoesNotExist:
            print(f"Parent insurance type with id={parent_id} not found")
    
    context = {
        'provider': provider,
        'parent_id': parent_id,
        'insurance_types': insurance_types,
        'parent_insurance_type': parent_insurance_type,
    }
    
    print(f"Context: {context}")
    
    return render(request, 'settings_app/forms/insurance_provider_form.html', context)

def treatment_type_form(request, id=None):
    """نمایش فرم نوع درمان"""
    treatment_type = None
    if id and id != 'new':
        treatment_type = get_object_or_404(TreatmentType, pk=id)
    
    return render(request, 'settings_app/forms/treatment_type_form.html', {
        'treatment_type': treatment_type,
    })

def treatment_detail_form(request, id=None, parent_id=None):
    """نمایش فرم جزئیات درمان"""
    print(f"treatment_detail_form called with id={id}, parent_id={parent_id}")
    
    detail = None
    if id and id != 'new':
        try:
            detail = TreatmentDetail.objects.get(pk=id)
            print(f"Found detail: {detail}")
        except TreatmentDetail.DoesNotExist:
            print(f"Detail with id={id} not found")
    
    # دریافت تمام انواع درمان
    treatment_types = TreatmentType.objects.all()
    print(f"Treatment types count: {treatment_types.count()}")
    
    # اگر parent_id وجود دارد، نوع درمان مربوطه را پیدا کن
    parent_treatment_type = None
    if parent_id and parent_id != 'None' and parent_id != '':
        try:
            parent_treatment_type = TreatmentType.objects.get(pk=parent_id)
            print(f"Found parent treatment type: {parent_treatment_type}")
        except TreatmentType.DoesNotExist:
            print(f"Parent treatment type with id={parent_id} not found")
        except ValueError:
            print(f"Invalid parent_id: {parent_id}")
    
    context = {
        'detail': detail,
        'parent_id': parent_id,
        'treatment_types': treatment_types,
        'parent_treatment_type': parent_treatment_type,
    }
    
    print(f"Context: {context}")
    
    return render(request, 'settings_app/forms/treatment_detail_form.html', context)



# API ویوها

@require_http_methods(["GET"])
def insurance_type_list(request):
    """دریافت لیست انواع بیمه"""
    insurance_types = InsuranceType.objects.all()
    data = [
        {
            'id': item.id,
            'name': item.name,
            'code': item.code,
            'description': item.description,
        }
        for item in insurance_types
    ]
    return JsonResponse(data, safe=False)

@require_http_methods(["GET", "PUT", "DELETE"])
def insurance_type_detail(request, id):
    """مدیریت جزئیات نوع بیمه"""
    insurance_type = get_object_or_404(InsuranceType, pk=id)
    
    if request.method == "GET":
        data = {
            'id': insurance_type.id,
            'name': insurance_type.name,
            'code': insurance_type.code,
            'description': insurance_type.description,
        }
        return JsonResponse(data)
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            insurance_type.name = data.get('name', insurance_type.name)
            insurance_type.code = data.get('code', insurance_type.code)
            insurance_type.description = data.get('description', insurance_type.description)
            
            insurance_type.full_clean()
            insurance_type.save()
            
            return JsonResponse({
                'id': insurance_type.id,
                'name': insurance_type.name,
                'code': insurance_type.code,
                'description': insurance_type.description,
            })
        
        except ValidationError as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == "DELETE":
        # جلوگیری از حذف انواع بیمه اصلی
        if insurance_type.name in ['آزاد', 'درصدی', 'تعرفه‌ای']:
            return JsonResponse({
                'error': 'انواع بیمه اصلی قابل حذف نیستند',
                'details': 'این نوع بیمه جزو انواع اصلی است و نمی‌توان آن را حذف کرد'
            }, status=403)
        
        try:
            with transaction.atomic():
                insurance_type.delete()
            return JsonResponse({'success': True}, status=204)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        

@csrf_exempt
@require_http_methods(["POST"])
def insurance_type_create(request):
    """ایجاد نوع بیمه جدید"""
    try:
        # برای درخواست‌های FormData
        name = request.POST.get('name')
        code = request.POST.get('code')
        description = request.POST.get('description')
        
        insurance_type = InsuranceType(
            name=name,
            code=code,
            description=description,
        )
        
        insurance_type.full_clean()
        insurance_type.save()
        
        return JsonResponse({
            'id': insurance_type.id,
            'name': insurance_type.name,
            'code': insurance_type.code,
            'description': insurance_type.description,
        }, status=201)
    
    except ValidationError as e:
        return JsonResponse({'error': str(e)}, status=400)

# ویوهای بیمه‌گر (InsuranceProvider)
@csrf_exempt
@require_http_methods(["GET"])
def insurance_provider_list(request):
    """دریافت لیست بیمه‌گران"""
    providers = InsuranceProvider.objects.all().select_related('insurance_type')
    data = [
        {
            'id': item.id,
            'name': item.name,
            'insurance_type': {
                'id': item.insurance_type.id,
                'name': item.insurance_type.name,
            },
            'code': item.code,
            'contact_info': item.contact_info,
            'website': item.website,
            'is_active': item.is_active,
            'logo_url': item.logo.url if item.logo else None,
        }
        for item in providers
    ]
    return JsonResponse(data, safe=False)

@login_required
@require_http_methods(["GET", "PUT", "DELETE"])
def insurance_provider_detail(request, id):
    """مدیریت جزئیات بیمه‌گر"""
    provider = get_object_or_404(InsuranceProvider, pk=id)
    
    if request.method == "GET":
        data = {
            'id': provider.id,
            'name': provider.name,
            'insurance_type': {
                'id': provider.insurance_type.id,
                'name': provider.insurance_type.name,
            },
            'code': provider.code,
            'contact_info': provider.contact_info,
            'website': provider.website,
            'is_active': provider.is_active,
            'logo_url': provider.logo.url if provider.logo else None,
        }
        return JsonResponse(data)
    
    elif request.method == "PUT":
        try:
            # بررسی نوع محتوا
            content_type = request.META.get('CONTENT_TYPE', '')
            
            if 'multipart/form-data' in content_type or request.FILES:
                # برای فرم‌های حاوی فایل
                # در حالت ویرایش، نوع بیمه تغییر نمی‌کند (فقط خواندنی)
                provider.name = request.POST.get('name', provider.name)
                provider.code = request.POST.get('code', provider.code)
                provider.contact_info = request.POST.get('contact_info', provider.contact_info)
                provider.website = request.POST.get('website', provider.website)
                provider.is_active = request.POST.get('is_active', 'off') == 'on'
                
                if 'logo' in request.FILES:
                    provider.logo = request.FILES['logo']
            elif 'application/json' in content_type:
                # برای درخواست‌های JSON
                try:
                    data = json.loads(request.body)
                    # در حالت ویرایش، نوع بیمه تغییر نمی‌کند (فقط خواندنی)
                    provider.name = data.get('name', provider.name)
                    provider.code = data.get('code', provider.code)
                    provider.contact_info = data.get('contact_info', provider.contact_info)
                    provider.website = data.get('website', provider.website)
                    provider.is_active = data.get('is_active', provider.is_active)
                except json.JSONDecodeError:
                    return JsonResponse({'error': 'Invalid JSON'}, status=400)
            else:
                # برای سایر انواع محتوا
                return JsonResponse({'error': 'Unsupported content type'}, status=415)
            
            provider.full_clean()
            provider.save()
            
            return JsonResponse({
                'id': provider.id,
                'name': provider.name,
                'insurance_type': {
                    'id': provider.insurance_type.id,
                    'name': provider.insurance_type.name,
                },
                'code': provider.code,
                'contact_info': provider.contact_info,
                'website': provider.website,
                'is_active': provider.is_active,
                'logo_url': provider.logo.url if provider.logo else None,
            })
        
        except ValidationError as e:
            return JsonResponse({'error': str(e)}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    elif request.method == "DELETE":
        try:
            with transaction.atomic():
                provider.delete()
            return JsonResponse({'success': True}, status=204)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)



@login_required
@require_http_methods(["POST"])
def insurance_provider_create(request):
    """ایجاد بیمه‌گر جدید"""
    try:
        # بررسی نوع محتوا
        content_type = request.META.get('CONTENT_TYPE', '')
        
        if 'multipart/form-data' in content_type or request.FILES:
            # برای فرم‌های حاوی فایل
            insurance_type_id = request.POST.get('insurance_type')
            insurance_type = get_object_or_404(InsuranceType, pk=insurance_type_id)
            
            provider = InsuranceProvider(
                name=request.POST.get('name'),
                insurance_type=insurance_type,
                code=request.POST.get('code'),
                contact_info=request.POST.get('contact_info'),
                website=request.POST.get('website'),
                is_active=request.POST.get('is_active', 'off') == 'on',
            )
            
            if 'logo' in request.FILES:
                provider.logo = request.FILES['logo']
        elif 'application/json' in content_type:
            # برای درخواست‌های JSON
            try:
                data = json.loads(request.body)
                insurance_type_id = data.get('insurance_type')
                insurance_type = get_object_or_404(InsuranceType, pk=insurance_type_id)
                
                provider = InsuranceProvider(
                    name=data.get('name'),
                    insurance_type=insurance_type,
                    code=data.get('code'),
                    contact_info=data.get('contact_info'),
                    website=data.get('website'),
                    is_active=data.get('is_active', True),
                )
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
        else:
            # برای سایر انواع محتوا
            return JsonResponse({'error': 'Unsupported content type'}, status=415)
        
        provider.full_clean()
        provider.save()
        
        return JsonResponse({
            'id': provider.id,
            'name': provider.name,
            'insurance_type': {
                'id': provider.insurance_type.id,
                'name': provider.insurance_type.name,
            },
            'code': provider.code,
            'contact_info': provider.contact_info,
            'website': provider.website,
            'is_active': provider.is_active,
            'logo_url': provider.logo.url if provider.logo else None,
        }, status=201)
    
    except ValidationError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)



# ویوهای نوع درمان (TreatmentType)

@require_http_methods(["GET"])
def treatment_type_list(request):
    """دریافت لیست انواع درمان"""
    treatment_types = TreatmentType.objects.all()
    data = [
        {
            'id': item.id,
            'title': item.title,
        }
        for item in treatment_types
    ]
    return JsonResponse(data, safe=False)

@require_http_methods(["GET", "PUT", "DELETE"])
def treatment_type_detail(request, id):
    """مدیریت جزئیات نوع درمان"""
    treatment_type = get_object_or_404(TreatmentType, pk=id)
    
    if request.method == "GET":
        data = {
            'id': treatment_type.id,
            'title': treatment_type.title,
        }
        return JsonResponse(data)
    
    elif request.method == "PUT":
        try:
            data = json.loads(request.body)
            
            treatment_type.title = data.get('title', treatment_type.title)
            
            treatment_type.full_clean()
            treatment_type.save()
            
            return JsonResponse({
                'id': treatment_type.id,
                'title': treatment_type.title,
            })
        
        except ValidationError as e:
            return JsonResponse({'error': str(e)}, status=400)
    
    elif request.method == "DELETE":
        try:
            with transaction.atomic():
                treatment_type.delete()
            return JsonResponse({'success': True}, status=204)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        
        
@csrf_exempt
@require_http_methods(["POST"])
def treatment_type_create(request):
    """ایجاد نوع درمان جدید"""
    try:
        # بررسی نوع محتوا
        content_type = request.META.get('CONTENT_TYPE', '')
        
        if 'application/json' in content_type:
            # برای درخواست‌های JSON
            data = json.loads(request.body)
            title = data.get('title')
        else:
            # برای درخواست‌های فرم
            title = request.POST.get('title')
        
        treatment_type = TreatmentType(
            title=title,
        )
        
        treatment_type.full_clean()
        treatment_type.save()
        
        return JsonResponse({
            'id': treatment_type.id,
            'title': treatment_type.title,
        }, status=201)
    
    except ValidationError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Invalid JSON'}, status=400)


# ویوهای جزئیات درمان (TreatmentDetail)

@require_http_methods(["GET"])
def treatment_detail_list(request):
    """دریافت لیست جزئیات درمان"""
    details = TreatmentDetail.objects.all().select_related('treatment_type')
    data = [
        {
            'id': item.id,
            'treatment_type': {
                'id': item.treatment_type.id,
                'title': item.treatment_type.title,
            },
            'description': item.description,
            'international_code': item.international_code,
            'public_tariff': str(item.public_tariff),
            'special_tariff': str(item.special_tariff),
        }
        for item in details
    ]
    return JsonResponse(data, safe=False)

@login_required
@require_http_methods(["GET", "PUT", "DELETE"])
def treatment_detail_detail(request, id):
    """مدیریت جزئیات درمان"""
    detail = get_object_or_404(TreatmentDetail, pk=id)
    
    if request.method == "GET":
        data = {
            'id': detail.id,
            'treatment_type': {
                'id': detail.treatment_type.id,
                'title': detail.treatment_type.title,
            },
            'description': detail.description,
            'international_code': detail.international_code,
            'public_tariff': str(detail.public_tariff),
            'special_tariff': str(detail.special_tariff),
        }
        return JsonResponse(data)
    
    elif request.method == "PUT":
        try:
            # بررسی نوع محتوا
            content_type = request.META.get('CONTENT_TYPE', '')
            
            if 'multipart/form-data' in content_type or request.FILES:
                # برای فرم‌های حاوی فایل
                # در حالت ویرایش، نوع درمان تغییر نمی‌کند (فقط خواندنی)
                detail.description = request.POST.get('description', detail.description)
                detail.international_code = request.POST.get('international_code', detail.international_code)
                detail.public_tariff = request.POST.get('public_tariff', detail.public_tariff)
                detail.special_tariff = request.POST.get('special_tariff', detail.special_tariff)
            elif 'application/json' in content_type:
                # برای درخواست‌های JSON
                try:
                    data = json.loads(request.body)
                    # در حالت ویرایش، نوع درمان تغییر نمی‌کند (فقط خواندنی)
                    detail.description = data.get('description', detail.description)
                    detail.international_code = data.get('international_code', detail.international_code)
                    detail.public_tariff = data.get('public_tariff', detail.public_tariff)
                    detail.special_tariff = data.get('special_tariff', detail.special_tariff)
                except json.JSONDecodeError:
                    return JsonResponse({'error': 'Invalid JSON'}, status=400)
            else:
                # برای سایر انواع محتوا
                return JsonResponse({'error': 'Unsupported content type'}, status=415)
            
            detail.full_clean()
            detail.save()
            
            return JsonResponse({
                'id': detail.id,
                'treatment_type': {
                    'id': detail.treatment_type.id,
                    'title': detail.treatment_type.title,
                },
                'description': detail.description,
                'international_code': detail.international_code,
                'public_tariff': str(detail.public_tariff),
                'special_tariff': str(detail.special_tariff),
            })
        
        except ValidationError as e:
            return JsonResponse({'error': str(e)}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    elif request.method == "DELETE":
        try:
            with transaction.atomic():
                detail.delete()
            return JsonResponse({'success': True}, status=204)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)


@login_required
@require_http_methods(["POST"])
def treatment_detail_create(request):
    """ایجاد جزئیات درمان جدید"""
    try:
        # بررسی نوع محتوا
        content_type = request.META.get('CONTENT_TYPE', '')
        
        if 'multipart/form-data' in content_type or request.FILES:
            # برای فرم‌های حاوی فایل
            treatment_type_id = request.POST.get('treatment_type')
            treatment_type = get_object_or_404(TreatmentType, pk=treatment_type_id)
            
            detail = TreatmentDetail(
                treatment_type=treatment_type,
                description=request.POST.get('description'),
                international_code=request.POST.get('international_code'),
                public_tariff=request.POST.get('public_tariff'),
                special_tariff=request.POST.get('special_tariff'),
            )
        elif 'application/json' in content_type:
            # برای درخواست‌های JSON
            try:
                data = json.loads(request.body)
                treatment_type_id = data.get('treatment_type')
                treatment_type = get_object_or_404(TreatmentType, pk=treatment_type_id)
                
                detail = TreatmentDetail(
                    treatment_type=treatment_type,
                    description=data.get('description'),
                    international_code=data.get('international_code'),
                    public_tariff=data.get('public_tariff'),
                    special_tariff=data.get('special_tariff'),
                )
            except json.JSONDecodeError:
                return JsonResponse({'error': 'Invalid JSON'}, status=400)
        else:
            # برای سایر انواع محتوا
            return JsonResponse({'error': 'Unsupported content type'}, status=415)
        
        detail.full_clean()
        detail.save()
        
        return JsonResponse({
            'id': detail.id,
            'treatment_type': {
                'id': detail.treatment_type.id,
                'title': detail.treatment_type.title,
            },
            'description': detail.description,
            'international_code': detail.international_code,
            'public_tariff': str(detail.public_tariff),
            'special_tariff': str(detail.special_tariff),
        }, status=201)
    
    except ValidationError as e:
        return JsonResponse({'error': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)




@ensure_csrf_cookie
def insurance_provider_form_without_parent(request, id=None):
    """نمایش فرم بیمه‌گر بدون parent_id"""
    print(f"insurance_provider_form_without_parent called with id={id}")
    
    # ارسال درخواست به ویو اصلی با parent_id=None
    return insurance_provider_form(request, id, None)


@ensure_csrf_cookie
def treatment_detail_form_without_parent(request, id=None):
    """نمایش فرم جزئیات درمان بدون parent_id"""
    print(f"treatment_detail_form_without_parent called with id={id}")
    
    detail = None
    if id and id != 'new':
        try:
            detail = TreatmentDetail.objects.get(pk=id)
            print(f"Found detail: {detail}")
        except TreatmentDetail.DoesNotExist:
            print(f"Detail with id={id} not found")
    
    # دریافت تمام انواع درمان
    treatment_types = TreatmentType.objects.all()
    print(f"Treatment types count: {treatment_types.count()}")
    
    context = {
        'detail': detail,
        'parent_id': None,
        'treatment_types': treatment_types,
    }
    
    print(f"Context: {context}")
    
    return render(request, 'settings_app/forms/treatment_detail_form.html', context)


def settings_view(request):
    settings_obj = ClinicSetting.get_solo()
    
    if request.method == 'POST':
        form = ClinicSettingForm(request.POST, request.FILES, instance=settings_obj)
        if form.is_valid():
            form.save()
            messages.success(request, 'تنظیمات با موفقیت ذخیره شد.')
            return redirect('settings_app:settings_view')
    else:
        form = ClinicSettingForm(instance=settings_obj)
        
    context = {
        'form': form,
        # هر context دیگری که تمپلیت اصلی شما نیاز دارد را اینجا اضافه کنید
    }
    # تمپلیت اصلی صفحه تنظیمات را رندر کنید
    return render(request, 'settings/settings.html', context)
