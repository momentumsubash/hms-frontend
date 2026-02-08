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
    // Pagination state for checkouts and items
    const [checkoutPage, setCheckoutPage] = useState(0);
    const [checkoutRowsPerPage, setCheckoutRowsPerPage] = useState(5);
    const [itemPage, setItemPage] = useState(0);
    const [itemRowsPerPage, setItemRowsPerPage] = useState(10);
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
                      Rs. {data.totals.totalRevenue.toLocaleString()}
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
                      color={data.totals.netProfit >= 0 ? 'success.main' : 'error.main'}
                    >
                      Rs. {data.totals.netProfit.toLocaleString()}
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
                    <Typography variant="h6">🏨 Allocated Rooms ({data.roomAllocations.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {data.roomAllocations.length === 0 ? (
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
                            {data.roomAllocations.map((room) => (
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
                                    label={room.isCurrentlyOccupied ? 'Occupied' : 'Vacant'} 
                                    size="small" 
                                    color={room.isCurrentlyOccupied ? 'success' : 'default'} 
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

              {/* Items Sold Table */}
              <Grid item xs={12} md={6}>
                <Accordion defaultExpanded elevation={2}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">🍽️ Items Sold ({data.itemSalesBreakdown?.length || 0})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {(!data.itemSalesBreakdown || data.itemSalesBreakdown.length === 0) ? (
                      <Typography color="textSecondary" align="center" sx={{ py: 2 }}>
                        No items sold on this date
                      </Typography>
                    ) : (
                      <>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Category</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Quantity</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {data.itemSalesBreakdown
                                .slice(itemPage * itemRowsPerPage, itemPage * itemRowsPerPage + itemRowsPerPage)
                                .map((item, idx) => (
                                  <TableRow key={item.itemId || idx}>
                                    <TableCell>{item.name}</TableCell>
                                    <TableCell>{item.category}</TableCell>
                                    <TableCell>Rs. {item.price?.toLocaleString()}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {/* Pagination for items */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <Button
                            size="small"
                            disabled={itemPage === 0}
                            onClick={() => setItemPage(itemPage - 1)}
                          >Prev</Button>
                          <Typography variant="body2" sx={{ mx: 2, alignSelf: 'center' }}>
                            Page {itemPage + 1} of {Math.ceil(data.itemSalesBreakdown.length / itemRowsPerPage)}
                          </Typography>
                          <Button
                            size="small"
                            disabled={(itemPage + 1) * itemRowsPerPage >= data.itemSalesBreakdown.length}
                            onClick={() => setItemPage(itemPage + 1)}
                          >Next</Button>
                        </Box>
                      </>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Daily Checkouts Table with Pagination */}
              <Grid item xs={12}>
                <Accordion defaultExpanded elevation={2}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="h6">📋 Daily Checkouts ({data.dailyCheckouts.length})</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {data.dailyCheckouts.length === 0 ? (
                      <Typography color="textSecondary" align="center" sx={{ py: 3 }}>
                        No checkouts on this date
                      </Typography>
                    ) : (
                      <>
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>Checkout ID</TableCell>
                                <TableCell>Guest</TableCell>
                                <TableCell>Rooms</TableCell>
                                <TableCell>Total Bill</TableCell>
                                <TableCell>Room Charges</TableCell>
                                <TableCell>Order Charges</TableCell>
                                <TableCell>Payment</TableCell>
                                <TableCell>Date</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {data.dailyCheckouts
                                .slice(checkoutPage * checkoutRowsPerPage, checkoutPage * checkoutRowsPerPage + checkoutRowsPerPage)
                                .map((checkout) => (
                                  <TableRow key={checkout.checkoutId}>
                                    <TableCell>{checkout.checkoutId?.slice(-6).toUpperCase()}</TableCell>
                                    <TableCell>{checkout.guest?.name || 'Walk-in'}</TableCell>
                                    <TableCell>
                                      {checkout.rooms?.map((room, idx) => (
                                        <Chip key={idx} label={room.roomNumber} size="small" sx={{ mr: 0.5 }} />
                                      ))}
                                    </TableCell>
                                    <TableCell>Rs. {checkout.financials?.totalBill.toLocaleString()}</TableCell>
                                    <TableCell>Rs. {checkout.financials?.roomCharges.toLocaleString()}</TableCell>
                                    <TableCell>Rs. {checkout.financials?.orderCharges.toLocaleString()}</TableCell>
                                    <TableCell>{checkout.paymentMethod}</TableCell>
                                    <TableCell>{format(new Date(checkout.checkOutDate), 'MMM dd, yyyy')}</TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                        {/* Pagination for checkouts */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                          <Button
                            size="small"
                            disabled={checkoutPage === 0}
                            onClick={() => setCheckoutPage(checkoutPage - 1)}
                          >Prev</Button>
                          <Typography variant="body2" sx={{ mx: 2, alignSelf: 'center' }}>
                            Page {checkoutPage + 1} of {Math.ceil(data.dailyCheckouts.length / checkoutRowsPerPage)}
                          </Typography>
                          <Button
                            size="small"
                            disabled={(checkoutPage + 1) * checkoutRowsPerPage >= data.dailyCheckouts.length}
                            onClick={() => setCheckoutPage(checkoutPage + 1)}
                          >Next</Button>
                        </Box>
                      </>
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