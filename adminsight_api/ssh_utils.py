
import paramiko
from .models import System, SysUser


def ssh_connect(hostname, port, username, password):
    try:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(hostname=hostname, port=port,
                       username=username, password=password)
        return client
    except paramiko.AuthenticationException:
        print("Error de autenticación: Credenciales inválidas")
    except Exception as e:
        print(f"Error al conectar: {e}")
    return None


def register_server(name, hostname, port, username, password):
    client = ssh_connect(hostname, port, username, password)
    if client:
        system = System.objects.create(
            name=name,
            ip_address=hostname,
            ssh_port=port
        )
        sys_user = SysUser.objects.create(
            username=username,
            system=system,
            password=password
        )
        sys_user.save()
        client.close()
        return system, sys_user
    return None, None


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
