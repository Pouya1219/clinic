from django.contrib import admin
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import path , include
from django.conf import settings
from django.conf.urls.static import static
from Patient import views as patient_views  # import ویو جستجو


urlpatterns = [
    path('admin/', admin.site.urls),
    path('',include('users.urls')),
    path('schedules/',include('schedules.urls',namespace='schedules')),
    #path('treatment/', include('Treatment.urls', namespace='treatment')),
    path('Patient/', include(('Patient.urls', 'Patient'), namespace='Patient')),
    path('settings/', include('settings.urls')),
    path('appointments/', include('appointments.urls', namespace='appointments')),
    path('sr-search-dashboard/', patient_views.sr_search_dashboard, name='sr_search_dashboard'),
    path('search-patients/', patient_views.search_patients, name='search_patients'),
    # Inventory App
    path('inventory/',include('inventory.urls',namespace='inventory')),
    # Inventory App
    
    # # Root redirect to inventory
    # path('', lambda request: redirect('inventory:dashboard')),
    
    # API Root
    # path('api/', include([
    #     path('v1/inventory/', include('inventory.urls')),
    #     # سایر API ها
    # ])),
    path('inventory/api/', include('inventory.api_urls')),
    # Health Check
    path('health/', lambda request: JsonResponse({'status': 'ok'})),

]+ static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)


# Static/Media files
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Error Handlers
handler404 = 'inventory.views.handler404'
handler500 = 'inventory.views.handler500'
handler403 = 'inventory.views.handler403'