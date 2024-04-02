import { Component, Input, OnInit } from '@angular/core';
import { System } from '../../models';
import { SshService } from '../../services/ssh.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-ssh-form',
  templateUrl: './ssh-form.component.html',
  styleUrls: ['./ssh-form.component.css']
})
export class SshFormComponent implements OnInit {
  @Input() selectedSystem: System | null = null;
  username: string = '';
  password: string = '';

  constructor(private sshService: SshService, private authService: AuthService) { }

  ngOnInit(): void { }

  onSubmit(): void {
    if (!this.selectedSystem) {
      console.error('No system selected');
      return;
    }

    this.sshService.login(this.selectedSystem.id, this.username, this.password).subscribe(
      (response) => {
        console.log('Login successful', response);
        this.authService.setSshToken(response.ssh_token);
        // Aquí puedes manejar la respuesta exitosa, por ejemplo, redirigir al usuario a otra página
      },
      (error) => {
        console.error('Login failed', error);
        // Aquí puedes manejar el error, por ejemplo, mostrar un mensaje al usuario
      }
    );
  }
}