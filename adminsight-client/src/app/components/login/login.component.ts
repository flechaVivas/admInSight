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

    if (!this.email) {
      this.emailError = 'Por favor, complete el campo de email.';
      return;
    }

    if (!this.password) {
      this.passwordError = 'Por favor, complete el campo de contraseña.';
      return;
    }

    const user: UserCredentials = {
      email: this.email || '',
      password: this.password || ''
    };
    this.authService.login(user.email, user.password).subscribe({
      next: (data) => {
        this.authService.setLoggedInUser(data);
        // this.router.navigateByUrl(`/home/${data.id}`);
      },
      error: (error) => {
        if (error.error && error.error.detail === "Not found.") {
          this.loginError = 'Usuario y/o contraseña no son correctos.';
        } else {
          this.loginError = 'Ocurrió un error al iniciar sesión.';
        }
      }
    });
  }


}