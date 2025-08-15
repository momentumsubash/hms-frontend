import { API_URL, getAuthHeaders, mergeHeaders } from "@/lib/api";

export async function logoutApi() {
  const res = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (!res.ok) throw new Error("Logout failed");
  return res.json();
}
