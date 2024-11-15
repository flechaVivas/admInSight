import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';

export interface Service {
  name: string;
  description: string;
  status: string;
  isEnabled: boolean;
  loadState: string;
}
@Component({
  selector: 'app-services',
  templateUrl: './services.component.html',
  styleUrl: './services.component.css',
})
export class ServicesComponent implements OnInit {
  services: Service[] = [];
  filteredServices: Service[] = [];
  searchTerm: string = '';
  activeFilter: string = '';
  enabledFilter: string = '';
  sortColumn: string = 'name';
  sortDirection: string = 'asc';
  isLoading: boolean = true;

  showPasswordModal: boolean = false;
  currentServiceName: string = '';
  currentAction: 'start' | 'stop' | 'restart' | 'enable' | 'disable' = 'start';


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
    this.isLoading = true;
    // Usamos dos comandos: uno para listar los servicios y otro para obtener el estado enabled
    const commands = [
      'systemctl list-units --type=service --all --no-pager --no-legend | sed "s/● / /"',
      'systemctl list-unit-files --type=service --no-pager --no-legend'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe({
        next: (response: any) => {
          const servicesOutput = response['systemctl list-units --type=service --all --no-pager --no-legend | sed "s/● / /"']?.stdout || '';
          const enabledOutput = response['systemctl list-unit-files --type=service --no-pager --no-legend']?.stdout || '';

          // Primero procesamos el estado enabled/disabled de los servicios
          const enabledStates = new Map<string, boolean>();
          enabledOutput.trim().split('\n').forEach((line: string) => {
            const [unit, state] = line.trim().split(/\s+/);
            enabledStates.set(
              unit.replace('.service', ''),
              state === 'enabled' || state === 'enabled-runtime' || state === 'static'
            );
          });

          // Ahora procesamos la información principal de los servicios
          const lines = servicesOutput.trim().split('\n');

          this.services = lines
            .filter((line: string) => {
              return !line.includes('LOAD') &&
                !line.includes('ACTIVE') &&
                !line.includes('SUB') &&
                !line.includes('listed') &&
                !line.includes('To');
            })
            .map((line: string) => {
              const parts = line.trim().split(/\s+/);
              const serviceName = parts[0].replace('.service', '');
              const loadState = parts[1] || '';
              const activeState = parts[2] || '';
              const subState = parts[3] || '';
              const description = parts.slice(4).join(' ') || '';
              const status = `${activeState} ${subState}`.trim();

              return {
                name: serviceName,
                description,
                status,
                isEnabled: enabledStates.get(serviceName) || false,
                loadState
              };
            });

          this.filterServices();
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError(error);
          this.isLoading = false;
        }
      });
  }

  // Agregar métodos para habilitar/deshabilitar servicios
  enableService(serviceName: string) {
    this.showPasswordModal = true;
    this.currentServiceName = serviceName;
    this.currentAction = 'enable';
  }

  disableService(serviceName: string) {
    this.showPasswordModal = true;
    this.currentServiceName = serviceName;
    this.currentAction = 'disable';
  }

  filterServices() {
    this.filteredServices = this.services.filter(service => {
      const matchesSearch = !this.searchTerm ||
        Object.values(service).some(value =>
          String(value).toLowerCase().includes(this.searchTerm.toLowerCase())
        );

      const matchesActive = !this.activeFilter ||
        (this.activeFilter === 'active' && service.status.includes('running')) ||
        (this.activeFilter === 'inactive' && !service.status.includes('running'));

      const matchesEnabled = !this.enabledFilter ||
        (this.enabledFilter === 'enabled' && service.isEnabled) ||
        (this.enabledFilter === 'disabled' && !service.isEnabled);

      return matchesSearch && matchesActive && matchesEnabled;
    });

    // Aplicar ordenamiento actual después del filtrado
    this.applySort();
  }

  private applySort() {
    this.filteredServices.sort((a, b) => {
      const aValue = String(a[this.sortColumn as keyof Service]);
      const bValue = String(b[this.sortColumn as keyof Service]);

      return this.sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }


  handleError(error: any): void {
    if (error.error.error_code === 'invalid_ssh_token') {
      alert('El token SSH ha expirado. Por favor, vuelva a iniciar sesión.');
      this.router.navigateByUrl('/login-server');
    }
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
  }

  refreshServices() {
    this.fetchServiceInfo();
  }

  rebootService(serviceName: string) {
    this.showPasswordModal = true;
    this.currentServiceName = serviceName;
    this.currentAction = 'restart';
  }

  stopService(serviceName: string) {
    this.showPasswordModal = true;
    this.currentServiceName = serviceName;
    this.currentAction = 'stop';
  }

  startService(serviceName: string) {
    this.showPasswordModal = true;
    this.currentServiceName = serviceName;
    this.currentAction = 'start';
  }

  getEnabledText(service: Service): string {
    return service.isEnabled ? 'Enabled' : 'Disabled';
  }

  getTotalServices(): number {
    return this.filteredServices.length;
  }

  getActiveServices(): number {
    return this.filteredServices.filter(s => s.status.includes('running')).length;
  }

  getInactiveServices(): number {
    return this.filteredServices.filter(s => !s.status.includes('running')).length;
  }

  getServiceHealth(): number {
    if (this.filteredServices.length === 0) return 0;
    const running = this.getActiveServices();
    return Math.round((running / this.filteredServices.length) * 100);
  }

  onPasswordConfirm(sudoPassword: string) {
    this.executeCommand(this.currentServiceName, this.currentAction, sudoPassword);
    this.showPasswordModal = false;
  }

  onPasswordCancel() {
    this.showPasswordModal = false;
  }

  executeCommand(serviceName: string, action: 'start' | 'stop' | 'restart' | 'enable' | 'disable', sudoPassword: string) {
    let command: string;

    switch (action) {
      case 'start':
        command = `echo '${sudoPassword}' | sudo -S systemctl start ${serviceName}`;
        break;
      case 'stop':
        command = `echo '${sudoPassword}' | sudo -S systemctl stop ${serviceName}`;
        break;
      case 'restart':
        command = `echo '${sudoPassword}' | sudo -S systemctl restart ${serviceName}`;
        break;
      case 'enable':
        command = `echo '${sudoPassword}' | sudo -S systemctl enable ${serviceName}`;
        break;
      case 'disable':
        command = `echo '${sudoPassword}' | sudo -S systemctl disable ${serviceName}`;
        break;
      default:
        console.error('Invalid action');
        return;
    }

    const commands = [command];
    this.executeCommands(commands);
  }

  private executeCommands(commands: string[], sudoPassword?: string) {
    this.sshService.executeCommand(this.systemId, commands, sudoPassword)
      .subscribe({
        next: (response: any) => {
          console.log(response);
          this.fetchServiceInfo();
        },
        error: (error) => {
          console.error('Error executing commands:', error);
          // Opcional: Mostrar un mensaje de error al usuario
        }
      });
  }
}