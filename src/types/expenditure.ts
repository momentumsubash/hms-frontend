// types/expenditure.ts
export interface Expenditure {
  _id: string;
  amount: number;
  category: "supplies" | "maintenance" | "utilities" | "salaries" | "marketing" | "other";
  description: string;
  date: string;
  hotel: string;
  createdBy: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  receipt?: string;
  notes?: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  rejectionReason?: string;
}

export interface ExpenditureFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
  search?: string;  // For text search
  minAmount?: number;  // For amount filtering
  maxAmount?: number;  // For amount filtering
  userId?: string;  // For user filtering
  page?: number;
  limit?: number;
  sortBy?: string;  // For sorting
  sortOrder?: 'asc' | 'desc';  // For sorting
  filter?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'halfYear' | 'year' | 'custom' | 'all'; // Date preset
}

// Add this new interface for the API response
export interface ExpenditureResponse {
  success: boolean;
  data: Expenditure[];
  summary: Array<{
    _id: {
      status: string;
      category: string;
    };
    totalAmount: number;
    count: number;
  }>;
  statusTotals: Array<{
    _id: string;
    totalAmount: number;
    count: number;
  }>;
  totals?: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    minAmount: number;
    maxAmount: number;
  };
  filteredTotal?: number;
  filteredCount?: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  dateRange?: {
    start: string;
    end: string;
    filter: string;
  };
  filters?: {
    available?: {
      categories: string[];
      statuses: string[];
    };
    applied?: Record<string, any>;
  };
}

export interface ExpenditureStats {
  totalExpenditures: number;
  totalAmount: number;
  pendingAmount: number;
  approvedAmount: number;
  rejectedAmount: number;
  categoryBreakdown: Array<{
    category: string;
    count: number;
    amount: number;
  }>;
  statusBreakdown: Array<{
    status: string;
    count: number;
    amount: number;
  }>;
}

export interface FinancialOverview {
  hotel: {
    name: string;
    initialAmount?: number;
    currentBalance?: number;
    lastBalanceUpdate?: string;
  };
  earnings?: {
    total: number;
    advance: number;
    discount: number;
    checkoutCount: number;
  };
  sales?: {
    roomSales: {
      total: number;
      count: number;
    };
    itemSales: {
      total: number;
      count: number;
    };
    totalSales: number;
  };
  expenditures: {
    approved: {
      total: number;
      count: number;
      byCategory?: Record<string, { amount: number; count: number }>;
    };
    pending: {
      total: number;
      count: number;
    };
    totalExpenditures: number;
    byStatus?: Record<string, { total: number; count: number }>;
  };
  financial: {
    netProfit: number;
    profitMargin: number | string;
    totalExpenditures: number;
    pendingExpenditures: number;
  };
  profitLoss?: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
  };
  hotelBalance?: {
    initialAmount: number;
    currentBalance: number;
  };
  dateRange?: {
    start: string;
    end: string;
    filter: string;
  };
}

export interface SummaryStats {
  totalSales: number;
  totalExpenditures: number;
  netProfit: number;
  profitMargin: number;
  period: string;
  dateRange?: {
    start: string;
    end: string;
    filter: string;
  };
  earnings?: {
    total: number;
    roomRevenue: number;
    itemSales: number;
    checkoutCount: number;
  };
  expenditures?: {
    total: number;
    count: number;
  };
  financial?: {
    netProfit: number;
    profitMargin: string;
  };
  business?: {
    occupiedRooms: number;
    totalGuests: number;
  };
  guests?: {
    total: number;
    checkedIn: number;
  };
  rooms?: {
    total: number;
    occupied: number;
    occupancyRate: string;
  };
  orders?: number;
  checkouts?: number;
  hotelBalance?: {
    initialAmount: number;
    currentBalance: number;
    lastBalanceUpdate: string | null;
  };
}

// Item Sales Types
export interface ItemSale {
  item: string;
  name: string;
  quantity: number;
  totalSales: number;
  averagePrice: number;
  salesCount: number;
  category?: {
    _id: string;
    name: string;
  } | null;
}

export interface ItemSalesData {
  items: ItemSale[];
  summary: {
    totalQuantity: number;
    totalRevenue: number;
    uniqueItems: number;
  };
  dateRange: {
    start: string;
    end: string;
    filter: string;
  };
}

// Room Sales Types
export interface RoomSale {
  roomId: string;
  roomNumber: string;
  type: string;
  totalRoomCharge: number;
  checkoutCount: number;
  totalNights: number;
  averageRoomCharge: number;
}

export interface RoomSalesData {
  roomSales: RoomSale[];
  totals: {
    totalRoomCharge: number;
    totalCheckouts: number;
    averageRoomCharge: number;
    totalNights: number;
  };
  dateRange?: {
    start: string;
    end: string;
    filter: string;
  };
}