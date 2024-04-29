import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SystemService } from '../../services/systems.service';
import { HttpErrorService, ErrorType } from '../../services/http-error.service';

@Component({
  selector: 'app-register-server',
  templateUrl: './register-server.component.html',
  styleUrls: ['./register-server.component.css']
})
export class RegisterServerComponent {
  registerForm: FormGroup;
  isLoading: boolean = false;
  isSuccess: boolean = false;
  credentialsError: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private systemService: SystemService,
    private httpErrorService: HttpErrorService
  ) {
    this.registerForm = this.formBuilder.group({
      name: ['', Validators.required],
      ip_address: ['', Validators.required],
      port: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.isSuccess = false;
      this.credentialsError = '';

      const formData = this.registerForm.value;
      this.systemService.registerServer(formData)
        .subscribe(
          response => {
            console.log('Server registered successfully:', response);
            setTimeout(() => {
              this.isLoading = false;
              this.isSuccess = true;
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }, 1000);
          },
          error => {
            this.isLoading = false;
            this.isSuccess = false;
            this.handleError(error);
          }
        );
    }
  }

  handleError(error: any): void {
    console.error('Error:', error);
    switch (error.error.error_code) {
      case 'ssh_connection_error':
        this.credentialsError = 'Error de conexión SSH.';
        break;
      case 'server_not_found':
        this.credentialsError = 'Servidor no encontrado.';
        break;
      default:
        this.credentialsError = 'Error desconocido.';
        break;
    }
  }
}