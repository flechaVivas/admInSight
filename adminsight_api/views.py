from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import (
    SystemSerializer,
    SysUserSerializer,
    AppUserSystemSerializer,
    UserSerializer,
)
from .models import System, SysUser, AppUserSystem
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework import status
from rest_framework.decorators import permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from .permissions import IsAdminUser
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from .ssh_utils import ssh_connect, register_server
from django.http import JsonResponse


@api_view(["POST"])
def login(request):

    user = get_object_or_404(User, email=request.data["email"])

    if not user.check_password(request.data["password"]):
        return Response(
            {"error": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST
        )

    token, created = Token.objects.get_or_create(user=user)

    serializer = UserSerializer(instance=user)

    return Response(
        {"token": token.key, "user": serializer.data}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
def register(request):

    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        serializer.save()

        user = User.objects.get(email=serializer.data["email"])
        user.set_password(serializer.data["password"])
        user.save()

        token = Token.objects.create(user=user)

        return Response(
            {"token": token.key, "user": serializer.data},
            status=status.HTTP_201_CREATED,
        )
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def profile(request):
    serializer = UserSerializer(instance=request.user)
    return Response(serializer.data, status=status.HTTP_200_OK)


class SystemViewSet(viewsets.ModelViewSet):
    queryset = System.objects.all()
    serializer_class = SystemSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        if self.request.user.is_staff:
            return System.objects.all()
        else:
            return System.objects.filter(app_users=self.request.user)


class SysUserViewSet(viewsets.ModelViewSet):
    queryset = SysUser.objects.all()
    serializer_class = SysUserSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        if self.request.user.is_staff:
            return SysUser.objects.all()
        else:
            return SysUser.objects.filter(system__app_users=self.request.user)


class AppUserSystemViewSet(viewsets.ModelViewSet):
    queryset = AppUserSystem.objects.all()
    serializer_class = AppUserSystemSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get_queryset(self):
        if self.request.user.is_staff:
            return AppUserSystem.objects.all()
        else:
            return AppUserSystem.objects.filter(app_user=self.request.user)
