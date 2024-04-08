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
    'Hardware',
    'Processes',
    'Services',
    'Packages',
    'Network',
    'Users & Groups',
    'Logs',
    'Security',
    'Storage',
    'File Explorer',
    'Terminal'
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