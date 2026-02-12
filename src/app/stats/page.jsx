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
  // getExpenditureStats,
  getFinancialOverview,
  getSummaryStats
} from "@/lib/expenditure";
import { Expenditure, ExpenditureFilters, ExpenditureStats, FinancialOverview, SummaryStats } from "@/types/expenditure";



export default function StatsPage() {
  // Load hotel from localStorage
  const [hotel, setHotel] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  // Listen for localStorage changes (e.g., nepaliLanguage toggle)
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'hotel') {
        setHotel(event.newValue ? JSON.parse(event.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const ROOM_TYPES = ["deluxe", "suite", "standard"];
  const EXPENDITURE_CATEGORIES = ["supplies", "maintenance", "utilities", "salary", "marketing", "other"];

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }

  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  
  // Filters
  const [itemCategory, setItemCategory] = useState("");
  const [roomType, setRoomType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expenditureStatus, setExpenditureStatus] = useState("");
  const [expenditureCategory, setExpenditureCategory] = useState("");
  
  // Data states
  const [itemStats, setItemStats] = useState(null);
  const [roomStats, setRoomStats] = useState(null);
  const [expenditures, setExpenditures] = useState([]);
  const [expenditureStats, setExpenditureStats] = useState(null);
  const [financialOverview, setFinancialOverview] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [daysFilter, setDaysFilter] = useState(1);
  const [itemCategories, setItemCategories] = useState([]);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState(null);
  
  // Expenditure form states
  const [showExpenditureForm, setShowExpenditureForm] = useState(false);
  const [expenditureForm, setExpenditureForm] = useState({
    amount: "",
    description: "",
    category: "supplies",
    date: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  
  // Approval states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedExpenditure, setSelectedExpenditure] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch item categories
  const fetchItemCategories = async () => {
    try {
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories?type=item&isActive=true`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setItemCategories(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch item categories:", error);
    }
  };

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
    // fetchItemCategories();
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
      const [itemRes, roomRes, expendituresRes, financialRes, summaryRes, dailyRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stats/item-sales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stats/room-sales`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        getExpenditures(),
        // getExpenditureStats(),
        getFinancialOverview(),
        getSummaryStats(30),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stats/summary?days=${daysFilter}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        ]);

        if (itemRes.status === 401 || roomRes.status === 401 || dailyRes.status === 401) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }

        if (!itemRes.ok || !roomRes.ok || !dailyRes.ok) throw new Error("Failed to fetch stats");

        const itemJson = await itemRes.json();
        const roomJson = await roomRes.json();
        const dailyJson = await dailyRes.json();
      
        console.log('📊 Stats Data Received:');
        console.log('itemJson:', itemJson);
        console.log('roomJson:', roomJson);
        console.log('financialRes:', financialRes);
        console.log('summaryRes:', summaryRes);
        console.log('dailyJson:', dailyJson);
        
        setItemStats(itemJson.data || itemJson);
        setRoomStats(roomJson.data || roomJson);
        setExpenditures(expendituresRes?.data || []);
        setExpenditureStats(expendituresRes?.summary || null);
        setFinancialOverview(financialRes?.data || financialRes);
        setSummaryStats(summaryRes?.data || summaryRes);
        setDailySummary(dailyJson.data || dailyJson);
      } catch (err) {
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
      const itemUrl = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stats/item-sales`);
      if (itemCategory) itemUrl.searchParams.append("category", itemCategory);
      if (startDate) itemUrl.searchParams.append("startDate", startDate);
      if (endDate) itemUrl.searchParams.append("endDate", endDate);

      const roomUrl = new URL(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stats/room-sales`);
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
        // getExpenditureStats({ startDate, endDate }),
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
    } catch (err) {
      setError(err.message || "Error fetching filtered stats");
    } finally {
      setLoading(false);
    }
  };

  // Handle expenditure form submission
  const handleExpenditureSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      await createExpenditure({
        amount: parseFloat(expenditureForm.amount),
        description: expenditureForm.description,
        category: expenditureForm.category,
        date: expenditureForm.date,
        notes: expenditureForm.notes
       
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
    } catch (err) {
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
    } catch (err) {
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
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to reject expenditure' });
    }
  };

  // Calculate totals and transform data for display
  const totalItemSales = Array.isArray(itemStats) 
    ? itemStats.reduce((sum, item) => sum + (item.totalSales || 0), 0)
    : itemStats?.totalItemSales ?? 0;
  
  const totalItemQuantity = Array.isArray(itemStats)
    ? itemStats.reduce((sum, item) => sum + (item.quantity || 0), 0)
    : itemStats?.totalQuantity ?? 0;
  
  const totalRoomRevenue = roomStats?.totalRoomCharge ?? roomStats?.totalRoomRevenue ?? 0;
  const totalRoomCheckouts = roomStats?.totalCheckouts ?? roomStats?.totalCount ?? 0;
  const totalNights = roomStats?.totalNights ?? 0;
  const totalCombined = totalItemSales + totalRoomRevenue;
  
  // Transform item stats array into breakdown format
  const itemBreakdown = Array.isArray(itemStats) 
    ? itemStats.map(item => ({
        itemId: item.item,
        name: item.name,
        category: item.category?.name || item.category || '',
        quantity: item.quantity || 0,
        sales: item.totalSales || 0
      }))
    : itemStats?.breakdown || [];
  
  // Room sales is returned as aggregate, not per-room, so create a summary
  const roomBreakdown = roomStats && !Array.isArray(roomStats)
    ? [{
        roomNumber: 'All Rooms',
        type: 'Aggregate',
        totalNights: roomStats.totalNights || 0,
        checkoutCount: roomStats.totalCheckouts || 0,
        actualRoomRevenue: roomStats.totalRoomCharge || 0
      }]
    : roomStats?.breakdown || [];

     const isManager = user?.role === 'manager' || user?.role === 'super_admin';

   // Helper function to get category name from ID
   const getCategoryName = (categoryId) => {
     const category = itemCategories.find(cat => cat._id === categoryId);
     return category ? category.name : categoryId;
   };

  return (
    <div>
      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        nepaliFlag={hotel?.nepaliFlag}
      />

      <div className="max-w-9xl mx-auto py-10 px-6 space-y-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Statistics & Financial Management</h1>
        
        {/* Filters */}
       

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
                  <div className="text-2xl font-bold text-blue-600">रु{totalItemSales.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Items Sold: {totalItemQuantity}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Room Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">रु{totalRoomRevenue.toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Total Checkouts: {totalRoomCheckouts}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                   <CardTitle className="text-sm">Total Expenditures</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="text-2xl font-bold text-red-600">रु{financialOverview?.summary?.totalExpenditures?.toLocaleString() ?? 0}</div>
                   <div className="text-sm text-gray-600">Pending: रु{financialOverview?.summary?.totalExpenditures?.toLocaleString() ?? 0}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Net Profit/Loss</CardTitle>
                </CardHeader>
                <CardContent>
                                     <div className={`text-2xl font-bold ${financialOverview?.summary?.netProfit && financialOverview.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     रु{financialOverview?.summary?.netProfit?.toLocaleString() ?? 0}
                   </div>
                   <div className="text-sm text-gray-600">
                     Margin: {typeof financialOverview?.summary?.profitMargin === 'string' 
                       ? financialOverview.summary.profitMargin 
                       : (financialOverview?.summary?.profitMargin?.toFixed(1) ?? 0) + '%'}
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
                  <button
                    className={`px-4 py-2 font-medium rounded-t-lg transition-colors ${
                      activeTab === 'daily' 
                        ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                    onClick={() => setActiveTab('daily')}
                  >
                    Daily Summary
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
                               <span className="font-semibold">रु{financialOverview?.summary?.totalGainedMoney?.toLocaleString() ?? 0}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Total Expenditures:</span>
                               <span className="font-semibold">रु{financialOverview?.summary?.totalExpenditures?.toLocaleString() ?? 0}</span>
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
                               <span className="font-semibold text-green-600">रु{financialOverview?.summary?.totalRoomRevenue?.toLocaleString() ?? 0}</span>
                             </div>
                             <div className="flex justify-between">
                               <span>Item Sales:</span>
                               <span className="font-semibold text-blue-600">रु{financialOverview?.summary?.totalItemSales?.toLocaleString() ?? 0}</span>
                             </div>
                            <div className="flex justify-between border-t pt-2">
                              <span>Total Sales:</span>
                              <span className="font-semibold">रु{financialOverview?.summary?.totalEarningsWithoutVat?.toLocaleString() ?? 0}</span>
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
                               <span className={`font-semibold ${financialOverview?.summary?.netProfit && financialOverview.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                 रु{financialOverview?.summary?.netProfit?.toLocaleString() ?? 0}
                               </span>
                             </div>
                             <div className="flex justify-between">
                               <span>Profit Margin:</span>
                               <span className="font-semibold">
                                 {isNaN(Number(financialOverview?.summary?.profitMargin))
                                   ? (financialOverview?.summary?.profitMargin ?? '0%')
                                   : (Number(financialOverview?.summary?.profitMargin).toFixed(1) + '%')}
                               </span>
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
                          {itemBreakdown.map((row) => (
               
                              <tr key={row.itemId} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border">{row.name}</td>
                                 <td className="px-3 py-2 border">{row.category}</td>
                              <td className="px-3 py-2 border text-center">{row.quantity}</td>
                                <td className="px-3 py-2 border text-right">रु{row.sales?.toFixed(2)}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold">
                            <td colSpan={2} className="px-3 py-2 border text-right">Total Item Sales:</td>
                            <td className="px-3 py-2 border text-center">{totalItemQuantity}</td>
                            <td className="px-3 py-2 border text-right">रु{totalItemSales.toFixed(2)}</td>
                          </tr>
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
                              <th className="px-3 py-2 border text-center">Checkouts</th>
                              <th className="px-3 py-2 border text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roomBreakdown.map((row, idx) => (
                              <tr key={row.roomNumber || idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 border">{row.roomNumber || '-'}</td>
                              <td className="px-3 py-2 border">{row.type || '-'}</td>
                              <td className="px-3 py-2 border text-center">{row.totalNights || '-'}</td>
                              <td className="px-3 py-2 border text-center">{row.checkoutCount || '-'}</td>
                              <td className="px-3 py-2 border text-right">रु{row.actualRoomRevenue?.toFixed(2) || 0}</td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-bold">
                            <td colSpan={2} className="px-3 py-2 border text-right">Total Room Revenue:</td>
                            <td className="px-3 py-2 border text-center">{totalNights}</td>
                            <td className="px-3 py-2 border text-center">{totalRoomCheckouts}</td>
                            <td className="px-3 py-2 border text-right">रु{totalRoomRevenue.toFixed(2)}</td>
                          </tr>
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
                     {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <Card>
                         <CardContent className="p-4">
                           <div className="text-sm text-gray-600">Total Expenditures</div>
                           <div className="text-2xl font-bold text-red-600">रु{financialOverview?.summary?.totalExpenditures?.toLocaleString() ?? 0}</div>
                         </CardContent>
                       </Card>
                       <Card>
                         <CardContent className="p-4">
                           <div className="text-sm text-gray-600">Pending</div>
                           <div className="text-2xl font-bold text-yellow-600">रु{financialOverview?.financial?.pendingExpenditures?.toLocaleString() ?? 0}</div>
                         </CardContent>
                       </Card>
                       <Card>
                         <CardContent className="p-4">
                           <div className="text-sm text-gray-600">Approved</div>
                           <div className="text-2xl font-bold text-green-600">रु{financialOverview?.expenditures?.approved?.total?.toLocaleString() ?? 0}</div>
                         </CardContent>
                       </Card>
                       <Card>
                         <CardContent className="p-4">
                           <div className="text-sm text-gray-600">Rejected</div>
                           <div className="text-2xl font-bold text-red-600">रु{(financialOverview?.financial?.totalExpenditures ?? 0) - (financialOverview?.expenditures?.approved?.total ?? 0) - (financialOverview?.financial?.pendingExpenditures ?? 0)}</div>
                         </CardContent>
                       </Card>
                     </div> */}

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
                                <td className="px-3 py-2 border text-right">रु{expenditure.amount.toLocaleString()}</td>
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
                                              <div className="flex justify-between items-center p-3 bg-teal-50 rounded">
                                                <span className="font-medium">Hotel Balance</span>
                                                <span className="text-lg font-bold text-teal-600">
                                                  {/* Initial: रु{financialOverview?.hotel?.initialAmount?.toLocaleString() ?? 0}<br />
                                                  Earnings: रु{financialOverview?.summary?.totalGainedMoney?.toLocaleString() ?? 0}<br />
                                                  Expenditures: रु{financialOverview?.summary?.totalExpenditures?.toLocaleString() ?? 0}<br /> */}
                                                  <span className="font-semibold">Current Balance: रु{((Number(financialOverview?.hotel?.initialAmount) || 0) + (Number(financialOverview?.summary?.totalGainedMoney) || 0) - (Number(financialOverview?.summary?.totalExpenditures) || 0)).toLocaleString()}</span>
                                                </span>
                                              </div>
                          
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                              <span className="font-medium">Total Sales without Vat</span>
                              <span className="text-lg font-bold text-green-600">रु{financialOverview?.summary?.totalEarningsWithoutVat?.toLocaleString() ?? 0}</span>
                            </div>
                              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                              <span className="font-medium">Total Vat Amount</span>
                              <span className="text-lg font-bold text-green-600">रु{financialOverview?.summary?.totalVatAmount?.toLocaleString() ?? 0}</span>
                            </div>
                              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                              <span className="font-medium">Total Advance Paid </span>
                              <span className="text-lg font-bold text-green-600">रु{financialOverview?.summary?.totalAdvancePaid?.toLocaleString() ?? 0}</span>
                            </div>
                             <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                              <span className="font-medium">Total Bill Without Advance</span>
                              <span className="text-lg font-bold text-green-600">रु{financialOverview?.summary?.totalBilledAmountWithoutAdvance?.toLocaleString() ?? 0}</span>
                            </div>
                             <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                              <span className="font-medium">Total Room Discounts </span>
                              <span className="text-lg font-bold text-green-600">रु{financialOverview?.summary?.totalRoomDiscount?.toLocaleString() ?? 0}</span>
                            </div>
                             <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                              <span className="font-medium">Total Money Collected </span>
                              <span className="text-lg font-bold text-green-600">रु{financialOverview?.summary?.totalGainedMoney?.toLocaleString() ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                              <span className="font-medium">Total Expenditures</span>
                              <span className="text-lg font-bold text-red-600">रु{financialOverview?.summary?.totalExpenditures?.toLocaleString() ?? 0}</span>
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
                              <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                              <span className="font-medium">Initial Amount</span>
                              <span className="text-lg font-bold">रु{financialOverview?.hotel?.initialAmount?.toLocaleString() ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                               <span className="font-medium">Current Balance</span>
                               <span className="text-lg font-bold text-blue-600">रु{financialOverview?.hotel?.currentBalance?.toLocaleString() ?? 0}</span>
                             </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                              <span className="font-medium">Actual Company Profit(withoutVat)</span>
                              <span className="text-lg font-bold text-green-600">रु{financialOverview?.summary?.totalEarningsWithoutVat?.toLocaleString() ?? 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                              <span className="font-medium">Net Profit/Loss</span>
                              <span className={`text-lg font-bold ${financialOverview?.summary?.netProfit && financialOverview.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                रु{financialOverview?.summary?.netProfit?.toLocaleString() ?? 0}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                              <span className="font-medium">Profit Margin</span>
                                                             <span className="text-lg font-bold text-purple-600">{financialOverview?.summary?.profitMargin ?? '0%'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}

                {/* Daily Summary Tab */}
                {activeTab === 'daily' && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-lg font-semibold">Daily Summary</h3>
                      <select
                        className="border rounded px-3 py-2"
                        value={daysFilter}
                        onChange={e => setDaysFilter(Number(e.target.value))}
                      >
                        <option value={1}>Today</option>
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                      </select>
                      <Button onClick={() => fetchAllData()}>Refresh</Button>
                    </div>

                    {dailySummary ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Total Earnings</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-green-600">रु{dailySummary.earnings?.total?.toLocaleString() ?? 0}</div>
                            <div className="text-sm text-gray-600">Checkouts: {dailySummary.earnings?.checkoutCount ?? 0}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Room Revenue</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-blue-600">रु{dailySummary.earnings?.roomRevenue?.toLocaleString() ?? 0}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Item Sales</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-purple-600">रु{dailySummary.earnings?.itemSales?.toLocaleString() ?? 0}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Expenditures</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-600">रु{dailySummary.expenditures?.total?.toLocaleString() ?? 0}</div>
                            <div className="text-sm text-gray-600">Count: {dailySummary.expenditures?.count ?? 0}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Net Profit</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className={`text-2xl font-bold ${dailySummary.financial?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              रु{dailySummary.financial?.netProfit?.toLocaleString() ?? 0}
                            </div>
                            <div className="text-sm text-gray-600">Margin: {isNaN(Number(dailySummary.financial?.profitMargin))
                              ? (dailySummary.financial?.profitMargin ?? '0%')
                              : (Number(dailySummary.financial?.profitMargin).toFixed(1) + '%')}
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Business Metrics</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-orange-600">{dailySummary.business?.occupiedRooms ?? 0}</div>
                            <div className="text-sm text-gray-600">Occupied Rooms</div>
                            <div className="text-2xl font-bold text-indigo-600 mt-2">{dailySummary.business?.totalGuests ?? 0}</div>
                            <div className="text-sm text-gray-600">Total Guests</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Hotel Balance</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-teal-600"> रु{((Number(financialOverview?.hotel?.initialAmount) || 0) + (Number(financialOverview?.summary?.totalGainedMoney) || 0) - (Number(financialOverview?.summary?.totalExpenditures) || 0)).toLocaleString()}</div>
                            <div className="text-sm text-gray-600">Initial Amount: रु{financialOverview?.hotel?.initialAmount?.toLocaleString() ?? 0}<br /></div>
                            <div className="text-sm text-gray-600">Last updated: {dailySummary.hotelBalance?.lastBalanceUpdate ? format(new Date(dailySummary.hotelBalance.lastBalanceUpdate), "MMM dd, yyyy") : 'N/A'}</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-sm">Expenditures (Approved)</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-600">रु{dailySummary.expenditures?.total?.toLocaleString() ?? 0}</div>
                            <div className="text-sm text-gray-600">Count: {dailySummary.expenditures?.count ?? 0}</div>
                          </CardContent>
                        </Card>
                      </div>
                    ) : (
                      <div className="text-gray-500 text-center py-8">No daily summary data available.</div>
                    )}
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
                  <label className="block text-sm font-medium mb-1">Amount (रु) *</label>
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
                    onChange={e => setExpenditureForm(prev => ({ ...prev, category: e.target.value}))}
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
                  <span className="font-medium">Amount:</span> रु{selectedExpenditure.amount.toLocaleString()}
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