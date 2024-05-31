import { Component, Input, OnInit } from '@angular/core';
import { System } from '../../models';
import { SshService } from '../../services/ssh.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { HttpErrorService, ErrorType } from '../../services/http-error.service';

@Component({
  selector: 'app-ssh-form',
  templateUrl: './ssh-form.component.html',
})
export class SshFormComponent implements OnInit {
  @Input() selectedSystem: System | null = null;
  sshForm: FormGroup;
  isLoading = false;
  isSuccess = false;
  errorMessage = '';

  constructor(
    private sshService: SshService,
    private authService: AuthService,
    private router: Router,
    private httpErrorService: HttpErrorService
  ) {
    this.sshForm = new FormGroup({
      username: new FormControl(''),
      password: new FormControl(''),
    });
  }

  ngOnInit(): void { }

  onSubmit(): void {
    if (!this.selectedSystem) {
      console.error('No system selected');
      return;
    }

    const username = this.sshForm.get('username')?.value;
    const password = this.sshForm.get('password')?.value;

    this.isLoading = true;
    this.isSuccess = false;
    this.errorMessage = '';

    this.sshService.login(this.selectedSystem.id, username, password).subscribe(
      (response) => {
        this.authService.setSshToken(response.ssh_token);

        setTimeout(() => {
          this.isLoading = false;
          this.isSuccess = true;

          setTimeout(() => {
            this.router.navigate(['/dashboard', this.selectedSystem?.id]);
          }, 1500);
        }, 1500);
      },
      (error) => {
        this.isLoading = false;
        this.handleError(error);
      }
    );
  }

  handleError(error: any): void {
    switch (error.error.error_code) {
      case 'user_not_found':
        this.errorMessage = 'El nombre de usuario o contraseña es incorrecto';
        break;
      case 'not_found':
        this.errorMessage = 'El nombre de usuario o contraseña es incorrecto';
        break;
      case 'ssh_connection_error':
        this.errorMessage = 'Error al conectar al servidor';
        break;
      default:
        this.errorMessage = 'Ha ocurrido un error inesperado';
        break;
    }
  }
}