from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from .models import WorkSchedule, DailySchedule
from users.models import  Profile
from django.contrib.auth.decorators import login_required
import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from users.models import Profile
from .models import WorkSchedule, DailySchedule

@login_required
def schedule_view(request):
    # تغییر از is_active به is_activate
    profiles = Profile.objects.filter(is_activate=True, is_deleted=False)
    context = {
        'profiles': profiles
    }
    return render(request, 'schedules/schedule_main.html', context)



@require_http_methods(["POST"])
def save_schedule(request):
    try:
        data = json.loads(request.POST.get('schedule_data', '{}'))
        profile_id = request.POST.get('profile_id')
        
        print(f"Received profile_id: {profile_id}")  # برای دیباگ
        print(f"Received data: {data}")  # برای دیباگ
        
        if not profile_id:
            return JsonResponse({
                'status': 'error', 
                'message': 'پرسنل انتخاب نشده است'
            })

        profile = Profile.objects.get(id=profile_id, is_activate=True)
        
        # چک کردن وجود برنامه قبلی
        existing_schedule = WorkSchedule.objects.filter(profile=profile).first()
        
        if existing_schedule:
            return JsonResponse({
                'status': 'confirm',
                'message': f'برنامه کاری برای {profile.first_name} {profile.last_name} وجود دارد. آیا مایل به بروزرسانی هستید؟',
                'schedule_id': existing_schedule.id
            })
        
        # ایجاد برنامه جدید
        schedule = WorkSchedule.objects.create(profile=profile)
        
        # ذخیره برنامه‌های جدید
        for day_data in data['regular_days']:
            DailySchedule.objects.create(
                work_schedule=schedule,
                day_of_week=day_data['day_of_week'],
                is_active=day_data['is_active'],
                morning_start=day_data['morning_start'],
                morning_end=day_data['morning_end'],
                evening_start=day_data['evening_start'],
                evening_end=day_data['evening_end']
            )

        return JsonResponse({
            'status': 'success',
            'message': f'برنامه کاری برای {profile.first_name} {profile.last_name} با موفقیت ایجاد شد'
        })

    except Profile.DoesNotExist:
        return JsonResponse({
            'status': 'error',
            'message': 'پرسنل مورد نظر یافت نشد'
        })
    except Exception as e:
        print(f"Error: {str(e)}")  # برای دیباگ
        return JsonResponse({
            'status': 'error',
            'message': f'خطا در ذخیره برنامه: {str(e)}'
        })

@require_http_methods(["POST"])
def update_schedule(request):
    try:
        data = json.loads(request.POST.get('schedule_data', '{}'))
        profile_id = request.POST.get('profile_id')
        
        if not profile_id:
            return JsonResponse({
                'status': 'error', 
                'message': 'پرسنل انتخاب نشده است'
            })

        profile = Profile.objects.get(id=profile_id, is_activate=True)
        schedule = WorkSchedule.objects.get(profile=profile)
        
        # حذف برنامه‌های قبلی
        schedule.daily_schedules.all().delete()
        if 'holidays' in data:
            schedule.holidays.all().delete()
        
        # ذخیره برنامه‌های جدید
        for day_data in data['regular_days']:
            DailySchedule.objects.create(
                work_schedule=schedule,
                day_of_week=day_data['day_of_week'],
                is_active=day_data['is_active'],
                morning_start=day_data['morning_start'],
                morning_end=day_data['morning_end'],
                evening_start=day_data['evening_start'],
                evening_end=day_data['evening_end']
            )
        
        # ذخیره تعطیلات
        if 'holidays' in data:
            for holiday_data in data['holidays']:
                schedule.holidays.create(
                    date=holiday_data['date'],
                    description=holiday_data['description']
                )

        return JsonResponse({
            'status': 'success',
            'message': 'برنامه با موفقیت بروزرسانی شد'
        })

    except (Profile.DoesNotExist, WorkSchedule.DoesNotExist):
        return JsonResponse({
            'status': 'error',
            'message': 'برنامه مورد نظر یافت نشد'
        })
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': f'خطا در بروزرسانی برنامه: {str(e)}'
        })


@login_required
def load_schedule(request, profile_id):
    try:
        profile = Profile.objects.get(id=profile_id, is_activate=True)
        schedule = WorkSchedule.objects.filter(profile=profile).first()
        if schedule:
            data = {
                'status': 'success',
                'schedule': [
                    {
                        'day': daily.day_of_week,
                        'is_active': daily.is_active,
                        'morning_start': daily.morning_start.strftime('%H:%M'),
                        'morning_end': daily.morning_end.strftime('%H:%M'),
                        'evening_start': daily.evening_start.strftime('%H:%M'),
                        'evening_end': daily.evening_end.strftime('%H:%M'),
                    }
                    for daily in schedule.daily_schedules.all()
                ]
            }
        else:
            data = {
                'status': 'success',
                'schedule': []
            }
        return JsonResponse(data)
    except Profile.DoesNotExist:
        return JsonResponse({'status': 'error', 'message': 'Profile not found'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

# schedules/views.py



