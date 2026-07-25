import { API_URL, getAuthHeaders, mergeHeaders } from "./api";

const handleResponse = async (res: Response) => {
  if (res.status === 401) {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Session expired');
  }
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Request failed');
  }
  return res.json();
};

// ============ DEPARTMENTS ============
export const getDepartments = async (hotel?: string) => {
  const params = hotel ? `?hotel=${hotel}` : '';
  const res = await fetch(`${API_URL}/departments${params}`, {
    headers: mergeHeaders({ Accept: "application/json" }, getAuthHeaders()),
  });
  return handleResponse(res);
};

export const createDepartment = async (data: { name: string; description?: string; hotel?: string }) => {
  const res = await fetch(`${API_URL}/departments`, {
    method: 'POST',
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateDepartment = async (id: string, data: { name?: string; description?: string }) => {
  const res = await fetch(`${API_URL}/departments/${id}`, {
    method: 'PUT',
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteDepartment = async (id: string) => {
  const res = await fetch(`${API_URL}/departments/${id}`, {
    method: 'DELETE',
    headers: mergeHeaders({ Accept: "application/json" }, getAuthHeaders()),
  });
  return handleResponse(res);
};

// ============ SALARIES ============
export const getSalaries = async (params?: Record<string, any>) => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
  }
  const qs = query.toString();
  const res = await fetch(`${API_URL}/salaries${qs ? `?${qs}` : ''}`, {
    headers: mergeHeaders({ Accept: "application/json" }, getAuthHeaders()),
  });
  return handleResponse(res);
};

export const generatePayroll = async (data: { month: number; year: number; hotel?: string }) => {
  const res = await fetch(`${API_URL}/salaries/generate`, {
    method: 'POST',
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const paySalary = async (id: string, data: { amountPaid: number; paymentMethod?: string; notes?: string }) => {
  const res = await fetch(`${API_URL}/salaries/${id}/pay`, {
    method: 'POST',
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const updateSalary = async (id: string, data: { allowances?: number; deductions?: number; bonus?: number; notes?: string }) => {
  const res = await fetch(`${API_URL}/salaries/${id}`, {
    method: 'PUT',
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const deleteSalary = async (id: string) => {
  const res = await fetch(`${API_URL}/salaries/${id}`, {
    method: 'DELETE',
    headers: mergeHeaders({ Accept: "application/json" }, getAuthHeaders()),
  });
  return handleResponse(res);
};

// ============ LEAVES ============
export const getLeaves = async (params?: Record<string, any>) => {
  const query = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') query.append(k, String(v));
    });
  }
  const qs = query.toString();
  const res = await fetch(`${API_URL}/leaves${qs ? `?${qs}` : ''}`, {
    headers: mergeHeaders({ Accept: "application/json" }, getAuthHeaders()),
  });
  return handleResponse(res);
};

export const createLeave = async (data: any) => {
  const res = await fetch(`${API_URL}/leaves`, {
    method: 'POST',
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
};

export const approveLeave = async (id: string, notes?: string) => {
  const res = await fetch(`${API_URL}/leaves/${id}/approve`, {
    method: 'PUT',
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify({ notes }),
  });
  return handleResponse(res);
};

export const rejectLeave = async (id: string, notes?: string) => {
  const res = await fetch(`${API_URL}/leaves/${id}/reject`, {
    method: 'PUT',
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify({ notes }),
  });
  return handleResponse(res);
};

export const deleteLeave = async (id: string) => {
  const res = await fetch(`${API_URL}/leaves/${id}`, {
    method: 'DELETE',
    headers: mergeHeaders({ Accept: "application/json" }, getAuthHeaders()),
  });
  return handleResponse(res);
};

export const getLeaveBalance = async (staffId: string, year?: number) => {
  const params = year ? `?year=${year}` : '';
  const res = await fetch(`${API_URL}/leaves/balance/${staffId}${params}`, {
    headers: mergeHeaders({ Accept: "application/json" }, getAuthHeaders()),
  });
  return handleResponse(res);
};
