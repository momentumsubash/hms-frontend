"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { 
  createExpenditure, 
  getExpenditures, 
  approveExpenditure, 
  rejectExpenditure,
  getExpenditureStats,
  getFinancialOverview,
  getSummaryStats
} from "@/lib/expenditure";
import { Expenditure, ExpenditureFilters, ExpenditureStats, FinancialOverview, SummaryStats } from "@/types/expenditure";

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
const EXPENDITURE_CATEGORIES = ["supplies", "maintenance", "utilities", "salaries", "marketing", "other"];

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

type TabType = 'item' | 'room' | 'expenditure' | 'financial' | 'summary';

export default function StatsPage() {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  
  // Filters
  const [itemCategory, setItemCategory] = useState("");
  const [roomType, setRoomType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expenditureStatus, setExpenditureStatus] = useState("");
  const [expenditureCategory, setExpenditureCategory] = useState("");
  
  // Data states
  const [itemStats, setItemStats] = useState<any>(null);
  const [roomStats, setRoomStats] = useState<any>(null);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [expenditureStats, setExpenditureStats] = useState<ExpenditureStats | null>(null);
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null);
  const [summaryStats, setSummaryStats] = useState<SummaryStats | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  
  // Expenditure form states
  const [showExpenditureForm, setShowExpenditureForm] = useState(false);
  const [expenditureForm, setExpenditureForm] = useState({
    amount: "",
    description: "",
    category: "supplies" as const,
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Approval states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedExpenditure, setSelectedExpenditure] = useState<Expenditure | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Hide notification after 3s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Fetch initial data
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
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
      
      // 2. Fetch all stats data
      const [itemRes, roomRes, expendituresRes, expenditureStatsRes, financialRes, summaryRes] = await Promise.all([
          fetch(`http://localhost:3000/api/stats/item-sales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`http://localhost:3000/api/stats/room-sales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        getExpenditures(),
        getExpenditureStats(),
        getFinancialOverview(),
        getSummaryStats(7)
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
       setExpenditures(expendituresRes?.data || []);
       setExpenditureStats(expendituresRes?.summary || null);
       setFinancialOverview(financialRes?.data || financialRes);
       setSummaryStats(summaryRes?.data || summaryRes);
      } catch (err: any) {
        setError(err.message || "Error fetching stats");
      } finally {
        setLoading(false);
      }
    };

  // Fetch with filters
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

      const [itemRes, roomRes, expendituresRes, expenditureStatsRes, financialRes] = await Promise.all([
        fetch(itemUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(roomUrl.toString(), {
          headers: { Authorization: `Bearer ${token}` },
        }),
        getExpenditures({
          startDate,
          endDate,
          category: expenditureCategory || undefined,
          status: expenditureStatus || undefined
        }),
        getExpenditureStats({ startDate, endDate }),
        getFinancialOverview({ startDate, endDate })
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
       setExpenditures(expendituresRes?.data || []);
       setExpenditureStats(expendituresRes?.summary || null);
       setFinancialOverview(financialRes?.data || financialRes);
    } catch (err: any) {
      setError(err.message || "Error fetching filtered stats");
    } finally {
      setLoading(false);
    }
  };

  // Handle expenditure form submission
  const handleExpenditureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      await createExpenditure({
        amount: parseFloat(expenditureForm.amount),
        description: expenditureForm.description,
        category: expenditureForm.category,
        date: expenditureForm.date,
        notes: expenditureForm.notes,
        createdBy: user?._id || "",
      });
      
      setNotification({ type: 'success', message: 'Expenditure created successfully' });
      setShowExpenditureForm(false);
      setExpenditureForm({
        amount: "",
        description: "",
        category: "supplies",
        date: new Date().toISOString().split('T')[0],
        notes: ""
      });
      fetchAllData(); // Refresh data
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to create expenditure' });
    } finally {
      setFormLoading(false);
    }
  };

  // Handle expenditure approval
  const handleApproveExpenditure = async () => {
    if (!selectedExpenditure) return;
    
    try {
      await approveExpenditure(selectedExpenditure._id);
      setNotification({ type: 'success', message: 'Expenditure approved successfully' });
      setShowApprovalModal(false);
      setSelectedExpenditure(null);
      fetchAllData(); // Refresh data
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to approve expenditure' });
    }
  };

     // Handle expenditure rejection
   const handleRejectExpenditure = async () => {
     if (!selectedExpenditure) return;
    
    try {
             await rejectExpenditure(selectedExpenditure._id, rejectionReason || "No reason provided");
      setNotification({ type: 'success', message: 'Expenditure rejected successfully' });
      setShowApprovalModal(false);
      setSelectedExpenditure(null);
      setRejectionReason("");
      fetchAllData(); // Refresh data
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to reject expenditure' });
    }
  };

  // Calculate totals
  const totalItemSales = itemStats?.totalSales ?? 0;
  const totalRoomEarnings = roomStats?.totalEarnings ?? 0;
  const totalCombined = totalItemSales + totalRoomEarnings;
  const totalRoomCount = roomStats?.totalCount ?? 0;
  
  const itemBreakdown = itemStats?.breakdown || [];
  const roomBreakdown = roomStats?.breakdown || [];

     const isManager = user?.role === 'manager' || user?.role === 'super_admin';

   // Helper function to get category name from ID
   const getCategoryName = (categoryId: string) => {
     // This is a simple mapping - in a real app, you'd fetch categories from API
     const categoryMap: { [key: string]: string } = {
       '68a3686d27e63dc402df776c': 'Food',
       '68a3686d27e63dc402df7771': 'Beverage',
       '68a3686d27e63dc402df7767': 'Main Course',
       '68a3686d27e63dc402df776a': 'Sandwiches',
       // Add more mappings as needed
     };
     return categoryMap[categoryId] || categoryId;
   };

  return (
    <div>
      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        navLinks={navLinks}
      />

      <div className="max-w-7xl mx-auto py-10 px-6 space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Statistics & Financial Management</h1>
        
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end"
              onSubmit={e => {
                e.preventDefault();
                fetchStatsWithFilters();
              }}
            >
              <div>
                <label className="block text-sm font-medium mb-1">Item Category</label>
                <select
                  className="w-full border rounded px-3 py-2"
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
                  className="w-full border rounded px-3 py-2"
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
                <label className="block text-sm font-medium mb-1">Expenditure Status</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={expenditureStatus}
                  onChange={e => setExpenditureStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expenditure Category</label>
                <select
                  className="w-full border rounded px-3 py-2"
                  value={expenditureCategory}
                  onChange={e => setExpenditureCategory(e.target.value)}
                >
                  <option value="">All</option>
                  {EXPENDITURE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">End Date</label>
                <input
                  type="date"
                  className="w-full border rounded px-3 py-2"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
              <div className="md:col-span-3 lg:col-span-6">
                <Button type="submit" className="w-full md:w-auto">Apply Filters</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {error && <div className="text-red-600 text-center bg-red-50 p-4 rounded">{error}</div>}

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {notification.message}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">Loading stats...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Item Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">₹{totalItemSales.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Items Sold: {itemStats?.totalCount ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Room Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">₹{totalRoomEarnings.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Rooms Sold: {totalRoomCount}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                   <CardTitle className="text-sm">Total Expenditures</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="text-2xl font-bold text-red-600">₹{financialOverview?.expenditures?.approved?.total?.toLocaleString() ?? 0}</div>
                   <div className="text-sm text-gray-600">Pending: ₹{financialOverview?.expenditures?.pending?.total?.toLocaleString() ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Net Profit/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                                     <div className={`text-2xl font-bold ${financialOverview?.financial?.netProfit && financialOverview.financial.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     ₹{financialOverview?.financial?.netProfit?.toLocaleString() ?? 0}
                   </div>
                   <div className="text-sm text-gray-600">
                     Margin: {typeof financialOverview?.financial?.profitMargin === 'string' 
                       ? financialOverview.financial.profitMargin 
                       : (financialOverview?.financial?.profitMargin?.toFixed(1) ?? 0) + '%'}
                   </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap gap-2 border-b">
                  <button
                    className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                      activeTab === 'summary' 
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('summary')}
                  >
                    Summary Overview
                  </button>
                  <button
                    className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                      activeTab === 'item' 
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('item')}
                  >
                    Item Sales
                  </button>
                  <button
                    className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                      activeTab === 'room' 
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('room')}
                  >
                    Room Sales
                  </button>
                  <button
                    className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                      activeTab === 'expenditure' 
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('expenditure')}
                  >
                    Expenditures
                  </button>
                  <button
                    className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                      activeTab === 'financial' 
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('financial')}
                  >
                    Financial Overview
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary Overview Tab */}
                {activeTab === 'summary' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Hotel Balance</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                                                         <div className="flex justify-between">
                               <span>Total Sales:</span>
                               <span className="font-semibold">₹{financialOverview?.sales?.totalSales?.toLocaleString() ?? 0}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Total Expenditures:</span>
                               <span className="font-semibold">₹{financialOverview?.expenditures?.totalExpenditures?.toLocaleString() ?? 0}</span>
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Sales Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                                                         <div className="flex justify-between">
                               <span>Room Sales:</span>
                               <span className="font-semibold text-green-600">₹{financialOverview?.sales?.roomSales?.total?.toLocaleString() ?? 0}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Item Sales:</span>
                               <span className="font-semibold text-blue-600">₹{financialOverview?.sales?.itemSales?.total?.toLocaleString() ?? 0}</span>
                             </div>
                            <div className="flex justify-between border-t pt-2">
                              <span>Total Sales:</span>
                              <span className="font-semibold">₹{financialOverview?.sales?.totalSales?.toLocaleString() ?? 0}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Profit/Loss</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                                                         <div className="flex justify-between">
                               <span>Net Profit/Loss:</span>
                               <span className={`font-semibold ${financialOverview?.financial?.netProfit && financialOverview.financial.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 ₹{financialOverview?.financial?.netProfit?.toLocaleString() ?? 0}
                               </span>
                             </div>
                             <div className="flex justify-between">
                               <span>Profit Margin:</span>
                               <span className="font-semibold">{typeof financialOverview?.financial?.profitMargin === 'string' 
                                 ? financialOverview.financial.profitMargin 
                                 : (financialOverview?.financial?.profitMargin?.toFixed(1) ?? 0) + '%'}</span>
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Item Sales Tab */}
                {activeTab === 'item' && (
                  <div>
                    {itemBreakdown.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No item sales data for this filter.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                              <th className="px-3 py-2 border text-left">Item Name</th>
                              <th className="px-3 py-2 border text-left">Category</th>
                              <th className="px-3 py-2 border text-center">Quantity Sold</th>
                              <th className="px-3 py-2 border text-right">Sales</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itemBreakdown.map((row: any) => (
                              <tr key={row.itemId} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border">{row.name}</td>
                                 <td className="px-3 py-2 border">{getCategoryName(row.category)}</td>
                              <td className="px-3 py-2 border text-center">{row.quantity}</td>
                                <td className="px-3 py-2 border text-right">₹{row.sales?.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}
                  </div>
                )}

                {/* Room Sales Tab */}
                {activeTab === 'room' && (
                  <div>
                    {roomBreakdown.length === 0 ? (
                      <div className="text-gray-500 text-center py-8">No room sales data for this filter.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                              <th className="px-3 py-2 border text-left">Room Number</th>
                              <th className="px-3 py-2 border text-left">Type</th>
                              <th className="px-3 py-2 border text-center">Nights Sold</th>
                              <th className="px-3 py-2 border text-right">Earnings</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomBreakdown.map((row: any, idx: number) => (
                              <tr key={row.roomId || idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border">{row.roomNumber || row.name || '-'}</td>
                              <td className="px-3 py-2 border">{row.type || '-'}</td>
                              <td className="px-3 py-2 border text-center">{row.nights || row.quantity || '-'}</td>
                              <td className="px-3 py-2 border text-right">
                                  ₹{(row.roomEarnings ?? row.earnings ?? row.sales ?? 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    )}
                  </div>
                )}

                {/* Expenditures Tab */}
                {activeTab === 'expenditure' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Expenditure Management</h3>
                      <Button 
                        onClick={() => setShowExpenditureForm(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Create New Expenditure
                      </Button>
                    </div>

                                         {/* Expenditure Stats Cards */}
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <Card>
                         <CardContent className="p-4">
                           <div className="text-sm text-gray-600">Total Expenditures</div>
                           <div className="text-2xl font-bold text-red-600">₹{financialOverview?.financial?.totalExpenditures?.toLocaleString() ?? 0}</div>
                         </CardContent>
                       </Card>
                       <Card>
                         <CardContent className="p-4">
                           <div className="text-sm text-gray-600">Pending</div>
                           <div className="text-2xl font-bold text-yellow-600">₹{financialOverview?.financial?.pendingExpenditures?.toLocaleString() ?? 0}</div>
                         </CardContent>
                       </Card>
                       <Card>
                         <CardContent className="p-4">
                           <div className="text-sm text-gray-600">Approved</div>
                           <div className="text-2xl font-bold text-green-600">₹{financialOverview?.expenditures?.approved?.total?.toLocaleString() ?? 0}</div>
                         </CardContent>
                       </Card>
                       <Card>
                         <CardContent className="p-4">
                           <div className="text-sm text-gray-600">Rejected</div>
                           <div className="text-2xl font-bold text-red-600">₹{(financialOverview?.financial?.totalExpenditures ?? 0) - (financialOverview?.expenditures?.approved?.total ?? 0) - (financialOverview?.financial?.pendingExpenditures ?? 0)}</div>
                         </CardContent>
                       </Card>
                     </div>

                    {/* Expenditures Table */}
                    <div className="overflow-x-auto">
                      <table className="min-w-full border text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="px-3 py-2 border text-left">Date</th>
                            <th className="px-3 py-2 border text-left">Description</th>
                            <th className="px-3 py-2 border text-left">Category</th>
                            <th className="px-3 py-2 border text-right">Amount</th>
                            <th className="px-3 py-2 border text-center">Status</th>
                            <th className="px-3 py-2 border text-left">Created By</th>
                            <th className="px-3 py-2 border text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenditures.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="px-3 py-4 text-center text-gray-500">
                                No expenditures found
                              </td>
                            </tr>
                          ) : (
                            expenditures.map((expenditure) => (
                              <tr key={expenditure._id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 border">
                                  {format(new Date(expenditure.date), "MMM dd, yyyy")}
                                </td>
                                <td className="px-3 py-2 border">{expenditure.description}</td>
                                <td className="px-3 py-2 border capitalize">{expenditure.category}</td>
                                <td className="px-3 py-2 border text-right">₹{expenditure.amount.toLocaleString()}</td>
                                <td className="px-3 py-2 border text-center">
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    expenditure.status === 'approved' 
                                      ? 'bg-green-100 text-green-800'
                                      : expenditure.status === 'rejected'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {expenditure.status}
                                  </span>
                                </td>
                                <td className="px-3 py-2 border">
                                  {expenditure.createdBy?.firstName} {expenditure.createdBy?.lastName}
                                </td>
                                                                 <td className="px-3 py-2 border text-center">
                                   {isManager && (
                                     <div className="flex gap-2 justify-center">
                                       {expenditure.status === 'pending' && (
                                         <>
                                           <Button
                                             size="sm"
                                             onClick={() => {
                                               setSelectedExpenditure(expenditure);
                                               setShowApprovalModal(true);
                                             }}
                                             className="bg-green-600 hover:bg-green-700"
                                           >
                                             Review
                                           </Button>
                                         </>
                                       )}
                                       {expenditure.status !== 'pending' && (
                                         <span className="text-sm text-gray-500">
                                           {expenditure.status === 'approved' ? 'Approved' : 'Rejected'}
                                         </span>
                                       )}
                                     </div>
                                   )}
                                 </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Financial Overview Tab */}
                {activeTab === 'financial' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Hotel Balance Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <span className="font-medium">Initial Amount</span>
                              <span className="text-lg font-bold">₹{financialOverview?.hotelBalance?.initialAmount?.toLocaleString() ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                              <span className="font-medium">Total Sales</span>
                              <span className="text-lg font-bold text-green-600">₹{financialOverview?.sales?.totalSales?.toLocaleString() ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                              <span className="font-medium">Total Expenditures</span>
                              <span className="text-lg font-bold text-red-600">₹{financialOverview?.expenditures?.totalExpenditures?.toLocaleString() ?? 0}</span>
                            </div>
                                                         <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                               <span className="font-medium">Current Balance</span>
                               <span className="text-lg font-bold text-blue-600">₹{(financialOverview?.sales?.totalSales ?? 0) - (financialOverview?.expenditures?.totalExpenditures ?? 0)}</span>
                             </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle>Profit & Loss Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                              <span className="font-medium">Gross Profit</span>
                              <span className="text-lg font-bold text-green-600">₹{financialOverview?.profitLoss?.grossProfit?.toLocaleString() ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                              <span className="font-medium">Net Profit/Loss</span>
                              <span className={`text-lg font-bold ${financialOverview?.profitLoss?.netProfit && financialOverview.profitLoss.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                ₹{financialOverview?.profitLoss?.netProfit?.toLocaleString() ?? 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                              <span className="font-medium">Profit Margin</span>
                                                             <span className="text-lg font-bold text-purple-600">{typeof financialOverview?.financial?.profitMargin === 'string' 
                                 ? financialOverview.financial.profitMargin 
                                 : (financialOverview?.financial?.profitMargin?.toFixed(1) ?? 0) + '%'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Expenditure Form Modal */}
        {showExpenditureForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Create New Expenditure</h2>
              
              <form onSubmit={handleExpenditureSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={expenditureForm.amount}
                    onChange={e => setExpenditureForm(prev => ({ ...prev, amount: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Enter amount"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    value={expenditureForm.description}
                    onChange={e => setExpenditureForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Enter description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    required
                    value={expenditureForm.category}
                    onChange={e => setExpenditureForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    {EXPENDITURE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={expenditureForm.date}
                    onChange={e => setExpenditureForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={expenditureForm.notes}
                    onChange={e => setExpenditureForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={3}
                    placeholder="Additional notes (optional)"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowExpenditureForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {formLoading ? "Creating..." : "Create Expenditure"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && selectedExpenditure && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Review Expenditure</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <span className="font-medium">Amount:</span> ₹{selectedExpenditure.amount.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Description:</span> {selectedExpenditure.description}
                </div>
                <div>
                  <span className="font-medium">Category:</span> {selectedExpenditure.category}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {format(new Date(selectedExpenditure.date), "MMM dd, yyyy")}
                </div>
                <div>
                  <span className="font-medium">Created By:</span> {selectedExpenditure.createdBy?.firstName} {selectedExpenditure.createdBy?.lastName}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Rejection Reason (if rejecting)</label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={3}
                    placeholder="Enter reason for rejection (optional)"
                  />
                </div>

                                 <div className="flex justify-end space-x-3">
                   <Button
                     onClick={() => {
                       setShowApprovalModal(false);
                       setSelectedExpenditure(null);
                       setRejectionReason("");
                     }}
                     className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                   >
                     Cancel
                   </Button>
                   <Button
                     onClick={handleRejectExpenditure}
                     className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                   >
                     Reject
                   </Button>
                   <Button
                     onClick={handleApproveExpenditure}
                     className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                   >
                     Approve
                   </Button>
                 </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}