export interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  rate: number;
  description: string;
  amenities: string[];
  isOccupied: boolean;
  capacity: number;
  currentGuest?: string;
  hotel?: {
    name: string;
    _id: string;
  };
  guestName?: string;
  guestPhone?: string;
  maintenanceStatus?: string;
  maintanenceStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginatedRoomResponse {
  rooms: Room[];
  total: number;
  totalPages: number;
}

export interface RoomResponse {
  data: PaginatedRoomResponse | Room[];
  message?: string;
}
