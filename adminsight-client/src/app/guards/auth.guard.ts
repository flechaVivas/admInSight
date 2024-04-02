import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private router: Router, @Inject(PLATFORM_ID) private platformId: Object, private authService: AuthService) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    const isLoggedIn = isPlatformBrowser(this.platformId) ? !!localStorage.getItem('userData') : false;
    const isSshTokenValid = this.authService.isSshTokenValid();

    if (route.url.length > 0 && route.url[0].path === 'dashboard') {
      // Ruta para el dashboard de un sistema específico
      if (isLoggedIn && isSshTokenValid) {
        return true;
      } else if (!isLoggedIn) {
        this.router.navigateByUrl('/login');
      } else {
        // El usuario está autenticado pero el token SSH no es válido
        this.router.navigateByUrl('/ssh-login');
      }
      return false;
    } else {
      // Otras rutas
      if (isLoggedIn) {
        return true;
      } else {
        this.router.navigateByUrl('/login');
        return false;
      }
    }
  }
}