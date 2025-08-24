export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  hotel?: string; // Optional because super_admin doesn't have a hotel
  createdAt: string;
  updatedAt: string;
  __v?: number;
}