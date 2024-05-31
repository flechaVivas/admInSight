import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ScheduledTask } from '../scheduled-tasks.service';

@Component({
  selector: 'app-scheduled-task-new',
  templateUrl: './scheduled-task-new.component.html',
})
export class ScheduledTaskNewComponent {
  @Input() task: ScheduledTask | null = null;
  @Output() submit = new EventEmitter<ScheduledTask>();
  @Output() cancel = new EventEmitter();

  name: string = '';
  description: string = '';
  command: string = '';
  minute: string = '*';
  hour: string = '*';
  dayOfMonth: string = '*';
  month: string = '*';
  dayOfWeek: string = '*';
  user: string = 'root';
  status: 'active' | 'inactive' = 'active';

  ngOnInit(): void {
    if (this.task) {
      this.name = this.task.name;
      this.description = this.task.description;
      this.command = this.task.command;
      this.user = this.task.user;
      this.status = this.task.status;

      const cronParts = this.task.cron.split(' ');
      this.minute = cronParts[0];
      this.hour = cronParts[1];
      this.dayOfMonth = cronParts[2];
      this.month = cronParts[3];
      this.dayOfWeek = cronParts[4];
    }
  }

  onSubmit(): void {
    const cron = `${this.minute} ${this.hour} ${this.dayOfMonth} ${this.month} ${this.dayOfWeek}`;
    const task: ScheduledTask = {
      name: this.name,
      description: this.description,
      command: this.command,
      cron: cron,
      user: this.user,
      status: this.status,
      lastRun: null,
      nextRun: null
    };

    this.submit.emit(task);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}