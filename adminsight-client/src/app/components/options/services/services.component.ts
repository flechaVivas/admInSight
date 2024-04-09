// services.component.ts
import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';

interface ServiceInfo {
  pid: number;
  name: string;
  description: string;
  status: string;
  enabled: boolean;
  active: boolean;
}

@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  services: ServiceInfo[] = [];
  filteredServices: ServiceInfo[] = [];
  searchTerm: string = '';
  statusFilter: string = '';
  enabledFilter: string = '';
  sortOption: string = 'name';

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
    const command = 'systemctl list-units --type=service --all --no-pager';

    this.sshService.executeCommand(this.systemId, [command]).subscribe(
      (response) => {
        const serviceLines = response[command]?.stdout.trim().split('\n');
        this.services = serviceLines
          .slice(1) // Omitir la primera línea de encabezado
          .map((line: string) => {
            const columns = line.trim().split(/\s{2,}/); // Dividir por 2 o más espacios

            // Extraer nombre y estado
            const name = columns[0];
            const status = columns[1] || ''; // Si no hay estado, asignamos una cadena vacía

            // Verificar si el servicio está activo y habilitado
            const isActive = status.toLowerCase().includes('active');
            const isEnabled = status.toLowerCase().includes('loaded');

            // Extraer la descripción si está disponible
            let description = '';
            const descriptionMatch = line.match(/(.+)\.service/);
            if (descriptionMatch && descriptionMatch.length > 1) {
              description = descriptionMatch[1];
            }

            return {
              pid: null, // PID no disponible en esta salida
              name: name,
              description: description,
              status: isActive ? 'active' : 'inactive',
              enabled: isEnabled,
              active: isActive
            };
          });

        this.filterServices();
      },
      (error) => {
        console.error('Error al obtener la información de servicios:', error);
      }
    );
  }






  filterServices() {
    this.filteredServices = this.services.filter((service) => {
      const nameMatch = service.name.toLowerCase().includes(this.searchTerm.toLowerCase());
      const statusMatch =
        this.statusFilter === ''
          ? true
          : this.statusFilter === 'active'
            ? service.active
            : !service.active;
      const enabledMatch =
        this.enabledFilter === ''
          ? true
          : this.enabledFilter === 'enabled'
            ? service.enabled
            : !service.enabled;

      return nameMatch && statusMatch && enabledMatch;
    });

    this.sortServices();
  }

  sortServices() {
    this.filteredServices.sort((a, b) => {
      switch (this.sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'pid':
          return a.pid - b.pid;
        case 'memory':
          // Aquí deberías implementar la lógica para ordenar por uso de memoria
          return 0;
        default:
          return 0;
      }
    });
  }
}