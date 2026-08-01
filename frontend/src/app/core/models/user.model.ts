export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'customer' | 'mechanic' | 'admin';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
