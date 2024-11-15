// logs.component.ts
import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { SshService } from '../../../services/ssh.service';
import { Router } from '@angular/router';
import { Subscription, interval, BehaviorSubject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Chart, ChartConfiguration } from 'chart.js';
import { saveAs } from 'file-saver';

export interface LogEntry {
  id: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  service: string;
  message: string;
  details?: string;
  raw?: string;
  host?: string;
  pid?: string;
}

interface LogStats {
  severityCount: { [key: string]: number };
  categoryCount: { [key: string]: number };
  serviceCount: { [key: string]: number };
  timelineData: Array<{ timestamp: string; count: number }>;
}

@Component({
  selector: 'app-logs',
  templateUrl: './logs.component.html',
})
export class LogsComponent implements OnInit, OnDestroy {
  @ViewChild('logChart', { static: true }) logChart!: ElementRef;

  isLoading: boolean = false;
  lastUpdate: Date = new Date();
  sortColumn: keyof LogEntry = 'timestamp';
  sortDirection: 'asc' | 'desc' = 'desc';
  currentAlert: { message: string; pattern: string } | null = null;

  logs: LogEntry[] = [];
  filteredLogs: LogEntry[] = [];
  searchTerm$ = new BehaviorSubject<string>('');
  stats: LogStats = {
    severityCount: {},
    categoryCount: {},
    serviceCount: {},
    timelineData: []
  };

  filters = {
    severity: '',
    category: '',
    service: '',
    startDate: '',
    endDate: '',
    host: '',
    pid: '',
    regex: '',
    excludePattern: ''
  };

  config = {
    autoRefresh: true,
    refreshInterval: 5000,
    maxLogEntries: 1000,
    enablePatternDetection: true,
    alertThreshold: 5
  };

  chart: Chart | null = null;
  private systemId: number;
  private updateSubscription: Subscription | null = null;
  private searchSubscription: Subscription | null = null;
  private knownPatterns: Map<string, number> = new Map();

  constructor(
    private sshService: SshService,
    private router: Router
  ) {
    this.systemId = Number(this.router.url.split('/')[2]);
  }

  ngOnInit(): void {
    if (this.systemId) {
      this.initializeSearchSubscription();
      this.initializeCharts();
      this.fetchLogs().then(() => {
        if (this.config.autoRefresh) {
          this.startAutoRefresh();
        }
      });
    } else {
      console.error('No system ID provided');
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initializeSearchSubscription(): void {
    this.searchSubscription = this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }


  private initializeCharts(): void {
    if (this.logChart?.nativeElement) {
      const ctx = this.logChart.nativeElement.getContext('2d');
      if (ctx) {
        this.chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels: [],
            datasets: [{
              label: 'Log Frequency',
              data: [],
              borderColor: 'rgb(75, 192, 192)',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            scales: {
              y: {
                beginAtZero: true
              }
            }
          }
        });
      }
    }
  }

  startAutoRefresh(): void {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }

    if (this.config.autoRefresh) {
      this.updateSubscription = interval(this.config.refreshInterval)
        .subscribe(async () => {
          await this.fetchLogs();
        });
    }
  }

  async fetchLogs(): Promise<void> {
    if (this.isLoading) return;

    this.isLoading = true;
    const commands = [
      'journalctl --no-pager -n 1000 -o json',
      'tail -n 500 /var/log/auth.log',
      'tail -n 500 /var/log/apache2/access.log',
      'tail -n 500 /var/log/nginx/error.log',
      'dmesg --time-format iso -n 500'
    ];

    try {
      const response = await this.sshService.executeCommand(this.systemId, commands).toPromise();
      await this.processLogs(response);
      this.lastUpdate = new Date();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isLoading = false;
    }
  }


  private async processLogs(response: any): Promise<void> {
    const newLogs: LogEntry[] = [];

    // Procesar journalctl
    if (response['journalctl --no-pager -n 1000 -o json']?.stdout) {
      const journalLines = response['journalctl --no-pager -n 1000 -o json'].stdout
        .split('\n')
        .filter(Boolean);

      for (const line of journalLines) {
        try {
          const entry = JSON.parse(line);
          const parsedEntry = this.parseJournalCtlEntry(entry);
          if (parsedEntry) {
            newLogs.push(parsedEntry);
          }
        } catch (e) {
          console.error('Error parsing journalctl entry:', e);
        }
      }
    }

    // Procesar otros logs
    await Promise.all([
      this.processAuthLog(response['tail -n 500 /var/log/auth.log']?.stdout, newLogs),
      this.processApacheLog(response['tail -n 500 /var/log/apache2/access.log']?.stdout, newLogs),
      this.processNginxLog(response['tail -n 500 /var/log/nginx/error.log']?.stdout, newLogs),
      this.processDmesgLog(response['dmesg --time-format iso -n 500']?.stdout, newLogs)
    ]);

    // Actualizar logs y estadísticas
    this.updateLogsAndStats(newLogs);
  }

