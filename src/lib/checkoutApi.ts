import { API_URL, mergeHeaders, getAuthHeaders } from "./api";
// Update checkout payment status
export async function updateCheckoutPayment(roomNumber: string, status: string, vatPercent?: string, vatAmount?: string) {
  const body: any = { roomNumber, status };
  if (vatPercent !== undefined) body.vatPercent = vatPercent;
  if (vatAmount !== undefined) body.vatAmount = vatAmount;
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
