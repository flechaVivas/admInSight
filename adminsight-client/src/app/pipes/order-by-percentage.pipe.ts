import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'percentageOrder'
})
export class PercentageOrderPipe implements PipeTransform {
  transform<T>(items: T[], sortColumn: string, sortDirection: string): T[] {
    if (!items || !sortColumn) {
      return items;
    }

    const sortedItems = [...items].sort((a: any, b: any) => {
      const aValue = this.extractPercentageValue(a[sortColumn]);
      const bValue = this.extractPercentageValue(b[sortColumn]);

      if (aValue === null && bValue === null) {
        return 0;
      }
      if (aValue === null) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      if (bValue === null) {
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

  private extractPercentageValue(percentageString: string | null): number | null {
    if (!percentageString) {
      return null;
    }

    const match = percentageString.match(/(\d+(\.\d+)?)\s*%/);
    if (!match) {
      return null;
    }

    return parseFloat(match[1]);
  }
}