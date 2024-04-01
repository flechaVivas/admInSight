import { Component } from '@angular/core';
import { System } from '../../models';

@Component({
  selector: 'app-login-server',
  templateUrl: './login-server.component.html',
  styleUrls: ['./login-server.component.css']
})
export class LoginServerComponent {
  selectedSystem: System | null = null;
  showRegisterForm: boolean = false;
  showSshForm: boolean = false;

  onSystemSelected(system: System) {
    this.selectedSystem = system;
    this.showRegisterForm = false;
    this.showSshForm = true; // Mostrar el formulario de inicio de sesión SSH
  }

  toggleRegisterForm() {
    this.showRegisterForm = !this.showRegisterForm;
    this.selectedSystem = null; // Limpiar la selección del sistema
    this.showSshForm = false; // Ocultar el formulario de inicio de sesión SSH
  }
}