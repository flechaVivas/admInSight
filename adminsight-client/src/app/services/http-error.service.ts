import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorService {
  constructor(private router: Router) { }

  handleError(error: HttpErrorResponse) {
    if (error.status === 401) {
      confirm('Your session has expired. Please log in again.');
      this.router.navigate(['/login-server']);
    } else if (error.status === 403) {
      confirm('You do not have permission to access this resource.');
      this.router.navigate(['/login-server']);
    } else if (error.status === 404) {
      this.router.navigate(['/not-found']);
    } else {
      // Manejar otros errores según sea necesario
      console.error('Un error ha ocurrido:', error);
    }
  }
}