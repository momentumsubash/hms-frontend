"use client";

import { getRooms, updateRoom, updateRoomMaintenance } from "@/lib/api";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { useEffect, useState, useCallback } from "react";

export default function RoomsPage() {
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [hotel, setHotel] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Pagination and filter state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);
  
  const [filters, setFilters] = useState({
    type: "",
    isOccupied: "",
    roomNumber: ""
  });

  // Debounce search inputs
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  
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
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  
  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editRoom, setEditRoom] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({
    type: "",
    rate: 0,
    amenities: [],
    isOccupied: false,
    capacity: 1,
    maintanenceStatus: "",
  });
  const [editLoading, setEditLoading] = useState(false);

  // Add room modal state
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<any>({
    roomNumber: "",
    type: "",
    rate: 0,
    description: "",
    amenities: [],
    isOccupied: false,
    capacity: 1,
    maintanenceStatus: "",
  });
  const [addLoading, setAddLoading] = useState(false);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Room details modal state
  const [showDetails, setShowDetails] = useState(false);
  const [roomDetails, setRoomDetails] = useState<any>(null);

  // Helper function to get standard headers
  const getRequestHeaders = (token: string) => {
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Load data with server-side filtering and pagination - UPDATED FOR YOUR API FORMAT
  const loadData = useCallback(async (resetPage = false, customFilters?: typeof filters) => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");

      // Use custom filters if provided, otherwise use current filters
      const currentFilters = customFilters || filters;
      const currentPage = resetPage ? 1 : page;

      // Build query parameters exactly like the curl example
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', limit.toString());
      
      // Add filters if they exist
      if (currentFilters.type) queryParams.append('type', currentFilters.type);
      if (currentFilters.isOccupied !== "") queryParams.append('isOccupied', currentFilters.isOccupied);
      if (currentFilters.roomNumber) queryParams.append('roomNumber', currentFilters.roomNumber);

      // Make the API call exactly like the curl example
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms?${queryParams.toString()}`, {
        method: 'GET',
        headers: getRequestHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch rooms');
      }

      const data = await response.json();
      // Handle the specific response structure from your API
      let roomsData = [];
      let totalCount = 0;
      let totalPagesCount = 0;
      let currentPageNum = 1;

      if (data.success && Array.isArray(data.data)) {
        // Structure: { success: true, data: [], pagination: {}, roomCount: number }
        roomsData = data.data;
        totalCount = data.roomCount || data.pagination?.total || 0;
        totalPagesCount = data.pagination?.pages || Math.ceil(totalCount / limit);
        currentPageNum = data.pagination?.page || currentPage;
      } else if (Array.isArray(data)) {
        // Fallback: simple array response
        roomsData = data;
        totalCount = data.length;
        totalPagesCount = Math.ceil(totalCount / limit);
      } else {
        // Fallback - ensure roomsData is always an array
        roomsData = [];
        totalCount = 0;
        totalPagesCount = 0;
      }

      setRooms(roomsData);
      setTotalPages(totalPagesCount);
      setTotalRooms(totalCount);
      
      // Update page if it's different from what API returned
      if (currentPageNum !== page) {
        setPage(currentPageNum);
      }

      if (resetPage) {
        setPage(1);
      }
    } catch (e: any) {
      console.error('Error loading rooms:', e);
      setError(e.message);
      setRooms([]);
      setTotalPages(0);
      setTotalRooms(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  // Handle filter changes with debouncing for search inputs
  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    
    // Clear existing timeout
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }
    
    // Set a new timeout to debounce the API call for search inputs
    if (filterKey === 'roomNumber') {
      setSearchDebounce(setTimeout(() => {
        loadData(true, newFilters);
      }, 1000));
    } else {
      // For other filters, apply immediately
      loadData(true, newFilters);
    }
  };

  useEffect(() => {
    // Initial data load
    const fetchAll = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setUser(null);
        return;
      }
      try {
        // 1. /auth/me
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
          headers: getRequestHeaders(token),
        });
        if (!meRes.ok) throw new Error("Not authenticated");
        const meData = await meRes.json();
        setUser(meData.data || null);
        localStorage.setItem('user', JSON.stringify(meData.data || null));
        
        // 2. /hotels/me
        const hotelRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hotels/me`, {
          headers: getRequestHeaders(token),
        });
        if (hotelRes.ok) {
          const hotelData = await hotelRes.json();
          const hotelInfo = hotelData.data || null;
          setHotel(hotelInfo);
          localStorage.setItem('hotel', JSON.stringify(hotelInfo));
        }
        
        // 3. Load rooms with initial filters
        await loadData();
      } catch (e: any) {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('hotel');
      }
    };
    fetchAll();
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

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Create room function
  const createRoom = async (roomData: any) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No authentication token");

    const storedHotel = typeof window !== "undefined" ? localStorage.getItem("hotel") : null;
    const hotelData = storedHotel ? JSON.parse(storedHotel) : hotel;
    
    if (!hotelData || !hotelData._id) {
      throw new Error("Hotel information not found");
    }

    const roomDataWithHotel = {
      ...roomData,
      hotel: hotelData._id
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: {
        ...getRequestHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roomDataWithHotel),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      const errorMessage = responseData?.message || 'Failed to create room';
      throw new Error(errorMessage);
    }

    return responseData;
  };

  // Delete room function
  const deleteRoom = async (roomNumber: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No authentication token");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms/${roomNumber}`, {
      method: 'DELETE',
      headers: getRequestHeaders(token),
    });

    if (!response.ok) {
      const responseData = await response.json();
      const errorMessage = responseData?.message || 'Failed to delete room';
      throw new Error(errorMessage);
    }

    return await response.json();
  };

  // Update room function
  const updateRoomLocal = async (roomNumber: string, roomData: any) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No authentication token");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms/${roomNumber}`, {
      method: 'PUT',
      headers: {
        ...getRequestHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(roomData),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      const errorMessage = responseData?.message || 'Failed to update room';
      throw new Error(errorMessage);
    }

    return responseData;
  };

  // Update room maintenance function
  const updateRoomMaintenanceLocal = async (roomNumber: string, status: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No authentication token");

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms/${roomNumber}/maintenance`, {
      method: 'PUT',
      headers: {
        ...getRequestHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maintenanceStatus: status }),
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      const errorMessage = responseData?.message || 'Failed to update room maintenance';
      throw new Error(errorMessage);
    }

    return responseData;
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      type: "",
      isOccupied: "",
      roomNumber: ""
    };
    setFilters(clearedFilters);
    loadData(true, clearedFilters);
  };

  // Generate pagination buttons
  const generatePaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First and previous buttons
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
    
    // Page number buttons
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
    
    // Next and last buttons
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

  if (loading && rooms.length === 0) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }
  
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
          <h1 className="text-3xl font-bold">Rooms Management</h1>
          <button
            onClick={() => {
              setAddForm({
                roomNumber: "",
                type: "",
                rate: 0,
                description: "",
                amenities: [],
                isOccupied: false,
                capacity: 1,
                maintanenceStatus: "",
              });
              setShowAdd(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add New Room
          </button>
        </div>

        {/* Summary Section - UPDATED */}
        <div className="flex gap-8 mb-6">
          <div className="bg-blue-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-blue-700 text-sm font-semibold">Total Rooms</div>
            <div className="text-2xl font-bold text-blue-900">{totalRooms}</div>
          </div>
          <div className="bg-green-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-green-700 text-sm font-semibold">Current Page</div>
            <div className="text-2xl font-bold text-green-900">{rooms.length} of {Math.min(limit, totalRooms - (page - 1) * limit)}</div>
          </div>
          <div className="bg-purple-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-purple-700 text-sm font-semibold">Page Info</div>
            <div className="text-2xl font-bold text-purple-900">{page} / {totalPages}</div>
          </div>
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
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear All Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <input
                type="text"
                value={filters.roomNumber}
                onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search by room number..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room Type</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Types</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="suite">Suite</option>
                <option value="deluxe">Deluxe</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Occupancy Status</label>
              <select
                value={filters.isOccupied}
                onChange={(e) => handleFilterChange('isOccupied', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Rooms</option>
                <option value="true">Occupied</option>
                <option value="false">Available</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading indicator for filter changes */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            Loading rooms...
          </div>
        )}

        {/* Rooms Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amenities</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupied</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(rooms) && rooms.length > 0 ? (
                  rooms.map((room: any) => (
                    <tr key={room._id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap font-medium">{room.roomNumber}</td>
                      <td className="px-4 py-4 whitespace-nowrap capitalize">{room.type}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {room.amenities && room.amenities.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {room.amenities.slice(0, 3).map((a: string, i: number) => (
                              <span key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{a}</span>
                            ))}
                            {room.amenities.length > 3 && (
                              <span className="text-gray-500 text-xs">+{room.amenities.length - 3}</span>
                            )}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">{room.capacity}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{room.hotel?.name || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{room.guestName || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{room.guestPhone || '-'}</td>
                      <td className="px-4 py-4 whitespace-nowrap">रु{room.rate}</td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {room.isOccupied ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            Occupied
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Available
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {(room.maintenanceStatus || room.maintanenceStatus) ? (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {(room.maintenanceStatus || room.maintanenceStatus)}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            onClick={() => {
                              setRoomDetails(room);
                              setShowDetails(true);
                            }}
                          >
                            View
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                            onClick={() => {
                              setEditRoom(room);
                              setEditForm({
                                type: room.type,
                                rate: room.rate,
                                amenities: room.amenities || [],
                                isOccupied: room.isOccupied,
                                capacity: room.capacity,
                                maintanenceStatus: (room.maintenanceStatus || room.maintanenceStatus || ""),
                              });
                              setShowEdit(true);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                            onClick={() => {
                              setRoomToDelete(room);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                      {loading ? 'Loading rooms...' : 'No rooms found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination Controls - UPDATED */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gray-50 border-t gap-4">
              <div className="text-sm text-gray-700">
                Showing {rooms.length} rooms (Page {page} of {totalPages}, Total: {totalRooms})
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

          {(!Array.isArray(rooms) || rooms.length === 0) && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg mb-2">No rooms found</div>
              <div className="text-gray-400 text-sm">
                {Object.values(filters).some(f => f !== "") 
                  ? "Try adjusting your filters or clearing them to see more results."
                  : "Get started by adding your first room."
                }
              </div>
              {Object.values(filters).some(f => f !== "") && (
                <button
                  onClick={clearFilters}
                  className="mt-3 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Room Details Modal */}
        {showDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Room Details - {roomDetails?.roomNumber}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Room Number</label>
                  <div className="text-lg font-medium">{roomDetails?.roomNumber}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Type</label>
                  <div className="text-lg capitalize">{roomDetails?.type}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Rate</label>
                  <div className="text-lg">रु{roomDetails?.rate}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Description</label>
                  <div className="text-lg">{roomDetails?.description || 'No description available'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {roomDetails?.amenities && roomDetails.amenities.length > 0 ? (
                      roomDetails.amenities.map((a: string, i: number) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {a}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No amenities</span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Capacity</label>
                  <div className="text-lg">{roomDetails?.capacity}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Hotel</label>
                  <div className="text-lg">{roomDetails?.hotel?.name || '-'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Occupied</label>
                  <div className="text-lg">
                    {roomDetails?.isOccupied ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Occupied
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Available
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Maintenance Status</label>
                  <div className="text-lg">
                    {(roomDetails?.maintenanceStatus || roomDetails?.maintanenceStatus) ? (
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {(roomDetails?.maintenanceStatus || roomDetails?.maintanenceStatus)}
                      </span>
                    ) : 'No maintenance'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Created At</label>
                  <div className="text-lg">
                    {roomDetails?.createdAt ? new Date(roomDetails.createdAt).toLocaleDateString() : '-'}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500">Updated At</label>
                  <div className="text-lg">
                    {roomDetails?.updatedAt ? new Date(roomDetails.updatedAt).toLocaleDateString() : '-'}
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Room Modal */}
        {showAdd && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Add New Room</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setAddLoading(true);
                  try {
                    await createRoom({
                      roomNumber: addForm.roomNumber,
                      type: addForm.type,
                      rate: Number(addForm.rate),
                      description: addForm.description,
                      amenities: Array.isArray(addForm.amenities)
                        ? addForm.amenities.filter((a: string) => a.trim() !== "")
                        : [],
                      isOccupied: addForm.isOccupied,
                      capacity: Number(addForm.capacity),
                      maintenanceStatus: addForm.maintanenceStatus || undefined,
                    });
                    
                    setShowAdd(false);
                    showToast("Room created successfully!", "success");
                    await loadData(true);
                  } catch (e: any) {
                    const errorMessage = e.message || 'An unexpected error occurred';
                    showToast(errorMessage, "error");
                  } finally {
                    setAddLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Room Number</label>
                  <input
                    type="text"
                    value={addForm.roomNumber}
                    onChange={e => setAddForm((f: any) => ({ ...f, roomNumber: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={addForm.type}
                    onChange={e => setAddForm((f: any) => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="suite">Suite</option>
                    <option value="deluxe">Deluxe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rate</label>
                  <input
                    type="number"
                    value={addForm.rate}
                    onChange={e => setAddForm((f: any) => ({ ...f, rate: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={addForm.description}
                    onChange={e => setAddForm((f: any) => ({ ...f, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amenities (comma separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(addForm.amenities) ? addForm.amenities.join(", ") : ""}
                    onChange={e => setAddForm((f: any) => ({ ...f, amenities: e.target.value.split(",").map((a: string) => a.trim()) }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Occupied</label>
                  <select
                    value={addForm.isOccupied ? "true" : "false"}
                    onChange={e => setAddForm((f: any) => ({ ...f, isOccupied: e.target.value === "true" }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input
                    type="number"
                    value={addForm.capacity}
                    onChange={e => setAddForm((f: any) => ({ ...f, capacity: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={addLoading}
                  >Cancel</button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={addLoading}
                  >{addLoading ? "Creating..." : "Create Room"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Room Modal */}
        {showEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">Edit Room {editRoom?.roomNumber}</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setEditLoading(true);
                  try {
                    await updateRoomLocal(editRoom.roomNumber, {
                      type: editForm.type,
                      rate: Number(editForm.rate),
                      amenities: Array.isArray(editForm.amenities)
                        ? editForm.amenities.filter((a: string) => a.trim() !== "")
                        : [],
                      capacity: Number(editForm.capacity),
                    });

                    if (editForm.maintanenceStatus) {
                      await updateRoomMaintenanceLocal(editRoom.roomNumber, editForm.maintanenceStatus);
                    }

                    setShowEdit(false);
                    setEditRoom(null);
                    showToast("Room updated successfully!", "success");
                    await loadData();
                  } catch (e: any) {
                    const errorMessage = e.message || 'An unexpected error occurred while updating the room';
                    showToast(errorMessage, "error");
                  } finally {
                    setEditLoading(false);
                  }
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    value={editForm.type}
                    onChange={e => setEditForm((f: any) => ({ ...f, type: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="">Select Type</option>
                    <option value="single">Single</option>
                    <option value="double">Double</option>
                    <option value="suite">Suite</option>
                    <option value="deluxe">Deluxe</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rate</label>
                  <input
                    type="number"
                    value={editForm.rate}
                    onChange={e => setEditForm((f: any) => ({ ...f, rate: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Amenities (comma separated)</label>
                  <input
                    type="text"
                    value={Array.isArray(editForm.amenities) ? editForm.amenities.join(", ") : ""}
                    onChange={e => setEditForm((f: any) => ({ ...f, amenities: e.target.value.split(",").map((a: string) => a.trim()) }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Occupied</label>
                  <select
                    value={editForm.isOccupied ? "true" : "false"}
                    onChange={e => setEditForm((f: any) => ({ ...f, isOccupied: e.target.value === "true" }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="false">No</option>
                    <option value="true">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Capacity</label>
                  <input
                    type="number"
                    value={editForm.capacity}
                    onChange={e => setEditForm((f: any) => ({ ...f, capacity: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Maintenance Status</label>
                  <select
                    value={editForm.maintanenceStatus}
                    onChange={e => setEditForm((f: any) => ({ ...f, maintanenceStatus: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">No Maintenance</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEdit(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    disabled={editLoading}
                  >Cancel</button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={editLoading}
                  >{editLoading ? "Saving..." : "Update Room"}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="mb-6">Are you sure you want to delete room {roomToDelete?.roomNumber}? This action cannot be undone.</p>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRoomToDelete(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={deleteLoading}
                >Cancel</button>
                <button
                  onClick={async () => {
                    setDeleteLoading(true);
                    try {
                      await deleteRoom(roomToDelete.roomNumber);
                      
                      setShowDeleteConfirm(false);
                      setRoomToDelete(null);
                      showToast("Room deleted successfully!", "success");
                      await loadData(true);
                    } catch (e: any) {
                      const errorMessage = e.message || 'An unexpected error occurred while deleting the room';
                      if (errorMessage.includes('occupied') || errorMessage.includes('checkout')) {
                        showToast("Cannot delete room: Room is currently occupied or has active checkouts", "error");
                      } else {
                        showToast(errorMessage, "error");
                      }
                    } finally {
                      setDeleteLoading(false);
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  disabled={deleteLoading}
                >{deleteLoading ? "Deleting..." : "Delete"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <div 
            className={`fixed bottom-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
              toast.type === 'error' 
                ? 'bg-red-500 text-white border border-red-600' 
                : 'bg-green-500 text-white border border-green-600'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">{toast.message}</span>
              <button
                onClick={() => setToast(null)}
                className="ml-3 text-white hover:text-gray-200"
              >
                ×
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}