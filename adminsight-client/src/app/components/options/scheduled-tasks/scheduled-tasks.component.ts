import { Component, OnInit } from '@angular/core';
import { ScheduledTasksService, ScheduledTask } from './scheduled-tasks.service';
import { ScheduledTaskNewComponent } from './scheduled-task-new/scheduled-task-new.component';

@Component({
  selector: 'app-scheduled-tasks',
  templateUrl: './scheduled-tasks.component.html',
})
export class ScheduledTasksComponent implements OnInit {
  scheduledTasks: ScheduledTask[] = [];
  showModal: boolean = false;
  selectedTask: ScheduledTask | null = null;

  constructor(
    private scheduledTasksService: ScheduledTasksService,
  ) { }

  ngOnInit(): void {
    this.fetchScheduledTasks();
  }

  fetchScheduledTasks(): void {
    this.scheduledTasksService.getScheduledTasks().subscribe(
      (tasks) => {
        this.scheduledTasks = tasks;
      },
      (error) => {
        console.error('Error al obtener las tareas programadas:', error);
      }
    );
  }

  openCreateTaskModal(): void {
    this.selectedTask = null;
    this.showModal = true;
  }

  openEditTaskModal(task: ScheduledTask): void {
    this.selectedTask = { ...task };
    this.showModal = true;
  }

  onSubmit(task: ScheduledTask): void {
    if (this.selectedTask) {
      // Editar tarea existente
      this.scheduledTasksService.createOrUpdateScheduledTask(task).subscribe(
        () => {
          this.fetchScheduledTasks();
          this.showModal = false;
        },
        (error) => {
          console.error('Error al actualizar la tarea programada:', error);
        }
      );
    } else {
      // Crear nueva tarea
      this.scheduledTasksService.createOrUpdateScheduledTask(task).subscribe(
        () => {
          this.fetchScheduledTasks();
          this.showModal = false;
        },
        (error) => {
          console.error('Error al crear la tarea programada:', error);
        }
      );
    }
  }

  onCancel(): void {
    this.showModal = false;
  }

  deleteScheduledTask(taskName: string): void {
    if (confirm(`¿Estás seguro de que deseas eliminar la tarea "${taskName}"?`)) {
      this.scheduledTasksService.deleteScheduledTask(taskName).subscribe(
        () => {
          this.fetchScheduledTasks();
        },
        (error) => {
          console.error('Error al eliminar la tarea programada:', error);
        }
      );
    }
  }

  toggleScheduledTaskStatus(task: ScheduledTask): void {
    const newStatus = task.status === 'active' ? 'inactive' : 'active';
    this.scheduledTasksService.toggleScheduledTaskStatus(task.name, newStatus).subscribe(
      () => {
        this.fetchScheduledTasks();
      },
      (error) => {
        console.error('Error al cambiar el estado de la tarea programada:', error);
      }
    );
  }

}