# inventory/utils.py

import json
from django.http import JsonResponse
from django.core.serializers.json import DjangoJSONEncoder
from decimal import Decimal
import uuid
from datetime import datetime, date
from django.db import models
# در بالای فایل utils.py اضافه کنید:
from decimal import Decimal, InvalidOperation

class CustomJSONEncoder(DjangoJSONEncoder):
    """کلاس سفارشی برای تبدیل انواع داده‌های خاص به JSON"""
    
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        elif isinstance(obj, uuid.UUID):
            return str(obj)
        elif isinstance(obj, (datetime, date)):
            return obj.isoformat()
        elif isinstance(obj, models.Model):
            return str(obj.pk)
        return super().default(obj)


def json_response(data=None, message=None, status=200, success=None, **kwargs):
    """
    استاندارد پاسخ JSON برای API
    
    Args:
        data: داده‌های پاسخ
        message: پیام برای کاربر
        status: کد وضعیت HTTP
        success: وضعیت موفقیت (اگر None باشد، بر اساس status تعیین می‌شود)
        **kwargs: پارامترهای اضافی
    
    Returns:
        JsonResponse: پاسخ JSON استاندارد
    """
    
    # تعیین وضعیت موفقیت بر اساس status code
    if success is None:
        success = 200 <= status < 300
    
    # ساخت پاسخ
    response_data = {
        'success': success,
        'status': status,
    }
    
    # اضافه کردن پیام
    if message:
        response_data['message'] = message
    
    # اضافه کردن داده‌ها
    if data is not None:
        if isinstance(data, dict):
            response_data.update(data)
        else:
            response_data['data'] = data
    
    # اضافه کردن پارامترهای اضافی
    response_data.update(kwargs)
    
    # اضافه کردن timestamp
    response_data['timestamp'] = datetime.now().isoformat()
    
    return JsonResponse(
        response_data,
        status=status,
        encoder=CustomJSONEncoder,
        json_dumps_params={'ensure_ascii': False, 'indent': 2}
    )


def parse_json_body(request):
    """
    تجزیه بدنه JSON درخواست
    
    Args:
        request: شیء درخواست Django
    
    Returns:
        dict: داده‌های تجزیه شده یا دیکشنری خالی
    
    Raises:
        ValueError: در صورت خطا در تجزیه JSON
    """
    
    try:
        if request.content_type == 'application/json':
            body = request.body.decode('utf-8')
            if body:
                return json.loads(body)
            return {}
        else:
            # اگر content-type JSON نباشد، از POST data استفاده کن
            return dict(request.POST)
    
    except json.JSONDecodeError as e:
        raise ValueError(f'خطا در تجزیه JSON: {str(e)}')
    except UnicodeDecodeError as e:
        raise ValueError(f'خطا در رمزگشایی: {str(e)}')
    except Exception as e:
        raise ValueError(f'خطای غیرمنتظره: {str(e)}')


def success_response(data=None, message="عملیات با موفقیت انجام شد.", **kwargs):
    """
    پاسخ موفقیت‌آمیز
    
    Args:
        data: داده‌های پاسخ
        message: پیام موفقیت
        **kwargs: پارامترهای اضافی
    
    Returns:
        JsonResponse: پاسخ JSON موفقیت‌آمیز
    """
    return json_response(data=data, message=message, status=200, **kwargs)


def error_response(message="خطایی رخ داده است.", status=400, **kwargs):
    """
    پاسخ خطا
    
    Args:
        message: پیام خطا
        status: کد وضعیت HTTP
        **kwargs: پارامترهای اضافی
    
    Returns:
        JsonResponse: پاسخ JSON خطا
    """
    return json_response(message=message, status=status, success=False, **kwargs)


def validation_error_response(errors, message="داده‌های ارسالی نامعتبر است."):
    """
    پاسخ خطای اعتبارسنجی
    
    Args:
        errors: لیست یا دیکشنری خطاهای اعتبارسنجی
        message: پیام کلی خطا
    
    Returns:
        JsonResponse: پاسخ JSON خطای اعتبارسنجی
    """
    return json_response(
        message=message,
        status=400,
        success=False,
        errors=errors
    )


def not_found_response(message="آیتم مورد نظر یافت نشد."):
    """
    پاسخ یافت نشد
    
    Args:
        message: پیام عدم یافتن
    
    Returns:
        JsonResponse: پاسخ JSON یافت نشد
    """
    return json_response(message=message, status=404, success=False)


def unauthorized_response(message="شما مجاز به انجام این عملیات نیستید."):
    """
    پاسخ عدم مجوز
    
    Args:
        message: پیام عدم مجوز
    
    Returns:
        JsonResponse: پاسخ JSON عدم مجوز
    """
    return json_response(message=message, status=401, success=False)


def forbidden_response(message="دسترسی ممنوع."):
    """
    پاسخ ممنوع
    
    Args:
        message: پیام ممنوع
    
    Returns:
        JsonResponse: پاسخ JSON ممنوع
    """
    return json_response(message=message, status=403, success=False)


