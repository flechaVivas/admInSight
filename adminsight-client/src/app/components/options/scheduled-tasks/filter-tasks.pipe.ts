import { Pipe, PipeTransform } from '@angular/core';
import { ScheduledTask } from './scheduled-tasks.service';

@Pipe({
  name: 'filterTasks'
})
export class FilterTasksPipe implements PipeTransform {
  transform(tasks: ScheduledTask[], searchTerm: string, activeFilter: string): ScheduledTask[] {
    if (!tasks) {
      return [];
    }

    return tasks.filter(task => {
      const searchMatch = task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = activeFilter === '' ||
        (activeFilter === 'active' && task.status === 'active') ||
        (activeFilter === 'inactive' && task.status === 'inactive');

      return searchMatch && statusMatch;
    });
  }
}