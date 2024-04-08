// processes.component.ts
import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';

interface CommandOutput {
  stdout: string;
  stderr: string;
}

interface CommandResponse {
  [key: string]: CommandOutput;
}

@Component({
  selector: 'app-processes',
  templateUrl: './processes.component.html',
  styleUrls: ['./processes.component.css']
})
export class ProcessesComponent implements OnInit {
  allProcesses: string = '';
  runningProcesses: string = '';
  processesByUser: string = '';
  processesByMemory: string = '';
  processesByCpu: string = '';

  constructor(private sshService: SshService, private router: Router) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  ngOnInit() {
    if (this.systemId) {
      this.fetchProcessInfo();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  fetchProcessInfo() {
    const commands = [
      'ps aux',
      'ps -ef',
      'ps -u $(whoami)',
      'ps aux --sort=-rmem',
      'ps aux --sort=-pcpu'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: CommandResponse) => {
          this.allProcesses = response['ps aux']?.stdout || '';
          this.runningProcesses = response['ps -ef']?.stdout || '';
          this.processesByUser = response['ps -u $(whoami)']?.stdout || '';
          this.processesByMemory = response['ps aux --sort=-rmem']?.stdout || '';
          this.processesByCpu = response['ps aux --sort=-pcpu']?.stdout || '';
        },
        (error) => {
          console.error('Error al obtener la información de los procesos:', error);
        }
      );
  }
}