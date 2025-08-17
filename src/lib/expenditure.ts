import { Expenditure, ExpenditureFilters } from "@/types/expenditure";
import Cookies from 'js-cookie';

const getAuthHeader = (): Record<string, string> => {
  const token = Cookies.get('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const createExpenditure = async (data: Omit<Expenditure, '_id' | 'createdAt' | 'updatedAt' | 'status' | 'approvedBy' | 'approvedAt'>) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenditure`, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
  });

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

  const headers: HeadersInit = {
    'Accept': 'application/json',
    ...getAuthHeader(),
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenditure?${params.toString()}`, {
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to fetch expenditures');
  }

  return response.json();
};

export const approveExpenditure = async (id: string) => {
  const headers: HeadersInit = getAuthHeader();
  
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenditure/${id}/approve`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    throw new Error('Failed to approve expenditure');
  }

  return response.json();
};

export const rejectExpenditure = async (id: string, reason: string) => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
  };

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/expenditure/${id}/reject`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reason }),
  });

  if (!response.ok) {
    throw new Error('Failed to reject expenditure');
  }

  return response.json();
};
