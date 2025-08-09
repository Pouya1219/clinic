# views.py
from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from datetime import datetime
import json
from users.models import Profile,Role
from schedules.models import WorkSchedule, DailySchedule, Holiday
from .models import Appointment,Unit
from django.core.exceptions import ValidationError
# اگر مدل داخل اپ دیگه‌ایه:
from Patient.models import PatientRecord
from Patient.models import TreatmentType, TreatmentDetail


@require_http_methods(["GET"])
def get_treatment_types(request):
    types = TreatmentType.objects.all().order_by('title')
    data = [{'id': t.id, 'title': t.title} for t in types]
    return JsonResponse({'status': 'success', 'results': data})


@require_http_methods(["GET"])
def get_treatment_details_by_type(request):
    type_id = request.GET.get('type_id')
    if not type_id:
        return JsonResponse({'status': 'error', 'message': 'نوع درمان مشخص نشده'}, status=400)

    details = TreatmentDetail.objects.filter(treatment_type_id=type_id).order_by('description')
    data = [{
        'id': d.id,
        'description': d.description,
        'international_code': d.international_code,
    } for d in details]

    return JsonResponse({'status': 'success', 'results': data})



@require_http_methods(["GET"])
def live_search_patients(request):
    query = request.GET.get('query', '').strip()

    if not query:
        return JsonResponse({'status': 'error', 'message': 'عبارت جستجو وارد نشده'}, status=400)

    # جستجو در چند فیلد با contains (case-insensitive)
    results = PatientRecord.objects.filter(
        Q(name__icontains=query) |
        Q(family__icontains=query) |
        Q(national_code__icontains=query) |
        Q(file_num__icontains=query)
    )[:10]  # محدودیت برای پرفورمنس

    data = [{
        'id': p.id,
        'file_num': p.file_num,
        'first_name': p.name,
        'last_name': p.family,
        'file_number': p.file_num,
        'national_code': p.national_code,
        'phone': p.contant_info,

    } for p in results]

    return JsonResponse({'status': 'success', 'results': data})

@login_required
def appointment_calendar(request):
    """نمایش صفحه تقویم"""
    context = {
        'roles': Role.objects.all(),
        'units': Unit.objects.all(),
    }
    return render(request, 'appointments/calendar.html', context)

@require_http_methods(["GET"])
def get_doctors(request):
    """دریافت لیست پزشکان"""
    try:
        # اول چک کنیم که آیا نقش پزشک وجود دارد
        doctor_role = Role.objects.filter(name='پزشک').first()
        if not doctor_role:
            return JsonResponse({'error': 'نقش پزشک تعریف نشده است'}, status=404)

        # فیلتر پزشکان
        doctors = Profile.objects.filter(
            role=doctor_role,
            work_schedules__is_active=True
        ).distinct()

        # برای دیباگ
        print(f"Found {doctors.count()} doctors")

        data = [{
            'id': doc.id,
            'name': f"{doc.first_name} {doc.last_name}",
            'personal_number': doc.personal_number,
            'schedules': [{
                'id': sch.id,
                'title': sch.title,
                'is_active': sch.is_active
            } for sch in doc.work_schedules.filter(is_active=True)]
        } for doc in doctors]

        return JsonResponse(data, safe=False)

    except Exception as e:
        print(f"Error in get_doctors: {str(e)}")  # برای دیباگ
        return JsonResponse({'error': str(e)}, status=500)


