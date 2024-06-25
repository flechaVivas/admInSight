import { Component, OnInit, OnDestroy } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);

export interface NetworkConnection {
  protocol: string;
  localAddress: string;
  foreignAddress: string;
  state: string;
  pid: string;
}

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
})
export class NetworkComponent implements OnInit, OnDestroy {
  networkConnections: NetworkConnection[] = [];
  filteredConnections: NetworkConnection[] = [];
  searchTerm: string = '';
  protocolFilter: string = '';
  stateFilter: string = '';
  sortColumn: string = 'localAddress';
  sortDirection: string = 'asc';

  bandwidthData: number[] = [];
  packetsData: number[] = [];
  latencyData: number[] = [];

  private bandwidthChart: Chart | null = null;
  private packetsChart: Chart | null = null;

  isInternetConnected: boolean = false;

  private systemId: number;
  private updateSubscription: Subscription | null = null;

  constructor(private sshService: SshService, private router: Router) {
    this.systemId = Number(this.router.url.split('/')[2]);
  }

  ngOnInit() {
    if (this.systemId) {
      this.fetchNetworkInfo();
      this.startAutoRefresh();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    if (this.bandwidthChart) {
      this.bandwidthChart.destroy();
    }
    if (this.packetsChart) {
      this.packetsChart.destroy();
    }
  }

  startAutoRefresh() {
    this.updateSubscription = interval(3000).subscribe(() => {
      this.fetchNetworkInfo();
    });
  }

  fetchNetworkInfo() {
    const commands = [
      'netstat -tuln',
      'ping -c 1 google.com',
      'sar -n DEV 1 1',
      'lsof -i -n -P'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          this.parseNetstatOutput(response['netstat -tuln']?.stdout || '');
          this.checkInternetConnection(response['ping -c 1 google.com']?.stdout || '');
          this.parseNetworkUsage(response['sar -n DEV 1 1']?.stdout || '');
          this.addProgramInfo(response['lsof -i -n -P']?.stdout || '');
        },
        (error) => {
          this.handleError(error);
        }
      );
  }

  parseNetstatOutput(output: string) {
    const lines = output.trim().split('\n').slice(2); // Ignorar las primeras dos líneas (encabezados)
    this.networkConnections = lines.map(line => {
      const parts = line.split(/\s+/);
      return {
        protocol: parts[0],
        localAddress: parts[3],
        foreignAddress: parts[4],
        state: parts[5] || 'N/A',
        pid: 'N/A' // Esto se actualizará en addProgramInfo
      };
    });
    this.filteredConnections = [...this.networkConnections];
  }

  addProgramInfo(output: string) {
    const lines = output.trim().split('\n').slice(1); // Ignorar la primera línea (encabezado)
    const programInfo = new Map();

    lines.forEach(line => {
      const parts = line.split(/\s+/);
      const pid = parts[1];
      const program = parts[0];
      const localAddress = parts[8];
      programInfo.set(localAddress, { pid, program });
    });

    this.networkConnections = this.networkConnections.map(conn => {
      const info = programInfo.get(conn.localAddress);
      if (info) {
        conn.pid = `${info.pid}/${info.program}`;
      }
      return conn;
    });

    this.filteredConnections = [...this.networkConnections];
  }

  checkInternetConnection(output: string) {
    this.isInternetConnected = output.includes('1 received');
  }

  parseNetworkUsage(output: string) {
    const lines = output.trim().split('\n');
    const dataLine = lines[lines.length - 1].split(/\s+/);

    const rxpck = parseFloat(dataLine[3]);
    const txpck = parseFloat(dataLine[4]);
    const rxkB = parseFloat(dataLine[5]);
    const txkB = parseFloat(dataLine[6]);

    this.updateCharts(rxkB + txkB, rxpck + txpck);
  }

  updateCharts(bandwidth: number, packets: number) {
    this.bandwidthData.push(bandwidth);
    this.packetsData.push(packets);

    if (this.bandwidthData.length > 10) {
      this.bandwidthData.shift();
      this.packetsData.shift();
    }

    this.renderBandwidthChart();
    this.renderPacketsChart();
  }

  renderBandwidthChart() {
    const canvas = document.getElementById('bandwidthChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const chartConfig: ChartConfiguration = {
        type: 'line',
        data: {
          labels: Array.from({ length: this.bandwidthData.length }, (_, i) => i.toString()),
          datasets: [{
            label: 'Bandwidth (kB/s)',
            data: this.bandwidthData,
            borderColor: 'rgba(75, 192, 192, 1)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          animation: false
        }
      };

      if (this.bandwidthChart) {
        this.bandwidthChart.data = chartConfig.data;
        this.bandwidthChart.update();
      } else {
        this.bandwidthChart = new Chart(ctx, chartConfig);
      }
    }
  }

  renderPacketsChart() {
    const canvas = document.getElementById('packetsChart') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      const chartConfig: ChartConfiguration = {
        type: 'line',
        data: {
          labels: Array.from({ length: this.packetsData.length }, (_, i) => i.toString()),
          datasets: [{
            label: 'Packets/s',
            data: this.packetsData,
            borderColor: 'rgba(153, 102, 255, 1)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          animation: false
        }
      };

      if (this.packetsChart) {
        this.packetsChart.data = chartConfig.data;
        this.packetsChart.update();
      } else {
        this.packetsChart = new Chart(ctx, chartConfig);
      }
    }
  }

  handleError(error: any): void {
    if (error.error.error_code === 'invalid_ssh_token') {
      alert('El token SSH ha expirado. Por favor, vuelva a iniciar sesión.');
      this.router.navigateByUrl('/login-server');
    }
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }
}