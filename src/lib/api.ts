// Create a new user
import { Hotel } from '@/types/hotel';
import { WebsiteContent, SEOData } from '@/types/website';
// import { Hotel } from 'lucide-react';
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  status?: number;
}


export async function createUser(user: any) {
  const res = await fetch(`${API_URL}/users`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(user),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to create user");
  return res.json();
}

// Add proper types for the updateHotelWebsite function
// lib/api.ts
export const updateHotelWebsite = async (hotelId: string, content: { website: WebsiteContent; seo: SEOData }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const response = await fetch(`${API_URL}/hotels/${hotelId}/website`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    body: JSON.stringify(content)
  });
  
  if (!response.ok) {
    throw new Error('Failed to update website content');
  }
  
  return response.json();
};
// Delete a user
export async function deleteUser(id: string) {
  const res = await fetch(`${API_URL}/users/${id}`, {
    method: "DELETE",
    headers: mergeHeaders({}, getAuthHeaders()),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to delete user");
  return res.json();
}
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
export const API_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
export const GATEWAY_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:4000/api";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function mergeHeaders(base: HeadersInit, extra?: HeadersInit): HeadersInit {
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
// lib/api.ts - Update getCurrentUser function
export async function getCurrentUser() {
  const res = await fetch(`${API_URL}/users/me`, {
    headers: mergeHeaders({ 'Accept': 'application/json' }, getAuthHeaders()),
  });
  
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Not authenticated');
  }
  
  if (!res.ok) {
    throw new Error('Not authenticated');
  }
  
  const data = await res.json();
  // Return the user data from the response structure
  return data.data; // This returns the user object directly
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

export async function getAvailableRooms() {
  const res = await fetch(`${API_URL}/rooms/available`, {
    headers: mergeHeaders({}, getAuthHeaders())
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to fetch available rooms");
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

export async function updateRoomMaintenance(roomNumber: string, maintenanceStatus: string) {
  const res = await fetch(`${API_URL}/rooms/${roomNumber}/maintenance`, {
    method: "PUT",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify({ maintenanceStatus }),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to update maintenance status");
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
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Handle hotel parameter - prioritize from params, fallback to current user's hotel
    let hotelId = params.hotel;
    if (!hotelId) {
      try {
        const myHotel = await getMyHotel();
        hotelId = myHotel?.data?.hotel?._id || myHotel?.data?._id;
      } catch (error) {
        console.warn('Could not fetch user hotel, proceeding without hotel filter:', error);
      }
    }
    
    if (hotelId) {
      queryParams.append('hotel', hotelId);
    }
    
    // Handle date parameter
    if (params.date) {
      queryParams.append('date', params.date);
    }
    
    // Handle detailed parameter - default to true for comprehensive data
    const detailed = params.detailed !== undefined ? params.detailed : true;
    queryParams.append('detailed', detailed.toString());
    
    // Add any additional parameters passed in
    Object.keys(params).forEach(key => {
      if (!['hotel', 'date', 'detailed'].includes(key) && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    // Build the final URL
    const url = `${API_URL}/guests/stats/count?${hotelId}`;
    
    const res = await fetch(url, {
      headers: mergeHeaders({}, getAuthHeaders()),
      method: 'GET'
    });
    
    // Handle authentication error
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    
    // Handle other HTTP errors
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch guests: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    
    // Return the data with additional metadata for easier consumption
    return {
      ...data,
      // Add computed fields for easier access
      meta: {
        hotelId: hotelId || null,
        requestedDate: params.date || null,
        isDetailed: detailed,
        hasBreakdown: !!(data.data?.breakdown),
        timestamp: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Error fetching guest statistics:', error);
    throw error;
  }
}

// Alternative quick count function for simple use cases
export async function getGuestsQuickCount(hotelId?: string) {
  try {
    const queryParams = new URLSearchParams();
    
    // Use provided hotelId or fetch current user's hotel
    let effectiveHotelId = hotelId;
    if (!effectiveHotelId) {
      try {
        const myHotel = await getMyHotel();
        effectiveHotelId = myHotel?.data?.hotel?._id || myHotel?.data?._id;
      } catch (error) {
        console.warn('Could not fetch user hotel for quick count:', error);
      }
    }
    
    if (effectiveHotelId) {
      queryParams.append('hotel', effectiveHotelId);
    }
    
    const url = `${API_URL}/guests/stats/quick-count${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const res = await fetch(url, {
      headers: mergeHeaders({}, getAuthHeaders()),
      method: 'GET'
    });
    
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch guest count: ${res.status} ${res.statusText}`);
    }
    
    return res.json();
    
  } catch (error) {
    console.error('Error fetching guest quick count:', error);
    throw error;
  }
}

// Utility functions for common use cases
export async function getCurrentStayingGuests(hotelId?: string) {
  const result = await getGuests({ hotel: hotelId, detailed: false });
  return result?.data?.currentlyStaying || 0;
}

export async function getHotelOccupancyRate(hotelId?: string) {
  const result = await getGuests({ hotel: hotelId, detailed: false });
  return result?.data?.occupancyRate || 0;
}

export async function getGuestStatsByDate(date: string, hotelId?: string) {
  return getGuests({ hotel: hotelId, date, detailed: true });
}

export async function getDetailedHotelBreakdown() {
  // This will only work for super_admin users - don't fetch hotel ID for this
  return getGuests({ detailed: true }); // No hotel filter to get all hotels
}

// New utility function to get current user's hotel guest stats
export async function getMyHotelGuestStats(params: Record<string, any> = {}) {
  try {
    const myHotel = await getMyHotel();
    const hotelId = myHotel?.data?.hotel?._id || myHotel?.data?._id;
    
    if (!hotelId) {
      throw new Error('Could not determine user hotel ID');
    }
    
    return getGuests({ 
      ...params, 
      hotel: hotelId 
    });
  } catch (error) {
    console.error('Error fetching my hotel guest stats:', error);
    throw error;
  }
}

// Add these functions to your existing API file


// Add these functions to your existing API file

export const uploadHotelLogo = async (hotelId: string, formData: FormData): Promise<{ url: string }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/logo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload logo');
  }
  
  return response.json();
};

export const uploadHotelImages = async (hotelId: string, formData: FormData): Promise<{ urls: string[] }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/images`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload images');
  }
  
  return response.json();
};

export const uploadHotelGallery = async (hotelId: string, formData: FormData): Promise<{ urls: string[] }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/gallery`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    throw new Error('Failed to upload gallery images');
  }
  
  return response.json();
};
// Helper function to remove image
export const removeHotelImage = async (hotelId: string, imageUrl: string, type: 'logo' | 'images' | 'gallery'): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_URL}/hotels/${hotelId}/images/remove`, {
    method: 'DELETE',
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify({ imageUrl, type }),
  });
  
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Authentication required');
  }
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Image removal failed');
  }
  
  return response.json();
};



// Helper function for handling responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const error = await response.text();
    throw new Error(error || 'Upload failed');
  }
  return response.json();
};

// Cached version to avoid multiple hotel API calls
let cachedHotelId: string | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

async function getCachedHotelId(): Promise<string | null> {
  const now = Date.now();
  
  // Use cached value if it's still valid
  if (cachedHotelId && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedHotelId;
  }
  
  try {
    const myHotel = await getMyHotel();
    cachedHotelId = myHotel?.data?.hotel?._id || myHotel?.data?._id || null;
    cacheTimestamp = now;
    return cachedHotelId;
  } catch (error) {
    console.warn('Could not fetch hotel ID:', error);
    return null;
  }
}

// Optimized functions using cached hotel ID
export async function getGuestsOptimized(params: Record<string, any> = {}) {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    
    // Handle hotel parameter - prioritize from params, fallback to cached hotel ID
    let hotelId = params.hotel;
    if (!hotelId) {
      hotelId = await getCachedHotelId();
    }
    
    if (hotelId) {
      queryParams.append('hotel', hotelId);
    }
    
    // Handle date parameter
    if (params.date) {
      queryParams.append('date', params.date);
    }
    
    // Handle detailed parameter - default to true for comprehensive data
    const detailed = params.detailed !== undefined ? params.detailed : true;
    queryParams.append('detailed', detailed.toString());
    
    // Add any additional parameters passed in
    Object.keys(params).forEach(key => {
      if (!['hotel', 'date', 'detailed'].includes(key) && params[key] !== undefined) {
        queryParams.append(key, params[key]);
      }
    });
    
    // Build the final URL
    const url = `${API_URL}/guests/stats/count${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    const res = await fetch(url, {
      headers: mergeHeaders({}, getAuthHeaders()),
      method: 'GET'
    });
    
    // Handle authentication error
    if (res.status === 401) {
      localStorage.removeItem('token');
      // Clear cache on auth error
      cachedHotelId = null;
      cacheTimestamp = 0;
      window.location.href = '/login';
      return;
    }
    
    // Handle other HTTP errors
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to fetch guests: ${res.status} ${res.statusText}`);
    }
    
    const data = await res.json();
    
    // Return the data with additional metadata for easier consumption
    return {
      ...data,
      // Add computed fields for easier access
      meta: {
        hotelId: hotelId || null,
        requestedDate: params.date || null,
        isDetailed: detailed,
        hasBreakdown: !!(data.data?.breakdown),
        timestamp: new Date().toISOString(),
        usedCache: !!cachedHotelId
      }
    };
    
  } catch (error) {
    console.error('Error fetching guest statistics:', error);
    throw error;
  }
}

export async function addGuest(guest: any) {
  const payload = {
    ...guest,
    checkInDate: guest.checkInDate || new Date().toISOString(),
    // Ensure all required fields are present
    firstName: guest.firstName,
    lastName: guest.lastName,
    email: guest.email,
    phone: guest.phone,
    address: guest.address || "",
    rooms: guest.rooms,
    hotel: guest.hotel, // This will be automatically populated from localStorage
    roomDiscount: guest.roomDiscount || 0,
    advancePaid: guest.advancePaid || 0
  };


  const res = await fetch(`${API_URL}/guests`, {
    method: "POST",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (res.status === 400) {
    const error = await res.json();
    console.error('Guest creation failed with 400:', error);
    throw new Error(error.message || "Room is already occupied");
  }
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Guest creation failed:', res.status, errorText);
    throw new Error("Failed to add guest");
  }
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
  const payload = {
    ...guest,
    // Ensure all required fields are present
    firstName: guest.firstName,
    lastName: guest.lastName,
    phone: guest.phone,
    address: guest.address || "",
    rooms: guest.rooms, // This will be room numbers from the frontend
    hotel: guest.hotel, // This will be automatically populated from localStorage
    checkOutDate: guest.checkOutDate,
    roomDiscount: guest.roomDiscount || 0,
    advancePaid: guest.advancePaid || 0
  };


  const res = await fetch(`${API_URL}/guests/${id}`, {
    method: "PUT",
    headers: mergeHeaders({ "Content-Type": "application/json" }, getAuthHeaders()),
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (res.status === 400) {
    const error = await res.json();
    console.error('Guest update failed with 400:', error);
    throw new Error(error.message || "Room is already occupied");
  }
  if (!res.ok) {
    const errorText = await res.text();
    console.error('Guest update failed:', res.status, errorText);
    throw new Error("Failed to update guest");
  }
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

// Add this function to get checkout by ID
export async function getCheckoutById(id: string) {
  const res = await fetch(`${API_URL}/checkouts/${id}`, {
    headers: mergeHeaders({ 'Accept': 'application/json' }, getAuthHeaders()),
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }
  if (!res.ok) throw new Error("Failed to fetch checkout");
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
export const getHotels = async (): Promise<{ success: boolean; data: Hotel[] }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/hotels`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch hotels');
  }
  
  return response.json();
};

export const getHotel = async (id: string): Promise<{ success: boolean; data: Hotel }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/hotels/${id}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch hotel');
  }
  
  return response.json();
};

export const addHotel = async (hotel: Partial<Hotel>): Promise<{ success: boolean; data: Hotel }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/hotels`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hotel),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create hotel');
  }
  
  return response.json();
};

export const updateHotel = async (id: string, hotel: Partial<Hotel>): Promise<{ success: boolean; data: Hotel }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/hotels/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hotel),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update hotel');
  }
  
  return response.json();
};

export const deleteHotel = async (id: string): Promise<{ success: boolean; message: string }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/hotels/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to delete hotel');
  }
  
  return response.json();
};

export const updateHotelBalance = async (id: string, initialAmount: number): Promise<{ success: boolean; data: any }> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/hotels/${id}/balance`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ initialAmount }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update hotel balance');
  }
  
  return response.json();
};


