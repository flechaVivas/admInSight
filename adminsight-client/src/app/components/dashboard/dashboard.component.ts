import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { System } from '../../models';
import { SystemService } from '../../services/systems.service';
import { SshService } from '../../services/ssh.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  @Output() optionSelected = new EventEmitter<Event>();

  selectedSystem: System | null = null;
  selectedOption: string | null = null;

  osInformation: any;
  hardwareInformation: any;
  // Agrega más propiedades para las demás opciones

  constructor(private route: ActivatedRoute,
    private systemService: SystemService,
    private sshService: SshService) { }

  ngOnInit() {
    const systemId = this.route.snapshot.paramMap.get('systemId');
    if (systemId) {
      this.systemService.getSystem(Number(systemId)).subscribe(system => {
        this.selectedSystem = system;
      });

    }
  }

  onOptionSelected(option: Event) {
    this.optionSelected.emit(option);
  }

  fetchData(option: string) {
    const commands = this.getCommandsForOption(option);
    // this.sshService.executeCommand(this.selectedSystem?.id, commands, ).subscribe(data => {
    //   this.updateDataForOption(option, data);
    // });
  }

  getCommandsForOption(option: string): string[] {
    switch (option) {
      case 'OS Information':
        return ['cat /etc/os-release', 'uname -r'];
      case 'Hardware Information':
        return ['lshw -short'];
      // Agrega más casos para las demás opciones
      default:
        return [];
    }
  }

  updateDataForOption(option: string, data: any) {
    switch (option) {
      case 'OS Information':
        this.osInformation = data;
        break;
      case 'Hardware Information':
        this.hardwareInformation = data;
        break;
      // Agrega más casos para las demás opciones
    }
  }
}