import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import {
  DashboardResponse,
  AdminUserListResponse,
  AdminUserDetail,
  AdminRepairShopListResponse,
  AdminRepairShopDetail,
  AdminServiceRequestListResponse,
  AdminReviewListResponse,
} from '../models/admin.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getDashboard(): Observable<ApiResponse<DashboardResponse>> {
    return this.http.get<ApiResponse<DashboardResponse>>(
      `${this.apiUrl}/admin/dashboard`
    );
  }

  getAllUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    sort?: 'newest' | 'oldest';
  }): Observable<ApiResponse<AdminUserListResponse>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.role) httpParams = httpParams.set('role', params.role);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<ApiResponse<AdminUserListResponse>>(
      `${this.apiUrl}/admin/users`,
      { params: httpParams }
    );
  }

  getUserById(id: string): Observable<ApiResponse<{ user: AdminUserDetail }>> {
    return this.http.get<ApiResponse<{ user: AdminUserDetail }>>(
      `${this.apiUrl}/admin/users/${id}`
    );
  }

  activateUser(id: string): Observable<ApiResponse<{ user: AdminUserDetail }>> {
    return this.http.patch<ApiResponse<{ user: AdminUserDetail }>>(
      `${this.apiUrl}/admin/users/${id}/activate`,
      {}
    );
  }

  deactivateUser(id: string): Observable<ApiResponse<{ user: AdminUserDetail }>> {
    return this.http.patch<ApiResponse<{ user: AdminUserDetail }>>(
      `${this.apiUrl}/admin/users/${id}/deactivate`,
      {}
    );
  }

  getAllRepairShops(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sort?: 'newest' | 'oldest';
  }): Observable<ApiResponse<AdminRepairShopListResponse>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<ApiResponse<AdminRepairShopListResponse>>(
      `${this.apiUrl}/admin/repair-shops`,
      { params: httpParams }
    );
  }

  getRepairShopDetail(
    id: string
  ): Observable<ApiResponse<{ repairShop: AdminRepairShopDetail }>> {
    return this.http.get<ApiResponse<{ repairShop: AdminRepairShopDetail }>>(
      `${this.apiUrl}/admin/repair-shops/${id}`
    );
  }

  verifyRepairShop(id: string): Observable<ApiResponse<{ repairShop: AdminRepairShopDetail }>> {
    return this.http.patch<ApiResponse<{ repairShop: AdminRepairShopDetail }>>(
      `${this.apiUrl}/admin/repair-shops/${id}/verify`,
      {}
    );
  }

  rejectRepairShop(id: string): Observable<ApiResponse<{ repairShop: AdminRepairShopDetail }>> {
    return this.http.patch<ApiResponse<{ repairShop: AdminRepairShopDetail }>>(
      `${this.apiUrl}/admin/repair-shops/${id}/reject`,
      {}
    );
  }

  getAllServiceRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
    sort?: 'newest' | 'oldest';
  }): Observable<ApiResponse<AdminServiceRequestListResponse>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<ApiResponse<AdminServiceRequestListResponse>>(
      `${this.apiUrl}/admin/service-requests`,
      { params: httpParams }
    );
  }

  getServiceRequestDetail(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/admin/service-requests/${id}`
    );
  }

  getAllReviews(params?: {
    page?: number;
    limit?: number;
    search?: string;
    sort?: 'newest' | 'oldest' | 'highest' | 'lowest';
  }): Observable<ApiResponse<AdminReviewListResponse>> {
    let httpParams = new HttpParams();
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    if (params?.search) httpParams = httpParams.set('search', params.search);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);

    return this.http.get<ApiResponse<AdminReviewListResponse>>(
      `${this.apiUrl}/admin/reviews`,
      { params: httpParams }
    );
  }

  getReviewDetail(id: string): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/admin/reviews/${id}`
    );
  }
}
