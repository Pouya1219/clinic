# settings/forms.py
from django import forms
from .models import AppointmentSettings
from .models import ClinicSetting

class AppointmentSettingsForm(forms.ModelForm):
    class Meta:
        model = AppointmentSettings
        fields = '__all__'
        widgets = {
            'normal_appointment_color': forms.TextInput(attrs={'type': 'color'}),
            'emergency_appointment_color': forms.TextInput(attrs={'type': 'color'}),
            'pending_appointment_color': forms.TextInput(attrs={'type': 'color'}),
            'calendar_start_time': forms.TimeInput(attrs={'type': 'time'}),
            'calendar_end_time': forms.TimeInput(attrs={'type': 'time'}),
        }

class ClinicSettingForm(forms.ModelForm):
    class Meta:
        model = ClinicSetting
        # تمام فیلدهایی که می‌خواهیم در فرم نمایش داده شوند
        fields = [
            'clinic_name', 'clinic_logo', 'phone_number1', 'phone_number2',
            'email', 'website', 'province', 'city', 'address',
            'currency_unit', 'notification_days_before'
        ]
        widgets = {
            'clinic_name': forms.TextInput(attrs={'class': 'form-control'}),
            'phone_number1': forms.TextInput(attrs={'class': 'form-control', 'dir': 'ltr'}),
            'phone_number2': forms.TextInput(attrs={'class': 'form-control', 'dir': 'ltr'}),
            'email': forms.EmailInput(attrs={'class': 'form-control', 'dir': 'ltr'}),
            'website': forms.URLInput(attrs={'class': 'form-control', 'dir': 'ltr'}),
            'province': forms.TextInput(attrs={'class': 'form-control'}),
            'city': forms.TextInput(attrs={'class': 'form-control'}),
            'address': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
            'currency_unit': forms.TextInput(attrs={'class': 'form-control'}),
            'notification_days_before': forms.NumberInput(attrs={'class': 'form-control', 'min': '1'}),
        }
