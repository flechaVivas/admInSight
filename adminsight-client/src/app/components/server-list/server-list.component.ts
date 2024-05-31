import { Component, EventEmitter, Output } from '@angular/core';
import { System } from '../../models';
import { SystemService } from '../../services/systems.service';

@Component({
  selector: 'app-server-list',
  templateUrl: './server-list.component.html',
  styleUrl: './server-list.component.css',
})
export class ServerListComponent {
  systems: System[] = [];
  filteredSystems: System[] = [];
  showSearch: boolean = false;
  selectedSystem: System | null = null;
  editingSystem: System | null = null;
  editingSystemName: string = '';

  showDeleteModal: boolean = false;
  deletingSystem: System | null = null;

  @Output() systemSelected = new EventEmitter<System>();

  constructor(private systemService: SystemService) { }

  ngOnInit() {
    this.fetchSystems();
  }

  fetchSystems() {
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

  selectSystem(system: System) {
    this.selectedSystem = system;
    this.systemSelected.emit(system);
  }

  isEditingSystemName(system: System): boolean {
    return this.editingSystem?.id === system.id;
  }

  editSystemName(system: System) {
    this.editingSystem = system;
    this.editingSystemName = system.name;
  }

  saveSystemName(system: System) {
    if (this.editingSystemName.trim() !== '') {
      system.name = this.editingSystemName.trim();
      this.systemService.updateSystem(system.id, system).subscribe(
        () => {
          this.editingSystem = null;
          this.editingSystemName = '';
          this.fetchSystems();
        },
        (error) => console.log(error)
      );
    } else {
      this.editingSystem = null;
      this.editingSystemName = '';
    }
  }

  deleteSystem(system: System) {
    this.openDeleteModal(system);
  }

  cancelDelete() {
    this.showDeleteModal = false;
    this.deletingSystem = null;
  }

  openDeleteModal(system: System) {
    this.deletingSystem = system;
    this.showDeleteModal = true;
  }

  confirmDelete() {
    if (this.deletingSystem) {
      this.systemService.deleteSystem(this.deletingSystem.id).subscribe(
        () => {
          this.fetchSystems();
          this.showDeleteModal = false;
          this.deletingSystem = null;
        },
        (error) => console.log(error)
      );
    }
  }

}