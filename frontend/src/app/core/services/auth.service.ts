import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, firstValueFrom } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { LoginCredentials, RegisterCredentials } from '../models/auth.model';
import { User } from '../models/user.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private currentUser = signal<User | null>(null);

  readonly user = this.currentUser.asReadonly();

  constructor(private http: HttpClient, private router: Router) {}

  restoreSession(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      return Promise.resolve();
    }

    return firstValueFrom(this.getCurrentUser()).then(
      (response) => {
        if (response.success && response.data) {
          this.currentUser.set(response.data.user);
        }
      },
      () => {
        this.currentUser.set(null);
      }
    );
  }

  login(credentials: LoginCredentials): Observable<ApiResponse<{ user: User; token: string }>> {
    return this.http.post<ApiResponse<{ user: User; token: string }>>(
      `${this.apiUrl}/auth/login`,
      credentials
    );
  }

  register(credentials: RegisterCredentials): Observable<ApiResponse<{ user: User; token: string }>> {
    return this.http.post<ApiResponse<{ user: User; token: string }>>(
      `${this.apiUrl}/auth/register`,
      credentials
    );
  }

  getCurrentUser(): Observable<ApiResponse<{ user: User }>> {
    return this.http.get<ApiResponse<{ user: User }>>(`${this.apiUrl}/auth/me`);
  }

  logout(): void {
    localStorage.removeItem('token');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  persistSession(token: string, user: User | null): void {
    localStorage.setItem('token', token);
    this.currentUser.set(user);
  }
}