import { Injectable } from '@angular/core';
import { User } from '../auth';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserProfileService {

  constructor(
    private http: HttpClient
  ) { }


  getUser(userId: string | null): Observable<User> {
    return this.http.get<User>(`http://localhost:8000/api/users/${userId}/`)
  }

}