@require_http_methods(["GET"])
def get_doctor_schedule(request, schedule_id):
    """دریافت جزئیات برنامه کاری"""
    schedule = get_object_or_404(WorkSchedule, id=schedule_id)
    # دریافت برنامه روزانه
    daily_schedules = schedule.daily_schedules.all()
    #print('daily_schedules',daily_schedules)
      
    # دریافت تعطیلات
    holidays = schedule.holidays.all()
    print('holidays',holidays)
    data = {
        'schedule_info': {
            'id': schedule.id,
            'title': schedule.title,
            'is_active': schedule.is_active,
            'total_hours': schedule.calculate_total_hours()
        },
        'daily_schedules': [{
            'day_of_week': ds.day_of_week,
            'day_name': ds.get_day_of_week_display(),
            'is_active': ds.is_active,
            'morning_start': ds.morning_start.strftime('%H:%M'),
            'morning_end': ds.morning_end.strftime('%H:%M'),
            'evening_start': ds.evening_start.strftime('%H:%M') if ds.evening_start else None,
            'evening_end': ds.evening_end.strftime('%H:%M') if ds.evening_end else None
        } for ds in daily_schedules],
        'holidays': [{
            'date': holiday.date.strftime('%Y-%m-%d'),
            'description': holiday.description
        } for holiday in holidays]
    }
    
    return JsonResponse(data)

