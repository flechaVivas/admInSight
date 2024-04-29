from rest_framework.exceptions import APIException


class InvalidCredentialsException(APIException):
    status_code = 400
    default_detail = 'Credenciales inválidas.'
    default_code = 'invalid_credentials'


class UserNotFoundException(APIException):
    status_code = 404
    default_detail = 'Usuario no encontrado.'
    default_code = 'user_not_found'


class ServerNotFoundException(APIException):
    status_code = 404
    default_detail = 'Servidor no encontrado.'
    default_code = 'server_not_found'


class SSHConnectionException(APIException):
    status_code = 400
    default_detail = 'Error al conectar al servidor.'
    default_code = 'ssh_connection_error'


class InvalidSSHTokenException(APIException):
    status_code = 401
    default_detail = 'Token SSH inválido o expirado.'
    default_code = 'invalid_ssh_token'


class InvalidSudoPasswordException(APIException):
    status_code = 401
    default_detail = 'Contraseña de sudo incorrecta.'
    default_code = 'invalid_sudo_password'


class EmailAlreadyExistsException(APIException):
    status_code = 400
    default_detail = 'El correo electrónico ya está registrado.'
    default_code = 'email_already_exists'


class UsernameAlreadyExistsException(APIException):
    status_code = 400
    default_detail = 'El nombre de usuario ya está registrado.'
    default_code = 'username_already_exists'
