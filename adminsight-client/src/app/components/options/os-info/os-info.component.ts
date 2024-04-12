import { Component, OnInit, Input } from '@angular/core';
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
  selector: 'app-os-info',
  templateUrl: './os-info.component.html',
  styleUrls: ['./os-info.component.css']
})
export class OsInfoComponent implements OnInit {

  @Input() sudoPassword: string | null = null;

  kernelInfo: string = '';
  hostname: string = '';
  uptime: string = '';
  distribution: string = '';
  version: string = '';
  dataLoaded = false; // Variable para indicar si los datos están cargados

  constructor(private sshService: SshService, private router: Router) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  ngOnInit() {
    if (this.systemId) {
      this.fetchOsInfo();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  fetchOsInfo() {
    const commands = [
      'uname -s',
      'hostname',
      'uptime -p',
      'cat /etc/os-release | grep PRETTY_NAME | cut -d \'"\' -f2',
      'cat /etc/os-release | grep VERSION_ID | cut -d \'"\' -f2'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: CommandResponse) => {
          this.kernelInfo = response['uname -s']?.stdout.trim() || '';
          this.hostname = response['hostname']?.stdout.trim() || '';
          this.uptime = response['uptime -p']?.stdout.trim() || '';
          this.distribution = response['cat /etc/os-release | grep PRETTY_NAME | cut -d \'"\' -f2']?.stdout.trim() || '';
          this.version = response['cat /etc/os-release | grep VERSION_ID | cut -d \'"\' -f2']?.stdout.trim() || '';
          this.dataLoaded = true; // Actualiza dataLoaded a true una vez que los datos estén cargados
        },
        (error) => {
          console.error('Error al obtener la información del sistema operativo:', error);
        }
      );
  }
}
