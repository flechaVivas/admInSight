import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SystemService } from '../../services/systems.service';

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
    private systemService: SystemService
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
      this.credentialsError = ''; // Limpiar el mensaje de error

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
            console.error('Error registering server:', error);
            this.isLoading = false;
            this.isSuccess = false;
            if (error.status === 400) {
              this.credentialsError = 'Invalid SSH credentials';
            }
          }
        );
    }
  }
}
