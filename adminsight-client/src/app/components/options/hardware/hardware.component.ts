import { Component, ViewChild } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { PasswordModalComponent } from '../../modals/password-modal/password-modal.component';

interface CommandOutput {
  stdout: string;
  stderr: string;
}

interface CommandResponse {
  [key: string]: CommandOutput;
}

interface NetworkInterface {
  name: string;
  description: string;
}

interface DiskDrive {
  name: string;
  model: string;
  capacity: string;
}

@Component({
  selector: 'app-hardware',
  templateUrl: './hardware.component.html',
  styleUrls: ['./hardware.component.css']
})
export class HardwareComponent {
  cpuModel: string = '';
  cpuArchitecture: string = '';
  cpuCores: string = '';
  cpuThreads: string = '';
  cpuFrequency: string = '';
  memoryTotal: string = '';
  memoryUsed: string = '';
  memoryFree: string = '';
  biosVendor: string = '';
  biosVersion: string = '';
  biosReleaseDate: string = '';
  motherboardManufacturer: string = '';
  motherboardModel: string = '';
  motherboardVersion: string = '';
  gpuDescription: string = '';
  gpuMemory: string = '';
  networkInterfaces: NetworkInterface[] = [];
  diskDrives: DiskDrive[] = [];
  pciInfo: { name: string; description: string; }[] = [];
  usbDevices: { bus: string; device: string; description: string; }[] = [];

  @ViewChild(PasswordModalComponent) passwordModal!: PasswordModalComponent;
  sudoPassword: string = '';
  showPasswordModal: boolean = false;

