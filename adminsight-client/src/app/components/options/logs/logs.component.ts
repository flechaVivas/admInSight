import { Component, OnInit, OnDestroy } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { Subscription, interval } from 'rxjs';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
Chart.register(...registerables);

export interface LogEntry {
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  service: string;
  message: string;
  details?: string;
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
})
export class LogsComponent implements OnInit, OnDestroy {
  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  searchTerm: string = '';
  severityFilter: string = '';
  categoryFilter: string = '';
  serviceFilter: string = '';
  startDate: string = '';
  endDate: string = '';
  sortColumn: string = 'timestamp';
  sortDirection: string = 'desc';

  private systemId: number;
  private updateSubscription: Subscription | null = null;

  constructor(private sshService: SshService, private router: Router) {
    this.systemId = Number(this.router.url.split('/')[2]);
  }

  ngOnInit() {
    if (this.systemId) {
      this.fetchLogs();
      this.startAutoRefresh();
    } else {
      console.error('No se ha proporcionado el ID del sistema');
    }
  }

  ngOnDestroy() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
  }

  startAutoRefresh() {
    this.updateSubscription = interval(5000).subscribe(() => {
      this.fetchLogs();
    });
  }

  fetchLogs() {
    const commands = [
      'journalctl -n 100 --no-pager',
      'tail -n 50 /var/log/auth.log',
      'tail -n 50 /var/log/apache2/access.log',
      'tail -n 50 /var/log/nginx/error.log',
      'dmesg | tail -n 50'
    ];

    this.sshService.executeCommand(this.systemId, commands)
      .subscribe(
        (response: any) => {
          this.parseJournalCtlOutput(response['journalctl -n 100 --no-pager']?.stdout || '');
          this.parseAuthLog(response['tail -n 50 /var/log/auth.log']?.stdout || '');
          this.parseApacheLog(response['tail -n 50 /var/log/apache2/access.log']?.stdout || '');
          this.parseNginxLog(response['tail -n 50 /var/log/nginx/error.log']?.stdout || '');
          this.parseDmesgOutput(response['dmesg | tail -n 50']?.stdout || '');
          this.applyFilters();
        },
        (error) => {
          this.handleError(error);
        }
      );
  }

  parseJournalCtlOutput(output: string) {
    const lines = output.trim().split('\n');
    lines.forEach(line => {
      const parts = line.split(' ');
      const timestamp = parts.slice(0, 3).join(' ');
      const severity = this.getSeverity(parts[3]);
      const category = 'System';
      const service = parts[4];
      const message = parts.slice(5).join(' ');
      this.logs.push({ timestamp, severity, category, service, message });
    });
  }

  parseAuthLog(output: string) {
    const lines = output.trim().split('\n');
    lines.forEach(line => {
      const parts = line.split(' ');
      const timestamp = parts.slice(0, 3).join(' ');
      const severity = 'info';
      const category = 'Security';
      const service = 'auth';
      const message = parts.slice(5).join(' ');
      this.logs.push({ timestamp, severity, category, service, message });
    });
  }

  parseApacheLog(output: string) {
    // Implement Apache log parsing logic
  }

  parseNginxLog(output: string) {
    // Implement Nginx log parsing logic
  }

  parseDmesgOutput(output: string) {
    // Implement dmesg output parsing logic
  }

  getSeverity(level: string): 'info' | 'warning' | 'error' | 'critical' {
    switch (level.toLowerCase()) {
      case 'emerg':
      case 'alert':
      case 'crit':
        return 'critical';
      case 'err':
        return 'error';
      case 'warning':
      case 'warn':
        return 'warning';
      default:
        return 'info';
    }
  }

  applyFilters() {
    this.filteredLogs = this.logs.filter(log => {
      const matchesSeverity = !this.severityFilter || log.severity === this.severityFilter;
      const matchesCategory = !this.categoryFilter || log.category === this.categoryFilter;
      const matchesService = !this.serviceFilter || log.service.includes(this.serviceFilter);
      const matchesDate = (!this.startDate || new Date(log.timestamp) >= new Date(this.startDate)) &&
        (!this.endDate || new Date(log.timestamp) <= new Date(this.endDate));
      const matchesSearch = !this.searchTerm ||
        log.message.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        log.service.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchesSeverity && matchesCategory && matchesService && matchesDate && matchesSearch;
    });

    this.sortLogs();
  }

  sortLogs() {
    this.filteredLogs.sort((a, b) => {
      const valueA = a[this.sortColumn as keyof LogEntry];
      const valueB = b[this.sortColumn as keyof LogEntry];

      if (valueA && valueB && valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA && valueB && valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
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
    this.sortLogs();
  }

  toggleDetails(log: LogEntry) {
    log.details = log.details ? undefined : 'Detalles adicionales del log...';
  }
}