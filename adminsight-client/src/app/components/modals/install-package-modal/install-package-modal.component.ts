import { Component, EventEmitter, Output } from '@angular/core';
import { PackageInfo } from '../../options/packages/packages.component';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-install-package-modal',
  templateUrl: './install-package-modal.component.html',
  styleUrls: ['./install-package-modal.component.css']
})
export class InstallPackageModalComponent {
  searchTerm: string = '';
  searchResults: PackageInfo[] = [];


  @Output() install = new EventEmitter<string>();
  @Output() cancel = new EventEmitter();

  constructor(private sshService: SshService, private router: Router) { }

  onSearch() {
    this.searchPackages(this.searchTerm);
  }

  private systemId: number = Number(this.router.url.split('/')[2]);

  searchPackages(searchTerm: string) {
    const commands = [`apt search ${searchTerm}`];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          const output = response[commands[0]]?.stdout || '';
          const lines = output.trim().split('\n\n'); // Separar por líneas vacías

          this.searchResults = [];

          for (const line of lines.slice(2)) { // Omitir las dos primeras líneas
            const [nameAndVersion, description] = line.split('\n', 2); // Separar nombre/versión y descripción
            const [name] = nameAndVersion.split(' '); // Obtener solo el nombre del paquete

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
    this.install.emit(packageName);
  }

  onCancel() {
    this.cancel.emit();
    this.searchResults = [];
    this.searchTerm = '';
  }
}