import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';

interface SystemInfo {
  hostname: string;
  ipAddress: string;
  operatingSystem: string;
  kernel: string;
  processor: string;
  timeOnSystem: string;
  uptime: string;
  packageManager: string;
  serviceManager: string;
  runningProcesses: number;
  loggedInUsers: { name: string; connection: string; datetime: string; ip: string }[];
  recentLogins: { name: string; connection: string; ip: string; datetime: string; status: string }[];
}

@Component({
  selector: 'app-os-info',
  templateUrl: './os-info.component.html',
  styleUrls: ['./os-info.component.css']
})
export class OsInfoComponent implements OnInit {
  systemInfo: SystemInfo = {
    hostname: '',
    ipAddress: '',
    operatingSystem: '',
    kernel: '',
    processor: '',
    timeOnSystem: '',
    uptime: '',
    packageManager: '',
    serviceManager: '',
    runningProcesses: 0,
    loggedInUsers: [],
    recentLogins: []
  };

  searchTerm: string = '';

  private systemId: number = Number(this.router.url.split('/')[2]);

  constructor(private sshService: SshService, private router: Router) { }

  ngOnInit() {
    if (this.systemId) {
      this.fetchSystemInfo();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  fetchSystemInfo() {
    const commands = [
      'hostname',
      'hostname -I',
      'cat /etc/os-release',
      'uname -r',
      'cat /proc/cpuinfo | grep "model name" | head -n 1',
      'uptime -s',
      'uptime -p',
      'echo "APT: $(command -v apt)"; echo "DNF: $(command -v dnf)"; echo "YUM: $(command -v yum)"; echo "ZYPPER: $(command -v zypper)"; echo "SNAP: $(command -v snap)"', // Nuevo comando para obtener los package managers instalados
      'cat /proc/1/comm',
      'ps aux | wc -l'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          this.systemInfo.hostname = response['hostname']?.stdout.trim() || '';
          this.systemInfo.ipAddress = response['hostname -I']?.stdout.trim() || '';
          this.systemInfo.operatingSystem = this.parseOperatingSystem(response['cat /etc/os-release']?.stdout || '');
          this.systemInfo.kernel = response['uname -r']?.stdout.trim() || '';
          this.systemInfo.processor = response['cat /proc/cpuinfo | grep "model name" | head -n 1']?.stdout.trim() || '';
          this.systemInfo.timeOnSystem = response['uptime -s']?.stdout.trim() || '';
          this.systemInfo.uptime = response['uptime -p']?.stdout.trim() || '';
          this.systemInfo.packageManager = this.parsePackageManagers(response['echo "APT: $(command -v apt)"; echo "DNF: $(command -v dnf)"; echo "YUM: $(command -v yum)"; echo "ZYPPER: $(command -v zypper)"; echo "SNAP: $(command -v snap)"']?.stdout || '');
          this.systemInfo.serviceManager = response['cat /proc/1/comm']?.stdout.trim() || '';
          this.systemInfo.runningProcesses = parseInt(response['ps aux | wc -l']?.stdout.trim().split(' ')[0] || '0', 10);

          this.fetchLoggedInUsers();
          this.fetchRecentLogins();
        },
        (error) => {
          this.handleError(error);
        }
      );
  }

  handleError(error: any): void {
    if (error.error.error_code === 'invalid_ssh_token') {
      alert('El token SSH ha expirado. Por favor, vuelva a iniciar sesión.');
      this.router.navigateByUrl('/login-server');
    }
  }

  parseOperatingSystem(output: string): string {
    const lines = output.trim().split('\n');
    const osNameLine = lines.find(line => line.startsWith('PRETTY_NAME='));
    if (osNameLine) {
      const osName = osNameLine.split('=')[1].replace(/"/g, '');
      return osName;
    }
    return '';
  }

  parsePackageManagers(output: string): string {
    const lines = output.trim().split('\n');
    const packageManagers = lines.filter(line => line.includes(':')).map(line => {
      const [name, path] = line.split(':');
      return path.trim() ? name : '';
    }).filter(Boolean);

    return packageManagers.join(', ');
  }

  fetchLoggedInUsers() {
    const commands = ['who'];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          const output = response['who']?.stdout || '';
          const lines = output.trim().split('\n');

          this.systemInfo.loggedInUsers = lines.map((line: string) => {
            const parts = line.split(/\s+/);
            const name = parts[0];
            const connection = parts[1];
            const datetime = parts[2] + ' ' + parts[3];
            const ip = parts[4] || '';

            return { name, connection, datetime, ip };
          });
        },
        (error) => {
          console.error('Error al obtener la información de usuarios conectados:', error);
        }
      );
  }

  fetchRecentLogins() {
    const commands = ['last -n 10'];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          const output = response['last -n 10']?.stdout || '';
          const lines = output.trim().split('\n');

          this.systemInfo.recentLogins = lines.slice(2).map((line: string) => {
            const regex = /^(\S+)\s+(\S+(?:\s+\S+)*)\s+(\S+)\s+(\S+\s+\S+\s+\S+)\s+(\S+)\s+(.*)/;
            const match = line.match(regex);

            if (match) {
              const [, name, connection, ip, datetime, status, details] = match;
              return { name, connection, ip, datetime, status: `${status} ${details.trim()}` };
            } else {
              return { name: '', connection: '', ip: '', datetime: '', status: '' };
            }
          }).filter((login: { name: string }) => login.name !== 'reboot' && login.name !== 'shutdown');
        },
        (error) => {
          console.error('Error al obtener la información de inicios de sesión recientes:', error);
        }
      );
  }
}