import { Component, Input, OnInit } from '@angular/core';
import { System } from '../../models';
import { SshService } from '../../services/ssh.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { FormGroup, FormControl } from '@angular/forms';
import { HttpErrorService } from '../../services/http-error.service';

@Component({
  selector: 'app-ssh-form',
  templateUrl: './ssh-form.component.html',
  styleUrls: ['./ssh-form.component.css']
})
export class SshFormComponent implements OnInit {
  @Input() selectedSystem: System | null = null;
  sshForm: FormGroup;
  isLoading = false;
  isSuccess = false;
  isInvalidCredentials = false;
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
    this.isInvalidCredentials = false;

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
        const errorHandled = this.httpErrorService.handleError(error);
        if (errorHandled?.isInvalidCredentials) {
          this.isLoading = false;
          this.errorMessage = 'The username or password is incorrect'; // Actualizar el mensaje de error
        } else {
          console.error('Login failed', error);
          this.isLoading = false;
          this.errorMessage = ''; // Limpiar el mensaje de error
        }
      }
    );
  }
}