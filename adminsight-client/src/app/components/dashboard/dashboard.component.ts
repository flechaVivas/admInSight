import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { System } from '../../models';
import { SystemService } from '../../services/systems.service';
import { SshService } from '../../services/ssh.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  selectedSystem: System | null = null;
  selectedOption: string | null = 'System Information';
  isLoggedIntoServer: boolean = false;
  sudoPassword: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private systemService: SystemService,
    private sshService: SshService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    const systemId = this.route.snapshot.paramMap.get('systemId');
    if (systemId) {
      this.systemService.getSystem(Number(systemId)).subscribe(system => {
        this.selectedSystem = system;
        this.isLoggedIntoServer = true;
      });
    } else {
      this.router.navigate(['/login-server']);
    }
  }

  onSystemSelected(system: System) {
    this.selectedSystem = system;
    this.isLoggedIntoServer = true;
  }

  onOptionSelected(option: string) {
    this.selectedOption = option;
    // Lógica para cargar los datos correspondientes a la opción seleccionada
  }
}