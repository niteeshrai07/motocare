import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ApiValidationError } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An unexpected error occurred';

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 401) {
          errorMessage = 'Your session has expired. Please log in again.';
          this.authService.logout();
        } else if (error.status === 403) {
          errorMessage = 'You do not have permission to perform this action.';
        } else if (error.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (error.status === 500) {
          errorMessage = 'A server error occurred. Please try again later.';
        } else if (error.error?.errors?.length) {
          errorMessage = (error.error.errors as ApiValidationError[])
            .map((e) => e.message)
            .join('. ');
        }

        console.error(`HTTP Error ${error.status}:`, errorMessage);

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
