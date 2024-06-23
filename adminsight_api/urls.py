# urls.py
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
    path('profile/', views.profile, name='profile'),
    path('logout/', views.logout_view, name='logout'),
    path('register-server/', views.RegisterServerView.as_view(),
         name='register-server'),
    path('login-server/', views.LoginServerView.as_view(), name='login-server'),
    path('execute-command/', views.ServerCommandView.as_view(),
         name='execute-command'),
    path('change-password/', views.change_password, name='change-password'),
    path('update-profile/', views.update_profile, name='update_profile'),
    path('delete-account/', views.delete_account, name='delete_account'),
    path('forgot-password/', views.forgot_password, name='forgot-password'),
    path('reset-password/<uid>/<token>/',
         views.reset_password, name='reset_password'),
    path('api-auth/', include('rest_framework.urls', namespace='rest_framework')),
]
