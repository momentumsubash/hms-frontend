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