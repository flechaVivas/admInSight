import { Component, OnInit, ViewChild } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { PasswordModalComponent } from '../../modals/password-modal/password-modal.component';
import { InstallPackageModalComponent } from '../../modals/install-package-modal/install-package-modal.component';
import { Observable, forkJoin, map } from 'rxjs';


export interface PackageInfo {
  name: string;
  version: string;
  size: string;
  architecture: string;
  description: string;
  status?: string;
}

@Component({
  selector: 'app-packages',
  templateUrl: './packages.component.html',
  styleUrls: ['./packages.component.css']
})
export class PackagesComponent implements OnInit {
  packages: PackageInfo[] = [];
  filteredPackages: PackageInfo[] = [];
  searchTerm: string = '';
  sortColumn: string = 'name';
  sortDirection: string = 'asc';
  showPackageDetails: { [key: string]: boolean } = {};

  showPasswordModal: boolean = false;
  showInstallModal: boolean = false;

  sizeFilter: 'installed' | 'uninstalled' | 'all' = 'all';

  sudoPassword: string = '';
  @ViewChild(PasswordModalComponent) passwordModal!: PasswordModalComponent;
  @ViewChild(InstallPackageModalComponent) installModal!: InstallPackageModalComponent;

  private packageManager: 'apt' | 'yum' | 'dnf' | 'unknown' = 'unknown';

