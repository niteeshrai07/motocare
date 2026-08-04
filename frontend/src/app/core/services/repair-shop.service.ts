import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import {
  RepairShop,
  RepairShopResponse,
  CreateRepairShopPayload,
  UpdateRepairShopPayload,
} from '../models/repair-shop.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class RepairShopService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  create(payload: CreateRepairShopPayload): Observable<ApiResponse<RepairShopResponse>> {
    return this.http.post<ApiResponse<RepairShopResponse>>(
      `${this.apiUrl}/repair-shops`,
      payload,
    );
  }

  getMyShop(): Observable<ApiResponse<RepairShopResponse>> {
    return this.http.get<ApiResponse<RepairShopResponse>>(
      `${this.apiUrl}/repair-shops/me`,
    );
  }

  update(payload: UpdateRepairShopPayload): Observable<ApiResponse<RepairShopResponse>> {
    return this.http.patch<ApiResponse<RepairShopResponse>>(
      `${this.apiUrl}/repair-shops/me`,
      payload,
    );
  }
}
