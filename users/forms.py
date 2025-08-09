# forms.py
from django import forms
from .models import CustomUser, Role, Specialty, Education
from decimal import Decimal

class UserCreationForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput(attrs={
        'class': 'form-input',
        'placeholder': 'رمز عبور'
    }))

    start_date = forms.DateField(widget=forms.TextInput(attrs={
        'class': 'date-input form-input jalali input-field',
        'data-id': '6',
        'readonly': True
    }))

    end_date = forms.DateField(widget=forms.TextInput(attrs={
        'class': 'date-input form-input jalali input-field',
        'data-id': '7',
        'readonly': True
    }))

    birth_date = forms.DateField(required=False, widget=forms.TextInput(attrs={
        'class': 'date-input form-input jalali input-field',
        'data-id': '110',
        'readonly': True
    }))

    class Meta:
        model = CustomUser
        fields = [
            'username', 'password', 'first_name', 'last_name', 'personal_number',
            'medical_code', 'national_code', 'phone', 'mobile', 'address',
            'postal_code', 'role', 'sex', 'is_active', 'is_married',
            'start_date', 'end_date', 'birthplace', 'education', 'specialty',
            'work_percentage', 'lab_expense_percentage', 'material_expense_percentage',
            'tax_percentage','birth_date'
        ]
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'نام کاربری'
            }),
            'first_name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'نام'
            }),
            'last_name': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'نام خانوادگی'
            }),
            'personal_number': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'شماره پرسنلی'
            }),
            'medical_code': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'کد نظام پزشکی'
            }),
            'national_code': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'کد ملی',
                'pattern': '[0-9]{10}',
                'maxlength': '10'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'تلفن ثابت',
                'pattern': '[0-9]{11}',
                'maxlength': '11'
            }),
            'mobile': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'موبایل',
                'pattern': '[0-9]{11}',
                'maxlength': '11'
            }),
            'postal_code': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'کد پستی',
                'maxlength': '10'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-textarea',
                'rows': '4',
                'placeholder': 'آدرس'
            }),
            'role': forms.Select(attrs={
                'class': 'form-input'
            }),
            'specialty': forms.Select(attrs={
                'class': 'form-input',
                'id': 'specialtySelect'
            }),
            'education': forms.Select(attrs={
                'class': 'form-input'
            }),
            'birthplace': forms.TextInput(attrs={
                'class': 'form-input',
                'placeholder': 'محل تولد'
            }),
            'sex': forms.RadioSelect(choices=[
                (True, 'مرد'),
                (False, 'زن')
            ], attrs={
                'class': 'radio-input'
            }),
            'is_married': forms.RadioSelect(choices=[
                (False, 'مجرد'),
                (True, 'متاهل')
            ], attrs={
                'class': 'radio-input'
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'checkbox-input',
                'checked': True
            }),
            'work_percentage': forms.NumberInput(attrs={
                'class': 'percentage-input',
                'step': '0.01',
                'value': '0.00'
            }),
            'lab_expense_percentage': forms.NumberInput(attrs={
                'class': 'percentage-input',
                'step': '0.01',
                'value': '0.00'
            }),
            'material_expense_percentage': forms.NumberInput(attrs={
                'class': 'percentage-input',
                'step': '0.01',
                'value': '0.00'
            }),
            'tax_percentage': forms.NumberInput(attrs={
                'class': 'percentage-input',
                'step': '0.01',
                'value': '0.00'
            })
        }

    def clean(self):
        cleaned_data = super().clean()
        
        # اعتبارسنجی تاریخ‌ها
        start_date = cleaned_data.get('start_date')
        end_date = cleaned_data.get('end_date')
        if start_date and end_date and end_date < start_date:
            raise forms.ValidationError('تاریخ پایان باید بعد از تاریخ شروع باشد')

        # اعتبارسنجی درصدها
        percentages = [
            cleaned_data.get('work_percentage', 0),
            cleaned_data.get('lab_expense_percentage', 0),
            cleaned_data.get('material_expense_percentage', 0),
            cleaned_data.get('tax_percentage', 0)
        ]
        
        total_percentage = sum(Decimal(str(p or 0)) for p in percentages)
        if total_percentage > 100:
            raise forms.ValidationError('مجموع درصدها نمی‌تواند بیشتر از 100 باشد')

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user
