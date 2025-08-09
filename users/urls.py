from django.urls import path
from .views import login_view,edit_user_images,generate_personnel_card, dashboard_view, logout_view, user_list , create_user ,edit_user,manage_personnel_card



urlpatterns = [
    path("", login_view, name="login"),
    path("dashboard/", dashboard_view, name="dashboard"),
    path("logout/", logout_view, name="logout"),
    path("users/", user_list, name="user_list"),  # نمایش لیست کاربران
    path("users/create/", create_user, name="create_user"),  # صفحه ساخت کاربر جدید
    path('users/edit/<int:id>/', edit_user, name='edit_user'),
    path('users/<int:profile_id>/manage-card/',manage_personnel_card, name='manage_personnel_card'),
    path('users/generate-card/', generate_personnel_card, name='generate_personnel_card'),
    path('users/<int:profile_id>/edit-images/',edit_user_images, name='edit_user_images'),
]