  private parseJournalCtlEntry(entry: any): LogEntry | null {
    try {
      return {
        id: entry.__REALTIME_TIMESTAMP || Date.now().toString(),
        timestamp: new Date(entry.__REALTIME_TIMESTAMP / 1000).toISOString(),
        severity: this.determineSeverity(entry.PRIORITY),
        category: entry.SYSLOG_IDENTIFIER || 'System',
        service: entry._SYSTEMD_UNIT || entry.SYSLOG_IDENTIFIER || 'unknown',
        message: entry.MESSAGE || '',
        host: entry._HOSTNAME,
        pid: entry._PID,
        raw: JSON.stringify(entry, null, 2)
      };
    } catch (e) {
      console.error('Error parsing journalctl entry:', e);
      return null;
    }
  }

  private updateLogsAndStats(newLogs: LogEntry[]) {
    // Mantener límite de entradas
    this.logs = [...newLogs, ...this.logs]
      .slice(0, this.config.maxLogEntries);

    // Actualizar estadísticas
    this.updateStats();

    // Detectar patrones si está habilitado
    if (this.config.enablePatternDetection) {
      this.detectPatterns(newLogs);
    }

    // Aplicar filtros actuales
    this.applyFilters();

    // Actualizar gráficas
    this.updateCharts();
  }

  private updateStats() {
    const stats: LogStats = {
      severityCount: {},
      categoryCount: {},
      serviceCount: {},
      timelineData: []
    };

    // Agrupar por intervalos de 5 minutos para la línea de tiempo
    const timeGroups = new Map<string, number>();

    this.logs.forEach(log => {
      // Conteos
      stats.severityCount[log.severity] = (stats.severityCount[log.severity] || 0) + 1;
      stats.categoryCount[log.category] = (stats.categoryCount[log.category] || 0) + 1;
      stats.serviceCount[log.service] = (stats.serviceCount[log.service] || 0) + 1;

      // Línea de tiempo
      const timeKey = new Date(log.timestamp)
        .toISOString()
        .slice(0, 16);
      timeGroups.set(timeKey, (timeGroups.get(timeKey) || 0) + 1);
    });

    // Convertir grupos de tiempo a array ordenado
    stats.timelineData = Array.from(timeGroups.entries())
      .map(([timestamp, count]) => ({ timestamp, count }))
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

    this.stats = stats;
  }

  private detectPatterns(newLogs: LogEntry[]) {
    const patterns = new Map<string, number>();

    newLogs.forEach(log => {
      // Detectar patrones en mensajes de error
      if (log.severity === 'error' || log.severity === 'critical') {
        const pattern = this.extractErrorPattern(log.message);
        patterns.set(pattern, (patterns.get(pattern) || 0) + 1);
      }
    });

    // Verificar patrones que superan el umbral
    patterns.forEach((count, pattern) => {
      const previousCount = this.knownPatterns.get(pattern) || 0;
      if (count - previousCount >= this.config.alertThreshold) {
        this.triggerAlert(pattern, count);
      }
      this.knownPatterns.set(pattern, count);
    });
  }

