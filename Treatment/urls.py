# from django.urls import path
# from . import views

# app_name = 'treatment'

# urlpatterns = [
#     # صفحه اصلی درمان
#     path('view/<int:patient_id>/', views.treatment_view, name='view'),
#     #path('treatment/view/<int:patient_id>/', views.treatment_view, name='view'),
    
#     # API درمان
#     path('create/', views.create_treatment, name='create'),
#     path('update/<int:id>/', views.update_treatment, name='update'),
#     path('delete/<int:id>/', views.delete_treatment, name='delete'),
#     path('get/<int:id>/', views.get_treatment, name='get'),
#     path('list/<int:patient_id>/', views.list_treatments, name='list'),
#     path('get-details/<int:type_id>/', views.get_treatment_details, name='get_treatment_details'),
    
#     # API پرداخت
#     path('payment/create/', views.create_payment, name='create_payment'),
    
#     # API بیمه
#     path('api/insurance-providers/<int:id>/', views.get_insurance_provider, name='get_insurance_provider'),
# ]
