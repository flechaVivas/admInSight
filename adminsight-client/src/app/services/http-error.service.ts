import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorService {
  constructor(private router: Router) { }

  handleError(error: HttpErrorResponse): { isInvalidCredentials: boolean } | null {
    if (error.status === 401) {
      if (error.error.error_code === 'invalid_sudo_password') {
        alert('La contraseña de sudo es incorrecta.');
      } else if (error.error.error_code === 'invalid_ssh_token') {
        alert('El token SSH es inválido o ha expirado.');
      } else {
        alert('Su sesión ha caducado. Inicie sesión nuevamente.');
        this.router.navigate(['/login-server']);
      }
      return null;
    } else if (error.status === 403) {
      alert('No tiene permiso para acceder a este recurso.');
      this.router.navigate(['/login-server']);
      return null;
    } else if (error.status === 404) {
      if (error.error.error_code === 'server_not_found') {
        alert('Servidor no encontrado.');
      } else if (error.error.error_code === 'user_not_found') {
        alert('Usuario no encontrado.');
      } else if (error.error.error_code === 'sys_user_not_found') {
        alert('Usuario del sistema no encontrado.');
      } else if (error.error.error_code === 'ssh_auth_token_not_found') {
        alert('Token de autenticación SSH no encontrado.');
      } else {
        this.router.navigate(['/not-found']);
      }
      return null;
    } else if (error.status === 400) {
      if (error.error.error_code === 'invalid_credentials') {
        alert('Credenciales inválidas.');
        return { isInvalidCredentials: true };
      } else if (error.error.error_code === 'email_already_exists') {
        alert('El correo electrónico ya está registrado.');
      } else if (error.error.error_code === 'username_already_exists') {
        alert('El nombre de usuario ya está registrado.');
      }
    } else {
      console.error('Un error ha ocurrido:', error);
      return null;
    }
    return null;
  }
}