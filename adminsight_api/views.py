from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .serializers import (
    SystemSerializer,
    SysUserSerializer,
    AppUserSystemSerializer,
    UserSerializer,
)
from .models import System, SysUser, AppUserSystem, SSHAuthToken
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework import status
from rest_framework.decorators import permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication
from .permissions import IsAdminOrReadOnly, IsOwnerOrReadOnly
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404
from .ssh_utils import ssh_connect, register_server
from rest_framework.views import APIView
from django.core.cache import cache
import uuid
from django.utils import timezone
from datetime import timedelta
from .ssh_utils import ssh_connect, register_server, ssh_execute_command
from django.contrib.auth import logout
from django.contrib.auth import logout as django_logout
from .exceptions import *
from django.db import IntegrityError

from django.views import View
from django.contrib.auth.mixins import LoginRequiredMixin
from django.http import HttpResponseBadRequest, HttpResponse
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str

from django.template.loader import render_to_string
from django.utils.html import strip_tags


@api_view(["POST"])
def login(request):
    try:
        user = get_object_or_404(User, email=request.data["email"])
    except User.DoesNotExist:
        raise UserNotFoundException()

    if not user.check_password(request.data["password"]):
        raise InvalidCredentialsException()

    token, created = Token.objects.get_or_create(user=user)

    serializer = UserSerializer(instance=user)

    return Response(
        {"token": token.key, "user": serializer.data}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
def register(request):
    serializer = UserSerializer(data=request.data)

    if serializer.is_valid():
        username = serializer.validated_data['username']
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']

        try:
            user = User(username=username, email=email)
            user.set_password(password)
            user.save()
        except IntegrityError:
            raise EmailAlreadyExistsException()

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


@api_view(['PUT'])
def update_profile(request):
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True)
    if serializer.is_valid():
        try:
            serializer.save()
        except IntegrityError:
            raise UsernameAlreadyExistsException()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
def delete_account(request):
    user = request.user
    user.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["POST"])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        token = request.auth
        token.delete()
    except Exception as e:
        print(f"Error al eliminar el token: {e}")

    django_logout(request)

    return Response({"message": "Sesión cerrada exitosamente."}, status=status.HTTP_200_OK)


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current_password = request.data.get('currentPassword')
    new_password = request.data.get('newPassword')

    if not user.check_password(current_password):
        raise InvalidCredentialsException()

    user.set_password(new_password)
    user.save()

    return Response({'message': 'Contraseña actualizada exitosamente.'}, status=status.HTTP_200_OK)


def generate_reset_password_email(reset_link):
    context = {
        'reset_link': reset_link
    }
    html_message = render_to_string('reset_password_email.html', context)
    plain_message = strip_tags(html_message)
    return html_message, plain_message


