"use client";

import React, { useEffect, useState, useCallback } from "react";
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
  getFinancialOverview,
  getSummaryStats,
  getItemSales,
  getRoomSales
} from "@/lib/expenditure";

// Date filter options
const DATE_FILTERS = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last 30 Days' },
  { value: 'quarter', label: 'Last 3 Months' },
  { value: 'halfYear', label: 'Last 6 Months' },
  { value: 'year', label: 'Last 12 Months' },
  { value: 'custom', label: 'Custom Range' }
];

// Add these helper functions at the top of your component, after your state declarations

// Convert local Nepal date to UTC for API queries
const convertLocalToUTCForNepal = (localDateStr) => {
  if (!localDateStr) return '';
  
  // Parse the local date (YYYY-MM-DD)
  const [year, month, day] = localDateStr.split('-').map(Number);
  
  // Nepal is UTC+5:45 (5 hours 45 minutes ahead)
  const nepalOffsetMinutes = 5 * 60 + 45; // 345 minutes
  
  // Create UTC date representing midnight in Nepal
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  utcDate.setMinutes(utcDate.getMinutes() - nepalOffsetMinutes);
  
  // Return as YYYY-MM-DD
  return utcDate.toISOString().split('T')[0];
};

// Convert UTC date from API back to local Nepal date for display
const convertUTCToLocalNepal = (utcDateStr) => {
  if (!utcDateStr) return '';
  
  const date = new Date(utcDateStr);
  
  // Add Nepal offset to get local time
  const nepalOffsetMinutes = 5 * 60 + 45;
  const localDate = new Date(date.getTime() + (nepalOffsetMinutes * 60 * 1000));
  
  // Format as YYYY-MM-DD
  return localDate.toISOString().split('T')[0];
};

// For date ranges, convert both start and end
const convertDateRangeForNepal = (startDate, endDate) => {
  return {
    startDate: convertLocalToUTCForNepal(startDate),
    endDate: convertLocalToUTCForNepal(endDate)
  };
};

export default function StatsPage() {
  // Load hotel from localStorage
  const [hotel, setHotel] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  
  // Listen for localStorage changes
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'hotel') {
        setHotel(event.newValue ? JSON.parse(event.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const EXPENDITURE_CATEGORIES = ["supplies", "maintenance", "utilities", "salary", "marketing", "other"];
  const ROOM_TYPES = ["deluxe", "suite", "standard", "family", "single", "double"];

  function getToken() {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token") || sessionStorage.getItem("token");
  }
  
  const [user, setUser] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  
  const { logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  // Add this state with your other states
const [currentDateParams, setCurrentDateParams] = useState({ filter: 'month' });
  
  // Date Filter States
  const [dateFilter, setDateFilter] = useState('month');
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  
  // Tab-specific loading states
  const [loadingStates, setLoadingStates] = useState({
    summary: false,
    item: false,
    room: false,
    expenditure: false,
    financial: false,
    daily: false
  });

  // Tab-specific error states
  const [errorStates, setErrorStates] = useState({
    summary: "",
    item: "",
    room: "",
    expenditure: "",
    financial: "",
    daily: ""
  });
  
  // Item Sales Filters
  const [selectedCategory, setSelectedCategory] = useState("");
  
  // Room Sales Filters
  const [roomType, setRoomType] = useState("");
  
  // Expenditure Filters
  const [expenditureStatus, setExpenditureStatus] = useState("");
  const [expenditureCategory, setExpenditureCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data states for each tab
  const [itemSalesData, setItemSalesData] = useState({ items: [], summary: { totalQuantity: 0, totalRevenue: 0, uniqueItems: 0 } });
  const [roomSalesData, setRoomSalesData] = useState({ roomSales: [], totals: { totalRoomCharge: 0, totalCheckouts: 0, totalNights: 0 } });
  const [expenditures, setExpenditures] = useState([]);
  const [expenditureStats, setExpenditureStats] = useState(null);
  const [financialOverview, setFinancialOverview] = useState(null);
  const [summaryStats, setSummaryStats] = useState(null);
  const [dailySummary, setDailySummary] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // UI states
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

  // Helper to build query string
  const buildQueryString = (params) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value);
      }
    });
    
    return queryParams.toString();
  };

  

  // Fetch categories
  const fetchCategories = async () => {
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
        setCategories(data.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    }
  };

  // Hide notification after 3s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

