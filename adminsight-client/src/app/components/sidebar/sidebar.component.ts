import { Component, OnInit } from '@angular/core';
import { UserProfileService } from '../../services/user-profile.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../services/local-storage.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {
  userData: any;

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
}