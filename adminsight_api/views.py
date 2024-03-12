from rest_framework.decorators import api_view
from rest_framework.response import Response
from . import serializers
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from rest_framework import status
from django.shortcuts import get_object_or_404
from rest_framework.decorators import permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.authentication import TokenAuthentication

@api_view(['POST'])
def login(request):

  user = get_object_or_404(User, username=request.data['username'])

  if not user.check_password(request.data['password']):
    return Response({"error": "Invalid password"}, status=status.HTTP_400_BAD_REQUEST)
  
  token, created = Token.objects.get_or_create(user=user)

  serializer = serializers.UserSerializer(instance=user)
  
  return Response({'token': token.key, "user": serializer.data},status=status.HTTP_200_OK)

@api_view(['POST'])
def register(request):

  serializer = serializers.UserSerializer(data=request.data)

  if serializer.is_valid():
    serializer.save()

    user = User.objects.get(username=serializer.data['username'])
    user.set_password(serializer.data['password'])
    user.save()

    token = Token.objects.create(user=user)
  
    return Response({'token': token.key, "user": serializer.data},
                  status=status.HTTP_201_CREATED)
  else:
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def profile(request):
  serializer = serializers.UserSerializer(instance=request.user)
  return Response(serializer.data, status=status.HTTP_200_OK)