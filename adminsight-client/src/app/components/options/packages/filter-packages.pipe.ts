import { Pipe, PipeTransform } from '@angular/core';

interface PackageInfo {
  name: string;
  version: string;
  size: string;
  architecture: string;
  description: string;
  status?: string;
}

@Pipe({
  name: 'filterPackages'
})
export class FilterPackagesPipe implements PipeTransform {
  transform(packages: PackageInfo[], searchTerm: string, sizeFilter: 'installed' | 'uninstalled' | 'all' = 'all'): PackageInfo[] {
    if (!packages) {
      return [];
    }

    searchTerm = searchTerm.toLowerCase();

    const filteredPackages = packages.filter(pkg =>
      (pkg.name && pkg.name.toLowerCase().includes(searchTerm)) ||
      (pkg.version && pkg.version.toLowerCase().includes(searchTerm)) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchTerm))
    );

    if (sizeFilter === 'installed') {
      return filteredPackages.filter(pkg => this.isPackageInstalled(pkg.size));
    } else if (sizeFilter === 'uninstalled') {
      return filteredPackages.filter(pkg => !this.isPackageInstalled(pkg.size));
    }

    return filteredPackages;
  }

  private isPackageInstalled(sizeString: string): boolean {
    const match = sizeString.match(/(\d+(\.\d+)?)\s*(\w+)/);
    if (!match) {
      return false;
    }

    const value = parseFloat(match[1]);
    const unit = match[3].toUpperCase();

    if (unit === 'BYTES' && value === 0) {
      return false;
    }

    return true;
  }
}