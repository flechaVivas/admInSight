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
        this.message = 'Ha ocurrido un error. Por favor, inténtelo de nuevo más tarde.';
        this.isLoading = false;
      }
    });
  }
}