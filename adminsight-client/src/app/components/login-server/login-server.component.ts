import { Component } from '@angular/core';
import { System } from '../../models';

@Component({
  selector: 'app-login-server',
  templateUrl: './login-server.component.html',
  styleUrl: './login-server.component.css'
})
export class LoginServerComponent {
  selectedSystem: System | null = null;
  showRegisterForm: boolean = false;
  showSshForm: boolean = false;
  showUserProfile: boolean = false;

  onSystemSelected(system: System) {
    this.selectedSystem = system;
    this.showRegisterForm = false;
    this.showSshForm = true;
    this.showUserProfile = false;
  }

  toggleRegisterForm() {
    this.showRegisterForm = !this.showRegisterForm;
    this.selectedSystem = null;
    this.showSshForm = false;
    this.showUserProfile = false;
  }

  toggleUserProfile() {
    this.showUserProfile = !this.showUserProfile;
    this.showRegisterForm = false;
    this.showSshForm = false;
    this.selectedSystem = null;
  }
}