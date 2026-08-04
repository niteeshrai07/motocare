export type ServiceRequestStatus =
  | 'pending'
  | 'quoted'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'expired';

export type VehicleType = 'two_wheeler' | 'four_wheeler';

export interface ServiceRequestCustomerSummary {
  id: string;
  name: string;
  phone?: string;
}

export interface ServiceRequestShopSummary {
  id: string;
  shopName: string;
  phone?: string;
}

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface ServiceRequest {
  id: string;
  vehicleType: VehicleType;
  issueDescription: string;
  location: GeoPoint;
  status: ServiceRequestStatus;
  estimatedCost: number | null;
  estimatedDuration: string | null;
  mechanicNotes: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  customer: ServiceRequestCustomerSummary;
  shop: ServiceRequestShopSummary;
}

export interface ServiceRequestDetailResponse {
  serviceRequest: ServiceRequest;
}

export interface CreateServiceRequestPayload {
  shopId: string;
  vehicleType: VehicleType;
  issueDescription: string;
  location: GeoPoint;
}

export interface QuoteServiceRequestPayload {
  estimatedCost: number;
  estimatedDuration: string;
  mechanicNotes?: string;
}

export interface RejectServiceRequestPayload {
  mechanicNotes?: string;
}

export interface RepairShopSummary {
  id: string;
  shopName: string;
  vehicleTypesServiced: VehicleType[];
  address: string;
  phone?: string;
  rating?: number;
}

export interface NearbyShopsResponse {
  repairShops: RepairShopSummary[];
  pagination: {
    page: number;
    limit: number;
  };
}


export interface ServiceRequestListResponse {
  serviceRequests: ServiceRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
