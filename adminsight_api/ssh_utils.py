from paramiko import SSHClient, AutoAddPolicy
from .models import System, SysUser


def ssh_connect(system_id, username, password):
    system = System.objects.get(id=system_id)
    sys_user = system.sysuser_set.first()

    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())

    try:
        ssh.connect(
            hostname=system.ip_address,
            port=system.ssh_port,
            username=sys_user.username if username is None else username,
            password=sys_user.password if password is None else password
        )
        return ssh
    except Exception as e:
        raise e


def register_server(ip_address, ssh_port, username, password, public_key=None):
    system = System.objects.create(
        name=f"{username}@{ip_address}",
        ip_address=ip_address,
        ssh_port=ssh_port
    )

    sys_user = SysUser.objects.create(
        username=username,
        password=password,  # Hash the password before storing
        system=system
    )

    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())

    try:
        ssh.connect(
            hostname=ip_address,
            port=ssh_port,
            username=username,
            password=password,
            pkey=public_key
        )
        return system, sys_user
    except Exception as e:
        system.delete()
        sys_user.delete()
        raise e
