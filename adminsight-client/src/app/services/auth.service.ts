import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${this.getToken()}`
    });

    const body = {
      currentPassword: currentPassword,
      newPassword: newPassword
    };

    return this.http.post('http://127.0.0.1:8000/api/change-password/', body, { headers });
  }

  updateUserProfile(username: string, email: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${this.getToken()}`
    });

    const body = {
      username: username,
      email: email
    };

    return this.http.put('http://127.0.0.1:8000/api/update-profile/', body, { headers });
  }

  deleteAccount(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Token ${this.getToken()}`
    });

    return this.http.delete('http://127.0.0.1:8000/api/delete-account/', { headers });
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
    return !!sshToken; // Retorna true si el token SSH no está vacío
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`http://127.0.0.1:8000/api/forgot-password/`, { email });
  }

  resetPassword(uid: string, token: string, newPassword: string): Observable<any> {
    return this.http.post(`http://127.0.0.1:8000/api/reset-password/${uid}/${token}/`, { new_password: newPassword });
  }

}