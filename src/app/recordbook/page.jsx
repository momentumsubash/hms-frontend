"use client";

import React, { useState, useEffect } from 'react';
import { DashboardLayout } from "@/components/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  ChevronDown,
  CalendarRange,
  Printer,
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Search,
  X,
  Eye,
  Edit
} from "lucide-react";

const convertToUTCForNepal = (localDateStr) => {
  if (!localDateStr) return '';
  const [year, month, day] = localDateStr.split('-').map(Number);
  const nepalOffsetMinutes = 5 * 60 + 45;
  const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  utcDate.setMinutes(utcDate.getMinutes() - nepalOffsetMinutes);
  return utcDate.toISOString().split('T')[0];
};

const convertUTCToLocalNepal = (utcDateStr) => {
  if (!utcDateStr) return '';
  const date = new Date(utcDateStr);
  const nepalOffsetMinutes = 5 * 60 + 45;
  const localDate = new Date(date.getTime() + (nepalOffsetMinutes * 60 * 1000));
  return localDate.toISOString().split('T')[0];
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

const AccordionSection = ({ title, count, defaultExpanded = true, children, ...props }) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden" {...props}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition-colors"
      >
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
};

const RecordBook = () => {
  const [checkoutPage, setCheckoutPage] = useState(0);
  const [checkoutRowsPerPage, setCheckoutRowsPerPage] = useState(5);
  const [itemPage, setItemPage] = useState(0);
  const [itemRowsPerPage, setItemRowsPerPage] = useState(10);
  const [roomPage, setRoomPage] = useState(0);
  const [roomRowsPerPage, setRoomRowsPerPage] = useState(10);

  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const fetchDailyDetails = async (date) => {
    setLoading(true);
    setError('');
    
    try {
      const token = getToken();
      if (!token) {
        setError('No authentication token');
        setLoading(false);
        return;
      }
      
      const utcDate = convertToUTCForNepal(date);
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/stats/daily-details?date=${utcDate}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.ok) {
        const result = await response.json();
        setData(result.data || result);
      } else {
        const errorText = await response.text();
        setError(`Failed to fetch data: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('Error fetching daily details:', error);
      setError(error.message || 'Error fetching daily details');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchDailyDetails(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
  };

  const handleRefresh = () => {
    fetchDailyDetails(selectedDate);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (!data) return;
    
    let csvContent = 'Record Book - ' + (data.date || data.hotel?.name || 'Daily Report') + '\n\n';
    
    csvContent += 'SUMMARY\n';
    csvContent += 'Total Revenue,' + (data.totals?.totalNetRevenue || 0) + '\n';
    csvContent += 'Total Expenditures,' + (data.totals?.totalExpenditures || 0) + '\n';
    csvContent += 'Net Profit,' + (data.totals?.netProfit || 0) + '\n';
    csvContent += 'Total Orders,' + (data.summary?.totalOrders || 0) + '\n';
    csvContent += 'Total Checkouts,' + (data.summary?.totalCheckouts || 0) + '\n';
    csvContent += 'Total Rooms Allocated,' + (data.summary?.totalRoomsAllocated || 0) + '\n\n';
    
    csvContent += 'ITEMS SOLD\n';
    csvContent += 'Name,Category,Price,Quantity,Sales\n';
    if (data.itemSalesBreakdown && Array.isArray(data.itemSalesBreakdown)) {
      data.itemSalesBreakdown.forEach(item => {
        csvContent += `"${item.name || 'Unknown'}",${item.category || 'Unknown'},${item.price || 0},${item.quantity || 0},${item.totalRevenue || 0}\n`;
      });
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `record-book-${selectedDate}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto py-4 px-4 md:px-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {data ? `${data.hotel?.name || 'Hotel'} - ${format(new Date(selectedDate), 'MMMM dd, yyyy')}` : 'Daily Operations Report'}
          </p>
          
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              data-cy="recordbook-date"
              value={selectedDate}
              onChange={handleDateChange}
              className="h-9 px-3 bg-background border border-input rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button
              variant="outline"
              data-cy="recordbook-refresh"
              onClick={handleRefresh}
              disabled={loading}
              size="sm"
            >
              <RotateCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              data-cy="recordbook-print"
              onClick={handlePrint}
              disabled={!data}
              size="sm"
            >
              <Printer className="w-4 h-4 mr-1" />
            </Button>
            <Button
              variant="outline"
              data-cy="recordbook-csv"
              onClick={handleExport}
              disabled={!data}
              size="sm"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-5 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:bg-destructive/10 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        {!data && !loading && (
          <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center">
            <CalendarRange className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-1">No Data Available</h3>
            <p className="text-muted-foreground text-sm">
              Select a date to view the record book or check if there&apos;s data for the selected date.
            </p>
          </div>
        )}

        {data && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card data-cy="recordbook-total-revenue">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-primary">Rs. {(data.totals?.totalNetRevenue || 0).toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card data-cy="recordbook-net-profit">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Net Profit</p>
                  <p className={`text-2xl font-bold ${data.totals?.netProfit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive'}`}>
                    Rs. {(data.totals?.netProfit || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card data-cy="recordbook-total-orders">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Orders</p>
                  <p className="text-2xl font-bold text-foreground">{data.summary?.totalOrders || 0}</p>
                </CardContent>
              </Card>
              <Card data-cy="recordbook-total-checkouts">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Checkouts</p>
                  <p className="text-2xl font-bold text-foreground">{data.summary?.totalCheckouts || 0}</p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Allocated Rooms */}
              <AccordionSection title="Allocated Rooms" data-cy="recordbook-allocated-rooms-section" count={data.roomAllocations?.length || 0}>
                {!data.roomAllocations || data.roomAllocations.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No rooms allocated on this date</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" data-cy="recordbook-allocated-rooms-table">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Room Number</th>
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Type</th>
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Rate</th>
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.roomAllocations
                            .slice(roomPage * roomRowsPerPage, roomPage * roomRowsPerPage + roomRowsPerPage)
                            .map((room, index) => (
                            <tr key={room.roomNumber || index} className="border-b border-border hover:bg-muted/30">
                              <td className="py-2 px-2 font-medium text-foreground">{room.roomNumber}</td>
                              <td className="py-2 px-2">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{room.type}</Badge>
                              </td>
                              <td className="py-2 px-2 text-foreground">Rs. {(room.rate || 0).toLocaleString()}</td>
                              <td className="py-2 px-2">
                                <Badge className={room.isCurrentlyOccupied ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}>
                                  {room.isCurrentlyOccupied ? 'Occupied' : 'Vacant'}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {data.roomAllocations.length > roomRowsPerPage && (
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm text-muted-foreground">
                          Page <span className="font-medium text-foreground">{roomPage + 1}</span> of <span className="font-medium text-foreground">{Math.ceil(data.roomAllocations.length / roomRowsPerPage)}</span>
                        </p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setRoomPage(0)} disabled={roomPage === 0} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <span className="text-xs font-medium">«</span>
                          </button>
                          <button onClick={() => setRoomPage(roomPage - 1)} disabled={roomPage === 0} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          {(() => {
                            const total = Math.ceil(data.roomAllocations.length / roomRowsPerPage);
                            const current = roomPage;
                            let start = Math.max(0, current - 2);
                            let end = Math.min(total - 1, start + 4);
                            if (end - start + 1 < 5) start = Math.max(0, end - 4);
                            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                          })().map(n => (
                            <button key={n} onClick={() => setRoomPage(n)}
                              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-all ${n === roomPage ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{n + 1}</button>
                          ))}
                          <button onClick={() => setRoomPage(roomPage + 1)} disabled={(roomPage + 1) * roomRowsPerPage >= data.roomAllocations.length} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button onClick={() => setRoomPage(Math.ceil(data.roomAllocations.length / roomRowsPerPage) - 1)} disabled={(roomPage + 1) * roomRowsPerPage >= data.roomAllocations.length} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <span className="text-xs font-medium">»</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </AccordionSection>

              {/* Items Sold */}
              <AccordionSection title="Items Sold" data-cy="recordbook-items-sold-section" count={data.itemSalesBreakdown?.length || 0}>
                {(!data.itemSalesBreakdown || data.itemSalesBreakdown.length === 0) ? (
                  <p className="text-muted-foreground text-center py-4">No items sold on this date</p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm" data-cy="recordbook-items-sold-table">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Name</th>
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Category</th>
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Price</th>
                            <th className="text-left py-2 px-2 font-medium text-muted-foreground">Quantity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.itemSalesBreakdown
                            .slice(itemPage * itemRowsPerPage, itemPage * itemRowsPerPage + itemRowsPerPage)
                            .map((item, idx) => (
                              <tr key={item.itemId || idx} className="border-b border-border hover:bg-muted/30">
                                <td className="py-2 px-2 text-foreground">{item.name}</td>
                                <td className="py-2 px-2">
                                  <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">{item.category}</Badge>
                                </td>
                                <td className="py-2 px-2 text-foreground">Rs. {(item.price || 0).toLocaleString()}</td>
                                <td className="py-2 px-2 text-foreground">{item.quantity}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    {data.itemSalesBreakdown.length > itemRowsPerPage && (
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-sm text-muted-foreground">
                          Page <span className="font-medium text-foreground">{itemPage + 1}</span> of <span className="font-medium text-foreground">{Math.ceil(data.itemSalesBreakdown.length / itemRowsPerPage)}</span>
                        </p>
                        <div className="flex items-center gap-1">
                          <button onClick={() => setItemPage(0)} disabled={itemPage === 0} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <span className="text-xs font-medium">«</span>
                          </button>
                          <button onClick={() => setItemPage(itemPage - 1)} disabled={itemPage === 0} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          {(() => {
                            const total = Math.ceil(data.itemSalesBreakdown.length / itemRowsPerPage);
                            const current = itemPage;
                            let start = Math.max(0, current - 2);
                            let end = Math.min(total - 1, start + 4);
                            if (end - start + 1 < 5) start = Math.max(0, end - 4);
                            return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                          })().map(n => (
                            <button key={n} onClick={() => setItemPage(n)}
                              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-all ${n === itemPage ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{n + 1}</button>
                          ))}
                          <button onClick={() => setItemPage(itemPage + 1)} disabled={(itemPage + 1) * itemRowsPerPage >= data.itemSalesBreakdown.length} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                          <button onClick={() => setItemPage(Math.ceil(data.itemSalesBreakdown.length / itemRowsPerPage) - 1)} disabled={(itemPage + 1) * itemRowsPerPage >= data.itemSalesBreakdown.length} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                            <span className="text-xs font-medium">»</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </AccordionSection>
            </div>

            {/* Daily Checkouts */}
            <AccordionSection title="Daily Checkouts" data-cy="recordbook-daily-checkouts-section" count={data.dailyCheckouts?.length || 0}>
              {!data.dailyCheckouts || data.dailyCheckouts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No checkouts on this date</p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm" data-cy="recordbook-daily-checkouts-table">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Checkout ID</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Guest</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Rooms</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Total Bill</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Room Charges</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Order Charges</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Payment</th>
                          <th className="text-left py-2 px-2 font-medium text-muted-foreground">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.dailyCheckouts
                          .slice(checkoutPage * checkoutRowsPerPage, checkoutPage * checkoutRowsPerPage + checkoutRowsPerPage)
                          .map((checkout) => (
                            <tr key={checkout.checkoutId} className="border-b border-border hover:bg-muted/30">
                              <td className="py-2 px-2 font-mono text-xs text-foreground">{checkout.checkoutId?.slice(-6).toUpperCase()}</td>
                              <td className="py-2 px-2 text-foreground">{checkout.guest?.name || 'Walk-in'}</td>
                              <td className="py-2 px-2">
                                <div className="flex flex-wrap gap-1">
                                  {checkout.rooms?.map((room, idx) => (
                                    <Badge key={idx} variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">{room.roomNumber}</Badge>
                                  ))}
                                </div>
                              </td>
                              <td className="py-2 px-2 text-foreground">Rs. {(checkout.financials?.totalBill || 0).toLocaleString()}</td>
                              <td className="py-2 px-2 text-foreground">Rs. {(checkout.financials?.roomCharges || 0).toLocaleString()}</td>
                              <td className="py-2 px-2 text-foreground">Rs. {(checkout.financials?.orderCharges || 0).toLocaleString()}</td>
                              <td className="py-2 px-2">
                                <Badge className={checkout.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'}>
                                  {checkout.paymentMethod}
                                </Badge>
                              </td>
                              <td className="py-2 px-2 text-muted-foreground">{format(new Date(checkout.checkOutDate), 'MMM dd, yyyy')}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  {data.dailyCheckouts.length > checkoutRowsPerPage && (
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-sm text-muted-foreground">
                        Page <span className="font-medium text-foreground">{checkoutPage + 1}</span> of <span className="font-medium text-foreground">{Math.ceil(data.dailyCheckouts.length / checkoutRowsPerPage)}</span>
                      </p>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setCheckoutPage(0)} disabled={checkoutPage === 0} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <span className="text-xs font-medium">«</span>
                        </button>
                        <button onClick={() => setCheckoutPage(checkoutPage - 1)} disabled={checkoutPage === 0} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        {(() => {
                          const total = Math.ceil(data.dailyCheckouts.length / checkoutRowsPerPage);
                          const current = checkoutPage;
                          let start = Math.max(0, current - 2);
                          let end = Math.min(total - 1, start + 4);
                          if (end - start + 1 < 5) start = Math.max(0, end - 4);
                          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                        })().map(n => (
                          <button key={n} onClick={() => setCheckoutPage(n)}
                            className={`w-8 h-8 flex items-center justify-center rounded-md text-sm font-medium transition-all ${n === checkoutPage ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>{n + 1}</button>
                        ))}
                        <button onClick={() => setCheckoutPage(checkoutPage + 1)} disabled={(checkoutPage + 1) * checkoutRowsPerPage >= data.dailyCheckouts.length} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <button onClick={() => setCheckoutPage(Math.ceil(data.dailyCheckouts.length / checkoutRowsPerPage) - 1)} disabled={(checkoutPage + 1) * checkoutRowsPerPage >= data.dailyCheckouts.length} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                          <span className="text-xs font-medium">»</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </AccordionSection>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default RecordBook;
