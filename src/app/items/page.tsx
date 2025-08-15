
"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { getItems } from "@/lib/api";

export default function ItemsPage() {
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
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    search: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
      const res = await fetch(`${apiBase}/items?page=1&limit=10`, {
        headers: {
          Accept: "application/json",
          Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWRiMjQ5N2M2NzMzMjVlODNjMzcwOSIsInJvbGUiOiJtYW5hZ2VyIiwiaWF0IjoxNzU1MTc0NTE1LCJleHAiOjE3NTUyNjA5MTV9.jCJC1S4lDBM9a_c0ocZwgMNFf2TNr2UBDvXLXxHi3R4"
        },
        credentials: "include"
      });
      const data = await res.json();
      setItems(data.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter items
  const filteredItems = items.filter((item: any) => {
    const matchesCategory = filters.category === "" || item.category === filters.category;
    const matchesSearch = filters.search === "" ||
      (item.name && item.name.toLowerCase().includes(filters.search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredItems.length / limit);
  const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

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
          <h1 className="text-3xl font-bold">Items Management</h1>
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
              <label className="block text-sm font-medium mb-1">Search (Name)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search items..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <input
                type="text"
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Filter by category..."
              />
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedItems.map((item: any) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">₹{item.price}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.isAvailable ? "Yes" : "No"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.hotel?.name || "-"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(item.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{new Date(item.updatedAt).toLocaleString()}</td>
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
          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No items found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{items.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{items.filter((i: any) => i.isAvailable).length}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
        </div>
      </div>
    </div>

  );
}

