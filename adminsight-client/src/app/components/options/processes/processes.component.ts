import { Component, OnInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

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
    this.autoRefreshSubscription = interval(2000)
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
      'ps -eo pid,user,pcpu,pmem,stat,comm --no-headers',
      'top -bn1 | grep "^%Cpu" | awk \'{print $2}\'', // CPU usage
      'free -m | awk \'/Mem:/ {print $3/$2*100.0}\'', // Memory usage
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

          const cpuUsage = parseFloat(response['top -bn1 | grep "^%Cpu" | awk \'{print $2}\'']?.stdout.trim());
          this.renderCpuLoadChart(cpuUsage);

          const memoryUsage = parseFloat(response['free -m | awk \'/Mem:/ {print $3/$2*100.0}\'']?.stdout.trim());
          this.renderMemoryUsageChart(memoryUsage);
        },
        (error) => {
          this.handleError(error);
        }
      );
  }

  private destroyCharts() {
    const charts = Object.values(Chart.instances);
    charts.forEach((chart) => {
      if (chart instanceof Chart) {
        chart.destroy();
      }
    });
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

  cpuUsageHistory: number[] = [];
  renderCpuLoadChart(cpuUsage: number | undefined) {
    const canvas = document.getElementById('cpuLoadChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx && cpuUsage !== undefined) {
      const chart = Chart.getChart(canvas);

      if (!chart) {
        // Crear un nuevo gráfico si no existe
        new Chart(ctx, {
          type: 'line',
          data: {
            labels: [], // Las etiquetas se actualizarán dinámicamente
            datasets: [
              {
                label: 'CPU Usage (%)',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 1,
                tension: 0.4, // Ajusta la curva de la línea
              }
            ]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  stepSize: 25
                }
              },
              x: {
                display: false
              }
            },
            animation: false, // Deshabilitar la animación
            elements: {
              line: {
                tension: 0.4 // Ajusta la curva de la línea
              }
            }
          }
        });
      } else {
        // Actualizar los datos del gráfico existente
        this.cpuUsageHistory.push(cpuUsage);
        chart.data.labels = Array.from({ length: this.cpuUsageHistory.length }, (_, i) => `${i + 1}`);
        chart.data.datasets[0].data = this.cpuUsageHistory;
        chart.update();
      }
    } else {
      console.error('No se pudo obtener el contexto de renderizado del canvas o los datos de CPU Usage son inválidos');
    }
  }

  memoryUsageHistory: number[] = [];
  renderMemoryUsageChart(memoryUsage: number) {
    const canvas = document.getElementById('memoryUsageChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const chart = Chart.getChart(canvas);

      if (!chart) {
        // Create a new chart if it doesn't exist
        new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: ['Used', 'Available'],
            datasets: [
              {
                data: [memoryUsage, 100 - memoryUsage],
                backgroundColor: ['rgba(255, 99, 132, 0.2)', 'rgba(54, 162, 235, 0.2)'],
                borderColor: ['rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)'],
                borderWidth: 1
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Memory Usage (%)'
              }
            },
            animation: false
          }
        });
      } else {
        // Update the data of the existing chart
        this.memoryUsageHistory.push(memoryUsage);
        chart.data.datasets[0].data = [memoryUsage, 100 - memoryUsage];
        chart.update();
      }
    } else {
      console.error('Failed to get canvas context');
    }
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