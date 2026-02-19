import { Expenditure, ExpenditureFilters, ExpenditureResponse } from "@/types/expenditure";
import { API_URL, getAuthHeaders, mergeHeaders } from "./api";

// Helper to get token
const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
};

// Helper to build query string with all filter parameters
const buildQueryString = (params?: Record<string, any>): string => {
  if (!params) return '';
  
  const queryParams = new URLSearchParams();
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, value.toString());
    }
  });
  
  return queryParams.toString();
};

// Create a new expenditure
export const createExpenditure = async (data: Omit<Expenditure, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'approvedBy' | 'approvedAt' | 'createdBy' | 'hotel' | 'receipt'>) => {
  try {
    const response = await fetch(`${API_URL}/expenditures`, {
      method: 'POST',
      headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
      body: JSON.stringify({
        amount: data.amount,
        description: data.description,
        category: data.category,
        date: data.date,
        notes: data.notes
      }),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create expenditure');
    }

    return response.json();
  } catch (error) {
    console.error('Error creating expenditure:', error);
    throw error;
  }
};

// Get item sales statistics
export const getItemSales = async (params?: { 
  filter?: string; 
  startDate?: string; 
  endDate?: string;
  category?: string;
}) => {
  try {
    const queryString = buildQueryString(params);
    const token = getToken();
    
    const response = await fetch(`${API_URL}/stats/item-sales${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch item sales');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching item sales:', error);
    throw error;
  }
};

// Get room sales statistics
export const getRoomSales = async (params?: { 
  filter?: string; 
  startDate?: string; 
  endDate?: string;
  type?: string;
}) => {
  try {
    const queryString = buildQueryString(params);
    const token = getToken();
    
    const response = await fetch(`${API_URL}/stats/room-sales${queryString ? `?${queryString}` : ''}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch room sales');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching room sales:', error);
    throw error;
  }
};

// Extended ExpenditureFilters to include date filter presets
export interface ExtendedExpenditureFilters extends ExpenditureFilters {
  filter?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'halfYear' | 'year' | 'custom' | 'all';
  startDate?: string;
  endDate?: string;
  search?: string;
  category?: string;
  status?: string;
  userId?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Get expenditures with filters
export const getExpenditures = async (filters?: ExtendedExpenditureFilters): Promise<ExpenditureResponse> => {
  try {
    // Create a clean params object with only defined values
    const params: Record<string, any> = {};
    
    if (filters) {
      // Date filter presets
      if (filters.filter) params.filter = filters.filter;
      
      // Custom date range
      if (filters.startDate) params.startDate = filters.startDate;
      if (filters.endDate) params.endDate = filters.endDate;
      
      // Text search - this is the key for search functionality
      if (filters.search) params.search = filters.search;
      
      // Category filter
      if (filters.category) params.category = filters.category;
      
      // Status filter
      if (filters.status) params.status = filters.status;
      
      // User filter
      if (filters.userId) params.userId = filters.userId;
      
      // Amount range
      if (filters.minAmount !== undefined) params.minAmount = filters.minAmount;
      if (filters.maxAmount !== undefined) params.maxAmount = filters.maxAmount;
      
      // Pagination
      if (filters.page) params.page = filters.page;
      if (filters.limit) params.limit = filters.limit;
      
      // Sorting
      if (filters.sortBy) params.sortBy = filters.sortBy;
      if (filters.sortOrder) params.sortOrder = filters.sortOrder;
    }
    
    const queryString = buildQueryString(params);
    const url = `${API_URL}/expenditures${queryString ? `?${queryString}` : ''}`;
    
    console.log('Fetching expenditures with URL:', url); // Debug log
    
    const response = await fetch(url, {
      headers: mergeHeaders({ "Accept": "application/json" }, getAuthHeaders()),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch expenditures');
    }

    const data = await response.json();
    console.log('Expenditures response:', data); // Debug log
    return data;
  } catch (error) {
    console.error('Error fetching expenditures:', error);
    throw error;
  }
};

// Approve an expenditure
export const approveExpenditure = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/expenditures/${id}/approve`, {
      method: 'PUT',
      headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
      body: JSON.stringify({ status: "approved" }),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to approve expenditure');
    }

    return response.json();
  } catch (error) {
    console.error('Error approving expenditure:', error);
    throw error;
  }
};

// Reject an expenditure
export const rejectExpenditure = async (id: string, reason: string) => {
  try {
    const response = await fetch(`${API_URL}/expenditures/${id}/approve`, {
      method: 'PUT',
      headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
      body: JSON.stringify({ 
        status: "rejected",
        rejectionReason: reason 
      }),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject expenditure');
    }

    return response.json();
  } catch (error) {
    console.error('Error rejecting expenditure:', error);
    throw error;
  }
};

// Get expenditure statistics
export const getExpenditureStats = async (params?: { 
  filter?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'halfYear' | 'year' | 'custom' | 'all';
  startDate?: string; 
  endDate?: string;
}) => {
  try {
    const queryString = buildQueryString(params);

    const response = await fetch(`${API_URL}/expenditures/stats${queryString ? `?${queryString}` : ''}`, {
      headers: mergeHeaders({ "Accept": "application/json" }, getAuthHeaders()),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch expenditure stats');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching expenditure stats:', error);
    throw error;
  }
};

// Get financial overview
export const getFinancialOverview = async (params?: { 
  filter?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'halfYear' | 'year' | 'custom' | 'all';
  startDate?: string; 
  endDate?: string;
}) => {
  try {
    const queryString = buildQueryString(params);

    const response = await fetch(`${API_URL}/stats/financial-overview${queryString ? `?${queryString}` : ''}`, {
      headers: mergeHeaders({ "Accept": "application/json" }, getAuthHeaders()),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch financial overview');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching financial overview:', error);
    throw error;
  }
};

// Get summary statistics
export const getSummaryStats = async (params?: { 
  filter?: 'today' | 'yesterday' | 'week' | 'month' | 'quarter' | 'halfYear' | 'year' | 'custom' | 'all';
  startDate?: string; 
  endDate?: string;
  days?: number;
}) => {
  try {
    const queryString = buildQueryString(params);

    const response = await fetch(`${API_URL}/stats/summary${queryString ? `?${queryString}` : ''}`, {
      headers: mergeHeaders({ "Accept": "application/json" }, getAuthHeaders()),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch summary stats');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching summary stats:', error);
    throw error;
  }
};

// Get daily details
export const getDailyDetails = async (date: string) => {
  try {
    const token = getToken();
    
    const response = await fetch(`${API_URL}/stats/daily-details?date=${date}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch daily details');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching daily details:', error);
    throw error;
  }
};

// Delete an expenditure (manager only)
export const deleteExpenditure = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/expenditures/${id}`, {
      method: 'DELETE',
      headers: mergeHeaders({ "Accept": "application/json" }, getAuthHeaders()),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete expenditure');
    }

    return response.json();
  } catch (error) {
    console.error('Error deleting expenditure:', error);
    throw error;
  }
};

// Get a single expenditure by ID
export const getExpenditureById = async (id: string) => {
  try {
    const response = await fetch(`${API_URL}/expenditures/${id}`, {
      headers: mergeHeaders({ "Accept": "application/json" }, getAuthHeaders()),
    });

    if (response.status === 401) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      window.location.href = '/login';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to fetch expenditure');
    }

    return response.json();
  } catch (error) {
    console.error('Error fetching expenditure:', error);
    throw error;
  }
};