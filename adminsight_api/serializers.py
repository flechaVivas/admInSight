from rest_framework import serializers
from django.contrib.auth.models import User
from .models import System, SysUser, AppUserSystem


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password']


class SystemSerializer(serializers.ModelSerializer):
    class Meta:
        model = System
        fields = ['id', 'name', 'ip_address', 'ssh_port']


class SysUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = SysUser
        fields = ['id', 'username', 'password', 'system']


class AppUserSystemSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppUserSystem
        fields = ['id', 'app_user', 'system']
