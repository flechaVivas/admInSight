from django.db import models
from django.contrib.auth.models import User


class System(models.Model):
    name = models.CharField(max_length=100)
    ip_address = models.CharField(max_length=50)
    ssh_port = models.IntegerField()
    app_users = models.ManyToManyField(
        User, through='AppUserSystem', related_name='systems')


class SysUser(models.Model):
    username = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    system = models.ForeignKey(System, on_delete=models.CASCADE)


class AppUserSystem(models.Model):
    app_user = models.ForeignKey(User, on_delete=models.CASCADE)
    system = models.ForeignKey(System, on_delete=models.CASCADE)

    class Meta:
        unique_together = ('app_user', 'system')
