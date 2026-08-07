import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import {
  Notification,
  NotificationListResponse,
  NotificationResponse,
} from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly apiUrl = environment.apiUrl;
  readonly unreadCount = signal<number>(0);

  constructor(private http: HttpClient) {}

  list(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    archived?: boolean;
    sort?: 'newest' | 'oldest';
  }): Observable<ApiResponse<NotificationListResponse>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.unreadOnly !== undefined) httpParams = httpParams.set('unreadOnly', String(params.unreadOnly));
    if (params?.archived !== undefined) httpParams = httpParams.set('archived', String(params.archived));
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<ApiResponse<NotificationListResponse>>(
      `${this.apiUrl}/notifications`,
      { params: httpParams },
    );
  }

  getById(id: string): Observable<ApiResponse<NotificationResponse>> {
    return this.http.get<ApiResponse<NotificationResponse>>(
      `${this.apiUrl}/notifications/${id}`,
    );
  }

  markAsRead(id: string): Observable<ApiResponse<NotificationResponse>> {
    return this.http.patch<ApiResponse<NotificationResponse>>(
      `${this.apiUrl}/notifications/${id}/read`,
      {},
    );
  }

  markAllAsRead(): Observable<ApiResponse<{ updatedCount: number }>> {
    return this.http.patch<ApiResponse<{ updatedCount: number }>>(
      `${this.apiUrl}/notifications/read-all`,
      {},
    );
  }

  archive(id: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/notifications/${id}`,
    );
  }

  refreshUnreadCount(): void {
    this.list({ page: 1, limit: 1 }).subscribe({
      next: (response) => {
        if (response.success && response.data?.pagination) {
          this.unreadCount.set(response.data.pagination.unreadCount);
        }
      },
      error: () => {
        this.unreadCount.set(0);
      },
    });
  }
}
