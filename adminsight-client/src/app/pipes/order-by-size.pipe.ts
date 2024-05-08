import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'orderBySize'
})
export class OrderBySizePipe implements PipeTransform {
  transform<T>(items: T[], sortColumn: string, sortDirection: string): T[] {
    if (!items || !sortColumn) {
      return items;
    }

    const sortedItems = [...items].sort((a: any, b: any) => {
      const aValue = this.extractSizeValue(a[sortColumn]);
      const bValue = this.extractSizeValue(b[sortColumn]);

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

  private extractSizeValue(sizeString: string | null): number | null {
    if (!sizeString) {
      return null;
    }

    const match = sizeString.match(/(\d+(\.\d+)?)\s*(\w+)/);
    if (!match) {
      return null;
    }

    const value = parseFloat(match[1]);
    const unit = match[3].toUpperCase();

    switch (unit) {
      case 'BYTES':
        return value;
      case 'KB':
        return value * 1024;
      case 'MB':
        return value * 1024 * 1024;
      case 'GB':
        return value * 1024 * 1024 * 1024;
      case 'TB':
        return value * 1024 * 1024 * 1024 * 1024;
      default:
        return null;
    }
  }
}