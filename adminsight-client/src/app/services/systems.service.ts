import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { System } from '../models';

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private apiUrl = 'http://127.0.0.1:8000/api/systems/';
  private registerServerUrl = 'http://127.0.0.1:8000/api/register-server/';

  constructor(private http: HttpClient) { }

  getSystems(): Observable<System[]> {
    return this.http.get<System[]>(this.apiUrl);
  }

  getSystem(id: number): Observable<System> {
    const url = `${this.apiUrl}${id}/`;
    return this.http.get<System>(url);
  }

  createSystem(system: System): Observable<System> {
    return this.http.post<System>(this.apiUrl, system);
  }

  registerServer(formData: any): Observable<any> {
    return this.http.post(this.registerServerUrl, formData);
  }

}