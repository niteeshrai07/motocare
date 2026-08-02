import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ApiValidationError } from '../models/api-response.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        const authService = this.injector.get(AuthService);
        let errorMessage = 'An unexpected error occurred';

        if (error.status === 401) {
          if (!req.url.includes('/auth/login') && !req.url.includes('/auth/register')) {
            authService.logout();
          }
          errorMessage = error.error?.message || 'Your session has expired. Please log in again.';
        } else if (error.error?.errors?.length) {
          errorMessage = (error.error.errors as ApiValidationError[])
            .map((e) => e.message)
            .join('. ');
        } else if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 403) {
          if (req.url.includes('/auth/login')) {
            errorMessage = error.error?.message || 'You do not have permission to perform this action.';
          } else {
            errorMessage = 'You do not have permission to perform this action.';
          }
        } else if (error.status === 404) {
          errorMessage = 'The requested resource was not found.';
        } else if (error.status === 500) {
          errorMessage = 'A server error occurred. Please try again later.';
        }

        if (!environment.production) {
          console.error(`HTTP Error ${error.status}:`, errorMessage);
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
