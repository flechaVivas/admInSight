import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorService, ErrorType } from '../../services/http-error.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
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
    private httpErrorService: HttpErrorService
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
          this.handleError(error);
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  handleError(error: any): void {
    if (error.errorType === ErrorType.EmailAlreadyExists) {
      this.emailError = 'Email already registered';
    } else {
      this.emailError = 'Ha ocurrido un error inesperado.';
    }
  }
}