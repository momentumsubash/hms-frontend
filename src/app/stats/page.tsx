"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Checkouts", href: "/checkouts" },
  { label: "Guests", href: "/guests" },
  { label: "Hotels", href: "/hotels", superAdminOnly: true },
  { label: "Items", href: "/items" },
  { label: "Orders", href: "/orders" },
  { label: "Rooms", href: "/rooms" },
  { label: "Stats", href: "/stats" },
  { label: "Users", href: "/users" },
];

const ITEM_CATEGORIES = ["food", "beverage", "laundry", "spa"];
const ROOM_TYPES = ["deluxe", "suite", "standard"];

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export default function StatsPage() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'item' | 'room'>('item');
  const [itemCategory, setItemCategory] = useState("");
  const [roomType, setRoomType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [itemStats, setItemStats] = useState<any>(null);
  const [roomStats, setRoomStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch /auth/me, then item-sales and room-sales without filters on initial load
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError("");
      const token = getToken();
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
        // 2. Fetch stats
        const [itemRes, roomRes] = await Promise.all([
          fetch(`http://localhost:3000/api/stats/item-sales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:3000/api/stats/room-sales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        if (itemRes.status === 401 || roomRes.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }
        if (!itemRes.ok || !roomRes.ok) throw new Error("Failed to fetch stats");
        const itemJson = await itemRes.json();
        const roomJson = await roomRes.json();
        setItemStats(itemJson.data || itemJson);
        setRoomStats(roomJson.data || roomJson);
      } catch (err: any) {
        setError(err.message || "Error fetching stats");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Fetch with filters only when user submits the form
  const fetchStatsWithFilters = async () => {
    setLoading(true);
    setError("");
    const token = getToken();
    
    try {
      const itemUrl = new URL("http://localhost:3000/api/stats/item-sales");
      if (itemCategory) itemUrl.searchParams.append("category", itemCategory);
      if (startDate) itemUrl.searchParams.append("startDate", startDate);
      if (endDate) itemUrl.searchParams.append("endDate", endDate);

      const roomUrl = new URL("http://localhost:3000/api/stats/room-sales");
      if (roomType) roomUrl.searchParams.append("type", roomType);
      if (startDate) roomUrl.searchParams.append("startDate", startDate);
      if (endDate) roomUrl.searchParams.append("endDate", endDate);

      const [itemRes, roomRes] = await Promise.all([
        fetch(itemUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(roomUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (itemRes.status === 401 || roomRes.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      if (!itemRes.ok || !roomRes.ok) throw new Error("Failed to fetch filtered stats");

      const itemJson = await itemRes.json();
      const roomJson = await roomRes.json();
      setItemStats(itemJson.data || itemJson);
      setRoomStats(roomJson.data || roomJson);
    } catch (err: any) {
      setError(err.message || "Error fetching filtered stats");
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals and breakdowns
  const totalItemSales = itemStats?.totalSales ?? 0;
  const totalRoomEarnings = roomStats?.totalEarnings ?? 0;
  const totalCombined = totalItemSales + totalRoomEarnings;
  const totalRoomCount = roomStats?.totalCount ?? 0;
  
  const itemBreakdown = itemStats?.breakdown || [];
  const roomBreakdown = roomStats?.breakdown || [];

  return (
    <div>
      {/* Navigation Bar */}
      <nav className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <span className="font-bold text-xl text-primary">HMS</span>
            <div className="flex items-center space-x-4">
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
            {/* User button in nav bar, at far right */}
            <div className="relative">
              <button
                className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-100 border border-gray-200"
                onClick={() => setShowUserMenu((v) => !v)}
              >
                <span className="font-medium text-gray-700">
                  {user?.firstName ? user.firstName : user?.email || "User"}
                </span>
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow z-50">
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={async () => {
                      setShowUserMenu(false);
                      await logout();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-10 space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Statistics</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="flex flex-wrap gap-4 items-end"
              onSubmit={e => {
                e.preventDefault();
                fetchStatsWithFilters();
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-1">Item Category</label>
                <select
                  className="border rounded px-2 py-1"
                  value={itemCategory}
                  onChange={e => setItemCategory(e.target.value)}
                >
                  <option value="">All</option>
                  {ITEM_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Room Type</label>
                <select
                  className="border rounded px-2 py-1"
                  value={roomType}
                  onChange={e => setRoomType(e.target.value)}
                >
                  <option value="">All</option>
                  {ROOM_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  className="border rounded px-2 py-1"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
              <Button type="submit">Apply Filters</Button>
            </form>
          </CardContent>
        </Card>

        {error && <div className="text-red-600 text-center">{error}</div>}

        {loading ? (
          <div className="text-center py-10">Loading stats...</div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle>Item Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-600 text-sm">Total Item Earning</div>
                  <div className="text-2xl font-bold">${totalItemSales.toFixed(2)}</div>
                  <div className="text-gray-600 text-sm mt-2">Total Items Sold: {itemStats?.totalCount ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Room Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-600 text-sm">Total Room Earning</div>
                  <div className="text-2xl font-bold">${totalRoomEarnings.toFixed(2)}</div>
                  <div className="text-gray-600 text-sm mt-2">Total Rooms Sold: {totalRoomCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Combined Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-600 text-sm">Grand Total Earning</div>
                  <div className="text-2xl font-bold">${totalCombined.toFixed(2)}</div>
                  <div className="text-gray-600 text-sm mt-2">(Item + Room)</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for breakdown tables */}
            <Card>
              <CardHeader>
                <div className="flex gap-4 border-b">
                  <button
                    className={`px-4 py-2 font-medium ${activeTab === 'item' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('item')}
                  >
                    Item Sales Breakdown
                  </button>
                  <button
                    className={`px-4 py-2 font-medium ${activeTab === 'room' ? 'border-b-2 border-primary text-primary' : 'text-gray-600'}`}
                    onClick={() => setActiveTab('room')}
                  >
                    Room Sales Breakdown
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {activeTab === 'item' ? (
                  itemBreakdown.length === 0 ? (
                    <div className="text-gray-500">No item sales data for this filter.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-3 py-2 border">Item Name</th>
                            <th className="px-3 py-2 border">Category</th>
                            <th className="px-3 py-2 border">Quantity Sold</th>
                            <th className="px-3 py-2 border">Sales</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemBreakdown.map((row: any) => (
                            <tr key={row.itemId}>
                              <td className="px-3 py-2 border">{row.name}</td>
                              <td className="px-3 py-2 border">{row.category}</td>
                              <td className="px-3 py-2 border text-center">{row.quantity}</td>
                              <td className="px-3 py-2 border text-right">${row.sales?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                ) : (
                  roomBreakdown.length === 0 ? (
                    <div className="text-gray-500">No room sales data for this filter.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-3 py-2 border">Room Number</th>
                            <th className="px-3 py-2 border">Type</th>
                            <th className="px-3 py-2 border">Nights Sold</th>
                            <th className="px-3 py-2 border">Earnings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomBreakdown.map((row: any, idx: number) => (
                            <tr key={row.roomId || idx}>
                              <td className="px-3 py-2 border">{row.roomNumber || row.name || '-'}</td>
                              <td className="px-3 py-2 border">{row.type || '-'}</td>
                              <td className="px-3 py-2 border text-center">{row.nights || row.quantity || '-'}</td>
                              <td className="px-3 py-2 border text-right">
                                ${(row.roomEarnings ?? row.earnings ?? row.sales ?? 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}