  private extractErrorPattern(message: string): string {
    // Remover datos variables como IPs, fechas, IDs
    return message.replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, 'IP_ADDRESS')
      .replace(/\d{4}-\d{2}-\d{2}/g, 'DATE')
      .replace(/\b[0-9a-f]{8}\b/g, 'ID')
      .toLowerCase();
  }

  private triggerAlert(pattern: string, count: number) {
    // Implementar sistema de alertas (e.g., notificaciones, webhooks, etc.)
    console.warn(`Alert: Pattern detected ${count} times: ${pattern}`);
  }

  getSeverityClass(severity: string): string {
    const classes = {
      'info': 'text-green-600',
      'warning': 'text-yellow-600',
      'error': 'text-red-600',
      'critical': 'text-purple-600'
    };
    return classes[severity as keyof typeof classes] || 'text-gray-600';
  }

  toggleAutoRefresh() {
    if (this.config.autoRefresh) {
      this.startAutoRefresh();
    } else {
      if (this.updateSubscription) {
        this.updateSubscription.unsubscribe();
      }
    }
  }

  updateRefreshInterval() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    if (this.config.autoRefresh) {
      this.startAutoRefresh();
    }
  }

  sort(column: keyof LogEntry) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortLogs();
  }

  sortLogs() {
    this.filteredLogs.sort((a, b) => {
      const valueA = a[this.sortColumn as keyof LogEntry];
      const valueB = b[this.sortColumn as keyof LogEntry];

      if (!valueA || !valueB) return 0;

      const comparison = valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  toggleDetails(log: LogEntry) {
    log.details = log.details ? undefined : log.raw;
  }

  closeAlert() {
    this.currentAlert = null;
  }

  private processAuthLog(output: string, logs: LogEntry[]) {
    if (!output) return;

    const lines = output.trim().split('\n');
    lines.forEach(line => {
      const match = line.match(/^(\w+\s+\d+\s+\d+:\d+:\d+)\s+(\w+)\s+([^:]+):\s+(.+)/);
      if (match) {
        const [, timestamp, host, service, message] = match;
        logs.push({
          id: Date.now().toString() + Math.random(),
          timestamp: new Date(timestamp).toISOString(),
          severity: this.determineSeverity(message),
          category: 'Security',
          service: service.trim(),
          message: message.trim(),
          host,
          pid: '',
          raw: line
        });
      }
    });
  }

  private processApacheLog(output: string, logs: LogEntry[]) {
    if (!output) return;

    const lines = output.trim().split('\n');
    lines.forEach(line => {
      // Apache Combined Log Format
      const match = line.match(/^(\S+) \S+ \S+ \[([^\]]+)\] "([^"]+)" (\d+) (\d+) "([^"]*)" "([^"]*)"/);
      if (match) {
        const [, ip, timestamp, request, status, bytes, referer, userAgent] = match;
        const statusNum = parseInt(status);
        logs.push({
          id: Date.now().toString() + Math.random(),
          timestamp: new Date(timestamp.replace(':', ' ')).toISOString(),
          severity: this.getHttpStatusSeverity(statusNum),
          category: 'Web',
          service: 'Apache',
          message: `${request} - Status: ${status} - Size: ${bytes}`,
          host: ip,
          pid: '',
          raw: line,
          details: `Referer: ${referer}\nUser-Agent: ${userAgent}`
        });
      }
    });
  }

  private processNginxLog(output: string, logs: LogEntry[]): void {
    if (!output) return;

    const lines = output.trim().split('\n');
    for (const line of lines) {
      try {
        const regex = /(\d{4}\/\d{2}\/\d{2}\s\d{2}:\d{2}:\d{2})\s\[(\w+)\]\s(\d+)#(\d+):\s\*(\d+)\s(.+)/;
        const match = line.match(regex);

        if (match) {
          const [, timestamp, level, pid, threadId, connection, message] = match;
          logs.push({
            id: `nginx-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            timestamp: this.parseTimestamp(timestamp),
            severity: this.getNginxSeverity(level),
            category: 'Web',
            service: 'Nginx',
            message: message.trim(),
            host: '',
            pid: pid,
            raw: line,
            details: `Thread ID: ${threadId}, Connection: ${connection}`
          });
        }
      } catch (error) {
        console.error('Error processing Nginx log line:', error);
      }
    }
  }

  private processDmesgLog(output: string, logs: LogEntry[]) {
    if (!output) return;

    const lines = output.trim().split('\n');
    lines.forEach(line => {
      const match = line.match(/^\[([^\]]+)\]\s+(?:\<\d+\>)?\s*(.+)/);
      if (match) {
        const [, timestamp, message] = match;
        logs.push({
          id: Date.now().toString() + Math.random(),
          timestamp: new Date(parseFloat(timestamp) * 1000).toISOString(),
          severity: this.determineSeverity(message),
          category: 'Kernel',
          service: 'kernel',
          message: message.trim(),
          host: '',
          pid: '',
          raw: line
        });
      }
    });
  }

  private parseTimestamp(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      return date.toISOString();
    } catch {
      return new Date().toISOString();
    }
  }

  private determineSeverity(message: string): 'info' | 'warning' | 'error' | 'critical' {
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('error') || lowerMessage.includes('fail') || lowerMessage.includes('fatal')) {
      return 'error';
    } else if (lowerMessage.includes('warn') || lowerMessage.includes('could not')) {
      return 'warning';
    } else if (lowerMessage.includes('crit') || lowerMessage.includes('emerg') || lowerMessage.includes('panic')) {
      return 'critical';
    }
    return 'info';
  }

  private getHttpStatusSeverity(status: number): 'info' | 'warning' | 'error' | 'critical' {
    if (status >= 500) return 'error';
    if (status >= 400) return 'warning';
    return 'info';
  }

  private getNginxSeverity(level: string): 'info' | 'warning' | 'error' | 'critical' {
    const severityMap: { [key: string]: 'info' | 'warning' | 'error' | 'critical' } = {
      'emerg': 'critical',
      'alert': 'critical',
      'crit': 'critical',
      'error': 'error',
      'warn': 'warning',
      'notice': 'info',
      'info': 'info',
      'debug': 'info'
    };
    return severityMap[level.toLowerCase()] || 'info';
  }

  private handleError(error: any) {
    console.error('Error fetching logs:', error);
    if (error.status === 401 || error.error?.error_code === 'invalid_ssh_token') {
      alert('La sesión SSH ha expirado. Por favor, vuelva a iniciar sesión.');
      this.router.navigateByUrl('/login-server');
    } else {
      alert('Error al obtener los logs. Por favor, intente nuevamente.');
    }
  }

  applyFilters() {
    this.filteredLogs = this.logs.filter(log => {
      const matchesSeverity = !this.filters.severity || log.severity === this.filters.severity;
      const matchesCategory = !this.filters.category || log.category === this.filters.category;
      const matchesService = !this.filters.service || log.service.includes(this.filters.service);
      const matchesHost = !this.filters.host || log.host?.includes(this.filters.host);
      const matchesPid = !this.filters.pid || log.pid?.includes(this.filters.pid);

      const matchesDate = (!this.filters.startDate || new Date(log.timestamp) >= new Date(this.filters.startDate)) &&
        (!this.filters.endDate || new Date(log.timestamp) <= new Date(this.filters.endDate));

      let matchesRegex = true;
      if (this.filters.regex) {
        try {
          const regex = new RegExp(this.filters.regex);
          matchesRegex = regex.test(log.message);
        } catch (e) {
          console.error('Invalid regex:', e);
        }
      }

      let matchesExclude = true;
      if (this.filters.excludePattern) {
        try {
          const regex = new RegExp(this.filters.excludePattern);
          matchesExclude = !regex.test(log.message);
        } catch (e) {
          console.error('Invalid exclude pattern:', e);
        }
      }

      const matchesSearch = !this.searchTerm$.value ||
        log.message.toLowerCase().includes(this.searchTerm$.value.toLowerCase()) ||
        log.service.toLowerCase().includes(this.searchTerm$.value.toLowerCase());

      return matchesSeverity && matchesCategory && matchesService &&
        matchesDate && matchesHost && matchesPid &&
        matchesRegex && matchesExclude && matchesSearch;
    });

    this.sortLogs();
  }

  private updateCharts() {
    if (this.chart) {
      const timeData = this.stats.timelineData.slice(-30); // Últimos 30 puntos

      this.chart.data.labels = timeData.map(d => d.timestamp);
      this.chart.data.datasets[0].data = timeData.map(d => d.count);

      this.chart.update();
    }
  }

  exportLogs(format: 'csv' | 'json') {
    const data = this.filteredLogs.map(log => ({
      timestamp: log.timestamp,
      severity: log.severity,
      category: log.category,
      service: log.service,
      message: log.message,
      host: log.host,
      pid: log.pid
    }));

    let content: string;
    let filename: string;

    if (format === 'csv') {
      content = this.convertToCSV(data);
      filename = 'logs_export.csv';
    } else {
      content = JSON.stringify(data, null, 2);
      filename = 'logs_export.json';
    }

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, filename);
  }

  private convertToCSV(data: any[]): string {
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header =>
          JSON.stringify(row[header] || '')
        ).join(',')
      )
    ];
    return csvRows.join('\n');
  }

  private cleanup() {
    if (this.updateSubscription) {
      this.updateSubscription.unsubscribe();
    }
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
    if (this.chart) {
      this.chart.destroy();
    }
  }
}