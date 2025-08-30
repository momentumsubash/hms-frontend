"use client";

import { getCheckouts, getCheckoutById } from "@/lib/api";
import { updateCheckoutPayment, updateCheckout } from "@/lib/checkoutApi";
import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";

import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";

export default function CheckoutsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { user, loading: userLoading, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navLinks = [
    { label: "Dashboardss", href: "/dashboard" },
    { label: "Checkouts", href: "/checkouts" },
    { label: "Guests", href: "/guests" },
    { label: "Hotels", href: "/hotels", superAdminOnly: true },
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
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 500);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalCount: 0
  });
  const [showEdit, setShowEdit] = useState(false);
  const [editCheckout, setEditCheckout] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);
  const [detailsCheckout, setDetailsCheckout] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // States for VAT editing
  const [showVatEdit, setShowVatEdit] = useState(false);
  const [vatEditLoading, setVatEditLoading] = useState(false);
  const [vatEditError, setVatEditError] = useState("");
  const [editVatPercent, setEditVatPercent] = useState<string>("");
  const [editVatAmount, setEditVatAmount] = useState<string>("");

  // New states for enhanced edit modal
  const [clientVatNumber, setClientVatNumber] = useState<string>("");
  const [clientVatCompany, setClientVatCompany] = useState<string>("");
  const [clientVatAddress, setClientVatAddress] = useState<string>("");
  const [advanceAmount, setAdvanceAmount] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");

  // Hotel name state
  const [hotelName, setHotelName] = useState("Hotel");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState<string>("cash");
  const [paymentDetails, setPaymentDetails] = useState({
    transactionId: "",
    paymentGateway: "",
    paymentDate: ""
  });
  const [advancePaymentDetails, setAdvancePaymentDetails] = useState({
    transactionId: "",
    paymentGateway: "",
    paymentDate: ""
  });

  // Load data when page, status filter, or debounced search changes
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.status, debouncedSearch]);

  // Update hotel name from user data
  useEffect(() => {
    if (user && user.hotel && user.hotel.name) {
      setHotelName(user.hotel.name);
    }
  }, [user]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        page,
        limit,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      };

      if (filters.status) params.status = filters.status;
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await getCheckouts(params);
      setCheckouts(res?.data || []);
      setPagination(res?.pagination || {
        page: 1,
        limit: 10,
        totalPages: 1,
        totalCount: 0
      });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters.status, debouncedSearch]);

  // Function to load detailed checkout data
  const loadCheckoutDetails = async (checkoutId: string) => {
    try {
      setDetailsLoading(true);
      const checkoutData = await getCheckoutById(checkoutId);
      setDetailsCheckout(checkoutData.data);
    } catch (e: any) {
      setError("Failed to load checkout details: " + e.message);
    } finally {
      setDetailsLoading(false);
    }
  };



  // Reset page to 1 on filter change
  useEffect(() => {
    setPage(1);
  }, [filters.status, debouncedSearch]);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  const handleStatusChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      status: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      search: ""
    });
    setSearchInput("");
    setPage(1);
  };

