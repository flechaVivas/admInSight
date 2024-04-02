// auth.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { LocalStorageService } from './local-storage.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly TOKEN_KEY = 'token';
  private readonly USER_DATA_KEY = 'userData';

  constructor(private http: HttpClient, private localStorage: LocalStorageService) { }

  // User Token

  setToken(token: string): void {
    localStorage.setItem('token', token);
  }
  getToken(): string | null {
    return this.localStorage.get(this.TOKEN_KEY);
  }
  login(email: string, password: string): Observable<any> {
    return this.http.post<any>('http://127.0.0.1:8000/api/login/', { email, password }).pipe(
      tap((response) => {
        this.localStorage.set(this.USER_DATA_KEY, response.user);
        this.localStorage.set(this.TOKEN_KEY, response.token);
      })
    );
  }
  setLoggedInUser(userData: any): void {
    localStorage.setItem('userData', JSON.stringify(userData));
  }
  register(email: string, username: string, password: string): Observable<any> {
    return this.http.post<any>('http://127.0.0.1:8000/api/register/', { email, username, password });
  }

  logout(): Observable<any> {
    return this.http.post<any>('http://127.0.0.1:8000/api/logout/', {}).pipe(
      tap(() => {
        localStorage.clear();
      })
    );
  }

  // SSH Token

  private readonly SSH_TOKEN_KEY = 'sshToken';

  setSshToken(token: string): void {
    this.localStorage.set(this.SSH_TOKEN_KEY, token);
  }

  getSshToken(): string | null {
    return this.localStorage.get(this.SSH_TOKEN_KEY);
  }

  isSshTokenValid(): boolean {
    const sshToken = this.getSshToken();
    // Aquí puedes agregar la lógica para verificar si el token SSH es válido
    // Por ejemplo, puedes hacer una solicitud al backend para validar el token
    return !!sshToken; // Retorna true si el token SSH no está vacío
  }

}