def server_error_response(message="خطای داخلی سرور."):
    """
    پاسخ خطای سرور
    
    Args:
        message: پیام خطای سرور
    
    Returns:
        JsonResponse: پاسخ JSON خطای سرور
    """
    return json_response(message=message, status=500, success=False)


def paginated_response(queryset, page, per_page=20, serializer_func=None, **kwargs):
    """
    پاسخ صفحه‌بندی شده
    
    Args:
        queryset: QuerySet برای صفحه‌بندی
        page: شماره صفحه
        per_page: تعداد آیتم در هر صفحه
        serializer_func: تابع سریالایز کردن آیتم‌ها
        **kwargs: پارامترهای اضافی
    
    Returns:
        JsonResponse: پاسخ JSON صفحه‌بندی شده
    """
    from django.core.paginator import Paginator
    
    paginator = Paginator(queryset, per_page)
    page_obj = paginator.get_page(page)
    
    # سریالایز کردن آیتم‌ها
    if serializer_func:
        items = [serializer_func(item) for item in page_obj]
    else:
        items = list(page_obj.object_list.values())
    
    data = {
        'items': items,
        'pagination': {
            'current_page': page_obj.number,
            'total_pages': paginator.num_pages,
            'total_items': paginator.count,
            'per_page': per_page,
            'has_next': page_obj.has_next(),
            'has_previous': page_obj.has_previous(),
            'next_page': page_obj.next_page_number() if page_obj.has_next() else None,
            'previous_page': page_obj.previous_page_number() if page_obj.has_previous() else None,
        }
    }
    
    return json_response(data=data, **kwargs)


def format_currency(amount, currency_symbol='ریال'):
    """
    فرمت کردن مبلغ پولی
    
    Args:
        amount: مبلغ
        currency_symbol: نماد ارز
    
    Returns:
        str: مبلغ فرمت شده
    """
    if amount is None:
        return '0'
    
    try:
        # تبدیل به عدد
        if isinstance(amount, str):
            amount = float(amount)
        elif isinstance(amount, Decimal):
            amount = float(amount)
        
        # فرمت کردن با جداکننده هزارگان
        formatted = f"{amount:,.0f}"
        
        # اضافه کردن نماد ارز
        return f"{formatted} {currency_symbol}"
    
    except (ValueError, TypeError):
        return '0'


def format_number(number, decimal_places=0):
    """
    فرمت کردن عدد
    
    Args:
        number: عدد
        decimal_places: تعداد رقم اعشار
    
    Returns:
        str: عدد فرمت شده
    """
    if number is None:
        return '0'
    
    try:
        if isinstance(number, str):
            number = float(number)
        elif isinstance(number, Decimal):
            number = float(number)
        
        if decimal_places > 0:
            return f"{number:,.{decimal_places}f}"
        else:
            return f"{number:,.0f}"
    
    except (ValueError, TypeError):
        return '0'


def safe_decimal(value, default=0):
    """
    تبدیل ایمن به Decimal
    
    Args:
        value: مقدار برای تبدیل
        default: مقدار پیش‌فرض
    
    Returns:
        Decimal: مقدار Decimal
    """
    if value is None or value == '':
        return Decimal(str(default))
    
    try:
        return Decimal(str(value))
    except (ValueError, TypeError, InvalidOperation):
        return Decimal(str(default))


def safe_int(value, default=0):
    """
    تبدیل ایمن به int
    
    Args:
        value: مقدار برای تبدیل
        default: مقدار پیش‌فرض
    
    Returns:
        int: مقدار int
    """
    if value is None or value == '':
        return default
    
    try:
        return int(value)
    except (ValueError, TypeError):
        return default


def safe_float(value, default=0.0):
    """
    تبدیل ایمن به float
    
    Args:
        value: مقدار برای تبدیل
        default: مقدار پیش‌فرض
    
    Returns:
        float: مقدار float
    """
    if value is None or value == '':
        return default
    
    try:
        return float(value)
    except (ValueError, TypeError):
        return default


def generate_code(prefix='', length=6):
    """
    تولید کد یکتا
    
    Args:
        prefix: پیشوند کد
        length: طول بخش عددی
    
    Returns:
        str: کد تولید شده
    """
    import random
    import string
    
    # تولید بخش عددی
    numbers = ''.join(random.choices(string.digits, k=length))
    
    # ترکیب پیشوند و عدد
    if prefix:
        return f"{prefix}{numbers}"
    else:
        return numbers


