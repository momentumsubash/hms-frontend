
"use client";
import { getOrders } from "@/lib/api";
import { useEffect, useState } from "react";

export default function OrdersPage() {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState("");
  const [updateError, setUpdateError] = useState("");

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
      const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWRiMjQ5N2M2NzMzMjVlODNjMzcwOSIsInJvbGUiOiJtYW5hZ2VyIiwiaWF0IjoxNzU1MTc0NTE1LCJleHAiOjE3NTUyNjA5MTV9.jCJC1S4lDBM9a_c0ocZwgMNFf2TNr2UBDvXLXxHi3R4";
      const res = await fetch(`${apiBase}/orders/${selectedOrder._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: updateStatus })
      });
      if (!res.ok) throw new Error("Failed to update order status");
      await loadData();
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
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    search: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiBase}/orders?page=1&limit=10`, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWRiMjQ5N2M2NzMzMjVlODNjMzcwOSIsInJvbGUiOiJtYW5hZ2VyIiwiaWF0IjoxNzU1MTc0NTE1LCJleHAiOjE3NTUyNjA5MTV9.jCJC1S4lDBM9a_c0ocZwgMNFf2TNr2UBDvXLXxHi3R4"
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

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center space-x-6">
            <span className="font-bold text-xl text-primary">Hotel HMS</span>
            <div className="flex space-x-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-primary font-medium px-3 py-2 rounded transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders Management</h1>
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
                {filteredOrders.map((order: any) => (
                  <tr key={order._id} className={`hover:bg-gray-50 ${selectedOrder?._id === order._id ? 'bg-blue-50' : ''}`} onClick={() => handleSelectOrder(order)} style={{ cursor: 'pointer' }}>
                    <td className="px-6 py-4 whitespace-nowrap">{order._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.guestId ? `${order.guestId.firstName} ${order.guestId.lastName}` : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.roomNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.items?.map((i: any) => (
                        <div key={i._id}>
                          <span className="font-semibold">{i.name}</span> (x{i.quantity}) - ₹{i.price} [{i.itemId?.category}]
                        </div>
                      ))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{order.totalAmount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{order.extraCharges}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.status}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.createdBy ? `${order.createdBy.firstName} ${order.createdBy.lastName}` : "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{order.hotel?.name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(order.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(order.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
