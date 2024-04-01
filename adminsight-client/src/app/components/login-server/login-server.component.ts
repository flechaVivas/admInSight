import { Component } from '@angular/core';
import { System } from '../../models';

@Component({
  selector: 'app-login-server',
  templateUrl: './login-server.component.html',
  styleUrls: ['./login-server.component.css']
})
export class LoginServerComponent {
  selectedSystem: System | null = null;

  onSystemSelected(system: System) {
    this.selectedSystem = system;
  }
}
