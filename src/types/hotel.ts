// types/hotel.ts
import type { WebsiteContent, SEOData } from './website';

export type LicenseStatus = 'active' | 'expired' | 'pending';

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
  recipients: string[];
  daysBefore: number[];
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

export interface FinancialStatistics {
  monthlyRevenue: number;
  monthlyExpenditure: number;
  currentBalance: number;
  initialAmount: number;
}

export interface OccupancyStatistics {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
}

export interface GuestStatistics {
  current: number;
}

export interface HotelStatistics {
  financial?: FinancialStatistics;
  occupancy?: OccupancyStatistics;
  guests?: GuestStatistics;
}

export interface RecentTransactions {
  checkouts: any[];
  expenditures: any[];
}

export interface Hotel {
  _id?: string;
  name?: string;
  description?: string;
  phone?: string;
  logo?: string;
  images?: string[];
  gallery?: string[];
  address?: HotelAddress;
  contact?: HotelContact;
  
  // Business details
  vatNumber?: string;
  companyName?: string;
  vatAddress?: string;
  type?: string;
  roomCount?: number;
  floors?: number;
  established?: number;
  amenities?: string[];
  locationMap?: string;
  nearby?: string[];
  
  // Financial details
  initialAmount?: number;
  currentBalance?: number;
  lastBalanceUpdate?: string;
  
  // Domain management
  domain?: string;
  whitelistedDomains?: string[];
  customDomains?: string[];
  isActive?: boolean;
  
  // Content and settings
  website?: WebsiteContent;
  seo?: SEOData;
  license?: HotelLicense;
  notificationSettings?: NotificationSettings;
  notes?: HotelNote[];
  
  // Statistics and transactions
  statistics?: HotelStatistics;
  recentTransactions?: RecentTransactions;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;

  // Language setting
  nepaliLanguage?: boolean;
}