// Notification management functions
export const getHotelRecipients = async (hotelId: string) => {
  const response = await fetch(`/api/hotels/${hotelId}/recipients`, {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  return response.json();
};

export const addHotelRecipient = async (hotelId: string, recipient: any) => {
  const response = await fetch(`/api/hotels/${hotelId}/recipients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(recipient)
  });
  return response.json();
};

export const removeHotelRecipient = async (hotelId: string, email: string) => {
  const response = await fetch(`/api/hotels/${hotelId}/recipients/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  return response.json();
};

export const toggleHotelRecipient = async (hotelId: string, email: string) => {
  const response = await fetch(`/api/hotels/${hotelId}/recipients/${encodeURIComponent(email)}/toggle`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
  });
  return response.json();
};

export const updateHotelNotificationSettings = async (hotelId: string, settings: any) => {
  const response = await fetch(`/api/hotels/${hotelId}/notification-settings`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(settings)
  });
  return response.json();
};

export const testHotelNotification = async (hotelId: string, testData: any) => {
  const response = await fetch(`/api/hotels/${hotelId}/test-notification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(testData)
  });
  return response.json();
};

// Add these functions to your api.ts file

// Notification and License Management Functions
export const getHotelLicense = async (hotelId: string): Promise<{ success: boolean; data: any }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/license`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch hotel license');
  }
  
  return response.json();
};

export const updateHotelLicense = async (hotelId: string, licenseInfo: any): Promise<{ success: boolean; data: any }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/license`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(licenseInfo),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update hotel license');
  }
  
  return response.json();
};

export const getNotificationSettings = async (hotelId: string): Promise<{ success: boolean; data: any }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/notification-settings`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch notification settings');
  }
  
  return response.json();
};