@require_http_methods(["GET"])
def get_appointments(request):
    """دریافت لیست قرارهای ملاقات"""
    try:
        # Get query parameters
        schedule_id = request.GET.get('schedule_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        # Filter appointments based on parameters
        if all([schedule_id, start_date, end_date]):
            appointments = Appointment.objects.filter(
                work_schedule_id=schedule_id,
                date__range=[start_date, end_date]
            ).select_related('doctor', 'treating_doctor', 'unit', 'created_by')
            
            #print(f'Found {appointments.count()} appointments for schedule {schedule_id}')
            
            data = [{
                'id': appointment.id,
                'first_name': appointment.first_name,
                'last_name': appointment.last_name,
                'national_code': appointment.national_code,
                'phone': appointment.phone,
                'date': appointment.date.strftime('%Y-%m-%d'),
                'time_from': appointment.time_from.strftime('%H:%M'),
                'time_to': appointment.time_to.strftime('%H:%M'),
                'status': appointment.status,
                'description': appointment.description,
                'file_number': appointment.file_number,
                'visited': appointment.visited,
                'no_file': appointment.no_file,
                'treatment_type': appointment.treatment_type,
                'treatment_description': appointment.treatment_description,
                'referral': appointment.referral,
                'unit': appointment.unit.name if appointment.unit else None,
                'unit_id': appointment.unit.id if appointment.unit else None,
                'doctor': {
                    'id': appointment.doctor.id if appointment.doctor else None,
                    'name': appointment.doctor.get_full_name() if appointment.doctor else None
                },
                'treating_doctor': {
                    'id': appointment.treating_doctor.id if appointment.treating_doctor else None,
                    'name': appointment.treating_doctor.get_full_name() if appointment.treating_doctor else None
                },
                'created_by': {
                    'id': appointment.created_by.id if appointment.created_by else None,
                    'name': appointment.created_by.get_full_name() if appointment.created_by else None
                },
                'created_at': appointment.created_at.strftime('%Y-%m-%d %H:%M') if appointment.created_at else None,
                'updated_at': appointment.updated_at.strftime('%Y-%m-%d %H:%M') if appointment.updated_at else None,
            } for appointment in appointments]
            
            return JsonResponse(data, safe=False)
        else:
            return JsonResponse({
                'error': 'Missing required parameters: schedule_id, start_date, end_date'
            }, status=400)
            
    except Exception as e:
        print(f"Error in get_appointments: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=500)

@require_http_methods(["GET"])
def get_appointment_details(request, appointment_id):
    """دریافت جزئیات یک قرار ملاقات"""
    try:
        appointment = get_object_or_404(Appointment, id=appointment_id)
        #print('Fetching details for appointment_id:', appointment_id)
        
        data = {
            'id': appointment.id,
            'first_name': appointment.first_name,
            'last_name': appointment.last_name,
            'national_code': appointment.national_code,
            'phone': appointment.phone,
            'file_number': appointment.file_number,
            'date': appointment.date.strftime('%Y-%m-%d'),
            'time_from': appointment.time_from.strftime('%H:%M'),
            'time_to': appointment.time_to.strftime('%H:%M'),
            'status': appointment.status,
            'visited': appointment.visited,
            'no_file': appointment.no_file,
            'treatment_type': appointment.treatment_type,
            'treatment_description': appointment.treatment_description,
            'referral': appointment.referral,
            'description': appointment.description,
            'unit': appointment.unit.id if appointment.unit else None,
            'unit_name': str(appointment.unit) if appointment.unit else None,
            'doctor': {
                'id': appointment.doctor.id,
                'name': appointment.doctor.get_full_name()
            } if appointment.doctor else None,
            'treating_doctor': {
                'id': appointment.treating_doctor.id,
                'name': appointment.treating_doctor.get_full_name()
            } if appointment.treating_doctor else None,
            'created_by': {
                'id': appointment.created_by.id,
                'name': appointment.created_by.get_full_name()
            } if appointment.created_by else None,
            'created_at': appointment.created_at.strftime('%Y-%m-%d %H:%M'),
            'updated_at': appointment.updated_at.strftime('%Y-%m-%d %H:%M'),
        }
        
        return JsonResponse(data)
        
    except Exception as e:
        print(f"Error in get_appointment_details: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return JsonResponse({'error': str(e)}, status=400)


@require_http_methods(["POST"])
def save_appointment(request):
    """ذخیره قرار ملاقات"""
    try:
        data = json.loads(request.body)

        # بررسی فرمت تاریخ
        try:
            appointment_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            data['date'] = appointment_date
        except ValueError as e:
            print(f"Date format error: {e}")  # برای دیباگ
            return JsonResponse({
                'error': 'فرمت تاریخ نامعتبر است. لطفاً به صورت YYYY-MM-DD وارد کنید'
            }, status=400)

        # ایجاد قرار ملاقات با فیلدهای جدید
        appointment = Appointment.objects.create(
            # فیلدهای قبلی
            doctor_id=data.get('doctor_id'),
            work_schedule_id=data.get('schedule_id'),
            first_name=data.get('first_name'),
            last_name=data.get('last_name'),
            national_code=data.get('national_code'),
            phone=data.get('phone'),
            date=data['date'],
            time_from=data.get('time_from'),
            time_to=data.get('time_to'),
            status=data.get('status', 'normal'),  # مقدار پیش‌فرض normal
            description=data.get('description', ''),
            file_number=data.get('file_number', ''),
            visited=data.get('visited', False),
            no_file=data.get('no_file', False),
            unit_id=data.get('unit_id'),
            created_by_id=request.user.id,
            
            # فیلدهای جدید
            treatment_type=data.get('treatment_type', ''),
            treatment_description=data.get('treatment_description', ''),
            referral=data.get('referral', ''),
            treating_doctor_id=data.get('treating_doctor_id')  # پزشک معالج
        )

        # اعتبارسنجی داده‌ها
        try:
            appointment.full_clean()
        except ValidationError as e:
            appointment.delete()  # حذف رکورد ایجاد شده در صورت خطا
            return JsonResponse({
                'error': 'خطا در اعتبارسنجی داده‌ها',
                'details': dict(e)
            }, status=400)

        return JsonResponse({
            'status': 'success',
            'message': 'قرار ملاقات با موفقیت ثبت شد',
            'data': {
                'id': appointment.id,
                'first_name': appointment.first_name,
                'last_name': appointment.last_name,
                'date': appointment.date.strftime('%Y-%m-%d'),
                'time_from': appointment.time_from.strftime('%H:%M'),
                'time_to': appointment.time_to.strftime('%H:%M'),
                'status': appointment.status,
                'treatment_type': appointment.treatment_type,
                'treating_doctor': appointment.treating_doctor.get_full_name() if appointment.treating_doctor else None
            }
        })

    except json.JSONDecodeError:
        return JsonResponse({
            'error': 'داده‌های ارسالی نامعتبر است'
        }, status=400)
        
    except Exception as e:
        print(f"Error saving appointment: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return JsonResponse({
            'error': str(e)
        }, status=400)



@require_http_methods(["DELETE"])
def delete_appointment(request, appointment_id):
    """حذف قرار ملاقات"""
    appointment = get_object_or_404(Appointment, id=appointment_id)
    appointment.delete()
    return JsonResponse({
        'message': 'قرار ملاقات با موفقیت حذف شد'
    })
# views.py
@require_http_methods(["GET"])
def get_units(request):
    """دریافت لیست همه یونیت‌ها"""
    try:
        units = Unit.objects.all()
        data = [{
            'id': unit.id,
            'name': unit.name,
            'parent_id': unit.parent_id,
            'parent_name': unit.parent.name if unit.parent else None
        } for unit in units]
        return JsonResponse(data, safe=False)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

# Add to appointments/views.py




@require_http_methods(["PATCH"])
def update_appointment(request, appointment_id):
    print('update_appointment view ویو کار  میکنه:')
    try:
        data = json.loads(request.body)
        appointment = get_object_or_404(Appointment, id=appointment_id)
        print(request.body)
        print("📌 before update:", appointment.__dict__)

        # فقط فیلدهای مجاز برای آپدیت
        allowed_fields = {
            'first_name',
            'last_name',
            'national_code',
            'phone',
            'treatment_type',
            'treatment_description',
            'status',
            'unit',
            'description',           
            'visited',
            'no_file'
        }
        # فیلترکردن فیلدهای مجاز از داده‌های ورودی
        update_data = {
            key: value 
            for key, value in data.items() 
            if key in allowed_fields
        }

        # آپدیت فیلدهای ساده
        fields_to_update = []

        for field, value in update_data.items():
            if field == 'unit':
                setattr(appointment, 'unit_id', value if value else None)
                fields_to_update.append('unit_id')
            else:
                setattr(appointment, field, value)
                fields_to_update.append(field)

        try:
            # اعتبارسنجی فقط فیلدهای آپدیت شده
            appointment.clean_fields(exclude=[
                f for f in appointment._meta.fields 
                if f.name not in update_data
            ])
            appointment.save(update_fields=fields_to_update)
            print("🎯 saved appointment:", appointment.__dict__)

            return JsonResponse({
                'status': 'success',
                'message': 'نوبت با موفقیت بروزرسانی شد',
                'data': {
                    'id': appointment.id,
                    'first_name': appointment.first_name,
                    'last_name': appointment.last_name,
                    'status': appointment.status,
                    'updated_fields': list(update_data.keys())
                }
            })

        except ValidationError as ve:
            return JsonResponse({
                'status': 'error',
                'message': 'خطا در اعتبارسنجی داده‌ها',
                'errors': dict(ve)
            }, status=400)

    except json.JSONDecodeError:
        return JsonResponse({
            'status': 'error',
            'message': 'داده‌های ارسالی نامعتبر است'
        }, status=400)

    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        }, status=500)


@require_http_methods(["GET"])
def get_treating_doctors(request):
    """دریافت لیست پزشکان"""
    try:
        # اول چک کنیم که آیا نقش پزشک وجود دارد
        doctor_role = Role.objects.filter(name='پزشک').first()
        if not doctor_role:
            return JsonResponse({'error': 'نقش پزشک تعریف نشده است'}, status=404)

        # فیلتر پزشکان
        treating = Profile.objects.filter(
            role=doctor_role,
            work_schedules__is_active=True
        ).distinct()

        # برای دیباگ
        print(f"Found {treating.count()} doctors")

        data = [{
            'id': doc.id,
            'name': f"{doc.first_name} {doc.last_name}",
            'personal_number': doc.personal_number,
            'schedules': [{
                'id': sch.id,
                'title': sch.title,
                'is_active': sch.is_active
            } for sch in doc.work_schedules.filter(is_active=True)]
        } for doc in treating]

        return JsonResponse(data, safe=False)

    except Exception as e:
        print(f"Error in get_doctors: {str(e)}")  # برای دیباگ
        return JsonResponse({'error': str(e)}, status=500)
    
