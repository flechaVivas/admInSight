import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderByDate'
})
export class OrderByDatePipe<T extends { [key: string]: any }> implements PipeTransform {
  transform(value: T[], property: string, direction: 'asc' | 'desc' = 'asc'): T[] {
    if (!value || !property) {
      return value;
    }

    const sortedValue = [...value];
    sortedValue.sort((a, b) => {
      const aValue = (a as any)[property];
      const bValue = (b as any)[property];

      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      } else if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      } else {
        return 0;
      }
    });

    return sortedValue;
  }
}