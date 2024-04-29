import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { LocalStorageService } from './local-storage.service';
import { HttpErrorService } from './http-error.service';

@Injectable({
  providedIn: 'root'
})
export class SshService {
  private apiLoginUrl = 'http://localhost:8000/api/login-server/';
  private apiExecuteUrl = 'http://localhost:8000/api/execute-command/';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private localStorage: LocalStorageService,
    private httpErrorService: HttpErrorService
  ) { }

  login(systemId: number, username: string, password: string): Observable<any> {
    const body = {
      system_id: systemId,
      username: username,
      password: password
    };
    return this.http.post<any>(this.apiLoginUrl, body).pipe(
      catchError((error: HttpErrorResponse) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  executeCommand(systemId: number, commands: string[], sudoPassword?: string): Observable<any> {
    const headers = new HttpHeaders({
      'ssh-token': this.authService.getSshToken() || ''
    });

    const body = {
      system_id: systemId,
      commands: commands,
      sudo_password: sudoPassword
    };

    return this.http.post<any>(this.apiExecuteUrl, body, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  handleError(error: HttpErrorResponse): Observable<never> {
    const errorType = this.httpErrorService.handleError(error);
    return throwError({ error: error, errorType: errorType });
  }

  logoutServer(): void {
    this.localStorage.remove('sshToken');
  }
}