export const updateNotificationSettings = async (hotelId: string, settings: any): Promise<{ success: boolean; data: any }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/notification-settings`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings),
  });
  
  if (!response.ok) {
    throw new Error('Failed to update notification settings');
  }
  
  return response.json();
};

export const addNotificationRecipient = async (hotelId: string, recipient: any): Promise<{ success: boolean; data: any }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/recipients`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(recipient),
  });
  
  if (!response.ok) {
    throw new Error('Failed to add notification recipient');
  }
  
  return response.json();
};

export const removeNotificationRecipient = async (hotelId: string, email: string): Promise<{ success: boolean; data: any }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/recipients/${encodeURIComponent(email)}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to remove notification recipient');
  }
  
  return response.json();
};

export const toggleNotificationRecipient = async (hotelId: string, email: string): Promise<{ success: boolean; data: any }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/recipients/${encodeURIComponent(email)}/toggle`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to toggle notification recipient');
  }
  
  return response.json();
};

export const testNotification = async (hotelId: string, type: string, testEmail?: string, date?: string): Promise<{ success: boolean; message: string; data?: any }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/${hotelId}/test-notification`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, testEmail, date }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send test notification');
  }
  
  return response.json();
};

export const getEmailServiceStatus = async (): Promise<{ success: boolean; data: any }> => {
  const token = getToken();
  const response = await fetch(`${API_URL}/hotels/email-status`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch email service status');
  }
  
  return response.json();
};

