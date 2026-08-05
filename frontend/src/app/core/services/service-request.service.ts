import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import {
  ServiceRequest,
  ServiceRequestListResponse,
  ServiceRequestDetailResponse,
  ServiceRequestStatus,
  CreateServiceRequestPayload,
  QuoteServiceRequestPayload,
  RejectServiceRequestPayload,
  NearbyShopsResponse,
} from '../models/service-request.model';
import {
  Review,
  ReviewResponse,
  CreateReviewPayload,
  UpdateReviewPayload,
} from '../models/review.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ServiceRequestService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private buildParams(params?: {
    status?: ServiceRequestStatus;
    page?: number;
    limit?: number;
  }): HttpParams {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.page) httpParams = httpParams.set('page', String(params.page));
    if (params?.limit) httpParams = httpParams.set('limit', String(params.limit));
    return httpParams;
  }

  getMyServiceRequests(params?: {
    status?: ServiceRequestStatus;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<ServiceRequestListResponse>> {
    return this.http.get<ApiResponse<ServiceRequestListResponse>>(
      `${this.apiUrl}/service-requests/my`,
      { params: this.buildParams(params) },
    );
  }

   getShopServiceRequests(params?: {
    status?: ServiceRequestStatus;
    page?: number;
    limit?: number;
  }): Observable<ApiResponse<ServiceRequestListResponse>> {
    return this.http.get<ApiResponse<ServiceRequestListResponse>>(
      `${this.apiUrl}/service-requests/shop`,
      { params: this.buildParams(params) },
    );
  }

  getById(id: string): Observable<ApiResponse<ServiceRequestDetailResponse>> {
    return this.http.get<ApiResponse<ServiceRequestDetailResponse>>(
      `${this.apiUrl}/service-requests/${id}`,
    );
  }

  getNearbyShops(params: {
    lng: number;
    lat: number;
    vehicleType?: string;
    radius?: number;
  }): Observable<ApiResponse<NearbyShopsResponse>> {
    let httpParams = new HttpParams()
      .set('lng', String(params.lng))
      .set('lat', String(params.lat));
    if (params.vehicleType) {
      httpParams = httpParams.set('vehicleType', params.vehicleType);
    }
    if (params.radius) {
      httpParams = httpParams.set('radius', String(params.radius));
    }
    return this.http.get<ApiResponse<NearbyShopsResponse>>(
      `${this.apiUrl}/repair-shops/nearby`,
      { params: httpParams },
    );
  }

  create(payload: CreateServiceRequestPayload): Observable<ApiResponse<ServiceRequestDetailResponse>> {
    return this.http.post<ApiResponse<ServiceRequestDetailResponse>>(
      `${this.apiUrl}/service-requests`,
      payload,
    );
  }

  accept(id: string): Observable<ApiResponse<ServiceRequestDetailResponse>> {
    return this.http.patch<ApiResponse<ServiceRequestDetailResponse>>(
      `${this.apiUrl}/service-requests/${id}/accept`,
      {},
    );
  }

  cancel(id: string): Observable<ApiResponse<ServiceRequestDetailResponse>> {
    return this.http.patch<ApiResponse<ServiceRequestDetailResponse>>(
      `${this.apiUrl}/service-requests/${id}/cancel`,
      {},
    );
  }

  quote(id: string, payload: QuoteServiceRequestPayload): Observable<ApiResponse<ServiceRequestDetailResponse>> {
    return this.http.patch<ApiResponse<ServiceRequestDetailResponse>>(
      `${this.apiUrl}/service-requests/${id}/quote`,
      payload,
    );
  }

  reject(id: string, payload?: RejectServiceRequestPayload): Observable<ApiResponse<ServiceRequestDetailResponse>> {
    return this.http.patch<ApiResponse<ServiceRequestDetailResponse>>(
      `${this.apiUrl}/service-requests/${id}/reject`,
      payload ?? {},
    );
  }

  startWork(id: string): Observable<ApiResponse<ServiceRequestDetailResponse>> {
    return this.http.patch<ApiResponse<ServiceRequestDetailResponse>>(
      `${this.apiUrl}/service-requests/${id}/start`,
      {},
    );
  }

  completeWork(id: string): Observable<ApiResponse<ServiceRequestDetailResponse>> {
    return this.http.patch<ApiResponse<ServiceRequestDetailResponse>>(
      `${this.apiUrl}/service-requests/${id}/complete`,
      {},
    );
  }

  createReview(requestId: string, payload: CreateReviewPayload): Observable<ApiResponse<ReviewResponse>> {
    return this.http.post<ApiResponse<ReviewResponse>>(
      `${this.apiUrl}/service-requests/${requestId}/review`,
      payload,
    );
  }

  getReview(requestId: string): Observable<ApiResponse<ReviewResponse>> {
    return this.http.get<ApiResponse<ReviewResponse>>(
      `${this.apiUrl}/service-requests/${requestId}/review`,
    );
  }

  updateReview(requestId: string, payload: UpdateReviewPayload): Observable<ApiResponse<ReviewResponse>> {
    return this.http.patch<ApiResponse<ReviewResponse>>(
      `${this.apiUrl}/service-requests/${requestId}/review`,
      payload,
    );
  }

  deleteReview(requestId: string): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/service-requests/${requestId}/review`,
    );
  }
}