// Get base date parameters
const getBaseParams = useCallback(() => {
  if (dateFilter === 'custom' && customStartDate && customEndDate) {
    // Convert dates to UTC for Nepal
    const { startDate: utcStart, endDate: utcEnd } = convertDateRangeForNepal(
      customStartDate, 
      customEndDate
    );
    return {
      filter: 'custom',
      startDate: utcStart,
      endDate: utcEnd
    };
  }
  
  return { filter: dateFilter };
}, [dateFilter, customStartDate, customEndDate]);

  // Fetch Summary Tab Data
  const fetchSummaryData = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, summary: true }));
    setErrorStates(prev => ({ ...prev, summary: "" }));
    
    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token");

      const baseParams = getBaseParams();
      
      const [summaryRes, financialRes] = await Promise.all([
        getSummaryStats(baseParams),
        getFinancialOverview(baseParams)
      ]);

      setSummaryStats(summaryRes?.data || summaryRes);
      setFinancialOverview(financialRes?.data || financialRes);
      
    } catch (err) {
      setErrorStates(prev => ({ ...prev, summary: err.message || "Error fetching summary data" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, summary: false }));
    }
  }, [getBaseParams]);

  // Fetch Item Sales Tab Data
  const fetchItemSalesData = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, item: true }));
    setErrorStates(prev => ({ ...prev, item: "" }));
    
    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token");

      const baseParams = getBaseParams();
      const itemParams = {
        ...baseParams,
        ...(selectedCategory && { category: selectedCategory })
      };

      const itemSalesRes = await getItemSales(itemParams);
      
      if (itemSalesRes?.data) {
        setItemSalesData(itemSalesRes.data);
      }
      
    } catch (err) {
      setErrorStates(prev => ({ ...prev, item: err.message || "Error fetching item sales" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, item: false }));
    }
  }, [getBaseParams, selectedCategory]);


  // Add this helper function to convert local Nepal date to UTC
const convertToUTCForNepal = (localDateStr) => {
  // Parse the local date (YYYY-MM-DD)
  const [year, month, day] = localDateStr.split('-').map(Number);
  
  // Create a date object representing midnight in Nepal time (UTC+5:45)
  // Nepal is 5 hours 45 minutes ahead of UTC
  const nepalOffset = 5 * 60 + 45; // 345 minutes
  
  // Create date in UTC that corresponds to Nepal midnight
  // We subtract the offset to get the UTC time that represents Nepal midnight
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  utcDate.setMinutes(utcDate.getMinutes() - nepalOffset);
  
  // Return as ISO string (YYYY-MM-DD)
  return utcDate.toISOString().split('T')[0];
};

