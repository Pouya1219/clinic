from django import template
import jdatetime
from Patient.models import InstallmentPlan
from decimal import Decimal
register = template.Library()

@register.filter
def to_jalali(value):
    if value:
        return jdatetime.date.fromgregorian(date=value).strftime('%Y/%m/%d')
    return ''


@register.filter
def dictsumattr(queryset, attr):
    return sum(getattr(obj, attr, 0) for obj in queryset)

@register.filter
def sub(value, arg):
    try:
        return float(value) - float(arg)
    except (ValueError, TypeError):
        return 0


@register.filter
def map_payments(treatments):
    payments = []
    for treatment in treatments:
        payments.extend(treatment.payments.all())
    return payments




@register.filter
def map_installment_plans(treatments):
    """تبدیل لیست درمان‌ها به لیست طرح‌های اقساط"""
    plans = []
    for treatment in treatments:
        try:
            # اگر طرح اقساط وجود داشته باشد، آن را به لیست اضافه کن
            plan = getattr(treatment, 'installment_plan', None)
            if plan:
                plans.append(plan)
        except Exception:
            # اگر خطایی رخ داد، آن را نادیده بگیر
            pass
    return plans





@register.filter
def count_paid_installments(plan):
    """شمارش تعداد اقساط پرداخت شده"""
    if not plan:
        return 0
    return plan.installments.filter(is_paid=True).count()


@register.filter
def div(value, arg):
    """تقسیم دو عدد"""
    try:
        return float(value) / float(arg)
    except (ValueError, ZeroDivisionError):
        return 0

@register.filter
def mul(value, arg):
    """ضرب دو عدد"""
    try:
        return float(value) * float(arg)
    except ValueError:
        return 0

@register.filter(name='paid_installments_count')
def paid_installments_count(installment_plan):
    """
    یک طرح اقساط را می‌گیرد و تعداد اقساط پرداخت شده آن را برمی‌گرداند.
    """
    if not installment_plan:
        return 0
    return installment_plan.installments.filter(is_paid=True).count()





@register.filter
def subtract(value, arg):
    """تفریق دو عدد"""
    try:
        return value - arg
    except (ValueError, TypeError):
        try:
            return Decimal(str(value)) - Decimal(str(arg))
        except:
            return 0
        
@register.filter
def subtract(value, arg):
    """تفریق دو عدد"""
    try:
        return value - arg
    except (ValueError, TypeError):
        return value