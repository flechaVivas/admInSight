import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import {
  Chart,
  ChartConfiguration,
  ChartData,
  ChartType,
  registerables,
  ChartTypeRegistry
} from 'chart.js';
Chart.register(...registerables);

export interface NetworkConnection {
  protocol: string;
  localAddress: string;
  foreignAddress: string;
  state: string;
}

interface NetworkStats {
  timestamp: string;
  activeConnections: number;
  tcpConnections: number;
  udpConnections: number;
  listeningPorts: number;
}

@Component({
  selector: 'app-network',
  templateUrl: './network.component.html',
})
export class NetworkComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('connectionsCanvas') connectionsCanvas!: ElementRef;
  @ViewChild('portsCanvas') portsCanvas!: ElementRef;

  networkConnections: NetworkConnection[] = [];
  filteredConnections: NetworkConnection[] = [];
  searchTerm: string = '';
  protocolFilter: string = '';
  stateFilter: string = '';
  sortColumn: string = 'localAddress';
  sortDirection: string = 'asc';

  networkStats: NetworkStats[] = [];
  isInternetConnected: boolean = false;
  isLoading: boolean = true;

  private connectionsChart: Chart | undefined;
  private portsChart: Chart<keyof ChartTypeRegistry, number[], unknown> | undefined;

  // Mapeo de estados para normalización
  private readonly stateMap: { [key: string]: string } = {
    'LISTEN': 'LISTEN',
    'ESTAB': 'ESTABLISHED',
    'ESTABLISHED': 'ESTABLISHED',
    'TIME_WAIT': 'TIME_WAIT',
    'CLOSE_WAIT': 'CLOSE_WAIT',
    'CLOSED': 'CLOSED',
    'SYN_SENT': 'SYN_SENT',
    'SYN_RECV': 'SYN_RECV',
    'FIN_WAIT1': 'FIN_WAIT1',
    'FIN_WAIT2': 'FIN_WAIT2',
    'LAST_ACK': 'LAST_ACK',
    'CLOSING': 'CLOSING'
  };

  // Mapeo de puertos comunes
  private readonly commonPorts: { [key: string]: string } = {
    '22': 'SSH',
    '80': 'HTTP',
    '443': 'HTTPS',
    '21': 'FTP',
    '25': 'SMTP',
    '53': 'DNS',
    '3306': 'MySQL',
    '5432': 'PostgreSQL',
    '27017': 'MongoDB',
    '6379': 'Redis',
    '1433': 'MSSQL',
    '3389': 'RDP',
    '5900': 'VNC',
    '8080': 'HTTP-ALT',
    '8443': 'HTTPS-ALT'
  };

  private systemId: number;
  private updateSubscription: Subscription | null = null;
  private readonly updateInterval = 5000; // 5 segundos
  private readonly maxDataPoints = 10;

  constructor(private sshService: SshService, private router: Router) {
    this.systemId = Number(this.router.url.split('/')[2]);
  }

  ngOnInit() {
    if (this.systemId) {
      this.fetchNetworkInfo();
      this.startAutoRefresh();
    } else {
      console.error('No system ID provided');
      this.router.navigate(['/systems']);
    }
  }

  ngAfterViewInit() {
    this.initializeCharts();
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    this.destroyCharts();
  }

  private initializeCharts() {
    this.initializeConnectionsChart();
    this.initializePortsChart();
  }

  private initializeConnectionsChart() {
    if (!this.connectionsCanvas?.nativeElement) return;

    const ctx = this.connectionsCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    this.connectionsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: 'Total Active',
            data: [],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'TCP',
            data: [],
            borderColor: 'rgb(54, 162, 235)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.4
          },
          {
            label: 'UDP',
            data: [],
            borderColor: 'rgb(153, 102, 255)',
            backgroundColor: 'rgba(153, 102, 255, 0.2)',
            fill: true,
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        },
        plugins: {
          legend: {
            display: true,
            position: 'top'
          },
          title: {
            display: true,
            text: 'Active Connections'
          }
        },
        interaction: {
          mode: 'index',
          intersect: false
        }
      }
    });
  }

  private initializePortsChart() {
    if (!this.portsCanvas?.nativeElement) return;

    const ctx = this.portsCanvas.nativeElement.getContext('2d');
    if (!ctx) return;

    const data: ChartData<'bar', number[], string> = {
      labels: ['SSH', 'HTTP', 'HTTPS', 'Database', 'Other'],
      datasets: [{
        label: 'Active Connections',
        data: [0, 0, 0, 0, 0],
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ]
      }]
    };

    const config = {
      type: 'bar' as const,
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: 'Connection Types Distribution'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    };

    this.portsChart = new Chart(ctx, config);
  }

  private destroyCharts() {
    if (this.connectionsChart) {
      this.connectionsChart.destroy();
      this.connectionsChart = undefined;
    }
    if (this.portsChart) {
      this.portsChart.destroy();
      this.portsChart = undefined;
    }
  }

  startAutoRefresh() {
    this.updateSubscription = interval(this.updateInterval).subscribe(() => {
      this.fetchNetworkInfo();
    });
  }

  fetchNetworkInfo() {
    this.isLoading = true;
    const commands = [
      'ss -tun', // Get all TCP and UDP connections
      'ping -c 1 8.8.8.8', // Check internet connectivity
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe({
        next: (response: any) => {
          this.parseNetworkConnections(response['ss -tun']?.stdout || '');
          this.checkInternetConnection(response['ping -c 1 8.8.8.8']?.stdout || '');
          this.updateNetworkStats();
          this.isLoading = false;
        },
        error: (error) => {
          this.handleError(error);
          this.isLoading = false;
        }
      });
  }

  parseNetworkConnections(output: string) {
    const lines = output.trim().split('\n').slice(1); // Skip header
    this.networkConnections = lines
      .filter(line => line.trim()) // Remove empty lines
      .map(line => {
        const parts = line.trim().split(/\s+/);

        // Get the state from the correct position
        let state = '';
        if (parts[0].includes('tcp')) {
          // For TCP connections, state is usually present
          state = this.normalizeState(parts[1] || 'UNKNOWN');
        } else if (parts[0].includes('udp')) {
          // For UDP connections, if there's a connection it's typically "ESTABLISHED"
          state = parts[1] ? this.normalizeState(parts[1]) : 'ESTABLISHED';
        }

        return {
          protocol: (parts[0] || '').toLowerCase().replace('tcp6', 'tcp').replace('udp6', 'udp'),
          localAddress: parts[4] || '',
          foreignAddress: parts[5] || '',
          state: state
        };
      })
      .filter(conn => conn.protocol && conn.localAddress);

    this.applyFilters();
  }

  private updateNetworkStats() {
    const timestamp = new Date().toLocaleTimeString();
    const tcpConnections = this.networkConnections.filter(conn => conn.protocol === 'tcp').length;
    const udpConnections = this.networkConnections.filter(conn => conn.protocol === 'udp').length;
    const listeningPorts = this.networkConnections.filter(conn => conn.state === 'LISTEN').length;

    const stats: NetworkStats = {
      timestamp,
      activeConnections: this.networkConnections.length,
      tcpConnections,
      udpConnections,
      listeningPorts
    };

    this.networkStats.push(stats);
    if (this.networkStats.length > this.maxDataPoints) {
      this.networkStats.shift();
    }

    this.updateCharts();
    this.updatePortsDistribution();
  }

  private updateCharts() {
    if (this.connectionsChart) {
      const labels = this.networkStats.map(stat => stat.timestamp);
      const activeData = this.networkStats.map(stat => stat.activeConnections);
      const tcpData = this.networkStats.map(stat => stat.tcpConnections);
      const udpData = this.networkStats.map(stat => stat.udpConnections);

      this.connectionsChart.data.labels = labels;
      this.connectionsChart.data.datasets[0].data = activeData;
      this.connectionsChart.data.datasets[1].data = tcpData;
      this.connectionsChart.data.datasets[2].data = udpData;
      this.connectionsChart.update('none');
    }
  }

  private updatePortsDistribution() {
    if (!this.portsChart) return;

    const activeConnections = this.networkConnections.filter(conn => conn.state === 'ESTABLISHED');
    let sshCount = 0, httpCount = 0, httpsCount = 0, dbCount = 0, otherCount = 0;

    activeConnections.forEach(conn => {
      if (this.isSSHConnection(conn)) {
        sshCount++;
      } else if (this.isHTTPConnection(conn)) {
        httpCount++;
      } else if (this.isHTTPSConnection(conn)) {
        httpsCount++;
      } else if (this.isDatabaseConnection(conn)) {
        dbCount++;
      } else {
        otherCount++;
      }
    });

    if (this.portsChart.data.datasets[0]) {
      this.portsChart.data.datasets[0].data = [sshCount, httpCount, httpsCount, dbCount, otherCount];
      this.portsChart.update();
    }
  }

  private isDatabaseConnection(connection: NetworkConnection): boolean {
    const dbPorts = ['3306', '5432', '27017', '6379', '1433'];
    const localPort = connection.localAddress.split(':')[1];
    const remotePort = connection.foreignAddress.split(':')[1];

    return dbPorts.includes(localPort) || dbPorts.includes(remotePort);
  }


  normalizeState(state: string): string {
    return this.stateMap[state.toUpperCase()] || state.toUpperCase();
  }

  checkInternetConnection(output: string) {
    this.isInternetConnected = output.includes('1 received');
  }

  getPortService(address: string): string | null {
    const port = address.split(':')[1];
    return this.commonPorts[port] || null;
  }

  isSSHConnection(connection: NetworkConnection): boolean {
    return connection.localAddress.includes(':22') ||
      connection.foreignAddress.includes(':22');
  }

  isHTTPConnection(connection: NetworkConnection): boolean {
    return connection.localAddress.includes(':80') ||
      connection.foreignAddress.includes(':80') ||
      connection.localAddress.includes(':8080') ||
      connection.foreignAddress.includes(':8080');
  }

  isHTTPSConnection(connection: NetworkConnection): boolean {
    return connection.localAddress.includes(':443') ||
      connection.foreignAddress.includes(':443') ||
      connection.localAddress.includes(':8443') ||
      connection.foreignAddress.includes(':8443');
  }

  getConnectionType(connection: NetworkConnection): string {
    if (this.isSSHConnection(connection)) return 'SSH';
    if (this.isHTTPSConnection(connection)) return 'HTTPS';
    if (this.isHTTPConnection(connection)) return 'HTTP';

    const localPort = connection.localAddress.split(':')[1];
    const remotePort = connection.foreignAddress.split(':')[1];

    return this.commonPorts[localPort] || this.commonPorts[remotePort] || 'Other';
  }

  applyFilters() {
    const searchTermLower = this.searchTerm.toLowerCase();

    this.filteredConnections = this.networkConnections.filter(connection => {
      // Get the connection type for search
      const connectionType = this.getConnectionType(connection);

      const matchesSearch = !this.searchTerm ||
        Object.values(connection).some(value =>
          String(value).toLowerCase().includes(searchTermLower)
        ) ||
        connectionType.toLowerCase().includes(searchTermLower);

      const matchesProtocol = !this.protocolFilter ||
        connection.protocol.toLowerCase() === this.protocolFilter.toLowerCase();

      const matchesState = !this.stateFilter ||
        connection.state === this.stateFilter;

      return matchesSearch && matchesProtocol && matchesState;
    });

    this.sortConnections();
  }

  sortConnections() {
    this.filteredConnections.sort((a, b) => {
      const aValue = String(a[this.sortColumn as keyof NetworkConnection]);
      const bValue = String(b[this.sortColumn as keyof NetworkConnection]);

      return this.sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  }

  handleError(error: any): void {
    console.error('Network error:', error);

    if (error.error?.error_code === 'invalid_ssh_token') {
      alert('SSH token has expired. Please log in again.');
      this.router.navigateByUrl('/login-server');
    } else {
      alert('An error occurred while fetching network information. Please try again.');
    }
  }

  setProtocolFilter(protocol: string) {
    this.protocolFilter = protocol;
    this.applyFilters();
  }

  setStateFilter(state: string) {
    this.stateFilter = state;
    this.applyFilters();
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortConnections();
  }
}