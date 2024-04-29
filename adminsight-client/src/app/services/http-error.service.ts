import { Injectable } from '@angular/core';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export enum ErrorType {
  InvalidCredentials,
  EmailAlreadyExists,
  UsernameAlreadyExists,
  InvalidSSHToken,
  InvalidSudoPassword,
  UserNotFound,
  ServerNotFound,
  Other
}

@Injectable({
  providedIn: 'root'
})
export class HttpErrorService implements HttpInterceptor {

  constructor() { }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const errorType = this.handleError(error);
          return throwError({ error: error, errorType: errorType });
        })
      );
  }

  handleError(error: HttpErrorResponse): ErrorType {
    if (error.error instanceof ErrorEvent) {
      // Error de cliente
      return ErrorType.Other;
    } else {
      // Error de servidor
      switch (error.status) {
        case 400:
          if (error.error.error_code === 'invalid_credentials') {
            return ErrorType.InvalidCredentials;
          } else if (error.error.error_code === 'email_already_exists') {
            return ErrorType.EmailAlreadyExists;
          } else if (error.error.error_code === 'username_already_exists') {
            return ErrorType.UsernameAlreadyExists;
          } else {
            return ErrorType.Other;
          }
        case 401:
          if (error.error.error_code === 'invalid_ssh_token') {
            return ErrorType.InvalidSSHToken;
          } else if (error.error.error_code === 'invalid_sudo_password') {
            return ErrorType.InvalidSudoPassword;
          } else {
            return ErrorType.Other;
          }
        case 404:
          if (error.error.error_code === 'user_not_found') {
            return ErrorType.UserNotFound;
          } else if (error.error.error_code === 'server_not_found') {
            return ErrorType.ServerNotFound;
          } else {
            return ErrorType.Other;
          }
        default:
          return ErrorType.Other;
      }
    }
  }
}