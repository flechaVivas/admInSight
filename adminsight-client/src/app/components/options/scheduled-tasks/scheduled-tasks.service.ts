import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SshService } from '../../../services/ssh.service';
import { HttpErrorService } from '../../../services/http-error.service';
import { Router } from '@angular/router';

export interface ScheduledTask {
  name: string;
  description: string;
  command: string;
  cron: string;
  user: string;
  status: 'active' | 'inactive';
  lastRun: Date | null;
  nextRun: Date | null;
}

@Injectable({
  providedIn: 'root'
})
export class ScheduledTasksService {



  constructor(
    private sshService: SshService,
    private httpErrorService: HttpErrorService,
    private router: Router
  ) { }

  private systemId: number = Number(this.router.url.split('/')[2]);

  getScheduledTasks(): Observable<ScheduledTask[]> {
    const commands = ['crontab -l'];
    return this.sshService.executeCommand(this.systemId, commands).pipe(
      catchError((error) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      }),
      map((response: any) => {
        const output = response[commands[0]]?.stdout || '';
        const lines = output.trim().split('\n');
        const tasks: ScheduledTask[] = [];

        for (const line of lines) {
          const parts = line.split(' ', 6);
          const cron = parts.slice(0, 5).join(' ');
          const command = parts.slice(5).join(' ');

          // Obtener el usuario de la línea
          const user = command.split(' ')[0];
          const commandOnly = command.split(' ').slice(1).join(' ');

          // Parsear la última ejecución y próxima ejecución
          const lastRun = this.parseLastRun(cron);
          const nextRun = this.parseNextRun(cron);

          tasks.push({
            name: commandOnly.split(' ')[0], // Asumir que el primer argumento es el nombre de la tarea
            description: '', // La descripción no se puede obtener de crontab
            command: commandOnly,
            cron: cron,
            user: user,
            status: line.startsWith('#') ? 'inactive' : 'active',
            lastRun: lastRun,
            nextRun: nextRun
          });
        }

        return tasks;
      })
    );
  }

  createOrUpdateScheduledTask(task: ScheduledTask): Observable<any> {
    const commands = [`crontab -l > mycron && echo "${task.cron} ${task.user} ${task.command}" >> mycron && crontab mycron && rm mycron`];
    return this.sshService.executeCommand(this.systemId, commands).pipe(
      catchError((error) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  deleteScheduledTask(taskName: string): Observable<any> {
    const commands = [`crontab -l | grep -v "${taskName}" | crontab -`];
    return this.sshService.executeCommand(this.systemId, commands).pipe(
      catchError((error) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  toggleScheduledTaskStatus(taskName: string, status: 'active' | 'inactive'): Observable<any> {
    const commands = [`crontab -l | sed "s/^#\?${taskName}/${status === 'active' ? '' : '#'}${taskName}/" | crontab -`];
    return this.sshService.executeCommand(this.systemId, commands).pipe(
      catchError((error) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  private parseLastRun(cron: string): Date | null {
    // Implementa la lógica para parsear la última ejecución de la tarea basada en la expresión cron
    // Puedes utilizar librerías como 'cron' o 'node-cron' para calcular la última ejecución
    // Aquí se devuelve null como valor predeterminado
    return null;
  }

  private parseNextRun(cron: string): Date | null {
    // Implementa la lógica para parsear la próxima ejecución de la tarea basada en la expresión cron
    // Puedes utilizar librerías como 'cron' o 'node-cron' para calcular la próxima ejecución
    // Aquí se devuelve null como valor predeterminado
    return null;
  }
}