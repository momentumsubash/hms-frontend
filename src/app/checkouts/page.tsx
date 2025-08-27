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

  // Print bill function
  const printBill = () => {
    const printContent = document.getElementById('bill-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Hotel Bill - ${detailsCheckout?.guest?.firstName} ${detailsCheckout?.guest?.lastName}</title>
              <style>
                body { 
                  font-family: Arial, sans-serif; 
                  margin: 15px; 
                  font-size: 12px;
                  line-height: 1.3;
                }
                .bill-header { 
                  text-align: center; 
                  border-bottom: 2px solid #000; 
                  padding-bottom: 8px; 
                  margin-bottom: 12px; 
                }
                .bill-header h1 { margin: 0 0 5px 0; font-size: 18px; }
                .bill-header p { margin: 2px 0; }
                .bill-section { 
                  margin: 8px 0; 
                  page-break-inside: avoid;
                }
                .bill-section h3 { 
                  margin: 5px 0 3px 0; 
                  font-size: 13px; 
                  border-bottom: 1px solid #ccc;
                  padding-bottom: 3px;
                }
                .bill-table { 
                  width: 100%; 
                  border-collapse: collapse; 
                  margin: 5px 0; 
                  font-size: 11px;
                }
                .bill-table th, .bill-table td { 
                  border: 1px solid #000; 
                  padding: 4px 6px; 
                  text-align: left; 
                  vertical-align: top;
                }
                .bill-table th { 
                  background-color: #f5f5f5; 
                  font-weight: bold;
                }
                .total-row { 
                  font-weight: bold; 
                  background-color: #f0f0f0; 
                }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .bill-footer {
                  margin-top: 15px;
                  text-align: center;
                  border-top: 1px solid #ccc;
                  padding-top: 8px;
                  font-size: 11px;
                }
                .order-details {
                  margin-top: 10px;
                }
                .order-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin: 5px 0;
                  font-size: 10px;
                }
                .order-table th, .order-table td {
                  border: 1px solid #ddd;
                  padding: 3px 5px;
                }
                .order-header {
                  background-color: #f9f9f9;
                  font-weight: bold;
                }
                .vat-info {
                  margin-top: 10px;
                  padding: 8px;
                  border: 1px solid #ddd;
                  background-color: #f9f9f9;
                }
                @media print {
                  body { 
                    margin: 10mm; 
                    font-size: 11px;
                  }
                  .bill-section {
                    page-break-inside: avoid;
                    margin: 6px 0;
                  }
                  .bill-table {
                    font-size: 10px;
                  }
                  .bill-table th, .bill-table td {
                    padding: 3px 4px;
                  }
                  .bill-footer {
                    margin-top: 10px;
                    padding-top: 5px;
                  }
                  .order-table {
                    font-size: 9px;
                  }
                  .vat-info {
                    border: 1px solid #999;
                  }
                }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
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
      };

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
                        }}>₹{checkout.totalBill?.toLocaleString()}</td>
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
                  <label htmlFor="advanceAmount" className="block text-sm font-medium text-gray-700">Advance Paid (₹)</label>
                  <input
                    type="number"
                    id="advanceAmount"
                    value={advanceAmount}
                    onChange={(e) => setAdvanceAmount(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
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
                  <label htmlFor="editVatAmount" className="block text-sm font-medium text-gray-700">VAT Amount (₹)</label>
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
                  <label htmlFor="editVatAmount" className="block text-sm font-medium text-gray-700">VAT Amount (₹)</label>
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
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex justify-center items-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-4xl mx-4">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
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
                  className="text-gray-400 hover:text-gray-600 text-2xl"
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
                  <h1 className="text-xl font-bold">{hotelName.toUpperCase()}</h1>
                  <h2 className="text-lg">HOTEL BILL</h2>
                  <p>Date: {new Date().toLocaleDateString()}</p>
                  <p>Invoice #: {detailsCheckout?._id?.slice(-8)}</p>
                </div>

                {/* Guest & Room Details */}
                <div className="bill-section grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h3 className="font-semibold text-lg">Guest Information</h3>
                    <p><strong>Name:</strong> {detailsCheckout?.guest?.firstName} {detailsCheckout?.guest?.lastName}</p>
                    <p><strong>Email:</strong> {detailsCheckout?.guest?.email}</p>
                    {detailsCheckout?.guest?.phone && (
                      <p><strong>Phone:</strong> {detailsCheckout.guest.phone}</p>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Stay Information</h3>
                    <p><strong>Rooms:</strong> {detailsCheckout?.rooms?.map((r: any) => `#${r.roomNumber}`).join(', ') || 'N/A'}</p>
                    <p><strong>Nights:</strong> {detailsCheckout?.nights || 1}</p>
                    <p><strong>Check-in:</strong> {detailsCheckout?.checkInDate ? new Date(detailsCheckout.checkInDate).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Check-out:</strong> {detailsCheckout?.checkOutDate ? new Date(detailsCheckout.checkOutDate).toLocaleDateString() : 'N/A'}</p>
                  </div>
                </div>

                {/* Client VAT Info (if available) */}
                {detailsCheckout?.clientVatInfo?.vatNumber && (
                  <div className="bill-section text-sm vat-info">
                    <h3 className="font-semibold text-lg">Client VAT Information</h3>
                    <p><strong>VAT Number:</strong> {detailsCheckout.clientVatInfo.vatNumber}</p>
                    <p><strong>Company:</strong> {detailsCheckout.clientVatInfo.companyName}</p>
                    <p><strong>Address:</strong> {detailsCheckout.clientVatInfo.address}</p>
                  </div>
                )}

                {/* Order Details */}
                {detailsCheckout?.orders && detailsCheckout.orders.length > 0 && (
                  <div className="bill-section">
                    <h3 className="font-semibold text-lg">Order Details</h3>
                    {detailsCheckout.orders.map((order: any, index: number) => (
                      <div key={index} className="order-details">
                        <p><strong>Order #{index + 1}</strong> - {new Date(order.createdAt).toLocaleDateString()}</p>
                        <table className="order-table">
                          <thead>
                            <tr className="order-header">
                              <th>Item</th>
                              <th className="text-center">Qty</th>
                              <th className="text-right">Price</th>
                              <th className="text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {order.items.map((item: any, itemIndex: number) => (
                              <tr key={itemIndex}>
                                <td>{item.name}</td>
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

                {/* Room Charges Details */}
                <div className="bill-section">
                  <h3 className="font-semibold text-lg">Room Charges</h3>
                  <table className="bill-table">
                    <thead>
                      <tr>
                        <th>Room</th>
                        <th>Type</th>
                        <th className="text-right">Rate per Night</th>
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
                            <td className="capitalize">{room.type}</td>
                            <td className="text-right">₹{room.rate?.toLocaleString()}</td>
                            <td className="text-center">{nights}</td>
                            <td className="text-right">₹{roomTotal.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Billing Summary */}
                <div className="bill-section">
                  <h3 className="font-semibold text-lg">Bill Summary</h3>
                  <table className="bill-table w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left">Description</th>
                        <th className="px-4 py-2 text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="px-4 py-2">Room Charges ({detailsCheckout?.nights || 1} nights)</td>
                        <td className="px-4 py-2 text-right">{detailsCheckout?.breakdown?.roomCharges?.toLocaleString()}</td>
                      </tr>
                      {detailsCheckout?.breakdown?.roomDiscount > 0 && (
                        <tr>
                          <td className="px-4 py-2 text-red-600">Room Discount</td>
                          <td className="px-4 py-2 text-right text-red-600">-{detailsCheckout.breakdown.roomDiscount?.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr>
                        <td className="px-4 py-2">Net Room Charges</td>
                        <td className="px-4 py-2 text-right">{detailsCheckout?.breakdown?.roomNet?.toLocaleString()}</td>
                      </tr>
                      {detailsCheckout?.breakdown?.orderCharges > 0 && (
                        <tr>
                          <td className="px-4 py-2">Food & Beverage Orders</td>
                          <td className="px-4 py-2 text-right">{detailsCheckout.breakdown.orderCharges?.toLocaleString()}</td>
                        </tr>
                      )}
                      {detailsCheckout?.breakdown?.extraCharges > 0 && (
                        <tr>
                          <td className="px-4 py-2">Other Charges</td>
                          <td className="px-4 py-2 text-right">{detailsCheckout.breakdown.extraCharges?.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="font-bold">
                        <td className="px-4 py-2">Subtotal</td>
                        <td className="px-4 py-2 text-right">
                          {detailsCheckout?.breakdown?.subtotal?.toLocaleString()}
                        </td>
                      </tr>
                      {detailsCheckout?.breakdown?.vatAmount > 0 && (
                        <tr>
                          <td className="px-4 py-2">VAT ({detailsCheckout.breakdown.vatPercent || 0}%)</td>
                          <td className="px-4 py-2 text-right">{detailsCheckout.breakdown.vatAmount?.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="font-bold">
                        <td className="px-4 py-2">Total Before Advance</td>
                        <td className="px-4 py-2 text-right">
                          {detailsCheckout?.breakdown?.totalBeforeAdvance?.toLocaleString()}
                        </td>
                      </tr>
                      {detailsCheckout?.breakdown?.advancePaid > 0 && (
                        <tr className="text-green-700">
                          <td className="px-4 py-2">Advance Paid</td>
                          <td className="px-4 py-2 text-right">-{detailsCheckout.breakdown.advancePaid?.toLocaleString()}</td>
                        </tr>
                      )}
                      <tr className="font-extrabold text-lg bg-gray-200">
                        <td className="px-4 py-2">Grand Total</td>
                        <td className="px-4 py-2 text-right">₹{detailsCheckout?.breakdown?.finalBill?.toLocaleString()}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Footer */}
                <div className="bill-footer">
                  <p>Thank you for staying with us!</p>
                  <p>For any queries, please contact hotel management</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}