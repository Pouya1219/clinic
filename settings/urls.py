# settings/urls.py
from django.urls import path
from . import views

app_name = 'settings_app'

urlpatterns = [
    path('settings_view/', views.settings_view, name='settings_view'),
    path('api/settings/', views.get_settings_json, name='get_settings'),
    # صفحه اصلی درختواره
    path('', views.tree_view, name='tree_view'),
    # مسیرهای فرم
    # مسیرهای فرم با parent_id
    path('forms/insurance-type/<str:id>/', views.insurance_type_form, name='insurance_type_form'),
    path('forms/insurance-provider/<str:id>/<str:parent_id>/', views.insurance_provider_form, name='insurance_provider_form'),
    path('forms/insurance-provider/<str:id>/', views.insurance_provider_form_without_parent, name='insurance_provider_form_without_parent'),
    path('forms/treatment-type/<str:id>/', views.treatment_type_form, name='treatment_type_form'),
    path('forms/treatment-detail/<str:id>/<str:parent_id>/', views.treatment_detail_form, name='treatment_detail_form'),
    path('forms/treatment-detail/<str:id>/', views.treatment_detail_form_without_parent, name='treatment_detail_form_without_parent'),

    # API مسیرهای
    # نوع بیمه
    path('api/insurance-types/', views.insurance_type_list, name='insurance_type_list'),
    path('api/insurance-types/<int:id>/', views.insurance_type_detail, name='insurance_type_detail'),
    path('api/insurance-types/create/', views.insurance_type_create, name='insurance_type_create'),
    
    # بیمه‌گر
    path('api/insurance-providers/', views.insurance_provider_list, name='insurance_provider_list'),
    path('api/insurance-providers/<int:id>/', views.insurance_provider_detail, name='insurance_provider_detail'),
    path('api/insurance-providers/create/', views.insurance_provider_create, name='insurance_provider_create'),
    
    # نوع درمان
    path('api/treatment-types/', views.treatment_type_list, name='treatment_type_list'),
    path('api/treatment-types/<int:id>/', views.treatment_type_detail, name='treatment_type_detail'),
    path('api/treatment-types/create/', views.treatment_type_create, name='treatment_type_create'),
    
    # جزئیات درمان
    path('api/treatment-details/', views.treatment_detail_list, name='treatment_detail_list'),
    path('api/treatment-details/<int:id>/', views.treatment_detail_detail, name='treatment_detail_detail'),
    path('api/treatment-details/create/', views.treatment_detail_create, name='treatment_detail_create'),
]