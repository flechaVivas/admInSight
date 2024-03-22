// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }

  login(email: string, password: string): Observable<any> {
    return this.http.post<any>('http://127.0.0.1:8000/api/login/', { email, password }).pipe(
      tap((response) => {
        this.setLoggedInUser(response);
      })
    );
  }
  setLoggedInUser(userData: any): void {
    localStorage.setItem('userData', JSON.stringify(userData));
  }
  register(email: string, username: string, password: string): Observable<any> {
    return this.http.post<any>('http://127.0.0.1:8000/api/register/', { email, username, password });
  }
}
