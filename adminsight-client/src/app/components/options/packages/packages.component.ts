import { Component, OnInit, ViewChild } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { PasswordModalComponent } from '../../modals/password-modal/password-modal.component';
import { InstallPackageModalComponent } from '../../modals/install-package-modal/install-package-modal.component';
import { Observable, map } from 'rxjs';


export interface PackageInfo {
  name: string;
  version: string;
  size: string;
  description: string;
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

  showPasswordModal: boolean = false;
  showInstallModal: boolean = false;

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
    let commands: string[] = [];

    switch (this.packageManager) {
      case 'apt':
        commands = ['dpkg --list'];
        break;
      case 'yum':
        commands = ['yum list installed'];
        break;
      case 'dnf':
        commands = ['dnf list installed'];
        break;
      default:
        console.error('No se pudo identificar el package manager');
        return;
    }

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          const output = response[commands[0]]?.stdout || '';
          const lines = output.trim().split('\n');

          switch (this.packageManager) {
            case 'apt':
              this.packages = lines.map((line: string) => {
                const parts = line.split(/\s+/);
                const name = parts[1];
                const version = parts[2];
                const size = parts[3];
                const description = parts.slice(4).join(' ');

                return {
                  name,
                  version,
                  size,
                  description
                };
              });

              this.packages.forEach(pkg => {
                this.getPackageSize(pkg.name).subscribe(size => pkg.size = size);
              });
              break;
            case 'yum':
              // Omitir la línea de encabezado
              const yumPackagesLines = lines.slice(1);

              this.packages = yumPackagesLines.map((line: string) => {
                const parts = line.trim().split(/\s+/);
                const name = parts[0];
                const version = parts[1];
                const size = parts[2];
                const description = parts.slice(3).join(' ');

                return {
                  name,
                  version,
                  size,
                  description
                };
              });
              break;
            case 'dnf':
              // Omitir la línea de encabezado
              const packagesLines = lines.slice(1);

              this.packages = packagesLines.map((line: string) => {
                const parts = line.trim().split(/\s+/);
                const name = parts[0];
                const version = parts[1];
                const size = parts[2];
                const description = parts.slice(3).join(' ');

                return {
                  name,
                  version,
                  size,
                  description
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

  getPackageSize(packageName: string): Observable<string> {
    const commands = [`dpkg -s ${packageName}`];

    return this.sshService.executeCommand(this.systemId, commands).pipe(
      map((response: any) => {
        const output = response[commands[0]]?.stdout || '';
        const lines = output.trim().split('\n');
        const sizeLine = lines.find((line: string) => line.includes('Installed-Size'));
        if (sizeLine) {
          const size = sizeLine.split(':')[1].trim();
          return size;
        } else {
          return 'N/A';
        }
      })
    );
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