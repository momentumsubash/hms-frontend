
"use client";
import { getCheckouts } from "@/lib/api";
import { useEffect, useState } from "react";

export default function CheckoutsPage() {
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
  const [checkouts, setCheckouts] = useState<any[]>([]);
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
      const res = await getCheckouts();
      setCheckouts(res?.data || res || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter checkouts
  const filteredCheckouts = checkouts.filter((checkout: any) => {
    const matchesStatus = filters.status === "" || checkout.status === filters.status;
    const matchesSearch = filters.search === "" ||
      (checkout.guestName && checkout.guestName.toLowerCase().includes(filters.search.toLowerCase())) ||
      (checkout.roomNumber && checkout.roomNumber.toLowerCase().includes(filters.search.toLowerCase()));
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
          <h1 className="text-3xl font-bold">Checkouts Management</h1>
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
              <label className="block text-sm font-medium mb-1">Search (Guest, Room)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search checkouts..."
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
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Checkouts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checkout Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCheckouts.map((checkout: any) => (
                  <tr key={checkout._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{checkout.guestName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{checkout.roomNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{checkout.checkoutDate ? new Date(checkout.checkoutDate).toLocaleString() : ""}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{checkout.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCheckouts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No checkouts found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{checkouts.length}</div>
            <div className="text-sm text-gray-600">Total Checkouts</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{checkouts.filter((c: any) => c.status === "Completed").length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{checkouts.filter((c: any) => c.status === "Pending").length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}
