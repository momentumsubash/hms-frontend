export interface Expenditure {
  _id: string;
  amount: number;
  category: "supplies" | "maintenance" | "utilities" | "salaries" | "marketing" | "other";
  description: string;
  date: string;
  hotel: string;
  createdBy: string;
  receipt?: string;
  notes?: string;
  status: "pending" | "approved" | "rejected";
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  reason?: string;
}

export interface ExpenditureFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  status?: string;
}
