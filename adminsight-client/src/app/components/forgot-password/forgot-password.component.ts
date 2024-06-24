import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
  email: string = '';
  message: string = '';
  isLoading: boolean = false;

  constructor(private authService: AuthService) { }

  onSubmit() {
    this.isLoading = true;
    this.authService.forgotPassword(this.email).subscribe({
      next: (response) => {
        this.message = 'Se ha enviado un correo electrónico con instrucciones para restablecer la contraseña.';
        this.isLoading = false;
      },
      error: (error) => {

        switch (error.status) {
          case 404:
            this.message = 'Error: No se ha encontrado una cuenta con el correo electrónico proporcionado.';
            this.isLoading = false;
            break;
          case 429:
            this.message = 'Error: Demasiados intentos. Por favor, inténtelo de nuevo más tarde.';
            this.isLoading = false;
            break;
          default:
        }
      }
    });
  }
}