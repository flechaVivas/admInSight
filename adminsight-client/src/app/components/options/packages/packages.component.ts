import { Component, OnInit, ViewChild } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { PasswordModalComponent } from '../../modals/password-modal/password-modal.component';
import { InstallPackageModalComponent } from './install-package-modal/install-package-modal.component';
import { Observable, forkJoin, map } from 'rxjs';
import { StringOrderPipe } from '../../../pipes/order-by-string.pipe';


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
  showInstallModal: boolean = false;

  commandsToExecute: string[] = [];

  sizeFilter: 'installed' | 'uninstalled' | 'all' = 'all';

  showPasswordModal: boolean = false;
  sudoPassword: string = '';
  @ViewChild(PasswordModalComponent) passwordModal!: PasswordModalComponent;
  @ViewChild(InstallPackageModalComponent) installModal!: InstallPackageModalComponent;

  packageManager: 'apt' | 'yum' | 'dnf' | 'unknown' = 'unknown';
  private packageToInstall: string = '';

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
          this.handleError(error);
          // Aquí puedes mostrar un mensaje de error al usuario o tomar alguna acción alternativa
        }
      );
  }

  handleError(error: any): void {
    if (error.error.error_code === 'invalid_ssh_token') {
      alert('El token SSH ha expirado. Por favor, vuelva a iniciar sesión.');
      this.router.navigateByUrl('/login-server');
    }
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
        listCommand.push('yum info installed');
        break;
      case 'dnf':
        listCommand.push('dnf info installed');
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

        const packages = [];
        let currentPackage = null;

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

            for (const line of lines) {
              if (line.trim() === '') {
                if (currentPackage) {
                  packages.push(currentPackage);
                }
                currentPackage = null;
              } else if (line.startsWith('Name')) {
                currentPackage = {
                  name: line.split(':')[1].trim(),
                  version: '',
                  size: '',
                  description: '',
                  architecture: '',
                  status: ''
                };
              } else if (currentPackage) {
                const [key, value] = line.split(':', 2);
                switch (key.trim()) {
                  case 'Version':
                    currentPackage.version = value.trim();
                    break;
                  case 'Size':
                    const sizeMatch = value.trim().match(/(\d+(\.\d+)?)\s*(\w+)/);
                    if (sizeMatch) {
                      const sizeValue = parseFloat(sizeMatch[1]);
                      const sizeUnit = sizeMatch[3].toUpperCase();
                      currentPackage.size = `${sizeValue} ${sizeUnit}`;
                    } else {
                      currentPackage.size = value.trim();
                    }
                    break;
                  case 'Summary':
                    currentPackage.description = value.trim();
                    break;
                  case 'Architecture':
                    currentPackage.architecture = value.trim();
                    break;
                  case 'Status':
                    currentPackage.status = value.trim();
                    break;
                }
              }
            }

            if (currentPackage) {
              packages.push(currentPackage);
            }

            this.packages = packages;
            this.filteredPackages = [...this.packages];
            break;
          case 'dnf':

            for (const line of lines) {
              if (line.trim() === '') {
                if (currentPackage) {
                  packages.push(currentPackage);
                }
                currentPackage = null;
              } else if (line.startsWith('Name')) {
                currentPackage = {
                  name: line.split(':')[1].trim(),
                  version: '',
                  size: '',
                  description: '',
                  architecture: '',
                  status: ''
                };
              } else if (currentPackage) {
                const [key, value] = line.split(':', 2);
                switch (key.trim()) {
                  case 'Version':
                    currentPackage.version = value.trim();
                    break;
                  case 'Size':
                    const sizeMatch = value.trim().match(/(\d+(\.\d+)?)\s*(\w+)/);
                    if (sizeMatch) {
                      const sizeValue = parseFloat(sizeMatch[1]);
                      const sizeUnit = sizeMatch[3].toUpperCase();
                      currentPackage.size = `${sizeValue} ${sizeUnit}`;
                    } else {
                      currentPackage.size = value.trim();
                    }
                    break;
                  case 'Summary':
                    currentPackage.description = value.trim();
                    break;
                  case 'Architecture':
                    currentPackage.architecture = value.trim();
                    break;
                  case 'Status':
                    currentPackage.status = value.trim();
                    break;
                }
              }
            }

            if (currentPackage) {
              packages.push(currentPackage);
            }

            this.packages = packages;
            this.filteredPackages = [...this.packages];
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
      if (this.packageManager === 'apt') {
        this.getPackageDetails(packageName);
      } else {
        this.showPackageDetails[packageName] = true;
      }
    }
  }

  getPackageDetails(packageName: string) {
    const commands: string[] = [];
    switch (this.packageManager) {
      case 'apt':
        commands.push(`dpkg -s ${packageName}`);
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
        commands = [`sudo apt-get update && sudo apt-get install --only-upgrade ${package_info.name}`];
        break;
      case 'yum':
        commands = [
          `sudo yum update ${package_info.name}`
        ];
        break;
      case 'dnf':
        commands = [
          `sudo dnf update ${package_info.name}`
        ];
        break;
      default:
        console.error('No se pudo identificar el package manager');
        return;
    }

    this.commandsToExecute = commands;
    this.showPasswordModal = true;
  }

  updateAllPackages() {
    let commands: string[] = [];

    switch (this.packageManager) {
      case 'apt':
        commands = ['sudo apt-get update', 'sudo apt-get upgrade -y'];
        break;
      case 'yum':
        commands = ['sudo yum update'];
        break;
      case 'dnf':
        commands = ['sudo dnf upgrade'];
        break;
      default:
        console.error('No se pudo identificar el package manager');
        return;
    }

    this.commandsToExecute = commands;
    this.showPasswordModal = true;
  }

  reinstallPackage(package_info: PackageInfo) {

    let commands: string[] = [];
    switch (this.packageManager) {
      case 'apt':
        commands = [`sudo dpkg-reconfigure ${package_info.name}`];
        break;
      case 'yum':
        commands = [
          `sudo yum reinstall ${package_info.name}`
        ];
        break;
      case 'dnf':
        commands = [
          `sudo dnf reinstall ${package_info.name}`
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
          `sudo dpkg -P ${package_info.name}`
        ];
        break;
      case 'yum':
        commands = [
          `sudo yum remove ${package_info.name}`
        ];
        break;
      case 'dnf':
        commands = [
          `sudo dnf remove ${package_info.name}`
        ];
        break;
      default:
        console.error('No se pudo identificar el package manager');
        return;
    }

    this.commandsToExecute = commands;
    this.showPasswordModal = true;
  }

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

  onInstallPackage(packageName: string) {
    this.showPasswordModal = true;
    this.showInstallModal = false;
    this.packageToInstall = packageName;
  }

  onPasswordConfirm(sudoPassword: string) {
    this.sudoPassword = sudoPassword;
    if (this.commandsToExecute.length > 0) {
      this.executeCommands(this.commandsToExecute, sudoPassword);
      this.commandsToExecute = [];
    } else if (this.packageToInstall) {
      this.installPackage(this.packageToInstall, sudoPassword);
      this.packageToInstall = '';
    }
    this.showPasswordModal = false;
  }

  onPasswordCancel() {
    this.showPasswordModal = false;
    this.packageToInstall = '';
    this.commandsToExecute = [];
  }

  onInstallConfirm($event: string) {
    this.showInstallModal = true;
  }

  onInstallCancel() {
    this.showInstallModal = false;
  }

  installPackage(packageName: string, sudoPassword: string) {
    const commands = [`sudo apt install ${packageName}`];

    this.sshService.executeCommand(this.systemId, commands, sudoPassword)
      .subscribe(
        (response) => {
          this.fetchInstalledPackages();
        },
        (error) => {
          console.error('Error al instalar el paquete:', error);
        }
      );
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