// Add these to your existing API functions in api.ts

/**
 * Add a domain to a hotel's whitelistedDomains or customDomains
 */
export const addHotelDomain = async (
  hotelId: string,
  domainType: 'whitelistedDomains' | 'customDomains',
  domain: string
): Promise<ApiResponse<any>> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/hotels/${hotelId}/domains`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ domainType, domain }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to add domain: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error adding hotel domain:', error);
    throw new Error(error.message || 'Failed to add domain');
  }
};

/**
 * Remove a domain from a hotel's whitelistedDomains or customDomains
 */
export const removeHotelDomain = async (
  hotelId: string,
  domainType: 'whitelistedDomains' | 'customDomains',
  domain: string
): Promise<ApiResponse<any>> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/hotels/${hotelId}/domains`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ domainType, domain }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to remove domain: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error removing hotel domain:', error);
    throw new Error(error.message || 'Failed to remove domain');
  }
};

/**
 * Update multiple domains at once (optional - for bulk operations)
 */
export const updateHotelDomains = async (
  hotelId: string,
  domainType: 'whitelistedDomains' | 'customDomains',
  domains: string[]
): Promise<ApiResponse<any>> => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/hotels/${hotelId}/domains/bulk`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ domainType, domains }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to update domains: ${response.statusText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error updating hotel domains:', error);
    throw new Error(error.message || 'Failed to update domains');
  }
};