@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email')

    if not email:
        return Response({'error': 'Debe proporcionar un email'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response({'error': 'No existe un usuario con ese email'}, status=status.HTTP_404_NOT_FOUND)

    uid = urlsafe_base64_encode(force_bytes(user.pk))
    token = default_token_generator.make_token(user)

    reset_link = f"http://localhost:4200/reset-password/{uid}/{token}"

    html_message, plain_message = generate_reset_password_email(reset_link)

    send_mail(
        'Restablecer contraseña',
        plain_message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        html_message=html_message,
        fail_silently=False,
    )

    return Response({'message': 'Se ha enviado un correo electrónico con instrucciones para restablecer la contraseña'}, status=status.HTTP_200_OK)


@api_view(['POST'])
def reset_password(request, uid, token):
    new_password = request.data.get('new_password')

    if not uid or not token or not new_password:
        return Response({'error': 'Debe proporcionar uid, token y nueva contraseña'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        uid = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None

    if user is None or not default_token_generator.check_token(user, token):
        return Response({'error': 'Token inválido'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()

    return Response({'message': 'Contraseña actualizada correctamente'}, status=status.HTTP_200_OK)


class SystemViewSet(viewsets.ModelViewSet):
    queryset = System.objects.all()
    serializer_class = SystemSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_staff:
            return System.objects.all()
        else:
            return System.objects.filter(app_users=self.request.user)


class SysUserViewSet(viewsets.ModelViewSet):
    queryset = SysUser.objects.all()
    serializer_class = SysUserSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_staff:
            return SysUser.objects.all()
        else:
            return SysUser.objects.filter(system__app_users=self.request.user)


class AppUserSystemViewSet(viewsets.ModelViewSet):
    queryset = AppUserSystem.objects.all()
    serializer_class = AppUserSystemSerializer
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        if self.request.user.is_staff:
            return AppUserSystem.objects.all()
        else:
            return AppUserSystem.objects.filter(app_user=self.request.user)


class RegisterServerView(APIView):
    permission_classes = []

    def post(self, request):
        name = request.data.get('name')
        hostname = request.data.get('ip_address')
        port = request.data.get('port', 22)
        username = request.data.get('username')
        password = request.data.get('password')

        try:
            system, sys_user = register_server(
                name, hostname, port, username, password)
        except (InvalidCredentialsException, SSHConnectionException) as e:
            raise e

        if system and sys_user:
            app_user_system = AppUserSystem.objects.create(
                app_user=request.user,
                system=system
            )
            return Response({'message': 'Server registered successfully'}, status=status.HTTP_201_CREATED)
        else:
            raise ServerNotFoundException()


class LoginServerView(APIView):
    def post(self, request):
        system_id = request.data.get('system_id')
        linux_username = request.data.get('username')
        linux_password = request.data.get('password')

        try:
            system = System.objects.get(id=system_id)
        except System.DoesNotExist:
            raise ServerNotFoundException()

        try:
            sys_user = SysUser.objects.get(
                system=system, username=linux_username)
            app_user_system = AppUserSystem.objects.get(
                system=system, app_user=request.user)
        except SysUser.DoesNotExist:
            raise UserNotFoundException()
        except AppUserSystem.DoesNotExist:
            raise UserNotFoundException()

        if not sys_user.password:
            raise InvalidCredentialsException()

        try:
            client = ssh_connect(
                system.ip_address, system.ssh_port, linux_username, linux_password)
        except (InvalidCredentialsException, SSHConnectionException) as e:
            raise e

        if client:
            # Generar token de autenticación SSH
            ssh_token = str(uuid.uuid4())
            expires_at = timezone.now() + timedelta(hours=1)  # Caducidad del token en 1 hora
            ssh_auth_token = SSHAuthToken.objects.create(
                user=request.user,
                system=system,
                token=ssh_token,
                expires_at=expires_at
            )

            client.close()
            return Response({'message': 'Conexión SSH exitosa', 'ssh_token': ssh_token}, status=status.HTTP_200_OK)
        else:
            raise SSHConnectionException()


class ServerCommandView(APIView):
    def post(self, request):
        system_id = request.data.get('system_id')
        commands = request.data.get('commands', [])

        sudo_password = request.data.get('sudo_password')
        ssh_token = request.headers.get('ssh_token')

        if not isinstance(commands, list):
            return Response({'error': 'El campo "commands" debe ser una lista'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            system = System.objects.get(id=system_id)
            sys_user = SysUser.objects.get(system=system)
            app_user_system = AppUserSystem.objects.get(
                system=system, app_user=request.user)
            ssh_auth_token = SSHAuthToken.objects.get(
                token=ssh_token, system=system, user=request.user)
        except System.DoesNotExist:
            raise ServerNotFoundException()
        except SysUser.DoesNotExist:
            raise UserNotFoundException()
        except AppUserSystem.DoesNotExist:
            raise UserNotFoundException()
        except SSHAuthToken.DoesNotExist:
            raise InvalidSSHTokenException()

        if ssh_auth_token.is_expired():
            raise InvalidSSHTokenException()

        try:
            client = ssh_connect(
                system.ip_address, system.ssh_port, sys_user.username, sys_user.password)
        except (InvalidCredentialsException, SSHConnectionException) as e:
            raise e

        if client:
            output = {}
            for command in commands:
                try:
                    stdout, stderr = ssh_execute_command(
                        client, command, sudo_password)
                except SSHConnectionException as e:
                    raise e
                output[command] = {'stdout': stdout, 'stderr': stderr}
            client.close()
            return Response(output, status=status.HTTP_200_OK)
        else:
            raise SSHConnectionException()


class TerminalConsumerView(View):
    def get(self, request, server_id):
        ssh_token = request.headers.get('ssh-token')

        if not ssh_token:
            return HttpResponseBadRequest("Token SSH no proporcionado.")

        try:
            system = System.objects.get(id=server_id)
            sys_user = SysUser.objects.get(system=system)
            app_user_system = AppUserSystem.objects.get(
                system=system, app_user=request.user)
            ssh_auth_token = SSHAuthToken.objects.get(
                token=ssh_token, system=system, user=request.user)
        except (System.DoesNotExist, SysUser.DoesNotExist, AppUserSystem.DoesNotExist, SSHAuthToken.DoesNotExist):
            return HttpResponseBadRequest("No tienes acceso a este servidor o el token SSH es inválido.")

        if ssh_auth_token.is_expired():
            return HttpResponseBadRequest("El token SSH ha expirado.")

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_add)(
            f'terminal_{server_id}',
            f'terminal_{request.user.id}'
        )

        return HttpResponse("Conexión WebSocket establecida correctamente.")
