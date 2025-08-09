# appointment/urls.py
from django.urls import path
from . import views

app_name = 'appointments'  # این خط مهم است

urlpatterns = [
    path('calendar/', views.appointment_calendar, name='calendar'),
    path('api/doctors/', views.get_doctors, name='get_doctors'),
    path('api/treatings/', views.get_treating_doctors, name='gettreating'),
    path('api/units/', views.get_units, name='get_units'),
    path('api/schedule/<int:schedule_id>/', views.get_doctor_schedule, name='get_schedule'),
    path('api/appointment/save/', views.save_appointment, name='save_appointment'),
    path('api/appointment/<int:appointment_id>/delete/', views.delete_appointment, name='delete_appointment'),
    path('api/appointments/<int:appointment_id>/', views.get_appointment_details, name='get_appointment_details'),  
    path('api/appointments/', views.get_appointments, name='get_appointments'),
    #path('appointments/<int:appointment_id>/', views.update_appointment, name='update-appointment'),
    path('api/appointments/<int:appointment_id>/',views.get_appointment_details,name='appointment_details'),
    path('api/appointments/<int:appointment_id>/update/',views.update_appointment,name='update_appointment'),
    path('api/patient/search/', views.live_search_patients, name='live_search_patients'),
    path('api/treatment/types/', views.get_treatment_types, name='get_treatment_types'),
    path('api/treatment/details/', views.get_treatment_details_by_type, name='get_treatment_details_by_type'),
]
