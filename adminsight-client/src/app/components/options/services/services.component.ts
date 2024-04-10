import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';

export interface Service {
  name: string;
  description: string;
  status: string;
}

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  filteredServices: Service[] = [];
  searchTerm: string = '';
  activeFilter: string = '';
  enabledFilter: string = '';
  sortColumn: string = 'name';
  sortDirection: string = 'asc';

  constructor(private sshService: SshService, private router: Router) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  ngOnInit() {
    if (this.systemId) {
      this.fetchServiceInfo();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  fetchServiceInfo() {
    const commands = [
      'systemctl list-units --type=service --all --no-pager'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          const output = response['systemctl list-units --type=service --all --no-pager']?.stdout || '';
          const lines = output.trim().split('\n');
          const headers = lines.shift()?.trim().split(/\s+/);

          if (!headers || headers.length < 5) {
            console.error('La salida del comando no tiene el formato esperado.');
            return;
          }

          const serviceNameIndex = headers.indexOf('UNIT');
          const loadStateIndex = headers.indexOf('LOAD');
          const activeStateIndex = headers.indexOf('ACTIVE');
          const subStateIndex = headers.indexOf('SUB');
          const descriptionIndex = headers.indexOf('DESCRIPTION');

          this.services = lines
            .filter((line: string) => line.trim() !== '')
            .map((line: string) => {
              const parts = line.trim().split(/\s+/);
              const serviceName = parts[serviceNameIndex]?.replace(/^●/, '') || '';
              const loadState = parts[loadStateIndex] || '';
              const activeState = parts[activeStateIndex] || '';
              const subState = parts[subStateIndex] || '';
              const description = parts.slice(descriptionIndex).join(' ') || '';
              const status = `${activeState} ${subState}`.trim();
              const hasMarker = parts[serviceNameIndex]?.startsWith('●');

              return {
                name: `${hasMarker ? '●' : ''} ${serviceName}`,
                description,
                status
              };
            });

          this.filteredServices = [...this.services];
        },
        (error) => {
          console.error('Error al obtener la información de los servicios:', error);
        }
      );
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  refreshServices() {
    this.fetchServiceInfo();
  }
}