from django.urls import path
from . import views

urlpatterns = [
    path('login/', views.login, name='login'),
    path('register/', views.register, name='register'),
    path('profile/', views.profile, name='profile'),
    path('systems/', views.system_list, name='system_list'),
    path('systems/<int:pk>/', views.system_detail, name='system_detail'),
    path('sysusers/', views.sysuser_list, name='sysuser_list'),
    path('sysusers/<int:pk>/', views.sysuser_detail, name='sysuser_detail'),
    path('appusersystems/', views.appusersystem_list, name='appusersystem_list'),
    path('appusersystems/<int:pk>/', views.appusersystem_detail,
         name='appusersystem_detail'),
]