  constructor(private sshService: SshService, private router: Router) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  ngOnInit() {
    if (this.systemId) {
      this.showPasswordModal = true;
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  handlePasswordModalConfirm(sudoPassword: string) {
    this.executeSudoCommands(sudoPassword);
    this.showPasswordModal = false;
  }

  handlePasswordModalCancel() {
    this.showPasswordModal = false;
  }

  executeSudoCommands(sudoPassword: string) {
    const commands = [
      'lscpu',
      'free -m | grep Mem',
      'sudo dmidecode -t bios | awk -F: \'/Vendor|Version|Release Date/ {print $1 ":" $2}\'',
      'sudo dmidecode -t baseboard | awk -F: \'/Manufacturer|Product Name|Version/ {print $1 ":" $2}\'',
      'lspci | grep -i "vga" | cut -d ":" -f 3',
      'ip link show | grep -E "^[0-9]+"',
      'lsblk --nodeps --noheadings --output NAME,MODEL,SIZE,TYPE | awk \'{printf "%s %s-%s %s\\n", $1, $2, $3, $4}\' | grep -E "^(sd|hd|vd|xvd|nvme)"',
      'lspci',
      'lsusb'
    ];

    this.sshService.executeCommand(this.systemId, commands, sudoPassword)
      .subscribe(
        (response: CommandResponse) => {
          this.parseCommandOutput(response);
        },
        (error) => {
          console.error('Error al obtener la información del hardware:', error);
        }
      );
  }

  parseCommandOutput(response: CommandResponse) {
    this.parseCpuInfo(response['lscpu']?.stdout || '');
    this.parseMemoryInfo(response['free -m | grep Mem']?.stdout || '');
    this.parseBiosInfo(response['sudo dmidecode -t bios | awk -F: \'/Vendor|Version|Release Date/ {print $1 ":" $2}\'']?.stdout || '');
    this.parseMotherboardInfo(response['sudo dmidecode -t baseboard | awk -F: \'/Manufacturer|Product Name|Version/ {print $1 ":" $2}\'']?.stdout || '');
    this.gpuDescription = response['lspci | grep -i "vga" | cut -d ":" -f 3']?.stdout || '';
    this.gpuMemory = response['lspci | grep -i "vga" | grep -i "Memory"']?.stdout || '';
    this.parseNetworkInterfaces(response['ip link show | grep -E "^[0-9]+"']?.stdout || '');
    this.parseDiskDrives(response['lsblk --nodeps --noheadings --output NAME,MODEL,SIZE,TYPE | awk \'{printf "%s %s-%s %s\\n", $1, $2, $3, $4}\' | grep -E "^(sd|hd|vd|xvd|nvme)"']?.stdout || '');
    this.formatUsbInfo(response['lsusb']?.stdout || '');
  }

  parseCpuInfo(output: string) {
    const lines = output.trim().split('\n');

    const modelRegex = /(?:model name|Modelo|Modèle)\s*?:\s*(.+)/i;
    const architectureRegex = /(?:architecture|arquitectura)\s*?:\s*(.+)/i;
    const coresRegex = /(?:cpu\(s\)|Núcleos de procesador)\s*?:\s*(.+)/i;
    const threadsRegex = /(?:thread\(s\) per core|Hilo\(s\) de procesamiento por núcleo)\s*?:\s*(.+)/i;
    const cpuFrequencyLine = lines.find(line => line.includes('CPU MHz máx.:'));


    const modelLine = lines.find(line => modelRegex.test(line));
    if (modelLine) {
      this.cpuModel = modelLine.match(modelRegex)![1].trim();
    }

    const architectureLine = lines.find(line => architectureRegex.test(line));
    if (architectureLine) {
      const opModes = architectureLine.match(architectureRegex)![1].trim().split(',');
      if (opModes.some(mode => /32-bit/i.test(mode)) && opModes.some(mode => /64-bit/i.test(mode))) {
        this.cpuArchitecture = '64-bit';
      } else if (opModes.some(mode => /32-bit/i.test(mode))) {
        this.cpuArchitecture = '32-bit';
      } else {
        this.cpuArchitecture = opModes[0];
      }
    }

    const coreLine = lines.find(line => coresRegex.test(line));
    if (coreLine) {
      this.cpuCores = coreLine.match(coresRegex)![1].trim();
    }

    const threadLine = lines.find(line => threadsRegex.test(line));
    if (threadLine) {
      const threads = threadLine.match(threadsRegex)![1].trim();
      const cores = this.cpuCores;
      this.cpuThreads = (parseInt(threads) * parseInt(cores)).toString();
    }

    if (cpuFrequencyLine) {
      this.cpuFrequency = `${parseFloat(cpuFrequencyLine.split(':')[1].trim()) / 1000} GHz`;
    }
  }

  parseMemoryInfo(output: string) {
    const parts = output.trim().split(/\s+/);
    this.memoryTotal = `${parts[1]} MB`;
    this.memoryUsed = `${parts[2]} MB`;
    this.memoryFree = `${parts[3]} MB`;
  }

  parseBiosInfo(output: string) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');

    lines.forEach(line => {
      const [key, value] = line.split(':').map(part => part.trim());
      switch (key.toLowerCase()) {
        case 'vendor':
          this.biosVendor = value;
          break;
        case 'version':
          this.biosVersion = value;
          break;
        case 'release date':
          this.biosReleaseDate = value;
          break;
      }
    });
  }

  parseMotherboardInfo(output: string) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');

    lines.forEach(line => {
      const [key, value] = line.split(':').map(part => part.trim());
      switch (key.toLowerCase()) {
        case 'manufacturer':
          this.motherboardManufacturer = value;
          break;
        case 'product name':
          this.motherboardModel = value;
          break;
        case 'version':
          this.motherboardVersion = value;
          break;
      }
    });
  }

  parseNetworkInterfaces(output: string) {
    const lines = output.trim().split('\n');
    this.networkInterfaces = lines.map(line => {
      const parts = line.trim().split(': ');
      const name = parts[0].trim();
      const description = parts[1].trim();
      return { name, description };
    });
  }

  parseDiskDrives(output: string) {
    const lines = output.trim().split('\n').filter(line => line.trim() !== '');
    this.diskDrives = lines.map(line => {
      const [name, model, capacity] = line.trim().split(' ');
      return { name, model, capacity };
    });
  }

  formatUsbInfo(output: string) {
    if (!output || output.trim() === '') {
      this.usbDevices = [];
      return;
    }

    const lines = output.trim().split('\n');
    this.usbDevices = lines.map(line => {
      const parts = line.split(' ');
      if (parts.length < 6) {
        return { bus: '', device: '', description: '' };
      }
      const bus = parts[1];
      const device = parts[3].split(':')[0];
      const description = parts.slice(6).join(' ');
      return { bus, device, description };
    });
  }
}