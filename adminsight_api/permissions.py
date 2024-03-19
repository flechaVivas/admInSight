from rest_framework import permissions
from .models import System, AppUserSystem


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

    def has_object_permission(self, request, view, obj):
        return request.user and request.user.is_staff


class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        # Permitir acceso de lectura a todos los usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated

        # Permitir acceso de escritura solo a usuarios administradores
        return request.user and request.user.is_staff


class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        # Permitir acciones de lectura (GET) a todos los usuarios autenticados
        if request.method in permissions.SAFE_METHODS:
            return True

        # Permitir acciones de escritura (POST, PUT, PATCH, DELETE) en objetos System y AppUserSystem
        if isinstance(obj, System):
            return obj.app_users.filter(id=request.user.id).exists()
        elif isinstance(obj, AppUserSystem):
            return obj.app_user == request.user

        # No permitir otras acciones de escritura
        return False
