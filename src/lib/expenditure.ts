import { Expenditure, ExpenditureFilters } from "@/types/expenditure";
import { API_URL, getAuthHeaders, mergeHeaders } from "./api";

export const createExpenditure = async (data: Omit<Expenditure, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'approvedBy' | 'approvedAt' | 'createdBy' | 'hotel'>) => {
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
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    throw new Error('Failed to create expenditure');
  }

  return response.json();
};

export const getExpenditures = async (filters?: ExpenditureFilters) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const response = await fetch(`${API_URL}/expenditures?${params.toString()}`, {
    headers: mergeHeaders({ "Accept": "application/json" }, getAuthHeaders()),
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch expenditures');
  }

  return response.json();
};

export const approveExpenditure = async (id: string) => {
  const response = await fetch(`${API_URL}/expenditures/${id}/approve`, {
    method: 'PUT',
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify({ status: "approved" }),
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    throw new Error('Failed to approve expenditure');
  }

  return response.json();
};

export const rejectExpenditure = async (id: string, reason: string) => {
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
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    throw new Error('Failed to reject expenditure');
  }

  return response.json();
};

export const getExpenditureStats = async (filters?: { startDate?: string; endDate?: string }) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const response = await fetch(`${API_URL}/expenditures/stats?${params.toString()}`, {
    headers: mergeHeaders({ "Accept": "application/json" }, getAuthHeaders()),
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch expenditure stats');
  }

  return response.json();
};

export const getFinancialOverview = async (filters?: { startDate?: string; endDate?: string }) => {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }

  const response = await fetch(`${API_URL}/stats/financial-overview?${params.toString()}`, {
    headers: mergeHeaders({ "Accept": "application/json" }, getAuthHeaders()),
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch financial overview');
  }

  return response.json();
};

export const getSummaryStats = async (days?: number) => {
  const params = new URLSearchParams();
  if (days) {
    params.append('days', days.toString());
  }

  const response = await fetch(`${API_URL}/stats/summary?${params.toString()}`, {
    headers: mergeHeaders({ "Accept": "application/json" }, getAuthHeaders()),
  });

  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  if (!response.ok) {
    throw new Error('Failed to fetch summary stats');
  }

  return response.json();
};
