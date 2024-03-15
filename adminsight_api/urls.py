from django.urls import path
from . import views
from rest_framework.routers import DefaultRouter
from django.urls import include


router = DefaultRouter()
router.register(r'systems', views.SystemViewSet, basename='systems')
router.register(r'sys-users', views.SysUserViewSet, basename='sys-users')
router.register(r'app-user-systems', views.AppUserSystemViewSet,
                basename='app-user-systems')


urlpatterns = [
    path('', include(router.urls)),
    path('login/', views.login),
    path('register/', views.register),
    path('profile/', views.profile),
    path('register-server/', views.RegisterServerView.as_view(),
         name='register-server'),
    path('login-server/', views.LoginServerView.as_view(), name='login-server'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
