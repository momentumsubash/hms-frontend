// types/hotelTypes.ts
import type { WebsiteContent, SEOData } from './website';

export enum LicenseStatus {
  Active = 'active',
  Expired = 'expired',
  Pending = 'pending'
}

export interface HotelAddress {
  street?: string;
  area?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface HotelContact {
  phone?: string;
  reception?: string;
  email?: string;
  website?: string;
}

export interface Author {
  _id: string;
  name: string;
}

export interface HotelNote {
  _id?: string;
  text: string;
  author: Author;
  createdAt: string;
}

export interface HotelLicense {
  licenseNumber?: string;
  expiryDate?: string;
  licenseDocument?: string;
  status?: LicenseStatus;
}

export interface NotificationRecipient {
  email: string;
  name?: string;
  role?: string;
  active: boolean;
  addedAt?: string;
}

export interface DailyReportSettings {
  enabled: boolean;
  time: string;
  recipients: NotificationRecipient[];
}

export interface LicenseExpiryAlerts {
  enabled: boolean;
  daysBeforeExpiry: number;
  recipients: NotificationRecipient[];
}

export interface ReservationNotifications {
  enabled: boolean;
  recipients: NotificationRecipient[];
}

export interface NotificationSettings {
  dailyReport?: DailyReportSettings;
  licenseExpiryAlerts?: LicenseExpiryAlerts;
  reservationNotifications?: ReservationNotifications;
}

export interface Hotel {
  _id?: string;
  name: string;
  description: string;
  phone: string;
  logo: string;
  images: string[];
  gallery: string[];
  address: HotelAddress;
  contact?: HotelContact;
  whitelistedDomains: string[];
  customDomains?: string[];
  website?: WebsiteContent;
  seo?: SEOData;
  license?: HotelLicense;
  notificationSettings?: NotificationSettings;
  notes?: HotelNote[];
  createdAt: string;
  updatedAt: string;
}