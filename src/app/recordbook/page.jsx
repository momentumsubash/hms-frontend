"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  DateRange as DateRangeIcon,
  Print as PrintIcon,
  Download as DownloadIcon
} from '@mui/icons-material';

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

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

const RecordBook = () => {
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchDailyDetails = async (date) => {
    try {
      setLoading(true);
      setError('');
      const token = getToken();
      
      if (!token) {
        setError("No authentication token");
        return;
      }
      
      // Fetch user info first
      const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
      });
      
      if (!meRes.ok) throw new Error("Not authenticated");
      const meData = await meRes.json();
      localStorage.setItem("user", JSON.stringify(meData.data || null));
      
      // Fetch daily details
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/stats/daily-details?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.message || 'Failed to fetch data');
      }
    } catch (err) {
      setError('Error fetching daily details. Please try again.');
      console.error('Error:', err);
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
    
    // Simple CSV export functionality
    let csvContent = 'Record Book - ' + data.date + '\n\n';
    
    // Summary
    csvContent += 'SUMMARY\n';
    csvContent += 'Total Revenue,' + data.summary.totalRevenue + '\n';
    csvContent += 'Total Expenditures,' + data.summary.totalExpenditures + '\n';
    csvContent += 'Net Profit,' + data.summary.netProfit + '\n';
    csvContent += 'Total Orders,' + data.summary.totalOrders + '\n';
    csvContent += 'Total Checkouts,' + data.summary.totalCheckouts + '\n';
    csvContent += 'Total Rooms Allocated,' + data.summary.totalRoomsAllocated + '\n\n';
    
    // Items Sold
    csvContent += 'ITEMS SOLD\n';
    csvContent += 'Name,Category,Price,Quantity,Sales\n';
    data.itemsSold.forEach(item => {
      csvContent += `"${item.name}",${item.category},${item.price},${item.quantity},${item.sales}\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `record-book-${selectedDate}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div>
        <NavBar
          user={user}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          logout={logout}
          navLinks={navLinks}
        />
        <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <Box textAlign="center">
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6">Loading Record Book...</Typography>
          </Box>
        </Container>
      </div>
    );
  }

  return (
    <div>
      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        navLinks={navLinks}
      />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom color="primary">
              📊 Record Book
            </Typography>
            <Typography variant="h6" color="textSecondary">
              {data ? `${data.hotel.name} - ${format(new Date(data.date), 'MMMM dd, yyyy')}` : 'Daily Operations Report'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ minWidth: 150 }}
            />
            <Button
              variant="outlined"
              onClick={handleRefresh}
              disabled={loading}
            >
              Refresh
            </Button>
            <IconButton onClick={handlePrint} title="Print" disabled={!data}>
              <PrintIcon />
            </IconButton>
            <IconButton onClick={handleExport} title="Export CSV" disabled={!data}>
              <DownloadIcon />
            </IconButton>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {!data && !loading && (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <DateRangeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No Data Available
            </Typography>
            <Typography color="textSecondary">
              Select a date to view the record book or check if there's data for the selected date.
            </Typography>
          </Paper>
        )}

        {data && (
          <>
            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Revenue
                    </Typography>
                    <Typography variant="h5" component="div" color="primary.main">
                      Rs. {data.summary.totalRevenue.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Net Profit
                    </Typography>
                    <Typography 
                      variant="h5" 
                      component="div"
                      color={data.summary.netProfit >= 0 ? 'success.main' : 'error.main'}
                    >
                      Rs. {data.summary.netProfit.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Orders
                    </Typography>
                    <Typography variant="h5" component="div">
                      {data.summary.totalOrders}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <Card elevation={3}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Checkouts
                    </Typography>
                    <Typography variant="h5" component="div">
                      {data.summary.totalCheckouts}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Detailed Sections */}
            <Grid container spacing={4}>
              {/* Allocated Rooms */}
              <Grid item xs={12} md={6}>
                <Accordion defaultExpanded elevation={2}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">🏨 Allocated Rooms ({data.allocatedRooms.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {data.allocatedRooms.length === 0 ? (
                      <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                        No rooms allocated on this date
                      </Typography>
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Room Number</TableCell>
                              <TableCell>Type</TableCell>
                              <TableCell>Rate</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.allocatedRooms.map((room) => (
                              <TableRow key={room.roomNumber} hover>
                                <TableCell>
                                  <Typography variant="body1" fontWeight="medium">
                                    {room.roomNumber}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip 
                                    label={room.type} 
                                    size="small" 
                                    color="primary" 
                                    variant="outlined" 
                                  />
                                </TableCell>
                                <TableCell>Rs. {room.rate?.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Chip 
                                    label={room.isOccupied ? 'Occupied' : 'Vacant'} 
                                    size="small" 
                                    color={room.isOccupied ? 'success' : 'default'} 
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Items Sold */}
              <Grid item xs={12} md={6}>
                <Accordion defaultExpanded elevation={2}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">🍽️ Items Sold ({data.itemsSold.length} items)</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {data.itemsSold.length === 0 ? (
                      <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                        No items sold on this date
                      </Typography>
                    ) : (
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Item Name</TableCell>
                              <TableCell>Price</TableCell>
                              <TableCell>Quantity</TableCell>
                              <TableCell>Total Sales</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {data.itemsSold.map((item) => (
                              <TableRow key={item.name} hover>
                                <TableCell>
                                  <Box>
                                    <Typography variant="body2" fontWeight="medium">
                                      {item.name}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      {item.category}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>Rs. {item.price?.toLocaleString()}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell>
                                  <Typography fontWeight="medium">
                                    Rs. {item.sales?.toLocaleString()}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Daily Orders */}
              <Grid item xs={12}>
                <Accordion defaultExpanded elevation={2}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">📋 Daily Orders ({data.dailyOrders.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {data.dailyOrders.length === 0 ? (
                      <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                        No orders placed on this date
                      </Typography>
                    ) : (
                      data.dailyOrders.map((order) => (
                        <Paper key={order.orderId} sx={{ p: 3, mb: 3, border: 1, borderColor: 'grey.200' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                              <Typography variant="h6" color="primary">
                                Order #{order.orderId?.slice(-6).toUpperCase()}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {order.guest?.name || 'No guest'} • {format(new Date(order.createdAt), 'hh:mm a')}
                              </Typography>
                            </Box>
                            <Chip 
                              label={order.status} 
                              color={order.status === 'completed' ? 'success' : 'default'} 
                              size="medium"
                            />
                          </Box>
                          
                          <TableContainer sx={{ mb: 2 }}>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Item Name</TableCell>
                                  <TableCell>Price</TableCell>
                                  <TableCell>Quantity</TableCell>
                                  <TableCell>Total</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {order.items.map((item, index) => (
                                  <TableRow key={index} hover>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>Rs. {item.price}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell>Rs. {item.total}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                          
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            <Typography variant="caption" color="textSecondary">
                              Created by: {order.createdBy || 'System'}
                            </Typography>
                            <Typography variant="h6" color="primary">
                              Total: Rs. {order.totalAmount?.toLocaleString()}
                            </Typography>
                          </Box>
                        </Paper>
                      ))
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Daily Checkouts */}
              <Grid item xs={12}>
                <Accordion defaultExpanded elevation={2}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">🚪 Daily Checkouts ({data.dailyCheckouts.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {data.dailyCheckouts.length === 0 ? (
                      <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                        No checkouts processed on this date
                      </Typography>
                    ) : (
                      data.dailyCheckouts.map((checkout) => (
                        <Paper key={checkout.checkoutId} sx={{ p: 3, mb: 3, border: 1, borderColor: 'grey.200' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                              <Typography variant="h5" color="primary">
                                {checkout.guest?.name || 'Unknown Guest'}
                              </Typography>
                              <Typography variant="body2" color="textSecondary">
                                {checkout.guest?.phone} • {checkout.guest?.email}
                              </Typography>
                            </Box>
                            <Box textAlign="right">
                              <Typography variant="body2">
                                Checkout: {format(new Date(checkout.checkOutDate), 'MMM dd, yyyy')}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Processed by: {checkout.processedBy}
                              </Typography>
                            </Box>
                          </Box>

                          <Grid container spacing={3}>
                            {/* Rooms */}
                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" gutterBottom>
                                Rooms Occupied:
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {checkout.rooms.map((room) => (
                                  <Chip
                                    key={room.roomNumber}
                                    label={`${room.roomNumber} (${room.type} - Rs. ${room.rate})`}
                                    variant="outlined"
                                    color="primary"
                                  />
                                ))}
                              </Box>
                            </Grid>

                            {/* Financial Summary */}
                            <Grid item xs={12} md={6}>
                              <Typography variant="h6" gutterBottom>
                                Financial Summary:
                              </Typography>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                {[
                                  { label: 'Room Charges', value: checkout.financials.roomCharges },
                                  { label: 'Discount', value: -checkout.financials.roomDiscount, isDiscount: true },
                                  { label: 'Order Charges', value: checkout.financials.orderCharges },
                                  { label: 'Extra Charges', value: checkout.financials.extraCharges },
                                  { label: 'VAT Amount', value: checkout.financials.vatAmount },
                                ].map((item, index) => (
                                  <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body2">{item.label}:</Typography>
                                    <Typography 
                                      variant="body2" 
                                      color={item.isDiscount ? 'error' : 'textPrimary'}
                                      fontWeight={item.isDiscount ? 'normal' : 'medium'}
                                    >
                                      {item.value !== 0 && (item.isDiscount ? '- ' : '')}Rs. {Math.abs(item.value).toLocaleString()}
                                    </Typography>
                                  </Box>
                                ))}
                                
                                <Divider sx={{ my: 1 }} />
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="subtitle1" fontWeight="bold">
                                    Total Bill:
                                  </Typography>
                                  <Typography variant="subtitle1" fontWeight="bold" color="primary">
                                    Rs. {checkout.financials.totalBill?.toLocaleString()}
                                  </Typography>
                                </Box>
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                  <Typography variant="body2">Advance Paid:</Typography>
                                  <Typography variant="body2">
                                    Rs. {checkout.financials.advancePaid?.toLocaleString()}
                                  </Typography>
                                </Box>
                              </Paper>
                            </Grid>
                          </Grid>

                          {/* Orders in this checkout */}
                          {checkout.orders && checkout.orders.length > 0 && (
                            <Box sx={{ mt: 3 }}>
                              <Typography variant="h6" gutterBottom>
                                Orders included:
                              </Typography>
                              <Grid container spacing={2}>
                                {checkout.orders.map((order, index) => (
                                  <Grid item xs={12} sm={6} key={index}>
                                    <Paper variant="outlined" sx={{ p: 2 }}>
                                      <Typography variant="subtitle2" gutterBottom>
                                        Order Total: Rs. {order.totalAmount?.toLocaleString()}
                                      </Typography>
                                      <Typography variant="body2" color="textSecondary">
                                        Items: {order.items.map(item => `${item.name} (${item.quantity})`).join(', ')}
                                      </Typography>
                                    </Paper>
                                  </Grid>
                                ))}
                              </Grid>
                            </Box>
                          )}
                        </Paper>
                      ))
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </>
        )}
      </Container>
    </div>
  );
};

export default RecordBook;