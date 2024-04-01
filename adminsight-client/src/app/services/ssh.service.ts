import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SshService {
  private apiUrl = 'http://localhost:8000/api/login-server/';

  constructor(private http: HttpClient) { }

  login(systemId: number, username: string, password: string): Observable<any> {
    const body = {
      system_id: systemId,
      username: username,
      password: password
    };
    return this.http.post<any>(this.apiUrl, body);
  }
}
