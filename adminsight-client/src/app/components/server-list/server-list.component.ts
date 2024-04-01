import { Component } from '@angular/core';
import { System } from '../../models';
import { SystemService } from '../../services/systems.service';

@Component({
  selector: 'app-server-list',
  templateUrl: './server-list.component.html',
  styleUrls: ['./server-list.component.css']
})
export class ServerListComponent {
  systems: System[] = [];
  filteredSystems: System[] = [];
  showSearch: boolean = false;

  constructor(private systemService: SystemService) { }

  ngOnInit() {
    this.systemService.getSystems().subscribe(
      (systems) => {
        this.systems = systems;
        this.filteredSystems = systems;
      },
      (error) => console.log(error)
    );
  }

  toggleSearch() {
    this.showSearch = !this.showSearch;
  }

  filterServers(event: any) {
    const searchTerm = event.target.value.toLowerCase();
    this.filteredSystems = this.systems.filter(system =>
      system.name.toLowerCase().includes(searchTerm)
    );
  }
} 