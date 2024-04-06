
import paramiko
from .models import System, SysUser
from paramiko.rsakey import RSAKey
from io import StringIO


def ssh_connect(hostname, port, sys_user):
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        # Cargar la clave privada desde el modelo SysUser
        private_key_obj = RSAKey.from_private_key(
            StringIO(sys_user.public_key))

        client.connect(hostname=hostname, port=port, pkey=private_key_obj)
        return client
    except Exception as e:
        print(f"Error al conectar: {e}")
    return None


def register_server(name, hostname, port, username, public_key):
    system = System.objects.create(
        name=name,
        ip_address=hostname,
        ssh_port=port
    )
    sys_user = SysUser.objects.create(
        username=username,
        system=system,
        public_key=public_key
    )
    return system, sys_user


def ssh_execute_command(client, command, sudo_password=None):
    try:
        if command.startswith('sudo'):
            if sudo_password is None:
                return None, "Se requiere la contraseña de sudo"

            command = f"echo '{sudo_password}' | sudo -S {command[4:].strip()}"

        stdin, stdout, stderr = client.exec_command(command)
        stdout_output = stdout.read().decode()
        stderr_output = stderr.read().decode()
        return stdout_output, stderr_output
    except Exception as e:
        print(f"Error al ejecutar el comando: {e}")
        return None, None
