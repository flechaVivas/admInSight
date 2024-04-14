import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorService } from '../../services/http-error.service'; // Asegúrate de importar el servicio correctamente

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  email = '';
  password = '';
  confirmPassword = '';
  emailError = '';
  passwordError = '';
  confirmPasswordError = '';
  isLoading: boolean = false;
  registrationSuccess: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private httpErrorService: HttpErrorService // Inyecta el servicio aquí
  ) { }

  registerUser() {
    this.emailError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.isLoading = true;
    this.registrationSuccess = false;

    if (!this.email) {
      this.emailError = 'Email is required';
      this.isLoading = false;
    }
    if (!this.password) {
      this.passwordError = 'Password is required';
      this.isLoading = false;
    }
    if (!this.confirmPassword) {
      this.confirmPasswordError = 'Confirm password is required';
      this.isLoading = false;
    }
    if (this.password && this.confirmPassword && this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match';
      this.isLoading = false;
    }

    if (!this.emailError && !this.passwordError && !this.confirmPasswordError) {
      const username = this.email.split('@')[0];
      this.authService.register(this.email, username, this.password).subscribe({
        next: (data) => {
          this.isLoading = false;
          this.registrationSuccess = true;
          setTimeout(() => {
            this.router.navigateByUrl('/login');
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          const errorHandlingResult = this.httpErrorService.handleError(error);
          if (errorHandlingResult && errorHandlingResult.isInvalidCredentials) {
            this.emailError = 'Email already registered';
          }
        }
      });
    } else {
      this.isLoading = false;
    }
  }
}
