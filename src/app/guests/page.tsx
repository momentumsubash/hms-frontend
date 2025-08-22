"use client";

import { getGuests, getRooms, updateGuest, addGuest as createGuest, getMe, getAvailableRooms } from "@/lib/api";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { format } from "date-fns";
import { isAPIResponse } from "@/types/api";

interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  rooms: string[];
  checkInDate: string;
  checkOutDate?: string;
  isCheckedOut: boolean;
  totalBill: number;
  roomDiscount?: number;
  advancePaid?: number;
  createdBy: string;
  hotel: string;
  createdAt: string;
  updatedAt: string;
  checkouts?: {
    _id: string;
    rooms: {
      _id: string;
      roomNumber: string;
      type: string;
      isOccupied: boolean;
    }[];
  }[];
}

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  rate: number;
  isOccupied: boolean;
  capacity: number;
}

interface GuestForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  rooms: string[];
  roomDiscount: string;
  advancePaid: string;
  checkInDate: string;
  checkOutDate?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Helper function to get current datetime in local format for datetime-local input
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function GuestsPage() {
  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalGuests, setTotalGuests] = useState(0);
  
  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Checkouts", href: "/checkouts" },
    { label: "Guests", href: "/guests" },
    { label: "Hotels", href: "/hotels" },
    { label: "Items", href: "/items" },
    { label: "Orders", href: "/orders" },
    { label: "Rooms", href: "/rooms" },
    { label: "Users", href: "/users" },
  ];
  
  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState<GuestForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    rooms: [],
    roomDiscount: "0",
    advancePaid: "0",
    checkInDate: "",
    checkOutDate: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // User info for nav bar
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Filters with debouncing
  const [filters, setFilters] = useState({
    isCheckedOut: "",
    roomNumber: "",
    search: ""
  });
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Helper function to get standard headers
  const getRequestHeaders = (token: string) => {
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Load data with server-side filtering and pagination
  const loadData = useCallback(async (resetPage = false, customFilters?: typeof filters) => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");

      // Use custom filters if provided, otherwise use current filters
      const currentFilters = customFilters || filters;
      const currentPage = resetPage ? 1 : page;

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', limit.toString());
      
      // Add filters if they exist
      if (currentFilters.search) queryParams.append('search', currentFilters.search);
      if (currentFilters.roomNumber) queryParams.append('roomNumber', currentFilters.roomNumber);
      if (currentFilters.isCheckedOut !== "") queryParams.append('isCheckedOut', currentFilters.isCheckedOut);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/guests?${queryParams.toString()}`, {
        headers: getRequestHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch guests');
      }

      const data = await response.json();
      
      // Handle the expected response structure
      let guestsData: Guest[] = [];
      let totalCount = 0;
      let totalPagesCount = 0;

      if (data.success && Array.isArray(data.data)) {
        guestsData = data.data;
        totalCount = data.pagination?.total || 0;
        totalPagesCount = data.pagination?.pages || Math.ceil(totalCount / limit);
      } else if (Array.isArray(data)) {
        guestsData = data;
        totalCount = data.length;
        totalPagesCount = Math.ceil(totalCount / limit);
      } else {
        guestsData = [];
        totalCount = 0;
        totalPagesCount = 0;
      }

      setGuests(guestsData);
      setTotalPages(totalPagesCount);
      setTotalGuests(totalCount);

      if (resetPage) {
        setPage(1);
      }
    } catch (e: any) {
      setError(e.message);
      setGuests([]);
      setTotalPages(0);
      setTotalGuests(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  // Handle filter changes with debouncing
  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    
    // Clear existing timeout
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    // Set a new timeout to debounce the API call for search inputs
    if (filterKey === 'search' || filterKey === 'roomNumber') {
      setSearchDebounce(setTimeout(() => {
        loadData(true, newFilters);
      }, 500));
    } else {
      // For other filters, apply immediately
      loadData(true, newFilters);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      isCheckedOut: "",
      roomNumber: "",
      search: ""
    };
    setFilters(clearedFilters);
    loadData(true, clearedFilters);
  };

  // Hide notification after 3s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Initial data load
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("No authentication token");
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch /auth/me
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
          headers: getRequestHeaders(token),
        });
        if (!meRes.ok) throw new Error("Not authenticated");
        const meData = await meRes.json();
        localStorage.setItem("user", JSON.stringify(meData.data || null));
        
        // 2. Fetch rooms data
        const [roomsRes, allRoomsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms?isOccupied=false`, {
            headers: getRequestHeaders(token),
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms`, {
            headers: getRequestHeaders(token),
          })
        ]);

        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setAvailableRooms(roomsData.data || roomsData || []);
        }

        if (allRoomsRes.ok) {
          const allRoomsData = await allRoomsRes.json();
          setAllRooms(allRoomsData.data || allRoomsData || []);
        }

        // 3. Load guests with initial filters
        await loadData();
      } catch (e: any) {
        setError(e.message);
      }
    };
    fetchInitialData();
  }, []);

  // Load data when page changes
  useEffect(() => {
    if (page > 1) {
      loadData(false);
    }
  }, [page, loadData]);

  // Clean up debounce timeout
  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      rooms: [],
      roomDiscount: "0",
      advancePaid: "0",
      checkInDate: "",
      checkOutDate: ""
    });
    setEditingGuest(null);
    setShowForm(false);
    setFormErrors({});
  };

  // Validation function
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    const now = new Date();

    if (!formData.checkInDate) {
      errors.checkInDate = "Check-in date is required";
    } else {
      const checkInDate = new Date(formData.checkInDate);
      if (!editingGuest && checkInDate < now) {
        errors.checkInDate = "Check-in date cannot be in the past";
      }
    }

    if (formData.checkOutDate && formData.checkInDate) {
      const checkInDate = new Date(formData.checkInDate);
      const checkOutDate = new Date(formData.checkOutDate);
      if (checkOutDate <= checkInDate) {
        errors.checkOutDate = "Check-out date must be after check-in date";
      }
    }

    if (!formData.rooms || formData.rooms.length === 0) {
      errors.rooms = "At least one room must be selected";
    }

    const roomDiscountValue = parseFloat(formData.roomDiscount || '0');
    const advancePaidValue = parseFloat(formData.advancePaid || '0');
    if (isNaN(roomDiscountValue) || roomDiscountValue < 0) {
      errors.roomDiscount = "Room discount must be a non-negative number";
    }
    if (isNaN(advancePaidValue) || advancePaidValue < 0) {
      errors.advancePaid = "Advance paid must be a non-negative number";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (formData.phone.length < 10) {
      errors.phone = "Phone number should be at least 10 digits";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setNotification({ type: 'error', message: 'Please fix the validation errors' });
      return;
    }

    setFormLoading(true);
    try {
      let resp;
      if (editingGuest) {
        const roomNumbers = formData.rooms.map(resolveRoomNumberFromId);
        const storedUser = localStorage.getItem('user');
        let hotelId = '';
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            hotelId = userData.hotel || user?.hotel || '';
          } catch (e) {
            console.error('Error parsing user data from localStorage:', e);
            hotelId = user?.hotel || '';
          }
        } else {
          hotelId = user?.hotel || '';
        }

        if (!hotelId) {
          throw new Error("Hotel ID is required. Please contact your administrator.");
        }

        const updatePayload: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          rooms: roomNumbers,
          hotel: hotelId,
          checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined,
          roomDiscount: parseFloat(formData.roomDiscount || '0') || 0,
          advancePaid: parseFloat(formData.advancePaid || '0') || 0,
        };
        
        resp = await updateGuest(editingGuest._id, updatePayload);
      } else {
        const roomNumbers = formData.rooms.map(resolveRoomNumberFromId);
        const storedUser = localStorage.getItem('user');
        let hotelId = '';
        
        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            hotelId = userData.hotel || user?.hotel || '';
          } catch (e) {
            console.error('Error parsing user data from localStorage:', e);
            hotelId = user?.hotel || '';
          }
        } else {
          hotelId = user?.hotel || '';
        }

        if (!hotelId) {
          throw new Error("Hotel ID is required. Please contact your administrator.");
        }

        const createPayload: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          rooms: roomNumbers,
          hotel: hotelId,
          checkInDate: new Date(formData.checkInDate).toISOString(),
          checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined,
          roomDiscount: parseFloat(formData.roomDiscount || '0') || 0,
          advancePaid: parseFloat(formData.advancePaid || '0') || 0,
        };
        
        resp = await createGuest(createPayload);
      }
      
      // Refresh guests data
      await loadData(true);
      resetForm();
      setNotification({ type: 'success', message: resp?.message || 'Operation successful' });
    } catch (e: any) {
      setError(e.message);
      setNotification({ type: 'error', message: e.message || 'Operation failed' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (guest: Guest) => {
    setEditingGuest(guest);
    const normalizedRooms = normalizeGuestRoomIds(guest);
    setFormData({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      address: guest.address || "",
      rooms: normalizedRooms,
      roomDiscount: guest.roomDiscount ? guest.roomDiscount.toString() : "0",
      advancePaid: guest.advancePaid ? guest.advancePaid.toString() : "0",
      checkInDate: guest.checkInDate ? format(new Date(guest.checkInDate), "yyyy-MM-dd'T'HH:mm") : "",
      checkOutDate: guest.checkOutDate ? format(new Date(guest.checkOutDate), "yyyy-MM-dd'T'HH:mm") : ""
    });
    setFormErrors({});
    
    // Fetch available rooms for editing
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms?isOccupied=false`, {
        headers: getRequestHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to fetch available rooms");
      const response = await res.json();
      
      let availableRoomsData: Room[] = [];
      if (response && isAPIResponse<Room[]>(response)) {
        availableRoomsData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        availableRoomsData = response;
      }
      setAvailableRooms(availableRoomsData);
    } catch (e) {
      setAvailableRooms([]);
    }
    setShowForm(true);
  };

  const handleAddNewGuest = async () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      rooms: [],
      roomDiscount: "0",
      advancePaid: "0",
      checkInDate: getCurrentDateTimeLocal(),
      checkOutDate: ""
    });
    setFormErrors({});
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms?isOccupied=false`, {
        headers: getRequestHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to fetch available rooms");
      const response = await res.json();
      
      let availableRoomsData: Room[] = [];
      if (response && isAPIResponse<Room[]>(response)) {
        availableRoomsData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        availableRoomsData = response;
      }
      setAvailableRooms(availableRoomsData);
    } catch (e) {
      setAvailableRooms([]);
    }
    setShowForm(true);
  };

  const handleCheckInDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckInDate = e.target.value;
    setFormData(prev => ({ 
      ...prev, 
      checkInDate: newCheckInDate,
      checkOutDate: prev.checkOutDate && new Date(prev.checkOutDate) <= new Date(newCheckInDate) ? "" : prev.checkOutDate
    }));
    if (formErrors.checkInDate) {
      setFormErrors(prev => ({ ...prev, checkInDate: "" }));
    }
  };

  const handleCheckOutDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, checkOutDate: e.target.value }));
    if (formErrors.checkOutDate) {
      setFormErrors(prev => ({ ...prev, checkOutDate: "" }));
    }
  };

  const getMinCheckOutDateTime = () => {
    if (!formData.checkInDate) return getCurrentDateTimeLocal();
    const checkInDate = new Date(formData.checkInDate);
    checkInDate.setHours(checkInDate.getHours() + 1);
    return format(checkInDate, "yyyy-MM-dd'T'HH:mm");
  };
  
  const getRoomNumberFromGuest = (guest: Guest, roomId: string): string => {
    if (guest.checkouts) {
      for (const checkout of guest.checkouts) {
        const foundRoom = checkout.rooms.find(room => room._id === roomId);
        if (foundRoom) {
          return foundRoom.roomNumber;
        }
      }
    }
    const room = allRooms.find(r => r._id === roomId);
    return room ? room.roomNumber : roomId;
  };
  
  const getRoomNumbersFromIds = (roomIds: string[]): string[] => {
    return roomIds.map(roomId => {
      const room = allRooms.find(r => r._id === roomId);
      return room ? room.roomNumber : roomId;
    });
  };

  const normalizeGuestRoomIds = (guest: Guest): string[] => {
    const result: string[] = [];
    const allById = new Map(allRooms.map(r => [r._id, r]));
    const allByNumber = new Map(allRooms.map(r => [r.roomNumber, r]));
    const checkoutById = new Map<string, string>();
    const checkoutByNumberToId = new Map<string, string>();
    
    if (guest.checkouts) {
      for (const co of guest.checkouts) {
        for (const r of co.rooms) {
          checkoutById.set(r._id, r.roomNumber);
          checkoutByNumberToId.set(r.roomNumber, r._id);
        }
      }
    }
    
    for (const value of guest.rooms || []) {
      if (allById.has(value)) {
        result.push(value);
        continue;
      }
      const asIdFromCheckout = checkoutByNumberToId.get(value);
      if (asIdFromCheckout) {
        result.push(asIdFromCheckout);
        continue;
      }
      const byNumber = allByNumber.get(value);
      if (byNumber) {
        result.push(byNumber._id);
        continue;
      }
      result.push(value);
    }
    return Array.from(new Set(result));
  };

  const resolveRoomNumberFromId = (roomId: string): string => {
    const inAll = allRooms.find(r => r._id === roomId);
    if (inAll) return inAll.roomNumber;
    const inAvailable = availableRooms.find(r => r._id === roomId);
    if (inAvailable) return inAvailable.roomNumber;
    const inRoomsList = rooms.find(r => r._id === roomId);
    if (inRoomsList) return inRoomsList.roomNumber;
    if (editingGuest?.checkouts) {
      for (const checkout of editingGuest.checkouts) {
        const found = checkout.rooms.find(r => r._id === roomId);
        if (found) return found.roomNumber;
      }
    }
    return roomId;
  };

  // Generate pagination buttons
  const generatePaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setPage(1)}
          disabled={page === 1 || loading}
        >
          «
        </button>
      );
      
      buttons.push(
        <button
          key="prev"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setPage(page - 1)}
          disabled={page === 1 || loading}
        >
          ‹
        </button>
      );
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            page === i
              ? 'text-white bg-blue-600 border border-blue-600'
              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
          } disabled:opacity-50`}
          onClick={() => setPage(i)}
          disabled={loading}
        >
          {i}
        </button>
      );
    }
    
    if (endPage < totalPages) {
      buttons.push(
        <button
          key="next"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages || loading}
        >
          ›
        </button>
      );
      
      buttons.push(
        <button
          key="last"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages || loading}
        >
          »
        </button>
      );
    }
    
    return buttons;
  };

  if (loading && guests.length === 0) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        navLinks={navLinks}
      />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Guests Management</h1>
          <button
            onClick={handleAddNewGuest}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Guest
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button 
              onClick={() => setError("")} 
              className="float-right text-red-700 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Summary Section */}
        <div className="flex gap-8 mb-6">
          <div className="bg-blue-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-blue-700 text-sm font-semibold">Total Guests</div>
            <div className="text-2xl font-bold text-blue-900">{totalGuests}</div>
          </div>
          <div className="bg-green-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-green-700 text-sm font-semibold">Current Page</div>
            <div className="text-2xl font-bold text-green-900">{guests.length}</div>
          </div>
          <div className="bg-purple-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-purple-700 text-sm font-semibold">Total Pages</div>
            <div className="text-2xl font-bold text-purple-900">{totalPages}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear All Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search (Name, Email, Phone)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search guests..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <input
                type="text"
                value={filters.roomNumber}
                onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Filter by room..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check-out Status</label>
              <select
                value={filters.isCheckedOut}
                onChange={(e) => handleFilterChange('isCheckedOut', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Guests</option>
                <option value="false">Currently Staying</option>
                <option value="true">Checked Out</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading indicator for filter changes */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            Loading guests...
          </div>
        )}

        {/* Guest Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingGuest ? "Edit Guest" : "Add New Guest"}
              </h2>
              
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {/* Form fields remain the same as before */}
                {/* ... */}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {formLoading ? "Saving..." : editingGuest ? "Update Guest" : "Add Guest"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {notification.message}
          </div>
        )}

        {/* Guests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stay Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guests.map((guest) => (
                  <tr key={guest._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {guest.firstName} {guest.lastName}
                        </div>
                        {guest.address && (
                          <div className="text-sm text-gray-500">{guest.address}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guest.email}</div>
                      <div className="text-sm text-gray-500">{guest.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {guest.rooms && guest.rooms.length > 0 ? (
                        guest.rooms.map((roomId, idx) => (
                          <span key={roomId} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                            Room {getRoomNumberFromGuest(guest, roomId)}
                          </span>
                        ))
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No rooms</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>In: {format(new Date(guest.checkInDate), "MMM dd, yyyy HH:mm")}</div>
                        {guest.checkOutDate && (
                          <div>Out: {format(new Date(guest.checkOutDate), "MMM dd, yyyy HH:mm")}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        guest.isCheckedOut 
                          ? "bg-gray-100 text-gray-800" 
                          : "bg-green-100 text-green-800"
                      }`}>
                        {guest.isCheckedOut ? "Checked Out" : "Currently Staying"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{guest.totalBill.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(guest)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {/* Add view orders functionality */}}
                        className="text-green-600 hover:text-green-900"
                      >
                        View Orders
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gray-50 border-t gap-4">
              <div className="text-sm text-gray-700">
                Showing {guests.length} of {totalGuests} guests (Page {page} of {totalPages})
              </div>
              <div className="flex items-center space-x-1">
                {generatePaginationButtons()}
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span>Go to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const newPage = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                    setPage(newPage);
                  }}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {guests.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500">No guests found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{totalGuests}</div>
            <div className="text-sm text-gray-600">Total Guests</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {guests.filter(g => !g.isCheckedOut).length}
            </div>
            <div className="text-sm text-gray-600">Currently Staying</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">
              {guests.filter(g => g.isCheckedOut).length}
            </div>
            <div className="text-sm text-gray-600">Checked Out</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-indigo-600">
              {availableRooms.filter(r => !r.isOccupied).length}
            </div>
            <div className="text-sm text-gray-600">Available Rooms</div>
          </div>
        </div>
      </div>
    </div>
  );
}