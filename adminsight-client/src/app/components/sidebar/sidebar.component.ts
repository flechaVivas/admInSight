import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
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
  @Input() isLoggedIntoServer: boolean = false;
  @Input() selectedSystem: System | null = null;
  @Output() systemSelected = new EventEmitter<System>();
  @Output() optionSelected = new EventEmitter<string>();

  @Output() registerFormToggled = new EventEmitter<boolean>();

  @Output() userProfileClicked = new EventEmitter<void>();

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
  }

  toggleRegisterForm() {
    this.registerFormToggled.emit(true);
  }

  toggleUserProfile() {
    this.userProfileClicked.emit();
  }

  onSystemSelected(system: System) {
    this.selectedSystem = system;
    this.systemSelected.emit(system);
  }

  onOptionSelected(option: string) {
    this.optionSelected.emit(option);
  }

  logoutUser(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}