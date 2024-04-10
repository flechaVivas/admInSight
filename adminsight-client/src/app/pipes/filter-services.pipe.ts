import { Pipe, PipeTransform } from '@angular/core';
import { Service } from '../components/options/services/services.component';

@Pipe({
  name: 'filterServices'
})
export class FilterServicesPipe implements PipeTransform {
  transform(services: Service[], searchTerm: string, activeFilter: string, enabledFilter: string): Service[] {
    let filteredServices = services;

    if (searchTerm) {
      filteredServices = filteredServices.filter(service =>
        service.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (activeFilter) {
      filteredServices = filteredServices.filter(service => {
        if (activeFilter === 'active') {
          return service.status.toLowerCase().includes('active') && !service.status.toLowerCase().includes('inactive');
        } else if (activeFilter === 'inactive') {
          return service.status.toLowerCase().includes('inactive');
        }
        return true;
      });
    }


    if (enabledFilter) {
      filteredServices = filteredServices.filter(service => {
        if (enabledFilter === 'enabled') {
          return service.status.toLowerCase().includes('enabled');
        } else if (enabledFilter === 'disabled') {
          return service.status.toLowerCase().includes('disabled');
        }
        return true;
      });
    }

    return filteredServices;
  }
}