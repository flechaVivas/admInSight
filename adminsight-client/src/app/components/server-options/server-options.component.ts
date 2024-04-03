import { Component, Input, Output, EventEmitter } from '@angular/core';
import { System } from '../../models';
import { SshService } from '../../services/ssh.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-server-options',
  templateUrl: './server-options.component.html',
  styleUrls: ['./server-options.component.css']
})
export class ServerOptionsComponent {
  @Input() selectedSystem: System | null = null;
  @Output() logoutClicked = new EventEmitter<void>();
  @Output() optionSelected = new EventEmitter<string>();

  serverOptions: string[] = [
    'OS Information',
    'Hardware Information',
    'Network Information',
    'Software Information',
    'User Information',
    'Process Information',
    'File Information',
    'Log Information',
    'Security Information',
    'System Information'
  ];

  constructor(private sshService: SshService, private router: Router) { }

  logout() {
    this.sshService.logoutServer();
    this.logoutClicked.emit();
    this.selectedSystem = null;
    this.router.navigate(['/login-server']);
  }

  handleOptionClick(option: string) {
    this.optionSelected.emit(option);
    // Lógica para cargar los datos correspondientes a la opción seleccionada
  }
}