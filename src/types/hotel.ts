// types/hotel.ts

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

export interface HotelNote {
  _id?: string;
  text: string;
  author: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

// Add these new interfaces for license and notification settings
export interface HotelLicense {
  licenseNumber?: string;
  expiryDate?: string;
  licenseDocument?: string;
  status?: 'active' | 'expired' | 'pending';
}

export interface NotificationRecipient {
  email: string;
  name?: string;
  role?: string;
  active: boolean;
  addedAt?: string;
}

export interface NotificationSettings {
  dailyReport?: {
    enabled: boolean;
    time: string;
    recipients: NotificationRecipient[];
  };
  licenseExpiryAlerts?: {
    enabled: boolean;
    recipients: string[];
    daysBefore: number[];
  };
}

export interface Hotel {
  _id?: string;
  name: string;
  description?: string;
  location?: string;
  phone?: string;
  logo?: string;
  images?: string[];
  vatNumber?: string;
  companyName?: string;
  vatAddress?: string;
  type?: string;
  roomCount?: number;
  floors?: number;
  established?: number;
  amenities?: string[];
  gallery?: string[];
  contact?: HotelContact;
  address?: HotelAddress;
  locationMap?: string;
  nearby?: string[];
  initialAmount?: number;
  currentBalance?: number;
  lastBalanceUpdate?: string;
  notes?: HotelNote[];
  createdAt?: string;
  updatedAt?: string;
  
  // Add the new properties
  license?: HotelLicense;
  notificationSettings?: NotificationSettings;
  
  // Optional domain properties
  domain?: string;
  customDomains?: string[];
  whitelistedDomains?: string[];
  isActive?: boolean;
  
  statistics?: {
    financial?: {
      monthlyRevenue: number;
      monthlyExpenditure: number;
      currentBalance: number;
      initialAmount: number;
    };
    occupancy?: {
      totalRooms: number;
      occupiedRooms: number;
      availableRooms: number;
      occupancyRate: number;
    };
    guests?: {
      current: number;
    };
  };
  recentTransactions?: {
    checkouts: any[];
    expenditures: any[];
  };
}