// For date ranges, convert both start and end
const convertDateRangeForNepal = (startDate, endDate) => {
  return {
    startDate: convertToUTCForNepal(startDate),
    endDate: convertToUTCForNepal(endDate)
  };
};
  // Fetch Room Sales Tab Data
  const fetchRoomSalesData = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, room: true }));
    setErrorStates(prev => ({ ...prev, room: "" }));
    
    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token");

      const baseParams = getBaseParams();
      const roomParams = {
        ...baseParams,
        ...(roomType && { type: roomType })
      };

      const roomSalesRes = await getRoomSales(roomParams);
      
      if (roomSalesRes?.data) {
        setRoomSalesData(roomSalesRes.data);
      }
      
    } catch (err) {
      setErrorStates(prev => ({ ...prev, room: err.message || "Error fetching room sales" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, room: false }));
    }
  }, [getBaseParams, roomType]);

  // Fetch Expenditure Tab Data
  const fetchExpenditureData = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, expenditure: true }));
    setErrorStates(prev => ({ ...prev, expenditure: "" }));
    
    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token");

      const baseParams = getBaseParams();
      const expenditureParams = {
        ...baseParams,
        ...(expenditureStatus && { status: expenditureStatus }),
        ...(expenditureCategory && { category: expenditureCategory }),
        ...(searchQuery && { search: searchQuery }),
        page: 1,
        limit: 50,
        sortBy: 'date',
        sortOrder: 'desc'
      };

      console.log('Fetching expenditures with params:', expenditureParams);
      
      const expendituresRes = await getExpenditures(expenditureParams);
      
      setExpenditures(expendituresRes?.data || []);
      setExpenditureStats(expendituresRes?.summary || null);
      
    } catch (err) {
      setErrorStates(prev => ({ ...prev, expenditure: err.message || "Error fetching expenditures" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, expenditure: false }));
    }
  }, [getBaseParams, expenditureStatus, expenditureCategory, searchQuery]);

  // Fetch Financial Tab Data
  const fetchFinancialData = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, financial: true }));
    setErrorStates(prev => ({ ...prev, financial: "" }));
    
    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token");

      const baseParams = getBaseParams();
      const financialRes = await getFinancialOverview(baseParams);
      
      setFinancialOverview(financialRes?.data || financialRes);
      
    } catch (err) {
      setErrorStates(prev => ({ ...prev, financial: err.message || "Error fetching financial data" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, financial: false }));
    }
  }, [getBaseParams]);

  // Fetch Daily Summary Tab Data
  const fetchDailyData = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, daily: true }));
    setErrorStates(prev => ({ ...prev, daily: "" }));
    
    try {
      const token = getToken();
      if (!token) throw new Error("No authentication token");

      const baseParams = getBaseParams();
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stats/summary?${buildQueryString(baseParams)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const dailyData = await response.json();
        setDailySummary(dailyData?.data || dailyData);
      }
      
    } catch (err) {
      setErrorStates(prev => ({ ...prev, daily: err.message || "Error fetching daily data" }));
    } finally {
      setLoadingStates(prev => ({ ...prev, daily: false }));
    }
  }, [getBaseParams]);

  // Debounced search effect for expenditure tab
  useEffect(() => {
    if (activeTab === 'expenditure') {
      const timer = setTimeout(() => {
        if (searchQuery !== undefined) {
          fetchExpenditureData();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [searchQuery, activeTab, fetchExpenditureData]);

  // Fetch data when tab changes or when tab-specific filters change
  useEffect(() => {
    switch(activeTab) {
      case 'summary':
        fetchSummaryData();
        break;
      case 'item':
        fetchItemSalesData();
        break;
      case 'room':
        fetchRoomSalesData();
        break;
      case 'expenditure':
        fetchExpenditureData();
        break;
      case 'financial':
        fetchFinancialData();
        break;
      case 'daily':
        fetchDailyData();
        break;
    }
  }, [activeTab, fetchSummaryData, fetchItemSalesData, fetchRoomSalesData, fetchExpenditureData, fetchFinancialData, fetchDailyData]);

// Handle global date filter apply
const handleApplyDateFilter = () => {
  let params = {};
  
  if (dateFilter === 'custom') {
    // Convert both dates to UTC for Nepal
    const { startDate: utcStart, endDate: utcEnd } = convertDateRangeForNepal(
      customStartDate, 
      customEndDate
    );
    params = {
      filter: 'custom',
      startDate: utcStart,
      endDate: utcEnd
    };
  } else {
    params = { filter: dateFilter };
    
    // For preset filters (today, yesterday, etc.), we don't need to convert
    // because the backend will use current server time
    // But we can still handle if needed
  }
  
  // Store these params to use in all fetch functions
  setCurrentDateParams(params);
  
  // Refresh current tab with new date filter
  switch(activeTab) {
    case 'summary':
      fetchSummaryData();
      break;
    case 'item':
      fetchItemSalesData();
      break;
    case 'room':
      fetchRoomSalesData();
      break;
    case 'expenditure':
      fetchExpenditureData();
      break;
    case 'financial':
      fetchFinancialData();
      break;
    case 'daily':
      fetchDailyData();
      break;
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
      
      // Refresh expenditure tab data
      if (activeTab === 'expenditure') {
        fetchExpenditureData();
      }
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
      
      // Refresh expenditure tab data
      if (activeTab === 'expenditure') {
        fetchExpenditureData();
      }
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
      
      // Refresh expenditure tab data
      if (activeTab === 'expenditure') {
        fetchExpenditureData();
      }
    } catch (err) {
      setNotification({ type: 'error', message: err.message || 'Failed to reject expenditure' });
    }
  };

  // Clear all expenditure filters
  const clearExpenditureFilters = () => {
    setSearchQuery("");
    setExpenditureStatus("");
    setExpenditureCategory("");
  };

  // Apply item category filter
  const applyItemCategoryFilter = () => {
    fetchItemSalesData();
  };

  // Clear category filter
  const clearCategoryFilter = () => {
    setSelectedCategory("");
    // Will trigger useEffect for item tab
  };

  // Apply room type filter
  const applyRoomTypeFilter = () => {
    fetchRoomSalesData();
  };

  // Calculate totals from item sales data
  const totalItemSales = itemSalesData?.summary?.totalRevenue || 0;
  const totalItemQuantity = itemSalesData?.summary?.totalQuantity || 0;
  
  // Calculate totals from room sales data
  const totalRoomRevenue = roomSalesData?.totals?.totalRoomCharge || 0;
  const totalRoomCheckouts = roomSalesData?.totals?.totalCheckouts || 0;
  const totalNights = roomSalesData?.totals?.totalNights || 0;
  
  const totalCombined = totalItemSales + totalRoomRevenue;
  
  // Transform item stats array into breakdown format
  const itemBreakdown = itemSalesData?.items?.map((item) => ({
    itemId: item.itemId || item.item,
    name: item.name,
    category: item.category?.name || item.category || 'Uncategorized',
    quantity: item.quantity || 0,
    sales: item.totalSales || 0,
    averagePrice: item.averagePrice || 0,
    salesCount: item.salesCount || 0
  })) || [];
  
  // Transform room sales data
  const roomBreakdown = roomSalesData?.roomSales?.map((room) => ({
    roomId: room.roomId,
    roomNumber: room.roomNumber || 'Unknown',
    type: room.type || 'Standard',
    totalNights: room.totalNights || 0,
    checkoutCount: room.checkoutCount || 0,
    actualRoomRevenue: room.totalRoomCharge || 0,
    averageRoomCharge: room.averageRoomCharge || 0
  })) || [];

  const isManager = user?.role === 'manager' || user?.role === 'super_admin';

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
        
        {/* Date Filter Section - Global */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Date Range Filter</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-center gap-4">
              <select
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setShowCustomDatePicker(e.target.value === 'custom');
                }}
                className="border rounded px-3 py-2 min-w-[200px]"
              >
                {DATE_FILTERS.map(filter => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
              
              {showCustomDatePicker && (
                <>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="border rounded px-3 py-2"
                    placeholder="Start Date"
                  />
                  <span>to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="border rounded px-3 py-2"
                    placeholder="End Date"
                  />
                </>
              )}
              
              <Button onClick={handleApplyDateFilter} className="bg-blue-600 hover:bg-blue-700">
                Apply Date Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Global Error */}
        {error && <div className="text-red-600 text-center bg-red-50 p-4 rounded">{error}</div>}

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {notification.message}
          </div>
        )}

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
    {loadingStates.summary ? (
      <div className="text-center py-10">Loading summary data...</div>
    ) : errorStates.summary ? (
      <div className="text-red-600 text-center bg-red-50 p-4 rounded">{errorStates.summary}</div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Hotel Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Initial Amount:</span>
                <span className="font-semibold">रु{summaryStats?.hotelBalance?.initialAmount?.toLocaleString() ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Gained:</span>
                <span className="font-semibold text-green-600">रु{summaryStats?.hotelBalance?.currentBalance && summaryStats?.hotelBalance?.initialAmount 
                  ? (summaryStats.hotelBalance.currentBalance - summaryStats.hotelBalance.initialAmount).toLocaleString() 
                  : 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Expenditures:</span>
                <span className="font-semibold text-red-600">रु{summaryStats?.expenditures?.total?.toLocaleString() ?? 0}</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Current Balance:</span>
                <span className="font-semibold text-blue-600">
                  रु{summaryStats?.hotelBalance?.currentBalance?.toLocaleString() ?? 0}
                </span>
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
                <span className="font-semibold text-green-600">
                  रु{summaryStats?.earnings?.roomRevenue?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Item Sales:</span>
                <span className="font-semibold text-blue-600">
                  रु{summaryStats?.earnings?.itemSales?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span>Total Sales (without VAT):</span>
                <span className="font-semibold">
                  रु{summaryStats?.earnings?.total?.toLocaleString() ?? 0}
                </span>
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
                <span className={`font-semibold ${(summaryStats?.financial?.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  रु{summaryStats?.financial?.netProfit?.toLocaleString() ?? 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Profit Margin:</span>
                <span className="font-semibold">
                  {summaryStats?.financial?.profitMargin ?? '0'}%
                </span>
              </div>
              <div className="flex justify-between">
                <span>Checkouts:</span>
                <span className="font-semibold">{summaryStats?.earnings?.checkoutCount ?? 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )}
  </div>
)}

            {/* Item Sales Tab */}
            {activeTab === 'item' && (
              <div>
                {/* Category Filter Section */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-3">Filter by Category</h4>
                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="border rounded px-3 py-2 min-w-[200px]"
                    >
                      <option value="">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    
                    <Button 
                      onClick={applyItemCategoryFilter} 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Apply Filter
                    </Button>
                    
                    {selectedCategory && (
                      <Button 
                        onClick={clearCategoryFilter}
                        variant="outline"
                        className="border-gray-300"
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                  
                  {selectedCategory && (
                    <p className="text-sm text-gray-600 mt-2">
                      Showing items from category: {categories.find(c => c._id === selectedCategory)?.name}
                    </p>
                  )}
                </div>

                {loadingStates.item ? (
                  <div className="text-center py-10">Loading item sales data...</div>
                ) : errorStates.item ? (
                  <div className="text-red-600 text-center bg-red-50 p-4 rounded">{errorStates.item}</div>
                ) : itemBreakdown.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No item sales data for this filter.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 border text-left">Item Name</th>
                          <th className="px-3 py-2 border text-left">Category</th>
                          <th className="px-3 py-2 border text-center">Quantity Sold</th>
                          <th className="px-3 py-2 border text-right">Price</th>
                          <th className="px-3 py-2 border text-right">Total Sales</th>
                          <th className="px-3 py-2 border text-center">Transactions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {itemBreakdown.map((row) => (
                          <tr key={row.itemId} className="hover:bg-gray-50">
                            <td className="px-3 py-2 border">{row.name}</td>
                            <td className="px-3 py-2 border">{row.category}</td>
                            <td className="px-3 py-2 border text-center">{row.quantity}</td>
                            <td className="px-3 py-2 border text-right">रु{(row.averagePrice || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 border text-right font-medium text-blue-600">रु{row.sales?.toLocaleString()}</td>
                            <td className="px-3 py-2 border text-center">{row.salesCount || 0}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan={2} className="px-3 py-2 border text-right">Total Item Sales:</td>
                          <td className="px-3 py-2 border text-center">{totalItemQuantity}</td>
                          <td className="px-3 py-2 border text-right">-</td>
                          <td className="px-3 py-2 border text-right">रु{totalItemSales.toLocaleString()}</td>
                          <td className="px-3 py-2 border text-center">{itemBreakdown.length}</td>
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
                {/* Room Type Filter */}
                <div className="mb-4 flex items-center gap-4">
                  <select
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="border rounded px-3 py-2"
                  >
                    <option value="">All Room Types</option>
                    {ROOM_TYPES.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                  <Button onClick={applyRoomTypeFilter} size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Apply Room Filter
                  </Button>
                </div>

                {loadingStates.room ? (
                  <div className="text-center py-10">Loading room sales data...</div>
                ) : errorStates.room ? (
                  <div className="text-red-600 text-center bg-red-50 p-4 rounded">{errorStates.room}</div>
                ) : roomBreakdown.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No room sales data for this filter.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border text-sm">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-3 py-2 border text-left">Room Number</th>
                          <th className="px-3 py-2 border text-left">Type</th>
                          <th className="px-3 py-2 border text-center">Nights</th>
                          <th className="px-3 py-2 border text-center">Checkouts</th>
                          <th className="px-3 py-2 border text-right">Base Rate</th>
                          <th className="px-3 py-2 border text-right">Total Revenue</th>
                          <th className="px-3 py-2 border text-right">Avg. Per Night</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roomBreakdown.map((row, idx) => (
                          <tr key={row.roomId || idx} className="hover:bg-gray-50">
                            <td className="px-3 py-2 border">{row.roomNumber || '-'}</td>
                            <td className="px-3 py-2 border">{row.type || '-'}</td>
                            <td className="px-3 py-2 border text-center">{row.totalNights || '-'}</td>
                            <td className="px-3 py-2 border text-center">{row.checkoutCount || '-'}</td>
                            <td className="px-3 py-2 border text-right">रु{(row.baseRate || 0).toFixed(2)}</td>
                            <td className="px-3 py-2 border text-right font-medium text-green-600">रु{row.actualRoomRevenue?.toFixed(2) || 0}</td>
                            <td className="px-3 py-2 border text-right">रु{(row.averageDailyRate || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-bold">
                          <td colSpan={2} className="px-3 py-2 border text-right">Total:</td>
                          <td className="px-3 py-2 border text-center">{totalNights}</td>
                          <td className="px-3 py-2 border text-center">{totalRoomCheckouts}</td>
                          <td className="px-3 py-2 border text-right">-</td>
                          <td className="px-3 py-2 border text-right">रु{totalRoomRevenue.toFixed(2)}</td>
                          <td className="px-3 py-2 border text-right">रु{(totalRoomRevenue / (totalNights || 1)).toFixed(2)}</td>
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

                {/* Expenditure Summary Cards */}
                {expenditureStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Total Expenditures</div>
                        <div className="text-2xl font-bold text-red-600">रु{expenditureStats?.totals?.totalAmount?.toLocaleString() ?? 0}</div>
                        <div className="text-xs text-gray-500">Count: {expenditureStats?.totals?.totalCount ?? 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Average Amount</div>
                        <div className="text-2xl font-bold text-blue-600">रु{expenditureStats?.totals?.averageAmount?.toLocaleString() ?? 0}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <div className="text-sm text-gray-600">Filtered Total</div>
                        <div className="text-2xl font-bold text-purple-600">रु{expenditureStats?.filteredTotal?.toLocaleString() ?? 0}</div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Expenditure Filters with Search */}
                <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                  {/* Search Bar */}
                  <div className="flex-1 min-w-[250px]">
                    <input
                      type="text"
                      placeholder="Search by description..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                  
                  <select
                    value={expenditureStatus}
                    onChange={(e) => setExpenditureStatus(e.target.value)}
                    className="border rounded px-3 py-2 min-w-[150px]"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  
                  <select
                    value={expenditureCategory}
                    onChange={(e) => setExpenditureCategory(e.target.value)}
                    className="border rounded px-3 py-2 min-w-[150px]"
                  >
                    <option value="">All Categories</option>
                    {EXPENDITURE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                    ))}
                  </select>
                  
                  <Button 
                    onClick={clearExpenditureFilters}
                    variant="outline"
                    className="border-gray-300"
                  >
                    Clear Filters
                  </Button>
                  
                  <Button onClick={fetchExpenditureData} className="bg-blue-600 hover:bg-blue-700">
                    Apply Filters
                  </Button>
                </div>

                {/* Expenditures Table */}
                {loadingStates.expenditure ? (
                  <div className="text-center py-10">Loading expenditures...</div>
                ) : errorStates.expenditure ? (
                  <div className="text-red-600 text-center bg-red-50 p-4 rounded">{errorStates.expenditure}</div>
                ) : (
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
                    
                    {/* Pagination Info */}
                    {expenditureStats?.pagination && (
                      <div className="mt-4 text-sm text-gray-600">
                        Showing {expenditures.length} of {expenditureStats.pagination.total} entries
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Financial Overview Tab */}
            {activeTab === 'financial' && (
              <div className="space-y-6">
                {loadingStates.financial ? (
                  <div className="text-center py-10">Loading financial data...</div>
                ) : errorStates.financial ? (
                  <div className="text-red-600 text-center bg-red-50 p-4 rounded">{errorStates.financial}</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Hotel Balance Details</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-teal-50 rounded">
                            <span className="font-medium">Current Balance</span>
                            <span className="text-lg font-bold text-teal-600">
                              रु{financialOverview?.hotel?.currentBalance?.toLocaleString() ?? 0}
                            </span>
                          </div>
                        
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                            <span className="font-medium">Initial Amount</span>
                            <span className="font-bold">रु{financialOverview?.hotel?.initialAmount?.toLocaleString() ?? 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="font-medium">Total Sales without VAT</span>
                            <span className="font-bold text-green-600">रु{financialOverview?.summary?.totalEarningsWithoutVat?.toLocaleString() ?? 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="font-medium">Room Revenue</span>
                            <span className="font-bold text-green-600">रु{financialOverview?.summary?.totalRoomRevenue?.toLocaleString() ?? 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="font-medium">Item Sales</span>
                            <span className="font-bold text-green-600">रु{financialOverview?.summary?.totalItemSales?.toLocaleString() ?? 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="font-medium">Total VAT Amount</span>
                            <span className="font-bold text-green-600">रु{financialOverview?.summary?.totalVatAmount?.toLocaleString() ?? 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="font-medium">Total Advance Paid</span>
                            <span className="font-bold text-green-600">रु{financialOverview?.summary?.totalAdvancePaid?.toLocaleString() ?? 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="font-medium">Total Room Discounts</span>
                            <span className="font-bold text-green-600">रु{financialOverview?.summary?.totalRoomDiscount?.toLocaleString() ?? 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                            <span className="font-medium">Total Money Collected</span>
                            <span className="font-bold text-green-600">रु{financialOverview?.summary?.totalGainedMoney?.toLocaleString() ?? 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                            <span className="font-medium">Total Expenditures</span>
                            <span className="font-bold text-red-600">रु{financialOverview?.summary?.totalExpenditures?.toLocaleString() ?? 0}</span>
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
                          <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                            <span className="font-medium">Net Profit/Loss</span>
                            <span className={`text-lg font-bold ${financialOverview?.summary?.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              रु{financialOverview?.summary?.netProfit?.toLocaleString() ?? 0}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                            <span className="font-medium">Profit Margin</span>
                            <span className="text-lg font-bold text-purple-600">{financialOverview?.summary?.profitMargin ?? '0%'}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-indigo-50 rounded">
                            <span className="font-medium">Item Transactions</span>
                            <span className="font-bold text-indigo-600">{financialOverview?.summary?.totalItemTransactions ?? 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-indigo-50 rounded">
                            <span className="font-medium">Item Quantity Sold</span>
                            <span className="font-bold text-indigo-600">{financialOverview?.summary?.totalItemQuantity ?? 0}</span>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-indigo-50 rounded">
                            <span className="font-medium">Billed Amount with Advance</span>
                            <span className="font-bold text-indigo-600">रु{financialOverview?.summary?.totalBilledAmountWithAdvance?.toLocaleString() ?? 0}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* Daily Summary Tab */}
            {activeTab === 'daily' && (
              <div className="space-y-6">
                {loadingStates.daily ? (
                  <div className="text-center py-10">Loading daily summary...</div>
                ) : errorStates.daily ? (
                  <div className="text-red-600 text-center bg-red-50 p-4 rounded">{errorStates.daily}</div>
                ) : dailySummary ? (
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
                        <div className="text-sm text-gray-600">Margin: {dailySummary.financial?.profitMargin ?? '0%'}</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Occupancy</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{dailySummary.rooms?.occupied || 0} / {dailySummary.rooms?.total || 0}</div>
                        <div className="text-sm text-gray-600">Occupancy Rate: {dailySummary.rooms?.occupancyRate || 0}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Guests</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-indigo-600">{dailySummary.guests?.checkedIn || 0}</div>
                        <div className="text-sm text-gray-600">Checked In / {dailySummary.guests?.total || 0} Total</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Hotel Balance</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-teal-600">रु{dailySummary.hotelBalance?.currentBalance?.toLocaleString() ?? 0}</div>
                        <div className="text-sm text-gray-600">Initial: रु{dailySummary.hotelBalance?.initialAmount?.toLocaleString() ?? 0}</div>
                        <div className="text-sm text-gray-600">Last updated: {dailySummary.hotelBalance?.lastBalanceUpdate ? format(new Date(dailySummary.hotelBalance.lastBalanceUpdate), "MMM dd, yyyy") : 'N/A'}</div>
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
                    onChange={e => setExpenditureForm({ ...expenditureForm, amount: e.target.value })}
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
                    onChange={e => setExpenditureForm({ ...expenditureForm, description: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Enter description"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category *</label>
                  <select
                    required
                    value={expenditureForm.category}
                    onChange={e => setExpenditureForm({ ...expenditureForm, category: e.target.value })}
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
                    onChange={e => setExpenditureForm({ ...expenditureForm, date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={expenditureForm.notes}
                    onChange={e => setExpenditureForm({ ...expenditureForm, notes: e.target.value })}
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
                {selectedExpenditure.approvedBy && (
                  <div>
                    <span className="font-medium">Approved By:</span> {selectedExpenditure.approvedBy?.firstName} {selectedExpenditure.approvedBy?.lastName}
                  </div>
                )}
                {selectedExpenditure.approvedAt && (
                  <div>
                    <span className="font-medium">Approved At:</span> {format(new Date(selectedExpenditure.approvedAt), "MMM dd, yyyy HH:mm")}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {selectedExpenditure.status === 'pending' && (
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
                )}

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
                  {selectedExpenditure.status === 'pending' && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}