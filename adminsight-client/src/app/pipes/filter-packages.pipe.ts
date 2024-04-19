import { Pipe, PipeTransform } from '@angular/core';

interface PackageInfo {
  name: string;
  version: string;
  size: string;
  description: string;
}

@Pipe({
  name: 'filterPackages'
})
export class FilterPackagesPipe implements PipeTransform {
  transform(packages: PackageInfo[], searchTerm: string): PackageInfo[] {
    if (!packages || !searchTerm) {
      return packages;
    }

    searchTerm = searchTerm.toLowerCase();

    return packages.filter(pkg =>
      (pkg.name && pkg.name.toLowerCase().includes(searchTerm)) ||
      (pkg.version && pkg.version.toLowerCase().includes(searchTerm)) ||
      (pkg.size && pkg.size.toLowerCase().includes(searchTerm)) ||
      (pkg.description && pkg.description.toLowerCase().includes(searchTerm))
    );
  }
}