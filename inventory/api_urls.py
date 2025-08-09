# inventory/api_urls.py

from django.urls import path, include
from . import api_views

# API Version 1
v1_patterns = [
    path('items/', include([
        path('', api_views.ItemListCreateView.as_view()),
        path('<uuid:pk>/', api_views.ItemRetrieveUpdateDestroyView.as_view()),
        path('<uuid:pk>/stock/', api_views.ItemStockView.as_view()),
        path('<uuid:pk>/movements/', api_views.ItemMovementsView.as_view()),
    ])),
    
    path('warehouses/', include([
        path('', api_views.WarehouseListCreateView.as_view()),
        path('<uuid:pk>/', api_views.WarehouseRetrieveUpdateDestroyView.as_view()),
        path('<uuid:pk>/inventory/', api_views.WarehouseInventoryView.as_view()),
    ])),
    
    path('entries/', include([
        path('', api_views.StockEntryListCreateView.as_view()),
        path('<uuid:pk>/', api_views.StockEntryRetrieveUpdateDestroyView.as_view()),
    ])),
    
    path('exits/', include([
        path('', api_views.StockExitListCreateView.as_view()),
        path('<uuid:pk>/', api_views.StockExitRetrieveUpdateDestroyView.as_view()),
    ])),
]

urlpatterns = [
    path('v1/', include(v1_patterns)),
    # آینده: path('v2/', include(v2_patterns)),
]
