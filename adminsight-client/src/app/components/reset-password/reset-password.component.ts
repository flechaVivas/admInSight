import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent implements OnInit {
  uid: string = '';
  token: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  message: string = '';
  isLoading: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    this.uid = this.route.snapshot.paramMap.get('uid') || '';
    this.token = this.route.snapshot.paramMap.get('token') || '';
  }

  onSubmit() {
    if (this.newPassword !== this.confirmPassword) {
      this.message = 'Las contraseñas no coinciden.';
      return;
    }

    this.isLoading = true;
    this.authService.resetPassword(this.uid, this.token, this.newPassword).subscribe({
      next: (response) => {
        this.message = 'Contraseña actualizada correctamente. Redirigiendo al inicio de sesión...';
        this.isLoading = false;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        this.message = 'Ha ocurrido un error. Por favor, inténtelo de nuevo más tarde.';
        this.isLoading = false;
      }
    });
  }
}