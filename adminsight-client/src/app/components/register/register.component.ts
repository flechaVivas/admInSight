import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

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

  constructor(private authService: AuthService, private router: Router) { }

  registerUser() {
    this.emailError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';

    if (!this.email) {
      this.emailError = 'Email is required';
    }
    if (!this.password) {
      this.passwordError = 'Password is required';
    }
    if (!this.confirmPassword) {
      this.confirmPasswordError = 'Confirm password is required';
    }
    if (this.password && this.confirmPassword && this.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match';
    }

    // Si no hay errores, procede con el registro
    if (!this.emailError && !this.passwordError && !this.confirmPasswordError) {
      // Extrae el nombre de usuario del email
      const username = this.email.split('@')[0];

      this.authService.register(this.email, username, this.password).subscribe({
        next: (data) => {
          console.log('Registro exitoso');

          this.router.navigateByUrl('/login');
        },
        error: (error) => {
          console.log(error);
          // Aquí puedes manejar el error mostrando un mensaje al usuario
        }
      });
    }
  }
}
