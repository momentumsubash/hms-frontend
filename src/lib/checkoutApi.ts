import { API_URL, mergeHeaders, getAuthHeaders } from "./api";
// Update checkout payment status (supports single or multiple rooms, VAT info and dates)
export async function updateCheckoutPayment(
  roomNumbers: string | string[],
  status: string,
  vatPercent?: string,
  vatAmount?: string,
  extra?: { clientVatInfo?: any; checkOutDate?: string; checkInDate?: string }
) {
  const body: any = { status };
  if (Array.isArray(roomNumbers)) {
    body.rooms = roomNumbers;
  } else {
    body.roomNumber = roomNumbers;
  }
  if (vatPercent !== undefined) body.vatPercent = vatPercent;
  if (vatAmount !== undefined) body.vatAmount = vatAmount;
  if (extra?.clientVatInfo) body.clientVatInfo = extra.clientVatInfo;
  if (extra?.checkOutDate) body.checkOutDate = extra.checkOutDate;
  if (extra?.checkInDate) body.checkInDate = extra.checkInDate;
  const res = await fetch(`${API_URL}/checkouts/payment`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(body),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to update checkout payment");
  return res.json();
}

// Update checkout dates and VAT without completing
export async function updateCheckout(
  id: string,
  payload: { checkInDate?: string; checkOutDate?: string; vatPercent?: number }
) {
  const res = await fetch(`${API_URL}/checkouts/${id}`, {
    method: "PUT",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to update checkout");
  return res.json();
}
