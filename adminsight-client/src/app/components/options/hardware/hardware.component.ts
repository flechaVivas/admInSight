import { Component } from '@angular/core';
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
  selector: 'app-hardware',
  templateUrl: './hardware.component.html',
  styleUrl: './hardware.component.css'
})
export class HardwareComponent {

  cpuInfo: string = '';
  memoryInfo: string = '';
  storageInfo: string = '';
  pciInfo: string = '';
  usbInfo: string = '';

  constructor(private sshService: SshService, private router: Router) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  ngOnInit() {
    if (this.systemId) {
      this.fetchHardwareInfo();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  fetchHardwareInfo() {
    const commands = [
      'lscpu',
      'lsmem',
      'lsblk',
      'lspci',
      'lsusb'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: CommandResponse) => {
          this.cpuInfo = response['lscpu']?.stdout || '';
          this.memoryInfo = response['lsmem']?.stdout || '';
          this.storageInfo = response['lsblk']?.stdout || '';
          this.pciInfo = response['lspci']?.stdout || '';
          this.usbInfo = response['lsusb']?.stdout || '';
        },
        (error) => {
          console.error('Error al obtener la información del hardware:', error);
        }
      );
  }

}
