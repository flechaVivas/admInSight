import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SshService {
  private apiLoginUrl = 'http://localhost:8000/api/login-server/';
  private apiExecuteUrl = 'http://localhost:8000/api/execute-command/';

  constructor(private http: HttpClient, private authService: AuthService) { }

  login(systemId: number, username: string, password: string): Observable<any> {
    const body = {
      system_id: systemId,
      username: username,
      password: password
    };
    return this.http.post<any>(this.apiLoginUrl, body);
  }

  executeCommand(systemId: number, commands: string[], password: string, sudoPassword?: string): Observable<any> {
    const headers = new HttpHeaders({
      'ssh_token': this.authService.getSshToken() || ''
    });

    const body = {
      system_id: systemId,
      commands: commands,
      password: password,
      sudo_password: sudoPassword
    };

    return this.http.post<any>(this.apiExecuteUrl, body, { headers });
  }
}