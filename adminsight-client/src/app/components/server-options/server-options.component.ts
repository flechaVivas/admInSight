import { Component, Input, Output } from '@angular/core';
import { System } from '../../models';
import { EventEmitter } from '@angular/core';
import { SshService } from '../../services/ssh.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-server-options',
  templateUrl: './server-options.component.html',
  styleUrl: './server-options.component.css'
})
export class ServerOptionsComponent {
  @Input() selectedSystem: System | null = null;
  @Output() logoutClicked = new EventEmitter<void>();

  constructor(private sshService: SshService, private router: Router) { }

  serverOptions: string[] = ['OS Information', 'Hardware Information', 'Network Information',
    'Software Information', 'User Information', 'Process Information', 'File Information',
    'Log Information', 'Security Information', 'System Information'];

  logout() {
    this.sshService.logoutServer();
    this.logoutClicked.emit();
    this.selectedSystem = null;

    this.router.navigate(['/login-server']);
  }

  handleOptionClick(option: string) {
    // call fetch data method
  }

}
