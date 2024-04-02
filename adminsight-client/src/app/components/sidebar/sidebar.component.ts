import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage.service';
import { System } from '../../models';
import { SystemService } from '../../services/systems.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  userData: any;
  isLoggedIntoServer: boolean = false;
  selectedSystem: System | null = null;
  @Output() systemSelected = new EventEmitter<System>();
  @Output() optionSelected = new EventEmitter<Event>();

  @Output() registerFormToggled = new EventEmitter<boolean>();


  constructor(
    private authService: AuthService,
    private systemService: SystemService,
    private router: Router,
    private localStorage: LocalStorageService
  ) { }

  ngOnInit(): void {
    const userData = this.localStorage.get('userData');
    if (userData) {
      this.userData = userData;
    } else {
      this.userData = null;
    }

    this.isLoggedIntoServer = this.authService.isSshTokenValid();
    if (this.isLoggedIntoServer) {
      const systemId = this.localStorage.get('selectedSystemId');
      if (systemId) {
        this.systemService.getSystem(systemId).subscribe(system => {
          this.selectedSystem = system;
        });
      }
    }
  }

  toggleRegisterForm() {
    this.registerFormToggled.emit(true);
  }

  onSystemSelected(system: System) {
    this.selectedSystem = system;
    this.systemSelected.emit(system);
  }
  onOptionSelected(option: Event) {
    this.optionSelected.emit(option);
  }

  logoutUser(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

}