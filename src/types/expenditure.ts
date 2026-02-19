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
  search?: string;  // Add this for text search
  minAmount?: number;  // Add this for amount filtering
  maxAmount?: number;  // Add this for amount filtering
  userId?: string;  // Add this for user filtering
  page?: number;
  limit?: number;
  sortBy?: string;  // Add this for sorting
  sortOrder?: 'asc' | 'desc';  // Add this for sorting
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
  };
  sales: {
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
    };
    pending: {
      total: number;
      count: number;
    };
    totalExpenditures: number;
  };
  financial: {
    netProfit: number;
    profitMargin: number;
    totalExpenditures: number;
    pendingExpenditures: number;
  };
  profitLoss: {
    grossProfit: number;
    netProfit: number;
    profitMargin: number;
  };
  hotelBalance: {
    initialAmount: number;
    currentBalance: number;
  };
}

export interface SummaryStats {
  totalSales: number;
  totalExpenditures: number;
  netProfit: number;
  profitMargin: number;
  period: string;
}