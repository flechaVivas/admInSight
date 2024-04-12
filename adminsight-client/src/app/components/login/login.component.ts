import { Component, OnInit } from '@angular/core';
import { AuthService } from "../../services/auth.service";
import { UserCredentials } from "../../auth";
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})

export class LoginComponent implements OnInit {

  email: string = '';
  password: string = '';
  emailError: string = '';
  passwordError: string = '';
  loginError: string = '';
  isLoading: boolean = false; // Nueva variable para controlar el spinner

  constructor(
    private authService: AuthService,
    private router: Router
  ) { };

  ngOnInit(): void {
  }

  logInUser(): void {

    this.emailError = '';
    this.passwordError = '';
    this.loginError = '';
    this.isLoading = true; // Mostrar el spinner

    if (!this.email) {
      this.emailError = 'Por favor, complete el campo de email.';
      this.isLoading = false; // Ocultar el spinner
      return;
    }

    if (!this.password) {
      this.passwordError = 'Por favor, complete el campo de contraseña.';
      this.isLoading = false; // Ocultar el spinner
      return;
    }

    const user: UserCredentials = {
      email: this.email || '',
      password: this.password || ''
    };

    this.authService.login(user.email, user.password).subscribe({
      next: (data) => {
        this.isLoading = false; // Ocultar el spinner
        // Redirige al usuario a la página de inicio o a otra ruta después del inicio de sesión exitoso
        this.router.navigate(['/login-server']);
      },
      error: (error) => {
        this.isLoading = false; // Ocultar el spinner
        // Maneja el error de inicio de sesión
        this.loginError = 'Usuario y/o contraseña no son correctos.';
      }
    });
  }
}