
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { getItems } from "@/lib/api";

// Notification state for bottom-right toast
// (must be inside the component, so move this logic below)

export default function OrdersPage() {
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateError, setUpdateError] = useState("");
  // Create order modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createForm, setCreateForm] = useState({
    roomNumber: "",
    itemId: ""
  });
  const [itemSearch, setItemSearch] = useState("");
  const [itemList, setItemList] = useState<any[]>([]);
  const [itemLoading, setItemLoading] = useState(false);
  // Notification state for bottom-right toast
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);
  // Fetch items for modal
  useEffect(() => {
    if (!showCreate) return;
    const fetchItems = async () => {
      setItemLoading(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "${process.env.NEXT_PUBLIC_API_BASE_URL}";
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
  }, [showCreate, itemSearch]);

  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    setUpdateStatus(order.status);
    setUpdateError("");
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
      await loadData(token);
      setSelectedOrder(null);
    } catch (e: any) {
      setUpdateError(e.message);
    } finally {
      setUpdating(false);
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
  const [filters, setFilters] = useState({
    status: "",
    search: ""
  });

  // Fetch /auth/me first, then orders
  const fetchAll = async () => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUser(null);
      setOrders([]);
      return;
    }
    try {
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      if (!meRes.ok) throw new Error("Not authenticated");
      const meData = await meRes.json();
      setUser(meData.data || null);
      localStorage.setItem("user", JSON.stringify(meData.data || null));
      await loadData(token);
    } catch (e: any) {
      setUser(null);
      setOrders([]);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setError("Authentication failed. Please login again.");
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const loadData = async (token: string) => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiBase}/orders?page=${page}&limit=${limit}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        },
        credentials: "include"
      });
      const data = await res.json();
      setOrders(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order: any) => {
    const matchesStatus = filters.status === "" || (order.status && order.status.toLowerCase() === filters.status);
    const guestName = order.guestId ? `${order.guestId.firstName} ${order.guestId.lastName}` : "";
    const matchesSearch = filters.search === "" ||
      (guestName && guestName.toLowerCase().includes(filters.search.toLowerCase())) ||
      (order.roomNumber && order.roomNumber.toString().includes(filters.search));
    return matchesStatus && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredOrders.length / limit);
  const paginatedOrders = filteredOrders.slice((page - 1) * limit, page * limit);

  // Reset page to 1 on filter change
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
          <h1 className="text-3xl font-bold">Orders Management</h1>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            onClick={() => {
              setShowCreate(true);
              setCreateError("");
            }}
          >+ New Order</button>
        </div>
        {/* Create Order Modal */}
        {showCreate && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 w-full max-w-4xl max-h-[90vh] flex gap-8 overflow-y-auto">
              {/* Left: Form */}
              <div className="flex-1 min-w-[320px]">
                <h2 className="text-2xl font-bold mb-4">Create New Order</h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setCreateLoading(true);
                    setCreateError("");
                    try {
                      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                      if (!token) throw new Error("No token found");
                      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "${process.env.NEXT_PUBLIC_API_BASE_URL}";
                      const res = await fetch(`${apiBase}/orders`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                          roomNumber: createForm.roomNumber,
                          itemId: createForm.itemId
                        })
                      });
                      const data = await res.json().catch(() => ({}));
                      if (!res.ok) {
                        setNotification({ type: 'error', message: data?.message || 'Failed to create order' });
                        throw new Error(data?.message || "Failed to create order");
                      }
                      setNotification({ type: 'success', message: data?.message || 'Order created successfully' });
                      setShowCreate(false);
                      setCreateForm({ roomNumber: "", itemId: "" });
                      await fetchAll();
                    } catch (err: any) {
                      setCreateError(err.message);
                    } finally {
                      setCreateLoading(false);
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
                    <label className="block text-sm font-medium mb-1">Room Number</label>
                    <input
                      type="text"
                      value={createForm.roomNumber}
                      onChange={e => setCreateForm(f => ({ ...f, roomNumber: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Item ID</label>
                    <input
                      type="text"
                      value={createForm.itemId}
                      onChange={e => setCreateForm(f => ({ ...f, itemId: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  {createError && <div className="text-red-600 mb-2">{createError}</div>}
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreate(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      disabled={createLoading}
                    >Cancel</button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      disabled={createLoading}
                    >{createLoading ? "Creating..." : "Create Order"}</button>
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
                          className={`p-2 rounded cursor-pointer hover:bg-blue-100 ${createForm.itemId === item._id ? 'bg-blue-200' : ''}`}
                          onClick={() => setCreateForm(f => ({ ...f, itemId: item._id }))}
                        >
                          <div className="font-semibold">{item.name}</div>
                          <div className="text-xs text-gray-500">{item.category.name}</div>
                          {/* <div className="text-xs text-gray-400">ID: {item._id}</div> */}
                          <div className="text-xs text-gray-400">Price: {item.price}</div>
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
          <h3 className="text-lg font-semibold mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search (Order #, Guest)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search orders..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Extra Charges</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedOrders.map((order: any) => {
                  // Defensive extraction for all fields
                  const orderId = order._id ? String(order._id) : "-";
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
                        return `${name} (x${qty}) - ₹${price}${category ? ` [${category}]` : ''}`;
                      }).join("; ")
                    : "-";
                  const total = order.totalAmount !== undefined ? `₹${String(order.totalAmount)}` : "-";
                  const extra = order.extraCharges !== undefined ? `₹${String(order.extraCharges)}` : "-";
                  const status = order.status ? String(order.status) : "-";
                  const createdBy = order.createdBy && typeof order.createdBy === 'object'
                    ? `${order.createdBy.firstName || ''} ${order.createdBy.lastName || ''}`.trim() || "-"
                    : (order.createdBy ? String(order.createdBy) : "-");
                  const hotel = order.hotel && typeof order.hotel === 'object'
                    ? (order.hotel.name ? String(order.hotel.name) : "-")
                    : (order.hotel ? String(order.hotel) : "-");
                  const createdAt = order.createdAt
                    ? (typeof window !== 'undefined'
                        ? new Date(order.createdAt).toLocaleString()
                        : new Date(order.createdAt).toISOString())
                    : "-";
                  const updatedAt = order.updatedAt
                    ? (typeof window !== 'undefined'
                        ? new Date(order.updatedAt).toLocaleString()
                        : new Date(order.updatedAt).toISOString())
                    : "-";
                  return (
                    <tr key={orderId} className={`hover:bg-gray-50 ${selectedOrder?._id === order._id ? 'bg-blue-50' : ''}`} onClick={() => handleSelectOrder(order)} style={{ cursor: 'pointer' }}>
                      <td className="px-6 py-4 whitespace-nowrap">{orderId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{guest}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{room}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{items}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{total}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{extra}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{status}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{createdBy}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{hotel}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{createdAt}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{updatedAt}</td>
                    </tr>
                  );
                })}
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
          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No orders found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <div className="text-sm text-gray-600">Total Orders</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{orders.filter((o: any) => o.status === "Completed").length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{orders.filter((o: any) => o.status === "Pending").length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>
    </div>

  );
}

