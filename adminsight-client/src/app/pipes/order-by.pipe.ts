import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBy'
})
export class OrderByPipe implements PipeTransform {
  transform<T>(items: T[], sortColumn: string, sortDirection: string): T[] {
    if (!items || !sortColumn) {
      return items;
    }

    const sortedItems = [...items].sort((a: any, b: any) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

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