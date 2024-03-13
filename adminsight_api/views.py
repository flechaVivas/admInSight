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
from django.shortcuts import get_object_or_404
from rest_framework.decorators import permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication


@api_view(["POST"])
def login(request):

    user = get_object_or_404(User, username=request.data["username"])

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

        user = User.objects.get(username=serializer.data["username"])
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


# Vistas para System
@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def system_list(request):
    if request.method == "GET":
        systems = System.objects.all()
        serializer = SystemSerializer(systems, many=True)
        return Response(serializer.data)
    elif request.method == "POST":
        serializer = SystemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def system_detail(request, pk):
    try:
        system = System.objects.get(pk=pk)
    except System.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = SystemSerializer(system)
        return Response(serializer.data)
    elif request.method == "PUT":
        serializer = SystemSerializer(system, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == "DELETE":
        system.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Vistas para SysUser
@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def sysuser_list(request):
    if request.method == "GET":
        sysusers = SysUser.objects.all()
        serializer = SysUserSerializer(sysusers, many=True)
        return Response(serializer.data)
    elif request.method == "POST":
        serializer = SysUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def sysuser_detail(request, pk):
    try:
        sysuser = SysUser.objects.get(pk=pk)
    except SysUser.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = SysUserSerializer(sysuser)
        return Response(serializer.data)
    elif request.method == "PUT":
        serializer = SysUserSerializer(sysuser, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == "DELETE":
        sysuser.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Vistas para AppUserSystem
@api_view(["GET", "POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def appusersystem_list(request):
    if request.method == "GET":
        appusersystems = AppUserSystem.objects.all()
        serializer = AppUserSystemSerializer(appusersystems, many=True)
        return Response(serializer.data)
    elif request.method == "POST":
        serializer = AppUserSystemSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET", "PUT", "DELETE"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def appusersystem_detail(request, pk):
    try:
        appusersystem = AppUserSystem.objects.get(pk=pk)
    except AppUserSystem.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == "GET":
        serializer = AppUserSystemSerializer(appusersystem)
        return Response(serializer.data)
    elif request.method == "PUT":
        serializer = AppUserSystemSerializer(appusersystem, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == "DELETE":
        appusersystem.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
