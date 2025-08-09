
from django.contrib.auth import logout
from django.contrib.auth.decorators import login_required
from django.conf import settings
from django.contrib.auth.views import LoginView
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login
from .models import CustomUser, Role ,PersonnelCard
from django.shortcuts import render, redirect
from django.shortcuts import get_object_or_404, redirect
from django.contrib import messages
from django.utils import timezone
from datetime import timedelta
from django.shortcuts import render, get_object_or_404, redirect
from .models import Profile, Education, Specialty, Role, License
from django.db import transaction
import jdatetime
from .models import CustomUser, Profile, License, Role, Education, Specialty, UserLicense
from decimal import Decimal
from django.db import transaction


def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        # بررسی مقدارهای خالی یا None
        if not username or not password:
            return render(request, "users/login.html", {"error": "نام کاربری و رمز عبور نمی‌توانند خالی باشند!"})

        user = authenticate(request, username=username, password=password)

        if user:
            login(request, user)
            return redirect("dashboard")  # انتقال به صفحه داشبورد
        else:
            return render(request, "users/login.html", {"error": "نام کاربری یا رمز عبور اشتباه است!"})

    return render(request, "users/login.html")

@login_required
def dashboard_view(request):
    context = {
        "is_admin": request.user.is_superuser,  # بررسی ادمین بودن کاربر
        "software_version": settings.SOFTWARE_VERSION,  # ورژن نرم‌افزار از settings.py
    }
    return render(request, "dashboard.html", context)


@csrf_exempt
def logout_view(request):
    logout(request)
    return redirect("localhost") 


@login_required
def user_list(request):
    # دریافت همه پروفایل‌های فعال و مرتب شده بر اساس جدیدترین
    profiles = Profile.objects.filter(is_deleted=False).order_by('-id')
    
    context = {
        'profiles': profiles,
    }
    return render(request, 'users/user_list.html', context)






@login_required
def create_user(request):
    if request.method == 'POST':
        print("POST request received")
        print(request.POST)
        
        try:
            with transaction.atomic():
                def convert_to_miladi(shamsi_date):
                    if not shamsi_date:
                        return None
                    year, month, day = map(int, shamsi_date.split('/'))
                    jalali_date = jdatetime.date(year, month, day)
                    return jalali_date.togregorian()

                # دریافت و تبدیل تاریخ‌ها
                start_date = convert_to_miladi(request.POST.get('start_date'))
                end_date = convert_to_miladi(request.POST.get('end_date'))
                birth_date = convert_to_miladi(request.POST.get('birth_date'))

                # اعتبارسنجی فیلدهای اجباری
                required_fields = {
                    'first_name': 'نام',
                    'last_name': 'نام خانوادگی',
                    'personal_number': 'کد پرسنلی'
                }
                
                missing_fields = [
                    field_name for field_key, field_name in required_fields.items()
                    if not request.POST.get(field_key)
                ]
                
                if missing_fields:
                    raise ValueError(f'فیلدهای {", ".join(missing_fields)} الزامی هستند')

                # اطلاعات درصدها
                percentage_data = {
                    'work_percentage': Decimal(request.POST.get('work_percentage', '0')),
                    'lab_expense_percentage': Decimal(request.POST.get('lab_expense_percentage', '0')),
                    'material_expense_percentage': Decimal(request.POST.get('material_expense_percentage', '0')),
                    'tax_percentage': Decimal(request.POST.get('tax_percentage', '0')),
                }

                # بررسی هر درصد به صورت جداگانه
                for percentage_name, percentage_value in percentage_data.items():
                    if percentage_value > 100:
                        raise ValueError(f'درصد {percentage_name} نمی‌تواند بیشتر از 100 باشد')
                national_code = request.POST.get('national_code')
                if national_code and Profile.objects.filter(national_code=national_code).exists():
                    raise ValueError('کد ملی وارد شده تکراری است')

                # بررسی تکراری بودن کد پرسنلی 
                personal_number = request.POST.get('personal_number')
                if personal_number and Profile.objects.filter(personal_number=personal_number).exists():
                    raise ValueError('کد پرسنلی وارد شده تکراری است')
                # اطلاعات مشترک
                common_data = {
                    'role_id': request.POST.get('role'),
                    'first_name': request.POST.get('first_name'),
                    'last_name': request.POST.get('last_name'),
                    'personal_number': request.POST.get('personal_number'),
                }

                # بررسی وجود نام کاربری و رمز عبور
                username = request.POST.get('username')
                password = request.POST.get('password')
                user = None

                if username and password:
                    # ایجاد کاربر
                    user = CustomUser.objects.create_user(
                        username=username,
                        password=password,
                        is_active=request.POST.get('is_active') == 'on',
                        start_date=start_date,
                        end_date=end_date,
                        **common_data
                    )

                # اطلاعات پروفایل
                profile_data = {
                    'medical_code': request.POST.get('medical_code'),
                    'national_code': request.POST.get('national_code'),
                    'phone': request.POST.get('phone'),
                    'mobile': request.POST.get('mobile'),
                    'address': request.POST.get('address'),
                    'postal_code': request.POST.get('postal_code'),
                    'sex': request.POST.get('sex') == 'true',
                    'is_married': request.POST.get('is_married') == 'true',
                    'birth_date': birth_date,
                    'birthplace': request.POST.get('birthplace'),
                    'education_id': request.POST.get('education'),
                    'specialty_id': request.POST.get('specialty'),
                    'is_activate': True,
                    'is_published': True,
                    **common_data,
                    **percentage_data
                }

                # ایجاد پروفایل
                profile = Profile.objects.create(
                    user=user,
                    **profile_data
                )

                # ایجاد لایسنس کاربر
                if user:
                    active_license = License.objects.filter(is_active=True).first()
                    if active_license:
                        UserLicense.objects.create(
                            user=profile,
                            license=active_license,
                            start_date=start_date,
                            end_date=end_date,
                            is_active=True
                        )

                messages.success(request, 'اطلاعات با موفقیت ذخیره شد.')
                return redirect('user_list')

        except ValueError as e:
            messages.error(request, str(e))
        except Exception as e:
            messages.error(request, f'خطا در ذخیره اطلاعات: {str(e)}')

    # تاریخ‌های پیش‌فرض و context
    context = {
        'roles': Role.objects.all(),
        'educations': Education.objects.all(),
        'specialties': Specialty.objects.all(),
        'total_users': Profile.objects.count(),
        'active_users': Profile.objects.filter(user__is_active=True).count(),
        'today_shamsi': jdatetime.date.today().strftime('%Y/%m/%d'),
        'next_year_shamsi': (jdatetime.date.today() + jdatetime.timedelta(days=365)).strftime('%Y/%m/%d'),
    }

    # اضافه کردن اطلاعات لایسنس
    active_license = License.objects.filter(is_active=True).first()
    if active_license:
        context['license'] = active_license
        context['remaining_users'] = active_license.max_users - context['total_users']
    
    return render(request, 'users/create_user.html', context)



