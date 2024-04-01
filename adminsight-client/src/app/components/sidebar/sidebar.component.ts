import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage.service';
import { System } from '../../models';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  userData: any;
  @Output() systemSelected = new EventEmitter<System>();
  @Output() registerFormToggled = new EventEmitter<boolean>();

  constructor(
    private authService: AuthService,
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

  logoutUser(): void {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }

  toggleRegisterForm() {
    this.registerFormToggled.emit(true);
  }

}