
"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { getHotels } from "@/lib/api";

export default function HotelsPage() {
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
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    city: "",
    search: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getHotels();
      setHotels(res?.data || res || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter hotels
  const filteredHotels = hotels.filter((hotel: any) => {
    const matchesName = filters.name === "" || (hotel.name && hotel.name.toLowerCase().includes(filters.name.toLowerCase()));
    const matchesCity = filters.city === "" || (hotel.city && hotel.city.toLowerCase().includes(filters.city.toLowerCase()));
    const matchesSearch = filters.search === "" ||
      (hotel.name && hotel.name.toLowerCase().includes(filters.search.toLowerCase())) ||
      (hotel.city && hotel.city.toLowerCase().includes(filters.search.toLowerCase()));
    return matchesName && matchesCity && matchesSearch;
  });

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
          <h1 className="text-3xl font-bold">Hotels Management</h1>
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
              <label className="block text-sm font-medium mb-1">Search (Name, City)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search hotels..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Filter by name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Filter by city..."
              />
            </div>
          </div>
        </div>

        {/* Hotels Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHotels.map((hotel: any) => (
                  <tr key={hotel._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{hotel.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{hotel.city}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{hotel.address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredHotels.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No hotels found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{hotels.length}</div>
            <div className="text-sm text-gray-600">Total Hotels</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{hotels.filter((h: any) => h.isActive).length}</div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
        </div>
      </div>
    </div>

  );
}

