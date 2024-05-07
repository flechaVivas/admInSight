import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';

export interface Process {
  pid: number;
  user: string;
  cpu: number;
  memory: string;
  status: 'running' | 'stopped' | 'interruptible sleep' | 'uninterruptible sleep' | 'zombie' | '';
  description: string;
}

@Component({
  selector: 'app-processes',
  templateUrl: './processes.component.html',
  styleUrls: ['./processes.component.css']
})
export class ProcessesComponent implements OnInit {
  processes: Process[] = [];
  filteredProcesses: Process[] = [];
  searchTerm: string = '';
  statusFilter: 'running' | 'stopped' | 'interruptible sleep' | 'uninterruptible sleep' | 'zombie' | '' = '';
  userFilter: string = '';
  distinctUsers: string[] = [];
  sortColumn: string = 'pid';
  sortDirection: string = 'asc';

  showPasswordModal: boolean = false;
  currentProcessPID: number = 0;
  currentAction: 'start' | 'stop' | 'kill' = 'start';

  constructor(private sshService: SshService, private router: Router) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  autoRefreshSubscription: Subscription | null = null;
  startAutoRefresh() {
    this.autoRefreshSubscription = interval(5000)
      .subscribe(() => {
        this.fetchProcessInfo();
      });
  }

  ngOnInit() {
    if (this.systemId) {
      this.fetchProcessInfo();
      this.startAutoRefresh();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  ngOnDestroy() {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
  }

  fetchProcessInfo() {
    const commands = [
      'ps -eo pid,user,pcpu,pmem,stat,comm --no-headers'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          const output = response['ps -eo pid,user,pcpu,pmem,stat,comm --no-headers']?.stdout || '';
          const lines = output.trim().split('\n');

          this.processes = lines.map((line: string) => {
            const [pid, user, cpu, memory, status, description] = line.trim().split(/\s+/);
            return {
              pid: parseInt(pid, 10),
              user,
              cpu: parseFloat(cpu),
              memory: this.formatMemoryUsage(memory),
              status: this.getProcessStatus(status),
              description
            };
          });

          this.distinctUsers = [...new Set(this.processes.map(process => process.user))];
          this.filteredProcesses = [...this.processes];
        },
        (error) => {
          this.handleError(error);
        }
      );
  }

  formatMemoryUsage(memoryString: string): string {
    const match = memoryString.match(/(\d+(\.\d+)?)/);
    if (match) {
      const value = parseFloat(match[1]);
      return `${value.toFixed(2)} %`;
    }
    return memoryString;
  }

  getProcessStatus(statusString: string): string {
    if (statusString.includes('R')) {
      return 'running';
    } else if (statusString.includes('S') || statusString.includes('I')) {
      return 'interruptible sleep';
    } else if (statusString.includes('D')) {
      return 'uninterruptible sleep';
    } else if (statusString.includes('T')) {
      return 'stopped';
    } else if (statusString.includes('Z')) {
      return 'zombie';
    } else {
      return statusString;
    }
  }

  sortProcesses(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  stopProcess(pid: number) {
    this.showPasswordModal = true;
    this.currentProcessPID = pid;
    this.currentAction = 'stop';
  }

  startProcess(pid: number) {
    this.showPasswordModal = true;
    this.currentProcessPID = pid;
    this.currentAction = 'start';
  }

  killProcess(pid: number) {
    this.showPasswordModal = true;
    this.currentProcessPID = pid;
    this.currentAction = 'kill';
  }

  onPasswordConfirm(sudoPassword: string) {
    let command;
    if (this.currentAction === 'stop') {
      command = `kill -19 ${this.currentProcessPID}`;
    } else if (this.currentAction === 'start') {
      command = `kill -CONT ${this.currentProcessPID}`;
    } else if (this.currentAction === 'kill') {
      command = `kill -15 ${this.currentProcessPID}`;
    }
    const commands = [`echo '${sudoPassword}' | sudo -S ${command}`];
    this.executeCommands(commands, sudoPassword);
    this.showPasswordModal = false;
  }

  onPasswordCancel() {
    this.showPasswordModal = false;
  }

  executeCommands(commands: string[], sudoPassword?: string) {
    this.sshService.executeCommand(this.systemId, commands, sudoPassword)
      .subscribe(
        (response) => {
          console.log(response);
          this.fetchProcessInfo();
        },
        (error) => {
          console.error('Error al ejecutar los comandos:', error);
        }
      );
  }

  handleError(error: any): void {
    if (error.error.error_code === 'invalid_ssh_token') {
      alert('El token SSH ha expirado. Por favor, vuelva a iniciar sesión.');
      this.router.navigateByUrl('/login-server');
    }
  }

}