@login_required
def edit_user(request, id):
    profile = get_object_or_404(Profile, id=id)
    
    if request.method == 'POST':
        try:
            with transaction.atomic():
                def convert_to_miladi(shamsi_date):
                    if not shamsi_date:
                        return None
                    year, month, day = map(int, shamsi_date.split('/'))
                    jalali_date = jdatetime.date(year, month, day)
                    return jalali_date.togregorian()

                # تبدیل تاریخ‌ها
                start_date = convert_to_miladi(request.POST.get('start_date'))
                end_date = convert_to_miladi(request.POST.get('end_date'))
                birth_date = convert_to_miladi(request.POST.get('birth_date'))

                # بررسی فیلدهای اجباری
                required_fields = {
                    'first_name': 'نام',
                    'last_name': 'نام خانوادگی',
                    'personal_number': 'کد پرسنلی'
                }
                
                missing_fields = [
                    field_name for field_key, field_name in required_fields.items()
                    if not request.POST.get(field_key)
                ]
                
                if missing_fields:
                    raise ValueError(f'فیلدهای {", ".join(missing_fields)} الزامی هستند')

                # بررسی درصدها
                percentage_data = {
                    'work_percentage': float(request.POST.get('work_percentage', '0')),
                    'lab_expense_percentage': float(request.POST.get('lab_expense_percentage', '0')),
                    'material_expense_percentage': float(request.POST.get('material_expense_percentage', '0')),
                    'tax_percentage': float(request.POST.get('tax_percentage', '0')),
                }

                for percentage_name, percentage_value in percentage_data.items():
                    if percentage_value > 100:
                        raise ValueError(f'درصد {percentage_name} نمی‌تواند بیشتر از 100 باشد')

                # بروزرسانی اطلاعات پروفایل
                profile.first_name = request.POST.get('first_name')
                profile.last_name = request.POST.get('last_name')
                profile.personal_number = request.POST.get('personal_number')
                profile.medical_code = request.POST.get('medical_code')
                profile.national_code = request.POST.get('national_code')
                profile.phone = request.POST.get('phone')
                profile.mobile = request.POST.get('mobile')
                profile.address = request.POST.get('address')
                profile.postal_code = request.POST.get('postal_code')
                profile.sex = request.POST.get('sex') == 'true'
                profile.is_married = request.POST.get('is_married') == 'true'
                profile.birth_date = birth_date
                profile.birthplace = request.POST.get('birthplace')
                profile.is_activate = request.POST.get('is_active') == 'on'

                # بروزرسانی روابط خارجی
                if request.POST.get('education'):
                    profile.education_id = request.POST.get('education')
                if request.POST.get('specialty'):
                    profile.specialty_id = request.POST.get('specialty')
                if request.POST.get('role'):
                    profile.role_id = request.POST.get('role')

                # بروزرسانی درصدها
                for field, value in percentage_data.items():
                    setattr(profile, field, value)

                # بروزرسانی کاربر مرتبط
                if profile.user:
                    profile.user.first_name = profile.first_name
                    profile.user.last_name = profile.last_name
                    profile.user.is_active = profile.is_activate
                    profile.user.role = profile.role
                    profile.user.start_date = start_date
                    profile.user.end_date = end_date
                    
                    # تغییر رمز عبور در صورت وارد کردن
                    new_password = request.POST.get('password')
                    if new_password:
                        profile.user.set_password(new_password)
                    
                    profile.user.save()

                profile.save()
                messages.success(request, 'اطلاعات با موفقیت بروزرسانی شد.')
                return redirect('user_list')

        except ValueError as e:
            messages.error(request, str(e))
        except Exception as e:
            messages.error(request, f'خطا در بروزرسانی اطلاعات: {str(e)}')

    # تبدیل تاریخ‌ها به شمسی برای نمایش
    birth_date_shamsi = None
    if profile.birth_date:
        birth_date_shamsi = jdatetime.date.fromgregorian(date=profile.birth_date).strftime('%Y/%m/%d')
    
    start_date_shamsi = None
    if profile.user and profile.user.start_date:
        start_date_shamsi = jdatetime.date.fromgregorian(date=profile.user.start_date).strftime('%Y/%m/%d')
    
    end_date_shamsi = None
    if profile.user and profile.user.end_date:
        end_date_shamsi = jdatetime.date.fromgregorian(date=profile.user.end_date).strftime('%Y/%m/%d')

    context = {
        'profile': profile,
        'roles': Role.objects.all(),
        'educations': Education.objects.all(),
        'specialties': Specialty.objects.all(),
        'birth_date_shamsi': birth_date_shamsi,
        'start_date_shamsi': start_date_shamsi,
        'end_date_shamsi': end_date_shamsi,
        'total_users': Profile.objects.count(),
        'active_users': Profile.objects.filter(is_activate=True).count(),
    }

    # اضافه کردن اطلاعات لایسنس
    active_license = License.objects.filter(is_active=True).first()
    if active_license:
        context['license'] = active_license
        context['remaining_users'] = active_license.max_users - context['total_users']
    
    return render(request, 'users/edit_user_tabs.html', context)








