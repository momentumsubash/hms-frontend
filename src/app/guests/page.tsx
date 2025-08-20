"use client";

import { getGuests, getRooms, updateGuest, addGuest as createGuest, getMe, getAvailableRooms } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
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
  roomDiscount: string; // store as string for input, convert to number on submit
  advancePaid: string; // store as string for input, convert to number on submit
  checkInDate: string; // Now required as per API
  checkOutDate?: string;
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
  // Hide notification after 3s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
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

  // Filters
  const [filters, setFilters] = useState({
    isCheckedOut: "",
    roomNumber: "",
    search: ""
  });

  useEffect(() => {
    const fetchAll = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("No authentication token");
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch /auth/me
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!meRes.ok) throw new Error("Not authenticated");
        const meData = await meRes.json();
        localStorage.setItem("user", JSON.stringify(meData.data || null));
        // 2. Fetch guests and rooms
        setLoading(true);
        const [guestsRes, roomsRes, allRoomsRes] = await Promise.all([
          getGuests(),
          getAvailableRooms(),
          getRooms(),
        ]);
        
        // Process guests data
        let guestsData: Guest[] = [];
        if (guestsRes && isAPIResponse<Guest[]>(guestsRes)) {
          guestsData = Array.isArray(guestsRes.data) ? guestsRes.data : [];
        } else if (Array.isArray(guestsRes)) {
          guestsData = guestsRes;
        }
        
        // Process available rooms data
        let roomsData: Room[] = [];
        if (roomsRes && isAPIResponse<Room[]>(roomsRes)) {
          roomsData = Array.isArray(roomsRes.data) ? roomsRes.data : [];
        } else if (Array.isArray(roomsRes)) {
          roomsData = roomsRes;
        }

        // Process all rooms data
        let allRoomsData: Room[] = [];
        if (allRoomsRes && isAPIResponse<Room[]>(allRoomsRes)) {
          allRoomsData = Array.isArray(allRoomsRes.data) ? allRoomsRes.data : [];
        } else if (Array.isArray(allRoomsRes)) {
          allRoomsData = allRoomsRes;
        }

        setGuests(guestsData);
        setRooms(roomsData);
        setAvailableRooms(roomsData);
        setAllRooms(allRoomsData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

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

    // Check if check-in date is provided and not in the past (unless editing)
    if (!formData.checkInDate) {
      errors.checkInDate = "Check-in date is required";
    } else {
      const checkInDate = new Date(formData.checkInDate);
      if (!editingGuest && checkInDate < now) {
        errors.checkInDate = "Check-in date cannot be in the past";
      }
    }

    // Check if check-out date is after check-in date
    if (formData.checkOutDate && formData.checkInDate) {
      const checkInDate = new Date(formData.checkInDate);
      const checkOutDate = new Date(formData.checkOutDate);
      if (checkOutDate <= checkInDate) {
        errors.checkOutDate = "Check-out date must be after check-in date";
      }
    }

    // Check if at least one room is selected (only show available rooms in UI)
    if (!formData.rooms || formData.rooms.length === 0) {
      errors.rooms = "At least one room must be selected";
    }



    // Validate discount and advance paid are non-negative numbers
    const roomDiscountValue = parseFloat(formData.roomDiscount || '0');
    const advancePaidValue = parseFloat(formData.advancePaid || '0');
    if (isNaN(roomDiscountValue) || roomDiscountValue < 0) {
      errors.roomDiscount = "Room discount must be a non-negative number";
    }
    if (isNaN(advancePaidValue) || advancePaidValue < 0) {
      errors.advancePaid = "Advance paid must be a non-negative number";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Phone validation (basic)
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
        // Convert all selected room IDs to room numbers for the update
        const roomNumbers = formData.rooms.map(resolveRoomNumberFromId);

        // Get hotel ID from localStorage or user object for updates
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
          rooms: roomNumbers, // Send all selected rooms as room numbers
          hotel: hotelId, // Include hotel ID in updates
          checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined,
          roomDiscount: parseFloat(formData.roomDiscount || '0') || 0,
          advancePaid: parseFloat(formData.advancePaid || '0') || 0,
        };
        
        console.log('Submitting guest update with payload:', updatePayload);
        console.log('Hotel ID automatically populated from localStorage:', hotelId);
        console.log('Rooms being sent (as room numbers):', roomNumbers);
        console.log('Update payload structure matches cURL format:', {
          firstName: updatePayload.firstName,
          lastName: updatePayload.lastName,
          phone: updatePayload.phone,
          address: updatePayload.address,
          rooms: updatePayload.rooms,
          checkOutDate: updatePayload.checkOutDate,
          roomDiscount: updatePayload.roomDiscount,
          advancePaid: updatePayload.advancePaid
        });
        resp = await updateGuest(editingGuest._id, updatePayload);
      } else {
        // Convert room IDs to room numbers for API
        const roomNumbers = formData.rooms.map(resolveRoomNumberFromId);

        // Get hotel ID from localStorage or user object
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
          rooms: roomNumbers, // Send room numbers instead of IDs
          hotel: hotelId,
          checkInDate: new Date(formData.checkInDate).toISOString(),
          checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined,
          roomDiscount: parseFloat(formData.roomDiscount || '0') || 0,
          advancePaid: parseFloat(formData.advancePaid || '0') || 0,
        };
        
        console.log('Submitting guest creation with payload:', createPayload);
        console.log('Hotel ID automatically populated from localStorage:', hotelId);
        resp = await createGuest(createPayload);
      }
      // Refresh guests and rooms
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const [guestsRes, roomsRes] = await Promise.all([
          getGuests(),
          getAvailableRooms(),
        ]);
        
        const guestsData = guestsRes?.data || [];
        const roomsData = roomsRes?.data || [];
        
        setGuests(Array.isArray(guestsData) ? guestsData : []);
        setRooms(Array.isArray(roomsData) ? roomsData : []);
      }
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
    // Set form data with existing guest details, including room IDs
    setFormData({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      address: guest.address || "",
      rooms: guest.rooms || [], // Store room IDs here
      roomDiscount: guest.roomDiscount ? guest.roomDiscount.toString() : "0",
      advancePaid: guest.advancePaid ? guest.advancePaid.toString() : "0",
      checkInDate: guest.checkInDate ? format(new Date(guest.checkInDate), "yyyy-MM-dd'T'HH:mm") : "",
      checkOutDate: guest.checkOutDate ? format(new Date(guest.checkOutDate), "yyyy-MM-dd'T'HH:mm") : ""
    });
    setFormErrors({});
    // Fetch available rooms
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");
      const res = await fetch("http://localhost:3000/api/rooms?isOccupied=false", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
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
      const res = await fetch("http://localhost:3000/api/rooms?isOccupied=false", {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
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
  
  // Helper to map room IDs to room numbers
  const getRoomNumbersFromIds = (roomIds: string[]): string[] => {
    return roomIds.map(roomId => {
      const room = allRooms.find(r => r._id === roomId);
      return room ? room.roomNumber : roomId;
    });
  };

  // Resolve a single room ID to its room number by checking multiple sources
  const resolveRoomNumberFromId = (roomId: string): string => {
    // 1) Check all rooms (complete catalog)
    const inAll = allRooms.find(r => r._id === roomId);
    if (inAll) return inAll.roomNumber;
    // 2) Check available rooms list
    const inAvailable = availableRooms.find(r => r._id === roomId);
    if (inAvailable) return inAvailable.roomNumber;
    // 3) Check the "rooms" state list
    const inRoomsList = rooms.find(r => r._id === roomId);
    if (inRoomsList) return inRoomsList.roomNumber;
    // 4) Check current guest's checkouts snapshot (if editing)
    if (editingGuest?.checkouts) {
      for (const checkout of editingGuest.checkouts) {
        const found = checkout.rooms.find(r => r._id === roomId);
        if (found) return found.roomNumber;
      }
    }
    // Fallback: return the original id so API can handle existing rooms
    return roomId;
  };

  const filteredGuests = guests.filter(guest => {
    const matchesCheckedOut = filters.isCheckedOut === "" || 
      guest.isCheckedOut.toString() === filters.isCheckedOut;
    
    const roomNumbers = getRoomNumbersFromIds(guest.rooms);
    const matchesRoom = filters.roomNumber === "" || 
      (roomNumbers && roomNumbers.some(r => r.toLowerCase().includes(filters.roomNumber.toLowerCase())));
      
    const matchesSearch = filters.search === "" || 
      `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
      guest.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      guest.phone.includes(filters.search);
    return matchesCheckedOut && matchesRoom && matchesSearch;
  });

  const totalPages = Math.ceil(filteredGuests.length / limit);
  const paginatedGuests = filteredGuests.slice((page - 1) * limit, page * limit);

  useEffect(() => { setPage(1); }, [filters]);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search (Name, Email, Phone)</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Search guests..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Room Number</label>
            <input
              type="text"
              value={filters.roomNumber}
              onChange={(e) => setFilters(prev => ({ ...prev, roomNumber: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Filter by room..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Check-out Status</label>
            <select
              value={filters.isCheckedOut}
              onChange={(e) => setFilters(prev => ({ ...prev, isCheckedOut: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">All Guests</option>
              <option value="false">Currently Staying</option>
              <option value="true">Checked Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guest Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingGuest ? "Edit Guest" : "Add New Guest"}
            </h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, email: e.target.value }));
                      if (formErrors.email) {
                        setFormErrors(prev => ({ ...prev, email: "" }));
                      }
                    }}
                    className={`w-full border rounded px-3 py-2 ${formErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.email && <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, phone: e.target.value }));
                      if (formErrors.phone) {
                        setFormErrors(prev => ({ ...prev, phone: "" }));
                      }
                    }}
                    className={`w-full border rounded px-3 py-2 ${formErrors.phone ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.phone && <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                />
              </div>


                             <div>
                 <label className="block text-sm font-medium mb-1">Rooms *</label>
                 <div className={`grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded px-3 py-2 ${formErrors.rooms ? 'border-red-500' : 'border-gray-300'}`}>
                   {(() => {
                     let roomList = availableRooms.length > 0 ? [...availableRooms] : [...rooms];
                     if (editingGuest) {
                         const occupiedRooms = allRooms.filter(r => editingGuest.rooms.includes(r._id));
                         roomList = [...roomList, ...occupiedRooms];
                     }
                     roomList = roomList.filter((r, idx, arr) => arr.findIndex(rr => rr._id === r._id) === idx);
                     return roomList.map(room => (
                       <label key={room._id} className="flex items-center space-x-2">
                         <input
                           type="checkbox"
                           value={room._id}
                           checked={formData.rooms.includes(room._id)}
                           onChange={e => {
                             const checked = e.target.checked;
                             setFormData(prev => {
                               let newRooms = prev.rooms || [];
                               if (checked) {
                                 newRooms = [...newRooms, room._id];
                               } else {
                                 newRooms = newRooms.filter(rn => rn !== room._id);
                               }
                               return { ...prev, rooms: newRooms };
                             });
                             if (formErrors.rooms) setFormErrors(prev => ({ ...prev, rooms: "" }));
                           }}
                           className="form-checkbox"
                         />
                         <span>
                           Room {room.roomNumber} - {room.type} (₹{room.rate}/night)
                         </span>
                       </label>
                     ));
                   })()}
                 </div>
                 <div className="text-xs text-gray-500 mt-1">
                   {editingGuest 
                     ? "Select rooms for the guest. Existing rooms will be handled by the API." 
                     : "Select one or more currently available rooms for the guest."
                   }
                 </div>
                 {formErrors.rooms && <p className="text-red-500 text-xs mt-1">{formErrors.rooms}</p>}
               </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Room Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.roomDiscount}
                    onChange={e => setFormData(prev => ({ ...prev, roomDiscount: e.target.value }))}
                    className={`w-full border rounded px-3 py-2 ${formErrors.roomDiscount ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.roomDiscount && <p className="text-red-500 text-xs mt-1">{formErrors.roomDiscount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Advance Paid (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.advancePaid}
                    onChange={e => setFormData(prev => ({ ...prev, advancePaid: e.target.value }))}
                    className={`w-full border rounded px-3 py-2 ${formErrors.advancePaid ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.advancePaid && <p className="text-red-500 text-xs mt-1">{formErrors.advancePaid}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Check-in Date *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.checkInDate}
                    onChange={handleCheckInDateChange}
                    min={editingGuest ? undefined : getCurrentDateTimeLocal()}
                    className={`w-full border rounded px-3 py-2 ${formErrors.checkInDate ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.checkInDate && <p className="text-red-500 text-xs mt-1">{formErrors.checkInDate}</p>}
                  {!editingGuest && <p className="text-xs text-gray-500 mt-1">Defaults to current date and time</p>}
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Check-out Date</label>
                  <input
                    type="datetime-local"
                    value={formData.checkOutDate}
                    onChange={handleCheckOutDateChange}
                    min={getMinCheckOutDateTime()}
                    className={`w-full border rounded px-3 py-2 ${formErrors.checkOutDate ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  {formErrors.checkOutDate && <p className="text-red-500 text-xs mt-1">{formErrors.checkOutDate}</p>}
                  <p className="text-xs text-gray-500 mt-1">Must be after check-in date</p>
                </div>
              </div>

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
                {paginatedGuests.map((guest) => (
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
          <div className="flex justify-center items-center gap-2 mt-4">
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >Prev</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded border ${page === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'}`}
                onClick={() => setPage(i + 1)}
              >{i + 1}</button>
            ))}
            <button
              className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
            >Next</button>
          </div>
        )}

        {filteredGuests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No guests found matching your criteria.</div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{guests.length}</div>
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
            {rooms.filter(r => !r.isOccupied).length}
          </div>
          <div className="text-sm text-gray-600">Available Rooms</div>
        </div>
      </div>
      </div>
    </div>
  );
}