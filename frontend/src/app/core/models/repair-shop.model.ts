export type RepairShopStatus = 'pending' | 'verified' | 'rejected';

export type VehicleType = 'two_wheeler' | 'four_wheeler';

export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number];
}

export interface RepairShop {
  id: string;
  shopName: string;
  vehicleTypesServiced: VehicleType[];
  location: GeoPoint;
  address: string;
  phone: string;
  description?: string;
  openingHours?: string;
  photoUrl?: string;
  rating: number;
  status: RepairShopStatus;
  createdAt: string;
  updatedAt: string;
}

export interface RepairShopResponse {
  repairShop: RepairShop;
}

export interface CreateRepairShopPayload {
  shopName: string;
  vehicleTypesServiced: VehicleType[];
  location: GeoPoint;
  address: string;
  phone: string;
  description?: string;
  openingHours?: string;
  photoUrl?: string;
}

export interface UpdateRepairShopPayload {
  shopName?: string;
  vehicleTypesServiced?: VehicleType[];
  location?: GeoPoint;
  address?: string;
  phone?: string;
  description?: string;
  openingHours?: string;
  photoUrl?: string;
}
