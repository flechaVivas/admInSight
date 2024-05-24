# consumers.py
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from .ssh_utils import ssh_connect, ssh_execute_command
from asgiref.sync import sync_to_async


class TerminalConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.server_id = self.scope['url_route']['kwargs']['server_id']
        # Log de intento de conexión
        print(f'Intentando conectar al servidor {self.server_id}')
        from .models import System, SysUser
        self.server, self.sys_user = await self.get_server_and_user_objects()
        if self.server and self.sys_user:
            self.group_name = f'terminal_{self.server_id}'
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            # Log de conexión exitosa
            print(f'Conectado al servidor {self.server_id}')

            # Enviar mensaje de prueba
            await self.send(text_data='Conexión establecida con éxito')
        else:
            print(f'Error al conectar al servidor {
                self.server_id}')  # Log de error
            await self.close()

    async def disconnect(self, close_code):
        if self.server:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        print(f'Comando recibido: {text_data}')  # Log de comando recibido
        if self.server and self.sys_user:
            try:
                client = await sync_to_async(ssh_connect)(
                    self.server.ip_address,
                    self.server.ssh_port,
                    self.sys_user.username,
                    self.sys_user.password
                )
                print('Conexión SSH establecida')  # Log de conexión SSH
                stdout, stderr = await sync_to_async(ssh_execute_command)(client, text_data)
                print(f'Comando ejecutado, stdout: {
                      stdout}, stderr: {stderr}')  # Log de resultados
                client.close()
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        'type': 'terminal_message',
                        'message': stdout,
                    }
                )
                if stderr:
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            'type': 'terminal_message',
                            'message': stderr,
                        }
                    )
            except Exception as e:
                # Log de error de ejecución
                print(f'Error ejecutando comando: {e}')
                await self.send(text_data=f'Error: {e}')

    async def terminal_message(self, event):
        message = event['message']
        # Log de envío de mensaje
        print(f'Enviando mensaje al cliente: {message}')
        await self.send(text_data=message)

    @sync_to_async
    def get_server_and_user_objects(self):
        from .models import System, SysUser
        try:
            server = System.objects.get(id=self.server_id)
            sys_user = SysUser.objects.get(system=server)
            return server, sys_user
        except (System.DoesNotExist, SysUser.DoesNotExist):
            return None, None
