import { Component, Input, Output } from '@angular/core';
import { System } from '../../models';
import { EventEmitter } from '@angular/core';

@Component({
  selector: 'app-server-options',
  templateUrl: './server-options.component.html',
  styleUrl: './server-options.component.css'
})
export class ServerOptionsComponent {
  @Input() selectedSystem: System | null = null;
  @Output() logoutClicked = new EventEmitter<void>();

  logout() {

  }
}
