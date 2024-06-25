import { Pipe, PipeTransform } from '@angular/core';
import { NetworkConnection } from './network.component';

@Pipe({
  name: 'filterNetwork'
})
export class FilterNetworkPipe implements PipeTransform {
  transform(connections: NetworkConnection[], searchTerm: string, protocolFilter: string, stateFilter: string): NetworkConnection[] {
    if (!connections) return [];

    return connections.filter(connection => {
      const matchesSearch = !searchTerm ||
        Object.values(connection).some(value =>
          value.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchesProtocol = !protocolFilter ||
        connection.protocol.toLowerCase() === protocolFilter.toLowerCase();

      const matchesState = !stateFilter ||
        connection.state.toLowerCase() === stateFilter.toLowerCase();

      return matchesSearch && matchesProtocol && matchesState;
    });
  }
}