  constructor(private sshService: SshService, private router: Router) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  ngOnInit() {
    if (this.systemId) {
      this.identifyPackageManager();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  identifyPackageManager() {
    const commands = [
      'which apt',
      'which yum',
      'which dnf'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          if (response['which apt']?.stdout.trim()) {
            this.packageManager = 'apt';
          } else if (response['which yum']?.stdout.trim()) {
            this.packageManager = 'yum';
          } else if (response['which dnf']?.stdout.trim()) {
            this.packageManager = 'dnf';
          } else {
            console.error('No se pudo identificar el package manager');
            // Aquí puedes mostrar un mensaje de error al usuario o tomar alguna acción alternativa
          }

          this.fetchInstalledPackages();
        },
        (error) => {
          console.error('Error al identificar el package manager:', error);
          // Aquí puedes mostrar un mensaje de error al usuario o tomar alguna acción alternativa
        }
      );
  }

  fetchInstalledPackages() {
    const listCommand: string[] = [];
    const sizeCommand: string[] = [];

    switch (this.packageManager) {
      case 'apt':
        listCommand.push('dpkg --list');
        sizeCommand.push("dpkg-query -Wf '${db:Status-Status} ${Installed-Size}\\t${Package}\\n' | sed -ne 's/^installed //p' | sort -n");
        break;
      case 'yum':
        listCommand.push('yum list installed');
        // Agrega el comando correspondiente para obtener los tamaños de los paquetes en yum
        break;
      case 'dnf':
        listCommand.push('dnf list installed');
        // Agrega el comando correspondiente para obtener los tamaños de los paquetes en dnf
        break;
      default:
        console.error('No se pudo identificar el package manager');
        return;
    }

    const listObservable = this.sshService.executeCommand(this.systemId, listCommand);
    const sizeObservable = this.sshService.executeCommand(this.systemId, sizeCommand);

    forkJoin([listObservable, sizeObservable]).subscribe(
      ([listResponse, sizeResponse]) => {
        const output = listResponse[listCommand[0]]?.stdout || '';
        const sizeOutput = sizeResponse[sizeCommand[0]]?.stdout || '';

        const lines = output.trim().split('\n');
        const sizeLines = sizeOutput.trim().split('\n');

        const sizeMap = new Map<string, string>();

        for (const line of sizeLines) {
          const [size, name] = line.split('\t');
          sizeMap.set(name, size);
        }

        switch (this.packageManager) {
          case 'apt':
            this.packages = lines.slice(5).map((line: string) => {
              const parts = line.split(/\s+/);
              const name = parts[1];
              const version = parts[2];
              const description = parts.slice(4).join(' ');
              const sizeInBytes = parseInt(sizeMap.get(name) || '0', 10); // Convertir el tamaño a número
              const formattedSize = this.formatPackageSize(sizeInBytes);

              return {
                name,
                version,
                size: formattedSize,
                description,
                architecture: ''
              };
            });
            break;
          case 'yum':
          case 'dnf':
            this.packages = lines.slice(1).map((line: string) => {
              const parts = line.trim().split(/\s+/);
              const name = parts[0];
              const version = parts[1];
              const description = parts.slice(3).join(' ');
              const size = sizeMap.get(name) || 'N/A';

              return {
                name,
                version,
                size,
                description,
                architecture: ''
              };
            });
            break;
          default:
            console.error('No se pudo identificar el package manager');
            return;
        }

        this.filteredPackages = [...this.packages];
      },
      (error) => {
        console.error('Error al obtener la lista de paquetes:', error);
      }
    );
  }

  togglePackageDetails(packageName: string) {
    if (this.showPackageDetails[packageName]) {
      this.showPackageDetails[packageName] = false;
    } else {
      this.getPackageDetails(packageName);
    }
  }

  getPackageDetails(packageName: string) {
    const commands = [`dpkg -s ${packageName}`];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          const output = response[commands[0]]?.stdout || '';
          const lines = output.trim().split('\n');
          const architectureLine = lines.find((line: string) => line.includes('Architecture'));
          const statusLine = lines.find((line: string) => line.includes('Status'));

          if (architectureLine && statusLine) {
            const architecture = architectureLine.split(':')[1].trim();
            const status = statusLine.split(':')[1].trim();

            const packageIndex = this.packages.findIndex(pkg => pkg.name === packageName);
            if (packageIndex !== -1) {
              this.packages[packageIndex].architecture = architecture;
              this.packages[packageIndex].status = status;
              this.filteredPackages = [...this.packages];
              this.showPackageDetails[packageName] = true;
            }
          }
        },
        (error) => {
          console.error(`Error al obtener los detalles del paquete ${packageName}:`, error);
        }
      );
  }



  trackByName(index: number, package_info: PackageInfo): string {
    return package_info.name;
  }

  getPackageSize(packageName: string): Observable<string> {
    const commands = [
      "dpkg-query -Wf '${db:Status-Status} ${Installed-Size}\\t${Package}\\n' | sed -ne 's/^installed //p' | sort -n"
    ];

    return this.sshService.executeCommand(this.systemId, commands).pipe(
      map((response: any) => {
        const output = response[commands[0]]?.stdout || '';
        const lines = output.trim().split('\n');
        const sizeLine = lines.find((line: string) => line.includes(packageName));
        if (sizeLine) {
          const [size] = sizeLine.split('\t');
          return size;
        } else {
          return 'N/A';
        }
      })
    );
  }

  formatPackageSize(sizeInKB: number): string {

    let unitIndex = 0;
    let size = sizeInKB;

    if (sizeInKB >= 1000000) {
      size /= 1024;
      unitIndex = 3;
    } else if (sizeInKB >= 1000) {
      size /= 1024;
      unitIndex = 2;
    }

    return `${size.toFixed(2)} ${['Bytes', 'KB', 'MB', 'GB', 'TB'][unitIndex]}`;
  }

  updatePackage(package_info: PackageInfo) {
    let commands: string[] = [];

    switch (this.packageManager) {
      case 'apt':
        commands = [
          'apt-get update',
          `apt-get install --only-upgrade ${package_info.name}`
        ];
        break;
      case 'yum':
        commands = [
          `yum update ${package_info.name}`
        ];
        break;
      case 'dnf':
        commands = [
          `dnf update ${package_info.name}`
        ];
        break;
      default:
        console.error('No se pudo identificar el package manager');
        return;
    }

    this.commandsToExecute = commands;
    this.showPasswordModal = true;
  }

  removePackage(package_info: PackageInfo) {
    let commands: string[] = [];

    switch (this.packageManager) {
      case 'apt':
        commands = [
          `apt-get remove --purge ${package_info.name}`
        ];
        break;
      case 'yum':
        commands = [
          `yum remove ${package_info.name}`
        ];
        break;
      case 'dnf':
        commands = [
          `dnf remove ${package_info.name}`
        ];
        break;
      default:
        console.error('No se pudo identificar el package manager');
        return;
    }

    this.commandsToExecute = commands;
    this.showPasswordModal = true;
  }

  commandsToExecute: string[] = [];

  executeCommands(commands: string[], sudoPassword?: string) {
    this.sshService.executeCommand(this.systemId, commands, sudoPassword)
      .subscribe(
        (response) => {
          console.log(response);
          this.fetchInstalledPackages();
        },
        (error) => {
          console.error('Error al ejecutar los comandos:', error);
        }
      );
  }

  onPasswordConfirm(sudoPassword: string) {
    const sudoCommands = this.commandsToExecute.map(command => `echo '${sudoPassword}' | sudo -S ${command}`);
    this.executeCommands(sudoCommands, sudoPassword);
    this.showPasswordModal = false;
    this.commandsToExecute = [];
    this.sudoPassword = '';
  }

  onPasswordCancel() {
    this.showPasswordModal = false;
    this.commandsToExecute = [];
    this.sudoPassword = '';
  }

  onInstallConfirm(packageName: string) {
    const commands = [
      // Comandos para instalar el paquete según el package manager
      // Ejemplo para APT:
      `apt-get install ${packageName}`
    ];

    this.commandsToExecute = commands;
    this.showPasswordModal = true;
  }

  onInstallCancel() {
    this.showInstallModal = false;
  }

  sortPackages(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }
}  