@login_required
def edit_user_images(request, profile_id):
    """ویو مخصوص آپلود و ذخیره عکس و امضا در کارت پرسنلی"""
    profile = get_object_or_404(Profile, id=profile_id)
    
    if request.method == 'POST':
        try:
            # اگر کارت پرسنلی وجود ندارد، ایجاد کنید
            personnel_card, created = PersonnelCard.objects.get_or_create(
                profile=profile,
                defaults={'expiry_date': timezone.now().date() + timedelta(days=365)}
            )

            # آپلود عکس
            if 'avatar' in request.FILES:
                personnel_card.avatar = request.FILES['avatar']
            
            # آپلود امضا
            if 'signature' in request.FILES:
                personnel_card.signature = request.FILES['signature']
            
            personnel_card.save()
            messages.success(request, 'تصاویر با موفقیت ذخیره شدند.')
            
        except Exception as e:
            messages.error(request, f'خطا در ذخیره تصاویر: {str(e)}')
        
        return redirect('edit_user', id=profile_id)

@login_required
def manage_personnel_card(request, profile_id):
    """ویو مخصوص مدیریت کارت پرسنلی (صدور و تولید مجدد)"""
    profile = get_object_or_404(Profile, id=profile_id)
    
    if request.method == 'POST':
        action = request.POST.get('action')
        
        try:
            if action == 'generate':
                # بررسی وجود کارت قبلی
                if hasattr(profile, 'personnel_card'):
                    raise ValueError("این کاربر قبلاً دارای کارت پرسنلی است.")

                # ایجاد کارت جدید
                PersonnelCard.objects.create(
                    profile=profile,
                    expiry_date=timezone.now().date() + timedelta(days=365)
                )
                messages.success(request, 'کارت پرسنلی با موفقیت صادر شد.')
                
            elif action == 'regenerate':
                if not hasattr(profile, 'personnel_card'):
                    raise ValueError("کارت پرسنلی برای این کاربر یافت نشد.")
                
                # تولید مجدد کارت
                card = profile.personnel_card
                card.generate_qr_code()
                card.save()
                messages.success(request, 'کارت پرسنلی با موفقیت بازتولید شد.')
                
        except ValueError as e:
            messages.error(request, str(e))
        except Exception as e:
            messages.error(request, f'خطا در عملیات: {str(e)}')
        
        return redirect('edit_user', id=profile_id)

    return redirect('edit_user', id=profile_id)


@login_required
def generate_personnel_card(request):
    if request.method == 'POST':
        try:
            profile_id = request.POST.get('profile_id')
            profile = Profile.objects.get(id=profile_id)
            
            # تنظیم تاریخ انقضا (یک سال بعد)
            expiry_date = timezone.now().date() + timedelta(days=365)
            
            card = PersonnelCard.objects.create(
                profile=profile,
                expiry_date=expiry_date
            )
            
            messages.success(request, 'کارت با موفقیت صادر شد')
            return redirect('edit_user', profile_id=profile_id)
            
        except Exception as e:
            messages.error(request, f'خطا در صدور کارت: {str(e)}')
            return redirect('edit_user', profile_id=profile_id)
    
    return redirect('user_list')
