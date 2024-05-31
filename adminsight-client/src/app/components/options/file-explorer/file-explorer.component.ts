import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';

export interface FileItem {
  type: 'directory' | 'file';
  name: string;
  path: string;
  size: string;
  modifiedDate: string;
}

@Component({
  selector: 'app-file-explorer',
  templateUrl: './file-explorer.component.html',
})
export class FileExplorerComponent implements OnInit {
  currentDirectory: string = '/';
  currentDirectoryPath: string[] = ['/'];
  items: FileItem[] = [];
  filteredItems: FileItem[] = [];
  searchTerm: string = '';
  showUploadModal: boolean = false;
  showHiddenFiles: boolean = false;

  constructor(private sshService: SshService, private router: Router) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  ngOnInit() {
    if (this.systemId) {
      this.refreshFileExplorer();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  refreshFileExplorer() {
    const command = `ls -l ${this.showHiddenFiles ? '-a' : ''} ${this.currentDirectory} | awk '/^[^:]/ { print $1, $3, $4, $5, $6, $7, $8, $9 }'`;
    this.sshService.executeCommand(this.systemId, [command])
      .subscribe(
        (response: any) => {
          const output = response[command]?.stdout || '';
          const lines = output.trim().split('\n').slice(1);
          this.items = lines.map((line: string) => {
            const [permissions, userId, userGroup, size, month, day, time, name] = line.trim().split(' ');
            const type = permissions.startsWith('d') ? 'directory' : 'file';
            const path = `${this.currentDirectory}/${name}`;
            const modifiedDate = `${month} ${day} ${time}`;
            return { type, name, path, size, modifiedDate };
          });

          this.filteredItems = [...this.items];
        },
        (error) => {
          console.error('Error al obtener los archivos:', error);
        }
      );
  }

  navigateToDirectory(directory: string) {
    this.currentDirectory = directory;
    this.currentDirectoryPath = directory.split('/').filter(dir => dir !== '');
    this.refreshFileExplorer();
  }

  getDirectoryPath(index: number): string {
    return '/' + this.currentDirectoryPath.slice(0, index + 1).join('/');
  }

  navigateToItem(item: FileItem) {
    if (item.type === 'directory') {
      this.navigateToDirectory(item.path);
    } else {
      // Implementar vista previa o descarga de archivo
      console.log(`Archivo seleccionado: ${item.name}`);
    }
  }

  searchFiles() {
    this.filteredItems = this.items.filter(item =>
      item.name.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  downloadFile(item: FileItem) {
    const command = `cat ${item.path}`;
    this.sshService.executeCommand(this.systemId, [command])
      .subscribe(
        (response: any) => {
          const fileContent = response[command]?.stdout || '';
          const blob = new Blob([fileContent], { type: 'text/plain' });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = item.name;
          link.click();
          window.URL.revokeObjectURL(url);
        },
        (error) => {
          console.error('Error al descargar el archivo:', error);
        }
      );
  }

  deleteDirectory(item: FileItem) {
    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar el directorio "${item.name}"?`);
    if (confirmDelete) {
      const command = `rm -rf ${item.path}`;
      this.sshService.executeCommand(this.systemId, [command])
        .subscribe(
          () => {
            this.refreshFileExplorer();
          },
          (error) => {
            console.error('Error al eliminar el directorio:', error);
          }
        );
    }
  }

  deleteFile(item: FileItem) {
    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar el archivo "${item.name}"?`);
    if (confirmDelete) {
      const command = `rm ${item.path}`;
      this.sshService.executeCommand(this.systemId, [command])
        .subscribe(
          () => {
            this.refreshFileExplorer();
          },
          (error) => {
            console.error('Error al eliminar el archivo:', error);
          }
        );
    }
  }

  onFileUpload(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const command = `cat > ${this.currentDirectory}/${file.name}`;
    this.sshService.executeCommand(this.systemId, [command])
      .subscribe(
        () => {
          this.refreshFileExplorer();
        },
        (error) => {
          console.error('Error al cargar el archivo:', error);
        }
      );
  }

}