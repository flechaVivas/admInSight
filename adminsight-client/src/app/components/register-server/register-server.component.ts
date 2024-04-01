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
      const formData = this.registerForm.value;
      this.systemService.registerServer(formData)
        .subscribe(
          response => {
            console.log('Server registered successfully:', response);
          },
          error => {
            console.error('Error registering server:', error);
          }
        );
    }
  }

}