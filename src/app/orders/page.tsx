"use client";


import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { useDebounce } from "@/hooks/useDebounce";

// Fetch hotel info for nepaliFlag
const fetchHotel = async (token: string) => {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
  const res = await fetch(`${apiBase}/hotels/me`, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data || data;
};


export default function OrdersPage() {
    // Hotel state for nepaliFlag
    const [hotel, setHotel] = useState<any>(null);
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateError, setUpdateError] = useState("");
  
  // Create/Edit order modal state
  const [showCreate, setShowCreate] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any | null>(null);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    roomNumber: "",
    items: [{ itemId: "", name: "", quantity: "1", price: 0 }]
  });
  const [itemSearch, setItemSearch] = useState("");
  const [itemList, setItemList] = useState<any[]>([]);
  const [itemLoading, setItemLoading] = useState(false);
  
  // Form errors state
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Reset form errors
  const resetFormErrors = () => setFormErrors({});

  // Validation function
  const validateOrderForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!createForm.roomNumber || createForm.roomNumber.trim() === '') {
      errors.roomNumber = 'Room is required';
    }

    const items = createForm.items.filter(item => item.itemId && item.quantity);
    if (items.length === 0) {
      errors.items = 'Please add at least one item';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Occupied rooms state
  const [occupiedRooms, setOccupiedRooms] = useState<any[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  
  // Notification state for bottom-right toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);
  
  // Fetch occupied rooms for modal
  const fetchOccupiedRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const url = `${apiBase}/rooms?page=1&limit=100&isoccupied=true`;
      const headers: Record<string, string> = { Accept: "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      
      const res = await fetch(url, { headers });
      if (!res.ok) throw new Error("Failed to fetch occupied rooms");
      
      const data = await res.json();
      setOccupiedRooms(data.data || data);
    } catch (error) {
      console.error("Error fetching occupied rooms:", error);
      setOccupiedRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  // Fetch items for modal
  useEffect(() => {
    if (!showCreate) return;
    
    const fetchItems = async () => {
      setItemLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
        const params = new URLSearchParams();
        params.set('limit', '100');
        if (itemSearch) params.set('search', itemSearch);
        const url = `${apiBase}/items?${params.toString()}`;
        const headers: Record<string, string> = { Accept: "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(url, { headers });
        if (!res.ok) throw new Error("Failed to fetch items");
        const items = await res.json();
        setItemList(items.data || items);
      } catch {
        setItemList([]);
      } finally {
        setItemLoading(false);
      }
    };
    
    fetchItems();
    fetchOccupiedRooms();
  }, [showCreate, itemSearch, fetchOccupiedRooms]);

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setUpdateError("");
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setCreateForm({
      roomNumber: order.roomNumber,
      items: order.items.map((item: any) => ({
        itemId: item.itemId?._id || item.itemId,
        name: item.name || item.itemId?.name || "",
        quantity: item.quantity.toString(),
        price: item.price || item.itemId?.price || 0
      }))
    });
    setShowCreate(true);
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    setUpdateError("");
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No token found");
      const res = await fetch(`${apiBase}/orders/${selectedOrder._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: updateStatus })
      });
      if (!res.ok) throw new Error("Failed to update order status");
      
      // Update the order in the local state instead of reloading everything
      const updatedOrder = await res.json();
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === selectedOrder._id 
            ? {...order, status: updateStatus} 
            : order
        )
      );
      
      setSelectedOrder(null);
      setNotification({ type: 'success', message: 'Order status updated successfully' });
    } catch (e: any) {
      setUpdateError(e.message);
      setNotification({ type: 'error', message: e.message });
    } finally {
      setUpdating(false);
    }
  };

const handleUpdateOrderItems = async () => {
    if (!editingOrder) return;
    setCreateLoading(true);
    setCreateError("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No token found");
      
      // Prepare items array with proper format
      const items = createForm.items
        .filter(item => item.itemId && item.quantity)
        .map(item => ({
          itemId: item.itemId,
          quantity: parseInt(item.quantity) || 0
        }));
      
      if (items.length === 0) {
        throw new Error("Please add at least one item");
      }

      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      
      // Use the new update endpoint
      const res = await fetch(`${apiBase}/orders/${editingOrder._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ items })
      });
      
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotification({ type: 'error', message: data?.message || 'Failed to update order' });
        throw new Error(data?.message || "Failed to update order");
      }
      
      setNotification({ type: 'success', message: data?.message || 'Order updated successfully' });
      setShowCreate(false);
      setEditingOrder(null);
      setCreateForm({ roomNumber: "", items: [{ itemId: "", name: "", quantity: "1", price: 0 }] });
      
      // Refresh only the orders data instead of the entire page
      await refreshOrders();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreateLoading(false);
    }
  };
  
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
  
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Enhanced filter state
  const [filters, setFilters] = useState({
    status: "",
    roomNumber: "",
    guestName: "",
    guestPhone: "",
    search: ""
  });

  // Use debounced values for filters
  const debouncedRoomNumber = useDebounce(filters.roomNumber, 1000);
  const debouncedGuestName = useDebounce(filters.guestName, 1000);
  const debouncedGuestPhone = useDebounce(filters.guestPhone, 1000);
  const debouncedSearch = useDebounce(filters.search, 1000);

  // Fetch /auth/me first, then orders
  const fetchAll = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUser(null);
      setOrders([]);
      return;
    }
    // Authentication logic here...
  };


  // Fetch hotel info on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetchHotel(token).then(setHotel);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [page]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      setPage(1);
      loadData(token);
    }
  }, [filters.status, debouncedRoomNumber, debouncedGuestName, debouncedGuestPhone, debouncedSearch]);

  const loadData = async (token: string) => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
      
      // Build query parameters
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      
      // Add filters to query parameters only if they have values
      if (filters.status) {
        params.set('status', filters.status);
      }
      
      if (debouncedRoomNumber) {
        params.set('roomNumber', debouncedRoomNumber);
      }
      
      if (debouncedGuestName) {
        params.set('guestName', debouncedGuestName);
      }
      
      if (debouncedGuestPhone) {
        params.set('guestPhone', debouncedGuestPhone);
      }
      
      // Use search parameter only if no specific filters are set
      if (debouncedSearch && !debouncedRoomNumber && !debouncedGuestName && !debouncedGuestPhone) {
        params.set('search', debouncedSearch);
      }
      
      const res = await fetch(`${apiBase}/orders?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include"
      });
      
      if (!res.ok) throw new Error("Failed to fetch orders");
      
      const data = await res.json();
      
      if (data.success) {
        setOrders(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
        setTotalCount(data.pagination?.total || 0);
      } else {
        throw new Error(data.message || "Failed to fetch orders");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh only the orders data
  const refreshOrders = useCallback(async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      await loadData(token);
    }
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      roomNumber: "",
      guestName: "",
      guestPhone: "",
      search: ""
    });
  };

  const hasActiveFilters = () => {
    return filters.status || filters.roomNumber || filters.guestName || filters.guestPhone || filters.search;
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        navLinks={navLinks}
        nepaliFlag={hotel?.nepaliFlag}
      />
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => {
              setShowCreate(true);
              setEditingOrder(null);
              setCreateError("");
              setCreateForm({
                roomNumber: "",
                items: [{ itemId: "", name: "", quantity: "1", price: 0 }]
              });
            }}
          >+ New Order</button>
        </div>
        
        {/* Create/Edit Order Modal */}
         {/* Create/Edit Order Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-6xl max-h-[90vh] flex gap-8 overflow-y-auto">
            {/* Left: Form */}
            <div className="flex-1 min-w-[320px]">
              <h2 className="text-2xl font-bold mb-4">
                {editingOrder ? "Edit Order" : "Create New Order"}
              </h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (editingOrder) {
                    await handleUpdateOrderItems();
                  } else {
                      if (!validateOrderForm()) {
                        setCreateError("Please fix validation errors");
                        return;
                      }
                      setCreateLoading(true);
                      setCreateError("");
                      try {
                        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                        if (!token) throw new Error("No token found");
                        
                        // Prepare items array with proper format
                        const items = createForm.items
                          .filter(item => item.itemId && item.quantity)
                          .map(item => ({
                            itemId: item.itemId,
                            quantity: parseInt(item.quantity) || 0
                          }));

                        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
                        const res = await fetch(`${apiBase}/orders`, {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                          },
                          body: JSON.stringify({
                            roomNumber: createForm.roomNumber,
                            items: items
                          })
                        });
                        const data = await res.json().catch(() => ({}));
                        if (!res.ok) {
                          // Handle API validation errors
                          if (data?.details) {
                            const errorDetails = data.details;
                            const fieldMatch = errorDetails.match(/"(\w+)"/);
                            if (fieldMatch) {
                              const fieldName = fieldMatch[1];
                              setFormErrors({ [fieldName]: errorDetails });
                            }
                          }
                          setNotification({ type: 'error', message: data?.message || 'Failed to create order' });
                          throw new Error(data?.message || "Failed to create order");
                        }
                        
                        setNotification({ type: 'success', message: data?.message || 'Order created successfully' });
                        setShowCreate(false);
                        resetFormErrors();
                        setCreateForm({ roomNumber: "", items: [{ itemId: "", name: "", quantity: "1", price: 0 }] });
                        
                        // Refresh only the orders data instead of the entire page
                        await refreshOrders();
                      } catch (err: any) {
                        setCreateError(err.message);
                      } finally {
                        setCreateLoading(false);
                      }
                    }
                  }}
                  className="space-y-4"
                >
                  {/* Notification Toast */}
                  {notification && (
                    <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
                      {notification.message}
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Select Room</label>
                    {roomsLoading ? (
                      <div className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100">Loading rooms...</div>
                    ) : occupiedRooms.length === 0 ? (
                      <div className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100">No occupied rooms available</div>
                    ) : (
                      <div>
                        <select
                          value={createForm.roomNumber}
                          onChange={e => setCreateForm(f => ({ ...f, roomNumber: e.target.value }))}
                          className={`w-full border rounded px-3 py-2 ${formErrors.roomNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                          required
                          disabled={!!editingOrder}
                        >
                          <option value="">Select a room</option>
                          {occupiedRooms.map((room) => (
                            <option key={room._id} value={room.roomNumber}>
                              Room {room.roomNumber} - {room.guestName || 'Guest'} (Check-in: {new Date(room.checkInDate).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                        {formErrors.roomNumber && <p className="text-red-600 text-sm mt-1">{formErrors.roomNumber}</p>}
                      </div>
                    )}
                  </div>
                  
                  {/* Items section */}
                  <div>
                    <label className="block text-sm font-medium mb-1">Items {formErrors.items && <span className="text-red-600">- {formErrors.items}</span>}</label>
                    {formErrors.items && <p className="text-red-600 text-sm mb-2">{formErrors.items}</p>}
                    {createForm.items.map((item, index) => (
                      <div key={index} className="flex gap-2 mb-2 items-center">
                        <div className="flex-1">
                          <div className="text-sm font-medium mb-1">{item.name || "Select an item"}</div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...createForm.items];
                                if (parseInt(newItems[index].quantity) > 1) {
                                  newItems[index].quantity = (parseInt(newItems[index].quantity) - 1).toString();
                                  setCreateForm(f => ({ ...f, items: newItems }));
                                }
                              }}
                              className="px-2 bg-gray-200 rounded"
                            >-</button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={e => {
                                const newItems = [...createForm.items];
                                newItems[index].quantity = e.target.value;
                                setCreateForm(f => ({ ...f, items: newItems }));
                              }}
                              className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
                              min="1"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newItems = [...createForm.items];
                                newItems[index].quantity = (parseInt(newItems[index].quantity) + 1).toString();
                                setCreateForm(f => ({ ...f, items: newItems }));
                              }}
                              className="px-2 bg-gray-200 rounded"
                            >+</button>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          रु{item.price * parseInt(item.quantity) || 0}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (createForm.items.length > 1) {
                              const newItems = createForm.items.filter((_, i) => i !== index);
                              setCreateForm(f => ({ ...f, items: newItems }));
                            }
                          }}
                          className="px-2 text-red-600 hover:bg-red-100 rounded"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCreateForm(f => ({ 
                        ...f, 
                        items: [...f.items, { itemId: "", name: "", quantity: "1", price: 0 }] 
                      }))}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Add Another Item
                    </button>
                  </div>
                  
                  {createError && <div className="text-red-600 mb-2">{createError}</div>}
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreate(false);
                        setEditingOrder(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={createLoading}
                    >Cancel</button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      disabled={createLoading || roomsLoading || occupiedRooms.length === 0}
                    >
                      {createLoading 
                        ? (editingOrder ? "Updating..." : "Creating...") 
                        : (editingOrder ? "Update Order" : "Create Order")
                      }
                    </button>
                  </div>
                </form>
              </div>
              
              {/* Right: Item List */}
              <div className="flex-1 min-w-[320px] max-w-[400px]">
                <div className="flex items-center mb-2">
                  <input
                    type="text"
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                    placeholder="Search items by name..."
                  />
                </div>
                <div className="border rounded h-[400px] overflow-y-auto bg-gray-50 p-2">
                  {itemLoading ? (
                    <div className="text-center text-gray-500 py-8">Loading...</div>
                  ) : itemList.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No items found.</div>
                  ) : (
                    <ul>
                      {itemList.map((item: any) => (
                        <li
                          key={item._id}
                          className={`p-2 rounded cursor-pointer hover:bg-blue-100 ${createForm.items.some(i => i.itemId === item._id) ? 'bg-blue-200' : ''}`}
                          onClick={() => {
                            // Add this item to the form
                            const newItems = [...createForm.items];
                            const emptyIndex = newItems.findIndex(i => !i.itemId);
                            
                            if (emptyIndex >= 0) {
                              // Replace the first empty item
                              newItems[emptyIndex] = {
                                itemId: item._id,
                                name: item.name,
                                quantity: "1",
                                price: item.price
                              };
                            } else {
                              // Add a new item
                              newItems.push({
                                itemId: item._id,
                                name: item.name,
                                quantity: "1",
                                price: item.price
                              });
                            }
                            
                            setCreateForm(f => ({ ...f, items: newItems }));
                          }}
                        >
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category?.name || 'No category'}</div>
                          <div className="text-xs text-gray-400">Price: रु{item.price}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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
            {hasActiveFilters() && (
              <button 
                onClick={clearFilters}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Clear All Filters
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search (General)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="General search..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <input
                type="text"
                value={filters.roomNumber}
                onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Room number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Guest Name</label>
              <input
                type="text"
                value={filters.guestName}
                onChange={(e) => handleFilterChange('guestName', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Guest name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Guest Phone</label>
              <input
                type="text"
                value={filters.guestPhone}
                onChange={(e) => handleFilterChange('guestPhone', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Guest phone"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order: any) => {
                  // Defensive extraction for all fields
                  const guest = order.guestId && typeof order.guestId === 'object'
                    ? `${order.guestId.firstName || ''} ${order.guestId.lastName || ''}`.trim() || "-"
                    : (order.guestId ? String(order.guestId) : "-");
                  const room = typeof order.roomNumber === 'string' || typeof order.roomNumber === 'number'
                    ? String(order.roomNumber)
                    : (order.room && typeof order.room === 'object' && order.room.roomNumber ? String(order.room.roomNumber) : (order.room ? String(order.room) : "-"));
                  const items = Array.isArray(order.items) && order.items.length > 0
                    ? order.items.map((i: any) => {
                        const name = i.name ? String(i.name) : "-";
                        const qty = i.quantity ? String(i.quantity) : "-";
                        const price = i.price ? String(i.price) : "-";
                        let category = "";
                        if (i.itemId && typeof i.itemId === 'object') {
                          category = i.itemId.category || i.itemId.name || "";
                        } else if (i.itemId) {
                          category = String(i.itemId);
                        }
                        return `${name} (x${qty}) - रु${price}${category ? ` [${category}]` : ''}`;
                      }).join("; ")
                    : "-";
                  const total = order.totalAmount !== undefined ? `रु${String(order.totalAmount)}` : "-";
                  const status = order.status ? String(order.status) : "-";
                  const createdBy = order.createdBy && typeof order.createdBy === 'object'
                    ? `${order.createdBy.firstName || ''} ${order.createdBy.lastName || ''}`.trim() || "-"
                    : (order.createdBy ? String(order.createdBy) : "-");
                  
                  return (
                    <tr key={order._id} className={`hover:bg-gray-50 ${selectedOrder?._id === order._id ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">{guest}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room}</td>
                      <td className="px-6 py-4 whitespace-nowrap max-w-xs truncate" title={items}>{items}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{total}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          status === 'completed' ? 'bg-green-100 text-green-800' :
                          status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{createdBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSelectOrder(order)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Status
                          </button>
                          <button
                            onClick={() => handleEditOrder(order)}
                            className="text-green-600 hover:text-green-800 text-sm"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Controls */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
              <div className="text-sm text-gray-700">
                Showing <span className="font-medium">{(page - 1) * limit + 1}</span> to{" "}
                <span className="font-medium">{Math.min(page * limit, totalCount)}</span> of{" "}
                <span className="font-medium">{totalCount}</span> results
              </div>
              
              <div className="flex items-center space-x-2">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                >
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
                
                <div className="flex space-x-1">
                  <button
                    className="px-3 py-1 rounded border bg-white disabled:opacity-50 text-sm"
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                  >«</button>
                  
                  <button
                    className="px-3 py-1 rounded border bg-white disabled:opacity-50 text-sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >‹</button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (page <= 3) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = page - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        className={`px-3 py-1 rounded border text-sm ${
                          page === pageNum ? 'bg-blue-500 text-white' : 'bg-white'
                        }`}
                        onClick={() => setPage(pageNum)}
                      >{pageNum}</button>
                    );
                  })}
                  
                  {totalPages > 5 && page < totalPages - 2 && (
                    <span className="px-2 py-1">...</span>
                  )}
                  
                  <button
                    className="px-3 py-1 rounded border bg-white disabled:opacity-50 text-sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >›</button>
                  
                  <button
                    className="px-3 py-1 rounded border bg-white disabled:opacity-50 text-sm"
                    onClick={() => setPage(totalPages)}
                    disabled={page === totalPages}
                  >»</button>
                </div>
              </div>
            </div>
          </div>
          
          {selectedOrder && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Update Order Status</h2>
                <div className="mb-4">
                  <div className="mb-2"><b>Order ID:</b> {selectedOrder._id}</div>
                  <div className="mb-2"><b>Guest:</b> {selectedOrder.guestId ? `${selectedOrder.guestId.firstName} ${selectedOrder.guestId.lastName}` : "-"}</div>
                  <div className="mb-2"><b>Current Status:</b> {selectedOrder.status}</div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">New Status</label>
                  <select
                    value={updateStatus}
                    onChange={e => setUpdateStatus(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                {updateError && <div className="text-red-600 mb-2">{updateError}</div>}
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => setSelectedOrder(null)}
                    disabled={updating}
                  >Cancel</button>
                  <button
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={handleUpdateOrderStatus}
                    disabled={updating}
                    >{updating ? 'Updating...' : 'Update'}</button>
                </div>
              </div>
            </div>
          )}
          
          {orders.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500">
                {hasActiveFilters() 
                  ? "No orders found matching your filters." 
                  : "No orders found."}
              </div>
              {hasActiveFilters() && (
                <button 
                  onClick={clearFilters}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {orders.filter((o: any) => o.status === "completed").length}
            </div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">
              {orders.filter((o: any) => o.status === "pending").length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">
              {orders.filter((o: any) => o.status === "cancelled").length}
            </div>
            <div className="text-sm text-gray-600">Cancelled</div>
          </div>
        </div>
      </div>
    </div>
  );
}