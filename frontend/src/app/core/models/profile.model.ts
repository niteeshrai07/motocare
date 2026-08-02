export interface ProfileRepairShop {
  id: string;
  shopName: string;
  status: 'pending' | 'verified' | 'rejected';
}

export interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'mechanic' | 'admin';
  createdAt: string;
  updatedAt: string;
  repairShop: ProfileRepairShop | null;
}

export interface ProfileResponse {
  profile: Profile;
}

export interface ProfileUpdatePayload {
  name?: string;
  phone?: string;
}
