import { API_URL, mergeHeaders, getAuthHeaders } from "./api";
// Update checkout payment status (supports single or multiple rooms, VAT info and dates)
export const updateCheckoutPayment = async (checkoutId: string, vatData: any) => {
  const response = await fetch(`${API_URL}/checkouts/${checkoutId}/vat`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(vatData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update VAT information');
  }
  
  return response.json();
};

// Update checkout dates and VAT without completing
// In lib/checkoutApi.ts or similar
export const updateCheckout = async (id: string, data: any) => {
  const response = await fetch(`${API_URL}/checkouts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update checkout');
  }
  
  return response.json();
};

// In lib/checkoutApi.ts
