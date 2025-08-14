// List all users
export async function getUsers() {
  const res = await fetch(`${API_URL}/users`, {
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (res.status === 401) {
    if (!sessionStorage.getItem('redirected401')) {
      sessionStorage.setItem('redirected401', '1');
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return;
  }
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}
// Get current user's hotel
export async function getMyHotel() {
  const res = await fetch(`${API_URL}/hotels/me`, {
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to fetch hotel details");
  return res.json();
}
// Copied from design/hms-ui-v2/lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function mergeHeaders(base: HeadersInit, extra?: HeadersInit): HeadersInit {
  if (!extra) return base;
  if (base instanceof Headers) base = Object.fromEntries(base.entries());
  if (extra instanceof Headers) extra = Object.fromEntries(extra.entries());
  return { ...(base as any), ...(extra as any) };
}

// AUTH
export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error("Invalid credentials");
  return res.json();
}

export async function register(user: any) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
  if (!res.ok) throw new Error("Registration failed");
  return res.json();
}

export async function getMe() {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

// USERS
export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: mergeHeaders({ 'Accept': 'application/json' }, getAuthHeaders()),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Not authenticated");
  return res.json();
}

export async function getUserById(id: string) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("User not found");
  return res.json();
}

export async function updateUser(id: string, user: any) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "PUT",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(user),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export async function deactivateUser(id: string) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Deactivation failed");
  return res.json();
}

// ROOMS
export async function getRooms(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/rooms${query ? `?${query}` : ""}`,
    { headers: mergeHeaders({}, getAuthHeaders()) }
  );
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to fetch rooms");
  return res.json();
}

export async function addRoom(room: any) {
  const res = await fetch(`${API_URL}/rooms`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(room),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to add room");
  return res.json();
}

export async function getRoom(roomNumber: string) {
  const res = await fetch(`${API_URL}/rooms/${roomNumber}`,
    { headers: mergeHeaders({}, getAuthHeaders()) }
  );
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Room not found");
  return res.json();
}

export async function updateRoom(roomNumber: string, room: any) {
  const res = await fetch(`${API_URL}/rooms/${roomNumber}`, {
    method: "PUT",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(room),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to update room");
  return res.json();
}

export async function deleteRoom(roomNumber: string) {
  const res = await fetch(`${API_URL}/rooms/${roomNumber}`, {
    method: "DELETE",
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to delete room");
  return res.json();
}

// GUESTS
export async function getGuests(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/guests${query ? `?${query}` : ""}`,
    { headers: mergeHeaders({}, getAuthHeaders()) }
  );
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to fetch guests");
  return res.json();
}

export async function addGuest(guest: any) {
  const res = await fetch(`${API_URL}/guests`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(guest),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to add guest");
  return res.json();
}

export async function getGuest(id: string) {
  const res = await fetch(`${API_URL}/guests/${id}`,
    { headers: mergeHeaders({}, getAuthHeaders()) }
  );
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Guest not found");
  return res.json();
}

export async function updateGuest(id: string, guest: any) {
  const res = await fetch(`${API_URL}/guests/${id}`, {
    method: "PUT",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(guest),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to update guest");
  return res.json();
}

// ORDERS
export async function getOrders(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/orders${query ? `?${query}` : ""}`,
    { headers: mergeHeaders({}, getAuthHeaders()) }
  );
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to fetch orders");
  return res.json();
}

export async function addOrder(order: any) {
  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(order),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to add order");
  return res.json();
}

export async function getOrder(id: string) {
  const res = await fetch(`${API_URL}/orders/${id}`,
    { headers: mergeHeaders({}, getAuthHeaders()) }
  );
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Order not found");
  return res.json();
}

export async function updateOrderStatus(id: string, status: string) {
  const res = await fetch(`${API_URL}/orders/${id}/status`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify({ status }),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to update order status");
  return res.json();
}

// CHECKOUTS
export async function getCheckouts(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/checkouts${query ? `?${query}` : ""}`, {
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to fetch checkouts");
  return res.json();
}

export async function createCheckout(checkout: any) {
  const res = await fetch(`${API_URL}/checkouts`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(checkout),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to create checkout");
  return res.json();
}

export async function completeCheckoutPayment(id: string, paymentAmount: number) {
  const res = await fetch(`${API_URL}/checkouts/${id}/payment`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify({ paymentAmount }),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to complete payment");
  return res.json();
}

// ITEMS
export async function getItems(params: Record<string, any> = {}) {
  const query = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/items${query ? `?${query}` : ""}`);
  if (!res.ok) throw new Error("Failed to fetch items");
  return res.json();
}

export async function addItem(item: any) {
  const res = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to add item");
  return res.json();
}

export async function getItem(id: string) {
  const res = await fetch(`${API_URL}/items/${id}`);
  if (!res.ok) throw new Error("Item not found");
  return res.json();
}

export async function updateItem(id: string, item: any) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "PUT",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("Failed to update item");
  return res.json();
}

export async function deleteItem(id: string) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (!res.ok) throw new Error("Failed to delete item");
  return res.json();
}

// HOTELS
export async function getHotels() {
  const res = await fetch(`${API_URL}/hotels`);
  if (!res.ok) throw new Error("Failed to fetch hotels");
  return res.json();
}

export async function addHotel(hotel: any) {
  const res = await fetch(`${API_URL}/hotels`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(hotel),
  });
  if (!res.ok) throw new Error("Failed to add hotel");
  return res.json();
}

export async function updateHotel(id: string, hotel: any) {
  const res = await fetch(`${API_URL}/hotels/${id}`, {
    method: "PUT",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(hotel),
  });
  if (!res.ok) throw new Error("Failed to update hotel");
  return res.json();
}

export async function deleteHotel(id: string) {
  const res = await fetch(`${API_URL}/hotels/${id}`, {
    method: "DELETE",
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (!res.ok) throw new Error("Failed to delete hotel");
  return res.json();
}
