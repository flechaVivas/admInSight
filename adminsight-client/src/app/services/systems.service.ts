import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { System } from '../models';
import { HttpErrorService } from './http-error.service';

@Injectable({
  providedIn: 'root'
})
export class SystemService {
  private apiUrl = 'http://127.0.0.1:8000/api/systems/';
  private registerServerUrl = 'http://127.0.0.1:8000/api/register-server/';

  constructor(private http: HttpClient, private httpErrorService: HttpErrorService) { }

  getSystems(): Observable<System[]> {
    return this.http.get<System[]>(this.apiUrl).pipe(
      catchError((error: HttpErrorResponse) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  getSystem(id: number): Observable<System> {
    const url = `${this.apiUrl}${id}/`;
    return this.http.get<System>(url).pipe(
      catchError((error: HttpErrorResponse) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  createSystem(system: System): Observable<System> {
    return this.http.post<System>(this.apiUrl, system).pipe(
      catchError((error: HttpErrorResponse) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  registerServer(formData: any): Observable<any> {
    return this.http.post(this.registerServerUrl, formData).pipe(
      catchError((error: HttpErrorResponse) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  deleteSystem(id: number): Observable<any> {
    const url = `${this.apiUrl}${id}/`;
    return this.http.delete(url).pipe(
      catchError((error: HttpErrorResponse) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }

  updateSystem(id: number, system: System): Observable<System> {
    const url = `${this.apiUrl}${id}/`;
    return this.http.put<System>(url, system).pipe(
      catchError((error: HttpErrorResponse) => {
        this.httpErrorService.handleError(error);
        return throwError(error);
      })
    );
  }
}