from django.urls import path
from .views import (pay_installment,get_installment_plan,deposit_to_wallet,pay_from_wallet,transfer_from_wallet,create_direct_payment,render_financial_tab,
                    get_discount_types,create_installment_plan,get_payment_history,
                    delete_payment,get_insurance_provider,create_payment,
                    list_treatments,get_treatment,delete_treatment,delete_payment,
                    create_treatment,update_treatment,refund_payment,
                    treatment_view,get_insurance_data,get_installment_plan_details,
                    print_patient_record,add_previous_treatment,print_financial_statement,
                    delete_previous_treatment,get_treatment_details,refund_payment,
                    get_treatment_types,delete_patient_insurance,update_patient_insurance,
                    get_insurance_details,add_patient_insurance,get_insurance_providers,
                    get_insurance_types,sr_search_dashboard,search_patients,generate_card_image, 
                    activate_card,create_patient,patient_detail,edit_patient,
                    clear_check_payment,reminders_center_view,reminders_center_view,
                    mark_reminder_as_seen,insurance_view,get_patient_active_insurances,
                    print_treatment,generate_invoice,treatment_view,
                    patient_list,generate_card,deactivate_card,regenerate_card)

app_name = 'Patient'

urlpatterns = [
    path('create/', create_patient, name='create_patient'),
    path('edit_patient/<int:id>/', edit_patient, name='edit_patient'),
    path('detail/<int:id>/', patient_detail, name='patient_detail'),
    path('patient_detail/<int:id>/', patient_detail, name='patient_detail'),
    path('list/', patient_list, name='list'),
    path('patient_detail/<int:id>/', patient_detail, name='patient_detail'),
    path('generate-card/', generate_card, name='generate_card'),
    path('deactivate-card/<int:patient_id>/', deactivate_card, name='deactivate_card'),
    path('regenerate-card/<int:patient_id>/', regenerate_card, name='regenerate_card'),
    path('activate-card/<int:patient_id>/', activate_card, name='activate_card'),
    path('generate-card-image/<int:card_id>/', generate_card_image, name='generate_card_image'),
    path('search/', search_patients, name='search_patients'),
    path('sr-search/', sr_search_dashboard, name='sr_search_dashboard'),
    
    #بیمه
    path('insurance-types/', get_insurance_types, name='insurance_types'),
    path('insurance-providers/<int:type_id>/', get_insurance_providers, name='insurance_providers'),
    path('add-insurance/', add_patient_insurance, name='add_insurance'),
    path('insurance-details/<int:insurance_id>/', get_insurance_details, name='insurance_details'),
    path('update-insurance/<int:insurance_id>/', update_patient_insurance, name='update_insurance'),
    path('delete-insurance/<int:insurance_id>/', delete_patient_insurance, name='delete_insurance'),
    
    # API بیمه
    path('insurance/get-types/', get_insurance_types, name='get_insurance_types'),
    path('insurance/get-providers/<int:type_id>/', get_insurance_providers, name='get_insurance_providers'),
    path('insurance/add/<int:patient_id>/', add_patient_insurance, name='add_patient_insurance'),
    path('insurance/details/<int:insurance_id>/', get_insurance_details, name='get_insurance_details'),
    path('insurance/update/<int:insurance_id>/', update_patient_insurance, name='update_patient_insurance'),
    path('insurance/delete/<int:insurance_id>/', delete_patient_insurance, name='delete_patient_insurance'),

    path('treatment-types/', get_treatment_types, name='treatment_types'),
    path('treatment-details/<int:type_id>/', get_treatment_details, name='treatment_details'),
    path('patient/<int:patient_id>/add_previous_treatment/', add_previous_treatment, name='add_previous_treatment'),
    path('patient/delete_previous_treatment/<int:treatment_id>/', delete_previous_treatment, name='delete_previous_treatment'),
    path('patient/<int:patient_id>/print/', print_patient_record, name='print_patient_record'),
    path('get-insurance-data/', get_insurance_data, name='get_insurance_data'),
    # URL‌های مربوط به درمان که از اپلیکیشن Treatment منتقل شده‌اند
    path('<int:patient_id>/treatment/', treatment_view, name='treatment_view'),
    
    # API درمان
    path('treatment/create/', create_treatment, name='create_treatment'),
    path('treatment/update/<int:id>/', update_treatment, name='update_treatment'),
    path('treatment/delete/<int:id>/', delete_treatment, name='delete_treatment'),
    path('treatment/get/<int:id>/', get_treatment, name='get_treatment'),
    path('treatment/list/<int:patient_id>/', list_treatments, name='list_treatments'),
    path('treatment/get-details/<int:type_id>/', get_treatment_details, name='get_treatment_details'),
    
    # API پرداخت
    path('treatment/payment/create/', create_payment, name='create_payment'),
    path('treatment/payment/delete/<int:id>/', delete_payment, name='delete_payment'),
    path('treatment/payment-history/<int:treatment_id>/', get_payment_history, name='get_payment_history'),
    path('treatment/payment/refund/<int:id>/', refund_payment, name='refund_payment'),
    
    # API اقساط
    path('treatment/installment-plan/<int:plan_id>/', get_installment_plan, name='get_installment_plan'),
    #path('treatment/installment/pay/<int:installment_id>/', pay_installment, name='pay_installment'),
    #   discount 
    path('treatment/discount-types/', get_discount_types, name='get_discount_types'),
    # API بیمه
    path('treatment/insurance-providers/<int:id>/', get_insurance_provider, name='get_insurance_provider'),
     # --- URL های جدید برای سیستم پرداخت ---
    path('payment/wallet/deposit/<int:patient_id>/', deposit_to_wallet, name='deposit_to_wallet'),
    path('payment/wallet/pay/<int:treatment_id>/', pay_from_wallet, name='pay_from_wallet'),
    path('payment/wallet/transfer/<int:patient_id>/', transfer_from_wallet, name='transfer_from_wallet'),
    path('payment/direct/<int:treatment_id>/', create_direct_payment, name='create_direct_payment'),
    path('payment/installment/create/<int:treatment_id>/', create_installment_plan, name='create_installment_plan'),
    path('payment/delete/<int:payment_id>/', delete_payment, name='delete_payment'),
    path('payment/installment/pay/<int:installment_id>/', pay_installment, name='pay_installment'),
    # [URL جدید] برای دریافت جزئیات طرح اقساط
    path('payment/installment/details/<int:plan_id>/', get_installment_plan_details, name='get_installment_plan_details'),
    # URL برای رفرش کردن تب پرداخت
    path('payment/refresh_tab/<int:patient_id>/', render_financial_tab, name='render_financial_tab'),
    path('payment/print_statement/<int:patient_id>/', print_financial_statement, name='print_financial_statement'),
    path('payment/refund/<int:payment_id>/', refund_payment, name='refund_payment'),
    #چک
    path('payment/check/clear/<int:payment_id>/', clear_check_payment, name='clear_check_payment'),
    #نوتیفیکیشن
    path('reminders/', reminders_center_view, name='reminders_center'),
    path('reminders/mark_as_seen/', mark_reminder_as_seen, name='mark_reminder_as_seen'),
    
    # مسیرهای مورد نیاز برای رفرش تب‌ها
    path('treatment/<int:patient_id>/', treatment_view, name='treatment_tab'),
    path('insurance_view/<int:patient_id>/', insurance_view, name='insurance_tab'),
    path('print_treatment/<int:treatment_id>/', print_treatment, name='print_treatment'),
    path('generate_invoice/<int:treatment_id>/', generate_invoice, name='generate_invoice'),
    path('active-insurances/<int:patient_id>/', get_patient_active_insurances, name='patient_active_insurances'),

]
