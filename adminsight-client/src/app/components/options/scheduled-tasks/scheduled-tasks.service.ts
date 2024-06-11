import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { SshService } from '../../../services/ssh.service';
import { HttpErrorService } from '../../../services/http-error.service';
import { Router } from '@angular/router';
import * as cronParser from 'cron-parser';

export interface ScheduledTask {
  name: string;
  description: string;
  command: string;
  cron: string;
  user: string;
  status: 'active' | 'inactive';
  lastRun: Date | null;
  nextRun: Date | null;
  showDetails?: boolean;
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

        let currentTask: ScheduledTask | null = null;

        for (const line of lines) {
          if (line.startsWith('# Name:')) {
            if (currentTask) {
              tasks.push(currentTask);
            }
            currentTask = {
              name: line.replace('# Name: ', '').trim(),
              description: '',
              command: '',
              cron: '',
              user: '',
              status: 'inactive',
              lastRun: null,
              nextRun: null
            };
          } else if (line.startsWith('# Description:') && currentTask) {
            currentTask.description = line.replace('# Description: ', '').trim();
          } else if (line.trim().length > 0) {
            const isCommented = line.startsWith('#');
            const lineContent = isCommented ? line.slice(1).trim() : line.trim();

            const cronParts = lineContent.split(' ');
            const cron = cronParts.slice(0, 5).join(' ');
            const user = cronParts[5];
            const command = cronParts.slice(6).join(' ');

            if (currentTask) {
              currentTask.cron = cron;
              currentTask.user = user;
              currentTask.command = command;
              currentTask.status = isCommented ? 'inactive' : 'active';
              currentTask.lastRun = this.calculateLastRun(cron);
              currentTask.nextRun = this.calculateNextRun(cron);

              tasks.push(currentTask);
              currentTask = null;
            } else {
              tasks.push({
                name: '',
                description: '',
                cron: cron,
                user: user,
                command: command,
                status: isCommented ? 'inactive' : 'active',
                lastRun: this.calculateLastRun(cron),
                nextRun: this.calculateNextRun(cron)
              });
            }
          }
        }

        if (currentTask) {
          tasks.push(currentTask);
        }

        return tasks;
      })
    );
  }

  createOrUpdateScheduledTask(task: ScheduledTask): Observable<any> {
    const commands = [
      `crontab -l > mycron`,
      `echo "# Name: ${task.name}" >> mycron`,
      `echo "# Description: ${task.description}" >> mycron`,
      `echo "${task.cron} ${task.user} ${task.command}" >> mycron`,
      `crontab mycron`,
      `rm mycron`
    ];
    return this.sshService.executeCommand(this.systemId, commands).pipe(
      catchError((error) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  deleteScheduledTask(taskName: string): Observable<any> {
    const commands = [`crontab -l | sed -e '/# Name: ${taskName}/,/^$/d' | crontab -`];
    return this.sshService.executeCommand(this.systemId, commands).pipe(
      catchError((error) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  toggleScheduledTaskStatus(task: ScheduledTask): Observable<any> {
    const commands = [
      `crontab -l > mycron`,
      `sed -i "\\|${task.command}| ${task.status === 'active' ? 's|^#||' : 's|^|#|'}" mycron`,
      `crontab mycron`,
      `rm mycron`
    ];

    return this.sshService.executeCommand(this.systemId, commands).pipe(
      catchError((error) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  calculateLastRun(cronExpression: string): Date {
    const interval = cronParser.parseExpression(cronExpression);
    return interval.prev().toDate();
  }

  calculateNextRun(cronExpression: string): Date {
    const interval = cronParser.parseExpression(cronExpression);
    return interval.next().toDate();
  }
}