def get_client_ip(request):
    """
    دریافت IP کلاینت
    
    Args:
        request: شیء درخواست Django
    
    Returns:
        str: آدرس IP کلاینت
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def get_user_agent(request):
    """
    دریافت User Agent
    
    Args:
        request: شیء درخواست Django
    
    Returns:
        str: User Agent
    """
    return request.META.get('HTTP_USER_AGENT', '')


# در تابع log_user_activity تغییر دهید:
def log_user_activity(user, action, details=None, request=None):
    """
    ثبت فعالیت کاربر
    
    Args:
        user: کاربر
        action: عمل انجام شده
        details: جزئیات اضافی
        request: شیء درخواست Django
    """
    try:
        # تلاش برای import مدل ActivityLog
        try:
            from .models import ActivityLog
        except ImportError:
            # اگر مدل ActivityLog وجود نداشته باشد، فقط لاگ کن
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"User activity: {user.username} - {action} - {details}")
            return
        
        activity_data = {
            'user': user,
            'action': action,
            'details': details or {},
        }
        
        if request:
            activity_data.update({
                'ip_address': get_client_ip(request),
                'user_agent': get_user_agent(request),
            })
        
        ActivityLog.objects.create(**activity_data)
    
    except Exception as e:
        # در صورت خطا، فقط لاگ کن
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error logging user activity: {str(e)}")


def validate_required_fields(data, required_fields):
    """
    اعتبارسنجی فیلدهای الزامی
    
    Args:
        data: داده‌های ورودی
        required_fields: لیست فیلدهای الزامی
    
    Returns:
        list: لیست خطاهای اعتبارسنجی
    """
    errors = []
    
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f"فیلد '{field}' الزامی است.")
    
    return errors


def clean_phone_number(phone):
    """
    تمیز کردن شماره تلفن
    
    Args:
        phone: شماره تلفن
    
    Returns:
        str: شماره تلفن تمیز شده
    """
    if not phone:
        return ''
    
    # حذف کاراکترهای غیرضروری
    phone = ''.join(filter(str.isdigit, phone))
    
    # تبدیل ۰ به 0
    phone = phone.replace('۰', '0').replace('۱', '1').replace('۲', '2').replace('۳', '3').replace('۴', '4').replace('۵', '5').replace('۶', '6').replace('۷', '7').replace('۸', '8').replace('۹', '9')
    
    # اضافه کردن پیش‌شماره ایران
    if phone.startswith('9') and len(phone) == 10:
        phone = '0' + phone
    elif phone.startswith('98') and len(phone) == 12:
        phone = '0' + phone[2:]
    
    return phone


def persian_to_english_digits(text):
    """
    تبدیل اعداد فارسی به انگلیسی
    
    Args:
        text: متن ورودی
    
    Returns:
        str: متن با اعداد انگلیسی
    """
    if not text:
        return text
    
    persian_digits = '۰۱۲۳۴۵۶۷۸۹'
    english_digits = '0123456789'
    
    for persian, english in zip(persian_digits, english_digits):
        text = text.replace(persian, english)
    
    return text


def english_to_persian_digits(text):
    """
    تبدیل اعداد انگلیسی به فارسی
    
    Args:
        text: متن ورودی
    
    Returns:
        str: متن با اعداد فارسی
    """
    if not text:
        return text
    
    persian_digits = '۰۱۲۳۴۵۶۷۸۹'
    english_digits = '0123456789'
    
    for english, persian in zip(english_digits, persian_digits):
        text = text.replace(english, persian)
    
    return text


def truncate_text(text, max_length=50, suffix='...'):
    """
    کوتاه کردن متن
    
    Args:
        text: متن ورودی
        max_length: حداکثر طول
        suffix: پسوند
    
    Returns:
        str: متن کوتاه شده
    """
    if not text:
        return ''
    
    if len(text) <= max_length:
        return text
    
    return text[:max_length - len(suffix)] + suffix


def get_file_extension(filename):
    """
    دریافت پسوند فایل
    
    Args:
        filename: نام فایل
    
    Returns:
        str: پسوند فایل
    """
    if not filename:
        return ''
    
    return filename.split('.')[-1].lower() if '.' in filename else ''


def is_valid_email(email):
    """
    بررسی معتبر بودن ایمیل
    
    Args:
        email: آدرس ایمیل
    
    Returns:
        bool: معتبر بودن ایمیل
    """
    import re
    
    if not email:
        return False
    
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def calculate_percentage(part, total):
    """
    محاسبه درصد
    
    Args:
        part: بخش
        total: کل
    
    Returns:
        float: درصد
    """
    if not total or total == 0:
        return 0
    
    try:
        return (float(part) / float(total)) * 100
    except (ValueError, TypeError, ZeroDivisionError):
        return 0


def get_persian_date(date_obj=None):
    """
    تبدیل تاریخ میلادی به شمسی
    
    Args:
        date_obj: تاریخ میلادی (اگر None باشد، تاریخ امروز)
    
    Returns:
        str: تاریخ شمسی
    """
    try:
        import jdatetime
        
        if date_obj is None:
            date_obj = datetime.now()
        
        if isinstance(date_obj, str):
            date_obj = datetime.fromisoformat(date_obj.replace('Z', '+00:00'))
        
        persian_date = jdatetime.datetime.fromgregorian(datetime=date_obj)
        return persian_date.strftime('%Y/%m/%d')
    
    except ImportError:
        # اگر jdatetime نصب نباشد
        if date_obj is None:
            date_obj = datetime.now()
        return date_obj.strftime('%Y-%m-%d')
    except Exception:
        return ''
