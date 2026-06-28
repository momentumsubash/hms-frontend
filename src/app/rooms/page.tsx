"use client";

import { getRooms, updateRoom, updateRoomMaintenance } from "@/lib/api";
import { DashboardLayout } from "@/components/dashboard-layout";
import { PaginationControls } from "@/components/ui/pagination-controls";
import React, { useEffect, useState, useCallback } from "react";
import { Bed, Users, Plus, Eye, Edit, Trash2, Search, X, SlidersHorizontal, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RoomsPage() {
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
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'hotel') {
        setHotel(event.newValue ? JSON.parse(event.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRooms, setTotalRooms] = useState(0);
  
  const [filters, setFilters] = useState({
    type: "",
    isOccupied: "",
    roomNumber: ""
  });

  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);
  
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);
  
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<any>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [showDetails, setShowDetails] = useState(false);
  const [roomDetails, setRoomDetails] = useState<any>(null);

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [editFormErrors, setEditFormErrors] = useState<{[key: string]: string}>({});
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRow = (id: string) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const resetFormErrors = () => setFormErrors({});
  const resetEditFormErrors = () => setEditFormErrors({});

  const validateAddForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    if (!addForm.roomNumber || addForm.roomNumber.trim() === '') errors.roomNumber = 'Room number is required';
    if (!addForm.type) errors.type = 'Room type is required';
    if (!addForm.rate || Number(addForm.rate) <= 0) errors.rate = 'Rate must be greater than 0';
    if (!addForm.capacity || Number(addForm.capacity) <= 0) errors.capacity = 'Capacity must be greater than 0';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = (): boolean => {
    const errors: {[key: string]: string} = {};
    if (!editForm.type) errors.type = 'Room type is required';
    if (!editForm.rate || Number(editForm.rate) <= 0) errors.rate = 'Rate must be greater than 0';
    if (!editForm.capacity || Number(editForm.capacity) <= 0) errors.capacity = 'Capacity must be greater than 0';
    setEditFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const getRequestHeaders = (token: string) => {
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadData = useCallback(async (resetPage = false, customFilters?: typeof filters) => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");

      const currentFilters = customFilters || filters;
      const currentPage = resetPage ? 1 : page;

      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', limit.toString());
      if (currentFilters.type) queryParams.append('type', currentFilters.type);
      if (currentFilters.isOccupied !== "") queryParams.append('isOccupied', currentFilters.isOccupied);
      if (currentFilters.roomNumber) queryParams.append('roomNumber', currentFilters.roomNumber);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms?${queryParams.toString()}`, {
        method: 'GET',
        headers: getRequestHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch rooms');
      }

      const data = await response.json();
      let roomsData = [];
      let totalCount = 0;
      let totalPagesCount = 0;
      let currentPageNum = 1;

      if (data.success && Array.isArray(data.data)) {
        roomsData = data.data;
        totalCount = data.roomCount || data.pagination?.total || 0;
        totalPagesCount = data.pagination?.pages || Math.ceil(totalCount / limit);
        currentPageNum = data.pagination?.page || currentPage;
      } else if (Array.isArray(data)) {
        roomsData = data;
        totalCount = data.length;
        totalPagesCount = Math.ceil(totalCount / limit);
      }

      setRooms(roomsData);
      setTotalPages(totalPagesCount);
      setTotalRooms(totalCount);
      if (currentPageNum !== page) setPage(currentPageNum);
      if (resetPage) setPage(1);
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

  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    if (searchDebounce) clearTimeout(searchDebounce);
    if (filterKey === 'roomNumber') {
      setSearchDebounce(setTimeout(() => loadData(true, newFilters), 1000));
    } else {
      loadData(true, newFilters);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) { setUser(null); return; }
      try {
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, { headers: getRequestHeaders(token) });
        if (!meRes.ok) throw new Error("Not authenticated");
        const meData = await meRes.json();
        setUser(meData.data || null);
        localStorage.setItem('user', JSON.stringify(meData.data || null));
        const hotelRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hotels/me`, { headers: getRequestHeaders(token) });
        if (hotelRes.ok) {
          const hotelData = await hotelRes.json();
          const hotelInfo = hotelData.data || null;
          setHotel(hotelInfo);
          localStorage.setItem('hotel', JSON.stringify(hotelInfo));
        }
        await loadData();
      } catch (e: any) {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('hotel');
      }
    };
    fetchAll();
  }, []);

  useEffect(() => { loadData(false); }, [page, loadData]);

  useEffect(() => {
    return () => { if (searchDebounce) clearTimeout(searchDebounce); };
  }, [searchDebounce]);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const createRoom = async (roomData: any) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No authentication token");
    const storedHotel = typeof window !== "undefined" ? localStorage.getItem("hotel") : null;
    const hotelData = storedHotel ? JSON.parse(storedHotel) : hotel;
    if (!hotelData || !hotelData._id) throw new Error("Hotel information not found");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms`, {
      method: 'POST',
      headers: { ...getRequestHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...roomData, hotel: hotelData._id }),
    });
    const responseData = await response.json();
    if (!response.ok) {
      if (responseData.details) {
        const fieldMatch = responseData.details.match(/"(\w+)"/);
        if (fieldMatch) setFormErrors({ [fieldMatch[1]]: responseData.details });
      }
      throw new Error(responseData?.message || 'Failed to create room');
    }
    return responseData;
  };

  const deleteRoom = async (roomNumber: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No authentication token");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms/${roomNumber}`, {
      method: 'DELETE',
      headers: getRequestHeaders(token),
    });
    if (!response.ok) {
      const responseData = await response.json();
      throw new Error(responseData?.message || 'Failed to delete room');
    }
    return await response.json();
  };

  const updateRoomLocal = async (roomNumber: string, roomData: any) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No authentication token");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms/${roomNumber}`, {
      method: 'PUT',
      headers: { ...getRequestHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });
    const responseData = await response.json();
    if (!response.ok) {
      if (responseData.details) {
        const fieldMatch = responseData.details.match(/"(\w+)"/);
        if (fieldMatch) setEditFormErrors({ [fieldMatch[1]]: responseData.details });
      }
      throw new Error(responseData?.message || 'Failed to update room');
    }
    return responseData;
  };

  const updateRoomMaintenanceLocal = async (roomNumber: string, status: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No authentication token");
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms/${roomNumber}/maintenance`, {
      method: 'PUT',
      headers: { ...getRequestHeaders(token), 'Content-Type': 'application/json' },
      body: JSON.stringify({ maintenanceStatus: status }),
    });
    if (!response.ok) {
      const responseData = await response.json();
      throw new Error(responseData?.message || 'Failed to update room maintenance');
    }
    return await response.json();
  };

  const clearFilters = () => {
    const clearedFilters = { type: "", isOccupied: "", roomNumber: "" };
    setFilters(clearedFilters);
    loadData(true, clearedFilters);
  };

  const Modal = ({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode }) => show ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-xl shadow-elevated animate-scale-in overflow-hidden border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  ) : null;

  const FormField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );

  if (loading && rooms.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading rooms...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-5">

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-5 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:bg-destructive/10 rounded transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={filters.roomNumber}
                onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                placeholder="Search by room number..."
                data-cy="rooms-search"
              />
              {filters.roomNumber && (
                <button onClick={() => handleFilterChange('roomNumber', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-all shrink-0 ${showMobileFilters ? 'bg-primary text-white border-primary' : 'bg-muted/50 border-input text-muted-foreground hover:text-foreground'}`}
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[120px]"
              data-cy="rooms-type-filter"
            >
              <option value="">All Types</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="suite">Suite</option>
              <option value="deluxe">Deluxe</option>
            </select>
            <select
              value={filters.isOccupied}
              onChange={(e) => handleFilterChange('isOccupied', e.target.value)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[120px]"
              data-cy="rooms-occupied-filter"
            >
              <option value="">All Rooms</option>
              <option value="true">Occupied</option>
              <option value="false">Available</option>
            </select>
            {(filters.roomNumber || filters.type || filters.isOccupied) && (
              <button onClick={clearFilters} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0" data-cy="rooms-clear-filters">
                Clear
              </button>
            )}
            <Button onClick={() => { setAddForm({ roomNumber: "", type: "", rate: 0, description: "", amenities: [], isOccupied: false, capacity: 1, maintanenceStatus: "" }); setShowAdd(true); }} className="ml-auto shrink-0" data-cy="rooms-add-new">
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          </div>
        </div>

        {showMobileFilters && (
          <div className="mt-3 space-y-2 md:hidden">
            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={() => setShowMobileSummary(!showMobileSummary)}
                className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-xs font-medium flex items-center gap-1.5"
              >
                <Info className="w-3.5 h-3.5" />
                {showMobileSummary ? 'Hide' : 'Show'} Stats
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-primary/5 border border-primary/10 rounded-lg px-5 py-3 flex items-center gap-2.5">
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading rooms...</span>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-cy="rooms-table">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Room #</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Amenities</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Guest Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Occupied</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Maintenance</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.isArray(rooms) && rooms.length > 0 ? (
                  rooms.map((room: any) => (
                    <tr key={room._id} onClick={() => toggleRow(room._id)} className="hover:bg-muted/30 transition-colors cursor-pointer md:cursor-auto" data-cy={`rooms-row-${room._id}`}>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-sm">{room.roomNumber}</td>
                      <td className="px-4 py-3 whitespace-nowrap capitalize text-sm hidden md:table-cell">{room.type}</td>
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                        {room.amenities && room.amenities.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[200px]">
                            {room.amenities.slice(0, 3).map((a: string, i: number) => (
                              <Badge key={i} variant="secondary" className="text-xs rounded px-1.5 py-0.5 font-normal">{a}</Badge>
                            ))}
                            {room.amenities.length > 3 && (
                              <span className="text-muted-foreground text-xs">+{room.amenities.length - 3}</span>
                            )}
                          </div>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm hidden md:table-cell">{room.capacity}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm hidden md:table-cell">{room.guestName || '-'}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium text-sm hidden md:table-cell">रु{room.rate}</td>
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                        {room.isOccupied ? (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-destructive/10 text-destructive border border-destructive/20">Occupied</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Available</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap hidden md:table-cell">
                        {(room.maintenanceStatus || room.maintanenceStatus) ? (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700 border border-amber-200">{(room.maintenanceStatus || room.maintanenceStatus)}</span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" onClick={() => { setRoomDetails(room); setShowDetails(true); }} title="View" data-cy={`rooms-view-btn-${room._id}`}>
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" onClick={() => {
                            setEditRoom(room);
                            setEditForm({ type: room.type, rate: room.rate, amenities: room.amenities || [], isOccupied: room.isOccupied, capacity: room.capacity, maintanenceStatus: (room.maintenanceStatus || room.maintanenceStatus || "") });
                            setShowEdit(true);
                          }} title="Edit" data-cy={`rooms-edit-btn-${room._id}`}>
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" onClick={() => { setRoomToDelete(room); setShowDeleteConfirm(true); }} title="Delete" data-cy={`rooms-delete-btn-${room._id}`}>
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-muted-foreground">{loading ? 'Loading rooms...' : 'No rooms found'}</p>
                        {Object.values(filters).some(f => f !== "") && (
                          <p className="text-sm text-muted-foreground/60">Try adjusting your filters.</p>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
          />
        </div>

        <Modal show={showDetails} onClose={() => setShowDetails(false)} title={`Room ${roomDetails?.roomNumber}`}>
          <div className="p-5 space-y-4">
            {[
              { label: "Room Number", value: roomDetails?.roomNumber },
              { label: "Type", value: roomDetails?.type },
              { label: "Rate", value: `रु${roomDetails?.rate}` },
              { label: "Description", value: roomDetails?.description || 'No description' },
              { label: "Capacity", value: roomDetails?.capacity },
              { label: "Hotel", value: roomDetails?.hotel?.name || '-' },
              { label: "Created", value: roomDetails?.createdAt ? new Date(roomDetails.createdAt).toLocaleDateString() : '-' },
            ].map((item) => (
              <div key={item.label}>
                <label className="block text-xs font-medium text-muted-foreground mb-0.5">{item.label}</label>
                <div className="text-sm font-medium text-foreground">{item.value}</div>
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-0.5">Amenities</label>
              <div className="flex flex-wrap gap-1">
                {roomDetails?.amenities?.length > 0 ? (
                  roomDetails.amenities.map((a: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs rounded px-2 py-0.5 font-normal">{a}</Badge>
                  ))
                ) : <span className="text-xs text-muted-foreground">None</span>}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-0.5">Status</label>
              {roomDetails?.isOccupied ? (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-destructive/10 text-destructive border border-destructive/20">Occupied</span>
              ) : (
                <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Available</span>
              )}
            </div>
          </div>
        </Modal>

        <Modal show={showAdd} onClose={() => setShowAdd(false)} title="Add New Room">
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!validateAddForm()) { showToast("Please fix validation errors", "error"); return; }
            setAddLoading(true);
            try {
              await createRoom({
                roomNumber: addForm.roomNumber, type: addForm.type, rate: Number(addForm.rate),
                description: addForm.description,
                amenities: Array.isArray(addForm.amenities) ? addForm.amenities.filter((a: string) => a.trim() !== "") : [],
                isOccupied: addForm.isOccupied, capacity: Number(addForm.capacity),
                maintenanceStatus: addForm.maintanenceStatus || undefined,
              });
              setShowAdd(false); resetFormErrors(); showToast("Room created successfully!", "success"); await loadData(true);
            } catch (e: any) { showToast(e.message, "error"); } finally { setAddLoading(false); }
          }} className="p-5 space-y-4">
            <FormField label="Room Number" error={formErrors.roomNumber}>
              <input type="text" value={addForm.roomNumber} onChange={e => setAddForm((f: any) => ({ ...f, roomNumber: e.target.value }))}
                className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all ${formErrors.roomNumber ? 'border-destructive bg-destructive/5' : 'border-input'}`} required data-cy="rooms-add-room-number" />
            </FormField>
            <FormField label="Type" error={formErrors.type}>
              <select value={addForm.type} onChange={e => setAddForm((f: any) => ({ ...f, type: e.target.value }))}
                className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all ${formErrors.type ? 'border-destructive bg-destructive/5' : 'border-input'}`} required data-cy="rooms-add-type">
                <option value="">Select Type</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="suite">Suite</option>
                <option value="deluxe">Deluxe</option>
              </select>
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Rate" error={formErrors.rate}>
                <input type="number" value={addForm.rate} onChange={e => setAddForm((f: any) => ({ ...f, rate: e.target.value }))}
                  className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all ${formErrors.rate ? 'border-destructive bg-destructive/5' : 'border-input'}`} required data-cy="rooms-add-rate" />
              </FormField>
              <FormField label="Capacity" error={formErrors.capacity}>
                <input type="number" value={addForm.capacity} onChange={e => setAddForm((f: any) => ({ ...f, capacity: e.target.value }))}
                  className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all ${formErrors.capacity ? 'border-destructive bg-destructive/5' : 'border-input'}`} required />
              </FormField>
            </div>
            <FormField label="Description">
              <textarea value={addForm.description} onChange={e => setAddForm((f: any) => ({ ...f, description: e.target.value }))}
                className="w-full h-20 px-3 py-2 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all" rows={2} />
            </FormField>
            <FormField label="Amenities (comma separated)">
              <input type="text" value={Array.isArray(addForm.amenities) ? addForm.amenities.join(", ") : ""}
                onChange={e => setAddForm((f: any) => ({ ...f, amenities: e.target.value.split(",").map((a: string) => a.trim()) }))}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all" />
            </FormField>
            <FormField label="Occupied">
              <select value={addForm.isOccupied ? "true" : "false"} onChange={e => setAddForm((f: any) => ({ ...f, isOccupied: e.target.value === "true" }))}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all">
                <option value="false">No</option>
                <option value="true">Yes</option>
              </select>
            </FormField>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowAdd(false)} disabled={addLoading} data-cy="rooms-add-cancel">Cancel</Button>
              <Button type="submit" disabled={addLoading} data-cy="rooms-add-submit">
                {addLoading ? <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Creating...</> : "Create Room"}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal show={showEdit} onClose={() => setShowEdit(false)} title={`Edit Room ${editRoom?.roomNumber}`}>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!validateEditForm()) { showToast("Please fix validation errors", "error"); return; }
            setEditLoading(true);
            try {
              await updateRoomLocal(editRoom.roomNumber, { type: editForm.type, rate: Number(editForm.rate), amenities: Array.isArray(editForm.amenities) ? editForm.amenities.filter((a: string) => a.trim() !== "") : [], capacity: Number(editForm.capacity) });
              if (editForm.maintanenceStatus) await updateRoomMaintenanceLocal(editRoom.roomNumber, editForm.maintanenceStatus);
              setShowEdit(false); setEditRoom(null); resetEditFormErrors(); showToast("Room updated successfully!", "success"); await loadData();
            } catch (e: any) { showToast(e.message, "error"); } finally { setEditLoading(false); }
          }} className="p-5 space-y-4">
            <FormField label="Type" error={editFormErrors.type}>
              <select value={editForm.type} onChange={e => setEditForm((f: any) => ({ ...f, type: e.target.value }))}
                className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all ${editFormErrors.type ? 'border-destructive bg-destructive/5' : 'border-input'}`} required>
                <option value="">Select Type</option>
                <option value="single">Single</option>
                <option value="double">Double</option>
                <option value="suite">Suite</option>
                <option value="deluxe">Deluxe</option>
              </select>
            </FormField>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Rate" error={editFormErrors.rate}>
                <input type="number" value={editForm.rate} onChange={e => setEditForm((f: any) => ({ ...f, rate: e.target.value }))}
                  className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all ${editFormErrors.rate ? 'border-destructive bg-destructive/5' : 'border-input'}`} required />
              </FormField>
              <FormField label="Capacity" error={editFormErrors.capacity}>
                <input type="number" value={editForm.capacity} onChange={e => setEditForm((f: any) => ({ ...f, capacity: e.target.value }))}
                  className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all ${editFormErrors.capacity ? 'border-destructive bg-destructive/5' : 'border-input'}`} required />
              </FormField>
            </div>
            <FormField label="Amenities (comma separated)">
              <input type="text" value={Array.isArray(editForm.amenities) ? editForm.amenities.join(", ") : ""}
                onChange={e => setEditForm((f: any) => ({ ...f, amenities: e.target.value.split(",").map((a: string) => a.trim()) }))}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all" />
            </FormField>
            <FormField label="Maintenance Status">
              <select value={editForm.maintanenceStatus} onChange={e => setEditForm((f: any) => ({ ...f, maintanenceStatus: e.target.value }))}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all">
                <option value="">No Maintenance</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </FormField>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowEdit(false)} disabled={editLoading} data-cy="rooms-edit-cancel">Cancel</Button>
              <Button type="submit" disabled={editLoading} data-cy="rooms-edit-submit">
                {editLoading ? <><span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Saving...</> : "Update Room"}
              </Button>
            </div>
          </form>
        </Modal>

        <Modal show={showDeleteConfirm} onClose={() => { setShowDeleteConfirm(false); setRoomToDelete(null); }} title="Confirm Delete">
          <div className="p-5">
            <p className="text-sm text-foreground/80 mb-6">Are you sure you want to delete room <strong>{roomToDelete?.roomNumber}</strong>? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => { setShowDeleteConfirm(false); setRoomToDelete(null); }} disabled={deleteLoading}>Cancel</Button>
              <Button onClick={async () => {
                setDeleteLoading(true);
                try {
                  await deleteRoom(roomToDelete.roomNumber);
                  setShowDeleteConfirm(false); setRoomToDelete(null);
                  showToast("Room deleted successfully!", "success"); await loadData(true);
                } catch (e: any) {
                  const msg = e.message || '';
                  showToast(msg.includes('occupied') || msg.includes('checkout') ? "Cannot delete: Room is occupied or has active checkouts" : msg, "error");
                } finally { setDeleteLoading(false); }
              }} variant="destructive" disabled={deleteLoading} data-cy="rooms-delete-confirm">
                {deleteLoading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Deleting...</> : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>

        {toast && (
          <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-elevated flex items-center gap-3 animate-slide-up ${
            toast.type === 'error' ? 'bg-destructive text-destructive-foreground' : 'bg-emerald-600 text-white'
          }`}>
            <span className="text-sm font-medium flex-1">{toast.message}</span>
            <button onClick={() => setToast(null)} className="p-0.5 hover:opacity-70 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
