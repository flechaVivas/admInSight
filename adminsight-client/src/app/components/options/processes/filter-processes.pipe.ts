import { Pipe, PipeTransform } from '@angular/core';
import { Process } from './processes.component';

@Pipe({
  name: 'filterProcesses'
})
export class FilterProcessesPipe implements PipeTransform {
  transform(processes: Process[], searchTerm: string, statusFilter: string, userFilter: string): Process[] {
    let filteredProcesses = processes;

    if (searchTerm) {
      filteredProcesses = filteredProcesses.filter(process =>
        process.pid.toString().includes(searchTerm) ||
        process.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      filteredProcesses = filteredProcesses.filter(process => process.status === statusFilter);
    }

    if (userFilter) {
      filteredProcesses = filteredProcesses.filter(process => process.user === userFilter);
    }

    return filteredProcesses;
  }
}