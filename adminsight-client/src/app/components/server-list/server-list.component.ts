import { Component } from '@angular/core';
import { System } from '../../models';
import { SystemService } from '../../services/systems.service';

@Component({
  selector: 'app-server-list',
  templateUrl: './server-list.component.html',
  styleUrl: './server-list.component.css'
})
export class ServerListComponent {

  systems: System[] = [];

  constructor(private systemService: SystemService) { }

  ngOnInit() {
    this.systemService.getSystems().subscribe(
      (systems) => this.systems = systems,
      (error) => console.log(error)
    );
  }


}
