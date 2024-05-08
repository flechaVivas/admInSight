import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderByNumber'
})
export class OrderByNumberPipe implements PipeTransform {
  transform<T>(items: T[], sortColumn: string, sortDirection: string): T[] {
    if (!items || !sortColumn) {
      return items;
    }

    const sortedItems = [...items].sort((a: any, b: any) => {
      const aValue = parseFloat(a[sortColumn]?.toString() || '');
      const bValue = parseFloat(b[sortColumn]?.toString() || '');

      if (isNaN(aValue) && isNaN(bValue)) {
        return 0;
      }
      if (isNaN(aValue)) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      if (isNaN(bValue)) {
        return sortDirection === 'asc' ? -1 : 1;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sortedItems;
  }
}