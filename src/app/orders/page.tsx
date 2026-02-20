"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { useDebounce } from "@/hooks/useDebounce";
import { format } from "date-fns";

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
    items: [{ itemId: "", name: "", quantity: "1", price: 0 }],
    showRoomDropdown: false
  });
  const [itemSearch, setItemSearch] = useState("");
  const [itemList, setItemList] = useState<any[]>([]);
  const [itemLoading, setItemLoading] = useState(false);
  
  // KOT States
  const [kotLoading, setKotLoading] = useState(false);
  const [kotError, setKotError] = useState("");
  const [showKOTModal, setShowKOTModal] = useState(false);
  const [selectedKOTOrder, setSelectedKOTOrder] = useState<any | null>(null);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [kotStats, setKotStats] = useState({
    pending: { count: 0, amount: 0 },
    preparing: { count: 0, amount: 0 },
    ready: { count: 0, amount: 0 },
    served: { count: 0, amount: 0 },
    cancelled: { count: 0, amount: 0 },
    total: 0,
    totalAmount: 0,
    averages: {
      preparationTime: 0,
      servingTime: 0
    }
  });

  // Add this near your other state declarations (around line 50-60)
const [printerInfo, setPrinterInfo] = useState<any>(() => {
  // Load from localStorage on initial render ONLY
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('printerInfo');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse printer info");
      }
    }
  }
  return null;
});
  
  // Printer status
  const [printerStatus, setPrinterStatus] = useState<any>(null);
  const [checkingPrinter, setCheckingPrinter] = useState(false);
  
  // Print job history
  const [printHistory, setPrintHistory] = useState<{[key: string]: any}>({});
  
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
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);
  
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(t);
    }
  }, [notification]);
  
  // Fetch KOT stats
  const fetchKOTStats = useCallback(async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;
      
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/kot/stats?period=today`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setKotStats(data.data);
        }
      }
    } catch (error) {
      console.error("Error fetching KOT stats:", error);
    }
  }, []);

  // Check printer status
  const checkPrinterStatus = useCallback(async () => {
    setCheckingPrinter(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) return;
      
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/kot/printer-status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPrinterStatus(data.data);
        }
      }
    } catch (error) {
      console.error("Error checking printer status:", error);
    } finally {
      setCheckingPrinter(false);
    }
  }, []);

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
    // checkPrinterStatus();
  }, [showCreate, itemSearch, fetchOccupiedRooms]);

  // Send KOT to kitchen
  const handleSendKOT = async (orderId: string) => {
    setKotLoading(true);
    setKotError("");
    
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No token found");
      
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/kot/send/${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ specialInstructions })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send KOT");
      
      // Store print result in history
      setPrintHistory(prev => ({
        ...prev,
        [orderId]: data.data.printResult
      }));
      
      // Show detailed print status
      const printResult = data.data?.printResult;
      if (printResult?.success) {
        const successfulMethod = printResult.attempts?.find((a: any) => a.success)?.method || 'unknown';
        setNotification({ 
          type: 'success', 
          message: `✅ KOT #${data.data.kotNumber} sent and printed (${successfulMethod})` 
        });
      } else if (printResult) {
        setNotification({ 
          type: 'warning', 
          message: `⚠️ KOT #${data.data.kotNumber} sent but printing failed. Check printer.` 
        });
      } else {
        setNotification({ type: 'success', message: `KOT #${data.data.kotNumber} sent to kitchen` });
      }
      
      setShowKOTModal(false);
      setSelectedKOTOrder(null);
      setSpecialInstructions("");
      
      // Refresh orders and stats
      await refreshOrders();
      await fetchKOTStats();
    } catch (err: any) {
      setKotError(err.message);
      setNotification({ type: 'error', message: err.message });
    } finally {
      setKotLoading(false);
    }
  };

  // Update KOT status
  const handleUpdateKOTStatus = async (orderId: string, status: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No token found");
      
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/kot/status/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update KOT status");
      
      setNotification({ type: 'success', message: `KOT status updated to ${status}` });
      
      // Refresh orders and stats
      await refreshOrders();
      await fetchKOTStats();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  // Reprint KOT
  const handleReprintKOT = async (orderId: string) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No token found");
      
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const res = await fetch(`${apiBase}/kot/reprint/${orderId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reprint KOT");
      
      // Update print history
      setPrintHistory(prev => ({
        ...prev,
        [orderId]: data.data.printResult
      }));
      
      const printResult = data.data?.printResult;
      if (printResult?.success) {
        setNotification({ type: 'success', message: `KOT #${data.data.kotNumber} reprinted successfully` });
      } else {
        setNotification({ type: 'warning', message: `Reprint attempted but may have failed` });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

// Update the test printer function to update localStorage with the response
const handleTestPrinter = async () => {
  try {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) throw new Error("No token found");
    
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
    const res = await fetch(`${apiBase}/kot/test-print`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Test print failed");
    
    if (data.data?.success) {
      setNotification({ type: 'success', message: 'Test print successful!' });
      
      // Extract printer info from the test response
      const testResult = data.data;
      
      // Create printer info object from the test response
      const newPrinterInfo = {
        name: testResult.printerName || 'Unknown Printer',
        type: testResult.printerType || 'unknown',
        detectedType: testResult.detectedType || 'standard',
        lastTested: new Date().toISOString(),
        success: testResult.success,
        method: testResult.attempts?.find((a: any) => a.success)?.method || 'unknown',
        // Store the full result for reference
        fullResult: testResult
      };
      
      // Update state and localStorage
      setPrinterInfo(newPrinterInfo);
      localStorage.setItem('printerInfo', JSON.stringify(newPrinterInfo));
      
    } else {
      setNotification({ type: 'warning', message: 'Test print completed with issues' });
      
      // Still save the attempt even if it had issues
      const testResult = data.data;
      const newPrinterInfo = {
        name: testResult?.printerName || 'Unknown Printer',
        type: testResult?.printerType || 'unknown',
        detectedType: testResult?.detectedType || 'standard',
        lastTested: new Date().toISOString(),
        success: false,
        error: data.message || 'Print had issues',
        fullResult: testResult
      };
      
      setPrinterInfo(newPrinterInfo);
      localStorage.setItem('printerInfo', JSON.stringify(newPrinterInfo));
    }
  } catch (err: any) {
    setNotification({ type: 'error', message: err.message });
  }
};

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setUpdateError("");
  };

  const handleEditOrder = (order: any) => {
    if (order.kotPrinted) {
      setNotification({ type: 'warning', message: 'Cannot edit order after KOT has been sent' });
      return;
    }
    
    setEditingOrder(order);
    setCreateForm({
      roomNumber: order.roomNumber,
      items: order.items.map((item: any) => ({
        itemId: item.itemId?._id || item.itemId,
        name: item.name || item.itemId?.name || "",
        quantity: item.quantity.toString(),
        price: item.price || item.itemId?.price || 0
      })),
      showRoomDropdown: false
    });
    setShowCreate(true);
  };

  const handleUpdateOrderStatus = async () => {
    if (!selectedOrder) return;
    setUpdating(true);
    setUpdateError("");
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
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
      setCreateForm({ roomNumber: "", items: [{ itemId: "", name: "", quantity: "1", price: 0 }], showRoomDropdown: false });
      
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
    kotStatus: "",
    roomNumber: "",
    guestName: "",
    guestPhone: "",
    search: "",
    fromDate: "",
    toDate: ""
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
  };

  // Fetch hotel info on mount
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      fetchHotel(token).then(setHotel);
      fetchKOTStats();
      // checkPrinterStatus();
    }
  }, [fetchKOTStats]);

  useEffect(() => {
    fetchAll();
  }, [page]);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      setPage(1);
      loadData(token);
    }
  }, [filters.status, filters.kotStatus, debouncedRoomNumber, debouncedGuestName, debouncedGuestPhone, debouncedSearch, filters.fromDate, filters.toDate]);

  const loadData = async (token: string) => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      
      // Build query parameters
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', limit.toString());
      
      if (filters.status) params.set('status', filters.status);
      if (filters.kotStatus) params.set('kotStatus', filters.kotStatus);
      if (debouncedRoomNumber) params.set('roomNumber', debouncedRoomNumber);
      if (debouncedGuestName) params.set('guestName', debouncedGuestName);
      if (debouncedGuestPhone) params.set('guestPhone', debouncedGuestPhone);
      if (filters.fromDate) params.set('fromDate', filters.fromDate);
      if (filters.toDate) params.set('toDate', filters.toDate);
      
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
      await fetchKOTStats();
    }
  }, [fetchKOTStats]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      kotStatus: "",
      roomNumber: "",
      guestName: "",
      guestPhone: "",
      search: "",
      fromDate: "",
      toDate: ""
    });
  };

  const hasActiveFilters = () => {
    return Object.values(filters).some(v => v);
  };

  // Get KOT status badge color
  const getKOTStatusBadge = (status: string) => {
    const colors: {[key: string]: string} = {
      'pending': 'bg-orange-100 text-orange-800 border-orange-200',
      'preparing': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'ready': 'bg-green-100 text-green-800 border-green-200',
      'served': 'bg-blue-100 text-blue-800 border-blue-200',
      'cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get printer status indicator


// Remove or comment out the checkPrinterStatus function entirely
// We don't need it anymore since we only update on test



// Update the printer status indicator to show info from localStorage
const getPrinterStatusIndicator = () => {
  if (!printerInfo) {
    return (
      <span className="text-gray-400 flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
        Not Tested
      </span>
    );
  }
  
  if (printerInfo.success) {
    return (
      <span className="text-green-600 font-semibold flex items-center gap-1" title={`Last tested: ${new Date(printerInfo.lastTested).toLocaleString()}`}>
        <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
        {printerInfo.name} ({printerInfo.method})
      </span>
    );
  }
  
  return (
    <span className="text-red-600 font-semibold flex items-center gap-1" title={`Last tested: ${new Date(printerInfo.lastTested).toLocaleString()}`}>
      <span className="w-2 h-2 bg-red-600 rounded-full"></span>
      {printerInfo.name} (Failed)
    </span>
  );
};

// Remove any useEffect that calls checkPrinterStatus
// Remove or comment out these lines from your existing code:
// useEffect(() => {
//   checkPrinterStatus();
// }, []);

// Also remove the checkPrinterStatus button onClick handler
// Keep only the Test Printer button

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        nepaliFlag={hotel?.nepaliFlag}
      />
      
      <div className="max-w-9xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders Management</h1>
<div className="flex gap-2">
  {/* Remove this entire button - we don't need separate status check */}
  {/* <button
    onClick={checkPrinterStatus}
    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm flex items-center gap-2"
    disabled={checkingPrinter}
  >
    <span>Printer: {getPrinterStatusIndicator()}</span>
    {checkingPrinter && <span className="animate-spin">⟳</span>}
  </button> */}
  
  {/* Keep only the Test Printer button */}
  <button
    onClick={handleTestPrinter}
    className="px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 text-sm flex items-center gap-2"
  >
    <span>Printer: {getPrinterStatusIndicator()}</span>
  </button>
  
  <button
    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
    onClick={() => {
      setShowCreate(true);
      setEditingOrder(null);
      setCreateError("");
      setCreateForm({
        roomNumber: "",
        items: [{ itemId: "", name: "", quantity: "1", price: 0 }],
        showRoomDropdown: false
      });
    }}
    data-cy="orders-add-btn"
  >+ New Order</button>
</div>
        </div>
        
        {/* KOT Statistics Dashboard */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-orange-50 p-4 rounded-lg shadow border-l-4 border-orange-500">
            <div className="text-2xl font-bold text-orange-600">{kotStats.pending.count}</div>
            <div className="text-sm text-gray-600">Pending in Kitchen</div>
            <div className="text-xs text-gray-500">रु{kotStats.pending.amount.toLocaleString()}</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <div className="text-2xl font-bold text-yellow-600">{kotStats.preparing.count}</div>
            <div className="text-sm text-gray-600">Preparing</div>
            <div className="text-xs text-gray-500">रु{kotStats.preparing.amount.toLocaleString()}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow border-l-4 border-green-500">
            <div className="text-2xl font-bold text-green-600">{kotStats.ready.count}</div>
            <div className="text-sm text-gray-600">Ready to Serve</div>
            <div className="text-xs text-gray-500">रु{kotStats.ready.amount.toLocaleString()}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg shadow border-l-4 border-blue-500">
            <div className="text-2xl font-bold text-blue-600">{kotStats.served.count}</div>
            <div className="text-sm text-gray-600">Served Today</div>
            <div className="text-xs text-gray-500">रु{kotStats.served.amount.toLocaleString()}</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg shadow border-l-4 border-purple-500">
            <div className="text-2xl font-bold text-purple-600">{kotStats.averages.preparationTime} min</div>
            <div className="text-sm text-gray-600">Avg Prep Time</div>
            <div className="text-xs text-gray-500">Serving: {kotStats.averages.servingTime} min</div>
          </div>
        </div>
        
        {/* Create/Edit Order Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div data-cy="orders-modal" className="bg-white rounded-lg p-8 w-full max-w-6xl max-h-[90vh] flex gap-8 overflow-y-auto">
              {/* Left: Form */}
              <div className="flex-1 min-w-[320px]">
                <h2 data-cy="orders-modal-title" className="text-2xl font-bold mb-4">
                  {editingOrder ? "Edit Order" : "Create New Order"}
                </h2>
                <form
                  data-cy="orders-create-form"
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
                        setCreateForm({ roomNumber: "", items: [{ itemId: "", name: "", quantity: "1", price: 0 }], showRoomDropdown: false });
                        
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
                    <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white transition-all ${
                      notification.type === 'success' ? 'bg-green-600' : 
                      notification.type === 'warning' ? 'bg-orange-600' : 'bg-red-600'
                    }`}>
                      {notification.message}
                    </div>
                  )}
                  
                  <div data-cy="orders-room-selector-container">
                    <label className="block text-sm font-medium mb-1">Select Room</label>
                    {roomsLoading ? (
                      <div className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100">Loading rooms...</div>
                    ) : occupiedRooms.length === 0 ? (
                      <div className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100">No occupied rooms available</div>
                    ) : (
                      <div>
                        <div className="relative">
                          <div
                            data-cy="orders-room-select"
                            onClick={() => setCreateForm(f => ({ ...f, showRoomDropdown: !f.showRoomDropdown }))}
                            className={`w-full border rounded px-3 py-2 cursor-pointer flex justify-between items-center ${formErrors.roomNumber ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                          >
                            <span className="text-gray-700">
                              {createForm.roomNumber 
                                ? occupiedRooms.find(r => r.roomNumber === createForm.roomNumber)?.roomNumber || 'Select a room'
                                : 'Select a room'
                              }
                            </span>
                            <span
                              data-cy="orders-room-select-icon"
                              className="text-gray-600"
                            >
                              ▼
                            </span>
                          </div>
                          {createForm.showRoomDropdown && (
                            <div data-cy="orders-room-dropdown" className="absolute top-full left-0 right-0 border border-gray-300 rounded mt-1 bg-white z-10 max-h-48 overflow-y-auto">
                              {occupiedRooms.map((room, index) => (
                                <div
                                  key={room._id}
                                  data-cy={`orders-room-${index}`}
                                  onClick={() => {
                                    setCreateForm(f => ({ ...f, roomNumber: room.roomNumber, showRoomDropdown: false }));
                                  }}
                                  className="px-3 py-2 hover:bg-blue-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="font-semibold">Room {room.roomNumber}</div>
                                  <div className="text-sm text-gray-600">{room.guestName || 'Guest'} (Check-in: {new Date(room.checkInDate).toLocaleDateString()})</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {formErrors.roomNumber && <p className="text-red-600 text-sm mt-1">{formErrors.roomNumber}</p>}
                      </div>
                    )}
                  </div>
                  
                  {/* Items section */}
                  <div data-cy="orders-items-container">
                    <label className="block text-sm font-medium mb-1">Items {formErrors.items && <span className="text-red-600">- {formErrors.items}</span>}</label>
                    {formErrors.items && <p className="text-red-600 text-sm mb-2">{formErrors.items}</p>}
                    {createForm.items.map((item, index) => (
                      <div key={index} data-cy={`orders-item-row-${index}`} className="flex gap-2 mb-2 items-center">
                        <div className="flex-1">
                          <div className="text-sm font-medium mb-1">{item.name || "Select an item"}</div>
                          <div className="flex gap-2">
                            <button
                              data-cy={`orders-quantity-decrease-${index}`}
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
                              data-cy={`orders-quantity-${index}`}
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
                              data-cy={`orders-quantity-increase-${index}`}
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
                          data-cy={`orders-remove-item-${index}`}
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
                      data-cy="orders-add-another-item"
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
                      data-cy="orders-cancel"
                    >Cancel</button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      disabled={createLoading || roomsLoading || occupiedRooms.length === 0}
                      data-cy="orders-submit"
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
                    data-cy="orders-item-search"
                    type="text"
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-2 w-full"
                    placeholder="Search items by name..."
                  />
                </div>
                <div data-cy="orders-items-list" className="border rounded h-[400px] overflow-y-auto bg-gray-50 p-2">
                  {itemLoading ? (
                    <div className="text-center text-gray-500 py-8">Loading...</div>
                  ) : itemList.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">No items found.</div>
                  ) : (
                    <ul>
                      {itemList.map((item: any) => (
                        <li
                          key={item._id}
                          data-cy={`orders-item-option-${item._id}`}
                          className={`p-2 rounded cursor-pointer hover:bg-blue-100 ${createForm.items.some(i => i.itemId === item._id) ? 'bg-blue-200' : ''}`}
                          onClick={() => {
                            const newItems = [...createForm.items];
                            const emptyIndex = newItems.findIndex(i => !i.itemId);
                            
                            if (emptyIndex >= 0) {
                              newItems[emptyIndex] = {
                                itemId: item._id,
                                name: item.name,
                                quantity: "1",
                                price: item.price
                              };
                            } else {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search..."
                data-cy="orders-search"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Order Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                data-cy="orders-status-filter"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">KOT Status</label>
              <select
                value={filters.kotStatus}
                onChange={(e) => handleFilterChange('kotStatus', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="served">Served</option>
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
                data-cy="orders-room-filter"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">From Date</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">To Date</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange('toDate', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KOT #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KOT Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Print Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order: any) => {
                  const guest = order.guestId && typeof order.guestId === 'object'
                    ? `${order.guestId.firstName || ''} ${order.guestId.lastName || ''}`.trim() || "-"
                    : (order.guestId ? String(order.guestId) : "-");
                  const room = order.roomNumber;
                  const items = Array.isArray(order.items) && order.items.length > 0
                    ? order.items.map((i: any) => `${i.name} (x${i.quantity})`).join(", ")
                    : "-";
                  const total = order.totalAmount !== undefined ? `रु${order.totalAmount.toLocaleString()}` : "-";
                  const status = order.status;
                  const kotStatus = order.kotStatus || "pending";
                  const kotNumber = order.kotNumber || "-";
                  const createdBy = order.createdBy && typeof order.createdBy === 'object'
                    ? `${order.createdBy.firstName || ''} ${order.createdBy.lastName || ''}`.trim() || "-"
                    : (order.createdBy ? String(order.createdBy) : "-");
                  
                  const printInfo = printHistory[order._id];
                  const printStatus = printInfo ? 
                    (printInfo.success ? '✅' : '❌') : 
                    (order.kotPrinted ? '📄' : '⏳');
                  
                  return (
                    <tr key={order._id} className={`hover:bg-gray-50 ${selectedOrder?._id === order._id ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{kotNumber}</td>
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        {order.kotPrinted ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getKOTStatusBadge(kotStatus)}`}>
                            {kotStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Not sent</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span title={printInfo ? `Printed: ${printInfo.printerType}` : ''}>
                          {printStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{createdBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSelectOrder(order)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Status
                            </button>
                            {!order.kotPrinted && (
                              <button
                                onClick={() => handleEditOrder(order)}
                                className="text-green-600 hover:text-green-800 text-sm"
                              >
                                Edit
                              </button>
                            )}
                          </div>
                          <div className="flex space-x-2 mt-1">
                            {order.status === 'pending' && !order.kotPrinted && (
                              <button
                                onClick={() => {
                                  setSelectedKOTOrder(order);
                                  setShowKOTModal(true);
                                }}
                                className="text-orange-600 hover:text-orange-800 text-sm font-semibold"
                              >
                                🧾 Send KOT
                              </button>
                            )}
                            {order.kotPrinted && (
                              <button
                                onClick={() => handleReprintKOT(order._id)}
                                className="text-purple-600 hover:text-purple-800 text-sm"
                                title="Reprint KOT"
                              >
                                🔄 Reprint
                              </button>
                            )}
                          </div>
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
                  <span className="px-3 py-1">Page {page} of {totalPages}</span>
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
          
          {/* Status Update Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Update Order Status</h2>
                <div className="mb-4">
                  <div className="mb-2"><b>KOT #:</b> {selectedOrder.kotNumber || 'Not generated'}</div>
                  <div className="mb-2"><b>Guest:</b> {selectedOrder.guestId ? `${selectedOrder.guestId.firstName} ${selectedOrder.guestId.lastName}` : "-"}</div>
                  <div className="mb-2"><b>Current Status:</b> {selectedOrder.status}</div>
                  {selectedOrder.kotStatus && (
                    <div className="mb-2"><b>KOT Status:</b> {selectedOrder.kotStatus}</div>
                  )}
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
          
          {/* KOT Modal */}
          {showKOTModal && selectedKOTOrder && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Send Order to Kitchen</h2>
                <div className="mb-4">
                  <div className="mb-2"><b>Room:</b> {selectedKOTOrder.roomNumber}</div>
                  <div className="mb-2"><b>Items:</b></div>
                  <ul className="list-disc pl-5 mb-2 max-h-40 overflow-y-auto">
                    {selectedKOTOrder.items.map((item: any, idx: number) => (
                      <li key={idx} className="text-sm">
                        {item.name} x{item.quantity} - रु{item.total}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Special Instructions</label>
                  <textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={3}
                    placeholder="e.g., extra spicy, no onions, etc."
                  />
                </div>
                {printerStatus && (
                  <div className="mb-4 p-2 bg-gray-50 rounded text-sm">
                    <span className="font-medium">Printer: </span>
                    {getPrinterStatusIndicator()}
                    {printerStatus.type && <span className="ml-2 text-gray-600">({printerStatus.type})</span>}
                  </div>
                )}
                {kotError && <div className="text-red-600 mb-2">{kotError}</div>}
                <div className="flex justify-end space-x-2">
                  <button
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    onClick={() => {
                      setShowKOTModal(false);
                      setSelectedKOTOrder(null);
                      setSpecialInstructions("");
                    }}
                    disabled={kotLoading}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    onClick={() => handleSendKOT(selectedKOTOrder._id)}
                    disabled={kotLoading}
                  >
                    {kotLoading ? 'Sending...' : 'Send to Kitchen'}
                  </button>
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
            <div className="text-2xl font-bold text-orange-600">
              {orders.filter((o: any) => o.kotStatus === 'preparing' || o.kotStatus === 'ready').length}
            </div>
            <div className="text-sm text-gray-600">In Kitchen</div>
          </div>
        </div>
      </div>
    </div>
  );
}