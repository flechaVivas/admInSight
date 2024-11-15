import { Component, OnInit } from '@angular/core';
import { AuthService } from "../../services/auth.service";
import { UserCredentials } from "../../auth";
import { Router } from '@angular/router';
import { HttpErrorService, ErrorType } from '../../services/http-error.service';

@Component({
  selector: 'app-user-login',
  templateUrl: './login.component.html',
})

export class LoginComponent implements OnInit {

  email: string = '';
  password: string = '';
  emailError: string = '';
  passwordError: string = '';
  loginError: string = '';
  isLoading: boolean = false;

  passwordVisible: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private httpErrorService: HttpErrorService
  ) { }

  ngOnInit(): void { }

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  logInUser(): void {
    this.emailError = '';
    this.passwordError = '';
    this.loginError = '';
    this.isLoading = true;

    if (!this.email) {
      this.emailError = 'Please fill in the email field.';
      this.isLoading = false;
      return;
    }

    if (!this.password) {
      this.passwordError = 'Please fill in the password field.';
      this.isLoading = false;
      return;
    }

    const user: UserCredentials = {
      email: this.email || '',
      password: this.password || ''
    };

    this.authService.login(user.email, user.password).subscribe({
      next: (data) => {
        this.isLoading = false;
        this.router.navigate(['/login-server']);
      },
      error: (error) => {
        this.isLoading = false;
        this.handleError(error);
      }
    });
  }

  handleError(error: any): void {
    switch (error.error.error_code) {
      case 'invalid_credentials':
        this.loginError = 'Invalid email or password.';
        break;
      case 'user_not_found':
        this.loginError = 'Invalid email or password.';
        break;
      case 'not_found':
        this.loginError = 'Invalid email or password.';
        break;
      default:
        this.loginError = 'An error occurred. Please try again later.';
        break;
    }
  }
}