// Print bill function - UPDATED FOR THERMAL PAPER WITH PAGINATION
  const printBill = () => {
    const printContent = document.getElementById('bill-content');
    if (printContent) {
      const printWindow = window.open('', '_blank', 'width=300,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Hotel Bill - ${detailsCheckout?.guest?.firstName} ${detailsCheckout?.guest?.lastName}</title>
              <style>
                @media print {
                  * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                    font-family: 'Courier New', monospace;
                  }
                  body {
                    width: 57mm;
                    max-width: 57mm;
                    padding: 2mm;
                    font-size: 8px;
                    line-height: 1.1;
                  }
                  .bill-header {
                    text-align: center;
                    border-bottom: 1px solid #000;
                    padding-bottom: 2mm;
                    margin-bottom: 2mm;
                  }
                  .bill-header h1 {
                    font-size: 10px;
                    font-weight: bold;
                    margin-bottom: 1mm;
                  }
                  .bill-header h2 {
                    font-size: 9px;
                    margin-bottom: 1mm;
                  }
                  .bill-header p {
                    font-size: 7px;
                    margin: 0.5mm 0;
                  }
                  .bill-section {
                    margin: 2mm 0;
                    page-break-inside: avoid;
                  }
                  .bill-section h3 {
                    font-size: 8px;
                    font-weight: bold;
                    border-bottom: 1px dashed #ccc;
                    padding-bottom: 1mm;
                    margin-bottom: 1mm;
                  }
                  .bill-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1mm 0;
                    font-size: 7px;
                  }
                  .bill-table th, .bill-table td {
                    padding: 0.5mm 0.3mm;
                    text-align: left;
                    vertical-align: top;
                  }
                  .bill-table th {
                    font-weight: bold;
                  }
                  .text-right {
                    text-align: right;
                  }
                  .text-center {
                    text-align: center;
                  }
                  .total-row {
                    font-weight: bold;
                    border-top: 1px dashed #000;
                  }
                  .bill-footer {
                    margin-top: 3mm;
                    text-align: center;
                    border-top: 1px dashed #ccc;
                    padding-top: 2mm;
                    font-size: 7px;
                  }
                  .order-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1mm 0;
                    font-size: 6px;
                  }
                  .order-table th, .order-table td {
                    padding: 0.3mm;
                  }
                  .vat-info {
                    margin-top: 1mm;
                    padding: 1mm;
                    border: 1px dashed #ccc;
                    font-size: 7px;
                  }
                  .payment-info {
                    margin-top: 1mm;
                    padding: 1mm;
                    border: 1px dashed #ccc;
                    font-size: 7px;
                  }
                  .payment-method {
                    display: inline-block;
                    padding: 0.5mm 1mm;
                    background: #f0f0f0;
                    border-radius: 2px;
                    margin-right: 1mm;
                    font-size: 6px;
                  }
                  .page-break {
                    page-break-before: always;
                  }
                }
              </style>
            </head>
            <body onload="window.print(); setTimeout(() => { window.close(); }, 500);">
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };



  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCheckout) return;

    setEditLoading(true);
    setEditError("");

    try {
      // Prepare the payload for the main checkout update including VAT
      const payload: any = {
        status: editStatus,
        advancePaid: parseFloat(advanceAmount) || 0,
        checkInDate,
        checkOutDate,
        paymentMethod,
        advancePaymentMethod,
      };
      // Add payment details if provided
      if (paymentMethod === "online" && paymentDetails.transactionId) {
        payload.paymentDetails = paymentDetails;
      }

      // Add advance payment details if provided
      if (advancePaymentMethod === "online" && advancePaymentDetails.transactionId) {
        payload.advancePaymentDetails = advancePaymentDetails;
      }

      // Add VAT information if provided
      if (editVatPercent !== "") {
        payload.vatPercent = parseFloat(editVatPercent);
      } else if (editVatPercent === "") {
        // Clear VAT percent if field is empty
        payload.vatPercent = null;
      }

      if (editVatAmount !== "") {
        payload.vatAmount = parseFloat(editVatAmount);
      } else if (editVatAmount === "") {
        // Clear VAT amount if field is empty
        payload.vatAmount = null;
      }

      // Add client VAT info if provided
      if (clientVatNumber || clientVatCompany || clientVatAddress) {
        payload.clientVatInfo = {
          vatNumber: clientVatNumber,
          companyName: clientVatCompany,
          address: clientVatAddress,
        };
      } else {
        // Clear client VAT info if all fields are empty
        payload.clientVatInfo = null;
      }

      // Execute API call using the main PUT endpoint
      await updateCheckout(editCheckout._id, payload);

      // Reload data and close modal
      loadData();
      setShowEdit(false);
      setEditCheckout(null);
    } catch (e: any) {
      setEditError(e.message || "Failed to update checkout.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleVatEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCheckout) return;

    setVatEditLoading(true);
    setVatEditError("");

    try {
      // Prepare the payload for VAT update according to the endpoint
      const vatUpdatePayload: any = {};

      // Check if editVatPercent is a valid number before adding it to the payload
      if (editVatPercent !== "") {
        vatUpdatePayload.vatPercent = parseFloat(editVatPercent);
      } else {
        // If the user clears the field, we should send null to clear it on the server
        vatUpdatePayload.vatPercent = null;
      }

      // Check if editVatAmount is a valid number before adding it to the payload
      if (editVatAmount !== "") {
        vatUpdatePayload.vatAmount = parseFloat(editVatAmount);
      } else {
        // Send null to clear the value on the server
        vatUpdatePayload.vatAmount = null;
      }

      // Include client VAT info if available
      if (clientVatNumber || clientVatCompany || clientVatAddress) {
        vatUpdatePayload.clientVatInfo = {
          vatNumber: clientVatNumber,
          companyName: clientVatCompany,
          address: clientVatAddress,
        };
      }

      // Execute API call for VAT update using the correct endpoint
      // This should call the PATCH /api/checkouts/:id/vat endpoint
      await updateCheckoutPayment(editCheckout._id, vatUpdatePayload);

      // Reload data and close modal
      loadData();
      setShowVatEdit(false);
      setEditCheckout(null);
    } catch (e: any) {
      setVatEditError(e.message || "Failed to update VAT information.");
    } finally {
      setVatEditLoading(false);
    }
  };

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
          <h1 className="text-3xl font-bold">Checkouts Management</h1>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search by guest name or room number..."
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput("");
                      setFilters(prev => ({ ...prev, search: "" }));
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ×
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">Press Enter or wait to search</p>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            <div className="flex items-end space-x-2">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="w-full bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors"
              >
                Clear
              </button>
            </div>
          </form>

          {/* Results Count */}
          <div className="text-sm text-gray-600">
            {pagination.totalCount === 0 ? 'No results' :
              `Showing ${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.totalCount)} of ${pagination.totalCount} checkouts`}
          </div>
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

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {checkouts.length > 0 ? (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bill</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {checkouts.map((checkout: any) => (
                      <tr key={checkout._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => {
                          setDetailsCheckout(checkout);
                          setShowDetails(true);
                          loadCheckoutDetails(checkout._id);
                        }}>
                          {checkout.guest ? `${checkout.guest.firstName} ${checkout.guest.lastName}` : "-"}
                          <div className="text-xs text-gray-500">{checkout.guest?.email}</div>
                          {checkout.guest?.phone && (
                            <div className="text-xs text-gray-500">{checkout.guest.phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => {
                          setDetailsCheckout(checkout);
                          setShowDetails(true);
                          loadCheckoutDetails(checkout._id);
                        }}>
                          {checkout.rooms && checkout.rooms.length > 0
                            ? checkout.rooms.map((r: any) => `#${r.roomNumber}`).join(', ')
                            : "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap capitalize cursor-pointer" onClick={() => {
                          setDetailsCheckout(checkout);
                          setShowDetails(true);
                          loadCheckoutDetails(checkout._id);
                        }}>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${checkout.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {checkout.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold cursor-pointer" onClick={() => {
                          setDetailsCheckout(checkout);
                          setShowDetails(true);
                          loadCheckoutDetails(checkout._id);
                        }}>रु{checkout.totalBill?.toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs cursor-pointer" onClick={() => {
                          setDetailsCheckout(checkout);
                          setShowDetails(true);
                          loadCheckoutDetails(checkout._id);
                        }}>{checkout.createdAt ? new Date(checkout.createdAt).toLocaleString() : ""}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            className="text-blue-600 hover:underline text-sm mr-3"
                            onClick={() => {
                              setDetailsCheckout(checkout);
                              setShowDetails(true);
                              loadCheckoutDetails(checkout._id);
                            }}
                          >
                            View
                          </button>
                          <button
                            className="text-green-600 hover:underline text-sm mr-3"
                            onClick={() => {
                              setEditCheckout(checkout);
                              setEditStatus(checkout.status);
                              setEditVatPercent(checkout.vatPercent?.toString() || "");
                              setEditVatAmount(checkout.vatAmount?.toString() || "");
                              setClientVatNumber(checkout.clientVatInfo?.vatNumber || "");
                              setClientVatCompany(checkout.clientVatInfo?.companyName || "");
                              setClientVatAddress(checkout.clientVatInfo?.address || "");
                              setAdvanceAmount(checkout.advancePaid?.toString() || "0");
                              setCheckInDate(checkout.checkInDate ? checkout.checkInDate.slice(0, 10) : "");
                              setCheckOutDate(checkout.checkOutDate ? checkout.checkOutDate.slice(0, 10) : "");
                              setPaymentMethod(checkout.paymentMethod || "cash");
                              setAdvancePaymentMethod(checkout.advancePaymentMethod || "cash");
                              setPaymentDetails(checkout.paymentDetails || {
                                transactionId: "",
                                paymentGateway: "",
                                paymentDate: ""
                              });
                              setAdvancePaymentDetails(checkout.advancePaymentDetails || {
                                transactionId: "",
                                paymentGateway: "",
                                paymentDate: ""
                              });
                              setShowEdit(true);
                              setEditError("");
                            }}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">No checkouts found matching your criteria.</div>
                {(filters.search || filters.status) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-blue-600 hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Pagination Controls */}
          <div className="flex justify-between items-center p-4 bg-white border-t border-gray-200">
            <button
              onClick={() => setPage(page => Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page => page + 1)}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {/* Edit Modal */}
      {showEdit && editCheckout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold">Edit Checkout for {editCheckout?.guest?.firstName} {editCheckout?.guest?.lastName}</h3>
              <button
                onClick={() => setShowEdit(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            {editError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{editError}</div>}
            <form onSubmit={handleEditSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Status */}
                <div>
                  <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="editStatus"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                {/* Advance Amount */}
                <div>
                  <label htmlFor="advanceAmount" className="block text-sm font-medium text-gray-700">Advance Paid (रु)</label>
                  <input
                    type="number"
                    id="advanceAmount"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* Payment Method Section */}
                <h4 className="text-lg font-semibold mt-6 mb-2">Payment Method</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">Final Payment Method</label>
                    <select
                      id="paymentMethod"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="advancePaymentMethod" className="block text-sm font-medium text-gray-700">Advance Payment Method</label>
                    <select
                      id="advancePaymentMethod"
                      value={advancePaymentMethod}
                      onChange={(e) => setAdvancePaymentMethod(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                    </select>
                  </div>
                </div>

                {/* Online Payment Details (Conditional) */}
                {paymentMethod === "online" && (
                  <div className="bg-blue-50 p-4 rounded-md mb-4">
                    <h5 className="font-medium text-blue-800 mb-2">Final Payment Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700">Transaction ID</label>
                        <input
                          type="text"
                          id="transactionId"
                          value={paymentDetails.transactionId}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter transaction ID"
                        />
                      </div>
                      <div>
                        <label htmlFor="paymentGateway" className="block text-sm font-medium text-gray-700">Payment Gateway</label>
                        <input
                          type="text"
                          id="paymentGateway"
                          value={paymentDetails.paymentGateway}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentGateway: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., stripe, paypal"
                        />
                      </div>
                      <div>
                        <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700">Payment Date</label>
                        <input
                          type="datetime-local"
                          id="paymentDate"
                          value={paymentDetails.paymentDate}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentDate: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {advancePaymentMethod === "online" && (
                  <div className="bg-green-50 p-4 rounded-md mb-4">
                    <h5 className="font-medium text-green-800 mb-2">Advance Payment Details</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="advanceTransactionId" className="block text-sm font-medium text-gray-700">Transaction ID</label>
                        <input
                          type="text"
                          id="advanceTransactionId"
                          value={advancePaymentDetails.transactionId}
                          onChange={(e) => setAdvancePaymentDetails({ ...advancePaymentDetails, transactionId: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter transaction ID"
                        />
                      </div>
                      <div>
                        <label htmlFor="advancePaymentGateway" className="block text-sm font-medium text-gray-700">Payment Gateway</label>
                        <input
                          type="text"
                          id="advancePaymentGateway"
                          value={advancePaymentDetails.paymentGateway}
                          onChange={(e) => setAdvancePaymentDetails({ ...advancePaymentDetails, paymentGateway: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="e.g., stripe, paypal"
                        />
                      </div>
                      <div>
                        <label htmlFor="advancePaymentDate" className="block text-sm font-medium text-gray-700">Payment Date</label>
                        <input
                          type="datetime-local"
                          id="advancePaymentDate"
                          value={advancePaymentDetails.paymentDate}
                          onChange={(e) => setAdvancePaymentDetails({ ...advancePaymentDetails, paymentDate: e.target.value })}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                )}
                {/* Check-in Date */}
                <div>
                  <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700">Check-in Date</label>
                  <input
                    type="date"
                    id="checkInDate"
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* Check-out Date */}
                <div>
                  <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700">Check-out Date</label>
                  <input
                    type="date"
                    id="checkOutDate"
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {/* VAT Information Section */}
              <h4 className="text-lg font-semibold mt-6 mb-2">VAT Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* VAT Percent */}
                <div>
                  <label htmlFor="editVatPercent" className="block text-sm font-medium text-gray-700">VAT Percent (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="editVatPercent"
                    value={editVatPercent}
                    onChange={(e) => setEditVatPercent(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter VAT percentage"
                  />
                </div>
                {/* VAT Amount */}
                <div>
                  <label htmlFor="editVatAmount" className="block text-sm font-medium text-gray-700">VAT Amount (रु)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="editVatAmount"
                    value={editVatAmount}
                    onChange={(e) => setEditVatAmount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter VAT amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">Note: Enter either percentage or amount, not both</p>
                </div>
              </div>

              {/* Client VAT Information Section */}
              <h4 className="text-lg font-semibold mt-6 mb-2">Client VAT Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* Client VAT Number */}
                <div>
                  <label htmlFor="clientVatNumber" className="block text-sm font-medium text-gray-700">VAT Number</label>
                  <input
                    type="text"
                    id="clientVatNumber"
                    value={clientVatNumber}
                    onChange={(e) => setClientVatNumber(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* Client Company Name */}
                <div>
                  <label htmlFor="clientVatCompany" className="block text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    type="text"
                    id="clientVatCompany"
                    value={clientVatCompany}
                    onChange={(e) => setClientVatCompany(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                {/* Client Address */}
                <div className="col-span-1 md:col-span-2">
                  <label htmlFor="clientVatAddress" className="block text-sm font-medium text-gray-700">Address</label>
                  <input
                    type="text"
                    id="clientVatAddress"
                    value={clientVatAddress}
                    onChange={(e) => setClientVatAddress(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  disabled={editLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md text-white ${editLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                  disabled={editLoading}
                >
                  {editLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VAT Edit Modal */}
      {showVatEdit && editCheckout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <h3 className="text-xl font-semibold">Edit VAT Information</h3>
              <button
                onClick={() => setShowVatEdit(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            {vatEditError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{vatEditError}</div>}
            <form onSubmit={handleVatEditSubmit}>
              <div className="grid grid-cols-1 gap-4 mb-4">
                {/* VAT Percent */}
                <div>
                  <label htmlFor="editVatPercent" className="block text-sm font-medium text-gray-700">VAT Percent (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="editVatPercent"
                    value={editVatPercent}
                    onChange={(e) => setEditVatPercent(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter VAT percentage"
                  />
                </div>
                {/* VAT Amount */}
                <div>
                  <label htmlFor="editVatAmount" className="block text-sm font-medium text-gray-700">VAT Amount (रु)</label>
                  <input
                    type="number"
                    step="0.01"
                    id="editVatAmount"
                    value={editVatAmount}
                    onChange={(e) => setEditVatAmount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter VAT amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">Note: Enter either percentage or amount, not both</p>
                </div>
              </div>



              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVatEdit(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
                  disabled={vatEditLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md text-white ${vatEditLoading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
                  disabled={vatEditLoading}
                >
                  {vatEditLoading ? 'Updating...' : 'Update VAT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

  {/* View Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative">
            {/* Close button positioned inside the modal */}
            <div className="flex justify-between items-center border-b pb-3 mb-4 sticky top-0 bg-white z-10">
              <h3 className="text-2xl font-semibold">Checkout Details</h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={printBill}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                >
                  Print Bill
                </button>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>

            {detailsLoading ? (
              <div className="flex justify-center items-center h-64">
                <div>Loading checkout details...</div>
              </div>
            ) : (
              <div id="bill-content">
                {/* Bill Header */}
                <div className="bill-header">
                  <h1>{hotelName.toUpperCase()}</h1>
                  <h2>HOTEL BILL</h2>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <p>Invoice #: {detailsCheckout?._id?.slice(-8)}</p>
                </div>

                {/* Guest & Room Details */}
                <div className="bill-section">
                  <h3>Guest Information</h3>
                  <p><strong>Name:</strong> {detailsCheckout?.guest?.firstName} {detailsCheckout?.guest?.lastName}</p>
                  <p><strong>Email:</strong> {detailsCheckout?.guest?.email}</p>
                  {detailsCheckout?.guest?.phone && (
                    <p><strong>Phone:</strong> {detailsCheckout.guest.phone}</p>
                  )}
                </div>

                <div className="bill-section">
                  <h3>Stay Information</h3>
                  <p><strong>Rooms:</strong> {detailsCheckout?.rooms?.map((r: any) => `#${r.roomNumber}`).join(', ') || 'N/A'}</p>
                  <p><strong>Nights:</strong> {detailsCheckout?.nights || 1}</p>
                  <p><strong>Check-in:</strong> {detailsCheckout?.checkInDate ? new Date(detailsCheckout.checkInDate).toLocaleDateString() : 'N/A'}</p>
                  <p><strong>Check-out:</strong> {detailsCheckout?.checkOutDate ? new Date(detailsCheckout.checkOutDate).toLocaleDateString() : 'N/A'}</p>
                </div>

                {/* Client VAT Info (if available) */}
                {detailsCheckout?.clientVatInfo?.vatNumber && (
                  <div className="bill-section vat-info">
                    <h3>Client VAT Information</h3>
                    <p><strong>VAT No:</strong> {detailsCheckout.clientVatInfo.vatNumber}</p>
                    <p><strong>Company:</strong> {detailsCheckout.clientVatInfo.companyName}</p>
                    <p><strong>Address:</strong> {detailsCheckout.clientVatInfo.address}</p>
                  </div>
                )}

                {/* Payment Information */}
                <div className="bill-section payment-info">
                  <h3>Payment Information</h3>
                  
                  {/* Final Payment */}
                  <p>
                    <strong>Final Payment:</strong> 
                    <span className="payment-method">{detailsCheckout?.paymentMethod?.toUpperCase() || 'CASH'}</span>
                  </p>
                  
                  {/* Advance Payment */}
                  {detailsCheckout?.advancePaid > 0 && (
                    <p>
                      <strong>Advance Paid:</strong> 
                      <span className="payment-method">{detailsCheckout?.advancePaymentMethod?.toUpperCase() || 'CASH'}</span>
                      ₹{detailsCheckout.advancePaid.toLocaleString()}
                    </p>
                  )}
                  
                  {/* Online Payment Details */}
                  {detailsCheckout?.paymentMethod === 'online' && detailsCheckout?.paymentDetails?.transactionId && (
                    <p>
                      <strong>Transaction ID:</strong> {detailsCheckout.paymentDetails.transactionId}
                      {detailsCheckout.paymentDetails.paymentGateway && (
                        <span> ({detailsCheckout.paymentDetails.paymentGateway})</span>
                      )}
                    </p>
                  )}
                  
                  {/* Advance Online Payment Details */}
                  {detailsCheckout?.advancePaymentMethod === 'online' && detailsCheckout?.advancePaymentDetails?.transactionId && (
                    <p>
                      <strong>Advance Txn ID:</strong> {detailsCheckout.advancePaymentDetails.transactionId}
                      {detailsCheckout.advancePaymentDetails.paymentGateway && (
                        <span> ({detailsCheckout.advancePaymentDetails.paymentGateway})</span>
                      )}
                    </p>
                  )}
                </div>

                {/* Room Charges Details */}
                <div className="bill-section">
                  <h3>Room Charges</h3>
                  <table className="bill-table">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th className="text-right">Rate/Night</th>
                        <th className="text-center">Nights</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailsCheckout?.rooms?.map((room: any, index: number) => {
                        const nights = detailsCheckout.nights || 1;
                        const roomTotal = room.rate * nights;
                        return (
                          <tr key={index}>
                            <td>#{room.roomNumber}</td>
                            <td className="text-right">₹{room.rate?.toLocaleString()}</td>
                            <td className="text-center">{nights}</td>
                            <td className="text-right">₹{roomTotal.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Order Details with pagination for print */}
                {detailsCheckout?.orders && detailsCheckout.orders.length > 0 && (
                  <div className="bill-section">
                    <h3>Order Details ({detailsCheckout.orders.length} orders)</h3>
                    {detailsCheckout.orders.map((order: any, index: number) => (
                      <div key={index} className="order-details ${index > 0 ? 'page-break' : ''}">
                        <p><strong>Order #{index + 1}</strong> - {new Date(order.createdAt).toLocaleDateString()}</p>
                        <table className="order-table">
                          <thead>
                            <tr>
                              <th>Item</th>
                              <th className="text-center">Qty</th>
                              <th className="text-right">Price</th>
                              <th className="text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item: any, itemIndex: number) => (
                              <tr key={itemIndex}>
                                <td>${item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name}</td>
                                <td className="text-center">{item.quantity}</td>
                                <td className="text-right">₹{item.price?.toLocaleString()}</td>
                                <td className="text-right">₹{item.total?.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="total-row">
                              <td colSpan={3} className="text-right">Order Total:</td>
                              <td className="text-right">₹{order.totalAmount?.toLocaleString()}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    ))}
                  </div>
                )}

                {/* Billing Summary */}
                <div className="bill-section">
                  <h3>Bill Summary</h3>
                  <table className="bill-table">
                    <tbody>
                      <tr>
                        <td>Room Charges</td>
                        <td className="text-right">₹{detailsCheckout?.breakdown?.roomCharges?.toLocaleString()}</td>
                      </tr>
                      {detailsCheckout?.breakdown?.roomDiscount > 0 && (
                        <tr>
                          <td className="text-right">Room Discount</td>
                          <td className="text-right">-₹{detailsCheckout.breakdown.roomDiscount?.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr>
                        <td>Net Room Charges</td>
                        <td className="text-right">₹{detailsCheckout?.breakdown?.roomNet?.toLocaleString()}</td>
                      </tr>
                      {detailsCheckout?.breakdown?.orderCharges > 0 && (
                        <tr>
                          <td>Food & Beverage</td>
                          <td className="text-right">₹{detailsCheckout.breakdown.orderCharges?.toLocaleString()}</td>
                        </tr>
                      )}
                      {detailsCheckout?.breakdown?.extraCharges > 0 && (
                        <tr>
                          <td>Other Charges</td>
                          <td className="text-right">₹{detailsCheckout.breakdown.extraCharges?.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="total-row">
                        <td>Subtotal</td>
                        <td className="text-right">₹{detailsCheckout?.breakdown?.subtotal?.toLocaleString()}</td>
                      </tr>
                      {detailsCheckout?.breakdown?.vatAmount > 0 && (
                        <tr>
                          <td>VAT ({detailsCheckout.breakdown.vatPercent || 0}%)</td>
                          <td className="text-right">₹{detailsCheckout.breakdown.vatAmount?.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="total-row">
                        <td>Total Before Advance</td>
                        <td className="text-right">₹{detailsCheckout?.breakdown?.totalBeforeAdvance?.toLocaleString()}</td>
                      </tr>
                      {detailsCheckout?.breakdown?.advancePaid > 0 && (
                        <tr>
                          <td>Advance Paid</td>
                          <td className="text-right">-₹{detailsCheckout.breakdown.advancePaid?.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="total-row">
                        <td><strong>GRAND TOTAL</strong></td>
                        <td className="text-right"><strong>₹{detailsCheckout?.breakdown?.finalBill?.toLocaleString()}</strong></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="bill-footer">
                  <p>Thank you for staying with us!</p>
                  <p>For queries, contact hotel management</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}