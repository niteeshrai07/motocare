import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { ProfileResponse, ProfileUpdatePayload } from '../models/profile.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<ProfileResponse>> {
    return this.http.get<ApiResponse<ProfileResponse>>(`${this.apiUrl}/profile`);
  }

  updateProfile(payload: ProfileUpdatePayload): Observable<ApiResponse<ProfileResponse>> {
    return this.http.patch<ApiResponse<ProfileResponse>>(`${this.apiUrl}/profile`, payload);
  }

  changePassword(current: string, newPassword: string): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/profile/password`, {
      currentPassword: current,
      newPassword: newPassword,
    });
  }

  deactivateAccount(): Observable<ApiResponse<null>> {
    return this.http.patch<ApiResponse<null>>(`${this.apiUrl}/profile/deactivate`, {});
  }
}
