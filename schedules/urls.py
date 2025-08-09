from django.urls import path
from . import views

app_name = 'schedules'

urlpatterns = [
    path('schedules/', views.schedule_view, name='schedule_view'),
    path('schedules/save/', views.save_schedule, name='save_schedule'),
    path('load/<int:profile_id>/', views.load_schedule, name='load_schedule'),
    path('save/', views.save_schedule, name='save_schedule'),
    path('update/', views.update_schedule, name='update_schedule')
]