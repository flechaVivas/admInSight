
import paramiko
from .models import System, SysUser


def ssh_connect(hostname, port, username, password):
    """
    Establece una conexión SSH con el servidor especificado.
    Devuelve un objeto SSHClient si la conexión es exitosa, de lo contrario, devuelve None.
    """
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


def register_server(hostname, port, username, password):
    """
    Intenta establecer una conexión SSH con el servidor especificado.
    Si la conexión es exitosa, crea instancias de System y SysUser y las devuelve.
    De lo contrario, devuelve None para ambas.
    """
    client = ssh_connect(hostname, port, username, password)
    if client:
        system = System.objects.create(
            name=hostname,
            ip_address=hostname,
            ssh_port=port
        )
        sys_user = SysUser.objects.create(
            username=username,
            password=password,
            system=system
        )
        client.close()
        return system, sys_user
    return None, None
