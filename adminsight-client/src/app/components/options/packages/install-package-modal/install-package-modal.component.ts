import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PackageInfo } from '../packages.component';
import { SshService } from '../../../../services/ssh.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-install-package-modal',
  templateUrl: './install-package-modal.component.html',
  styleUrls: ['./install-package-modal.component.css']
})
export class InstallPackageModalComponent {
  searchTerm: string = '';
  searchResults: PackageInfo[] = [];

  @Input() packageManager: 'apt' | 'yum' | 'dnf' | 'unknown' = 'unknown';

  @Output() install = new EventEmitter<string>();
  @Output() cancel = new EventEmitter();

  isLoading: boolean = false;

  constructor(private sshService: SshService, private router: Router) { }

  onSearch() {
    this.isLoading = true;
    this.searchPackages(this.searchTerm);
  }

  private systemId: number = Number(this.router.url.split('/')[2]);

  searchPackages(searchTerm: string) {
    const commands: string[] = [];

    switch (this.packageManager) {
      case 'apt':
        commands.push(`apt search ${searchTerm}`);
        break;
      case 'yum':
        commands.push(`yum search ${searchTerm}`);
        break;
      case 'dnf':
        commands.push(`dnf search ${searchTerm}`);
        break;
      default:
        console.error('No se pudo identificar el package manager');
        return;
    }


    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          const output = response[commands[0]]?.stdout || '';
          const lines = output.trim().split('\n\n');

          this.searchResults = [];

          for (const line of lines.slice(0)) {
            const [nameAndVersion, description] = line.split('\n', 2);
            const [name] = nameAndVersion.split(' ');

            if (name) {
              this.searchResults.push({
                name,
                description: description || '',
                version: '',
                size: '',
                architecture: ''
              });
            }
          }
        },
        (error) => {
          console.error('Error al buscar paquetes:', error);
        }
      );
  }

  installPackage(packageName: string) {
    const commands: string[] = [];
    switch (this.packageManager) {
      case 'apt':
        commands.push(`sudo apt install ${packageName}`);
        break;
      case 'yum':
        commands.push(`sudo yum install ${packageName}`);
        break;
      case 'dnf':
        commands.push(`sudo dnf install ${packageName}`);
        break;
      default:
        console.error('No se pudo identificar el package manager');
        return;
    }
    this.install.emit(packageName);
  }

  onCancel() {
    this.cancel.emit();
    this.searchResults = [];
    this.searchTerm = '';
  }
}