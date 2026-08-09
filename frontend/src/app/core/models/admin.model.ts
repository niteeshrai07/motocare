export interface DashboardOverview {
  totalUsers: number;
  totalCustomers: number;
  totalMechanics: number;
  totalAdmins: number;
  totalRepairShops: number;
  pendingShops: number;
  verifiedShops: number;
  rejectedShops: number;
  totalServiceRequests: number;
  pendingRequests: number;
  quotedRequests: number;
  acceptedRequests: number;
  inProgressRequests: number;
  completedRequests: number;
  rejectedRequests: number;
  cancelledRequests: number;
  expiredRequests: number;
  totalReviews: number;
  averagePlatformRating: number;
}

export interface DashboardStatistics {
  usersByRole: {
    customer: number;
    mechanic: number;
    admin: number;
  };
  shopsByStatus: {
    pending: number;
    verified: number;
    rejected: number;
  };
  requestsByStatus: {
    pending: number;
    quoted: number;
    accepted: number;
    in_progress: number;
    completed: number;
    rejected: number;
    cancelled: number;
    expired: number;
  };
  averagePlatformRating: number;
  totalReviews: number;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'mechanic' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUserListItem {}

export interface AdminRepairShopListItem {
  id: string;
  shopName: string;
  status: 'pending' | 'verified' | 'rejected';
  rating: number;
  totalReviews: number;
  vehicleTypesServiced?: string[];
  owner: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminRepairShopDetail extends AdminRepairShopListItem {}

import { ServiceRequestStatus, VehicleType } from './service-request.model';

export interface AdminServiceRequestListItem {
  id: string;
  status: ServiceRequestStatus;
  vehicleType: VehicleType;
  customer: {
    id: string;
    name: string;
  } | null;
  shop: {
    id: string;
    shopName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminReviewListItem {
  id: string;
  rating: number;
  comment: string | null;
  customer: {
    id: string;
    name: string;
  } | null;
  shop: {
    id: string;
    shopName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DashboardResponse {
  overview: DashboardOverview;
  statistics: DashboardStatistics;
}

export interface AdminUserListResponse {
  users: AdminUserListItem[];
  pagination: AdminPagination;
}

export interface AdminRepairShopListResponse {
  repairShops: AdminRepairShopListItem[];
  pagination: AdminPagination;
}

export interface AdminServiceRequestListResponse {
  serviceRequests: AdminServiceRequestListItem[];
  pagination: AdminPagination;
}

export interface AdminReviewListResponse {
  reviews: AdminReviewListItem[];
  pagination: AdminPagination;
}
