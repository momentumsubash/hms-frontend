export interface HotelNote {
  _id: string;
  text: string;
  author: {
    _id: string;
    name: string;
  };
  createdAt: string;
}

export interface HotelContact {
  phone: string;
  reception: string;
  email: string;
  website: string;
}

export interface HotelAddress {
  street: string;
  area: string;
  city: string;
  state: string;
  zip: string;
}

interface HotelStatistics {
  totalRooms: number;
  occupiedRooms: number;
  occupancyRate: number;
  currentGuests: number;
}

interface HotelTransaction {
  _id: string;
  status: string;
  guest: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  room: string;
  orders: string[];
  totalRoomCharge: number;
  totalOrderCharge: number;
  totalExtraCharge: number;
  vatPercent: number;
  vatAmount: number;
  totalBill: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  rooms: any[];
}

interface HotelTransactions {
  checkouts: HotelTransaction[];
  expenditures: any[];
}

export interface Hotel {
  _id?: string;
  name: string;
  description: string;
  location: string;
  phone: string;
  logo: string;
  images: string[];
  type?: string;
  roomCount: number;
  floors?: number;
  established?: number;
  amenities: string[];
  gallery: string[];
  contact: HotelContact;
  address: HotelAddress;
  nearby: string[];
  notes: HotelNote[];
  createdAt: string;
  updatedAt?: string;
  statistics?: HotelStatistics;
  recentTransactions?: HotelTransactions;
  vatNumber?: string;
  companyName?: string;
  vatAddress?: string;
}
