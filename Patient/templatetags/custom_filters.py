# Patient/templatetags/custom_filters.py
from django import template

register = template.Library()

@register.filter
def subtract(value, arg):
    """تفریق دو عدد"""
    try:
        return float(value) - float(arg)
    except (ValueError, TypeError):
        return 0
