"use client";

import { getCheckouts } from "@/lib/api";
import { updateCheckoutPayment, updateCheckout } from "@/lib/checkoutApi";
import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce"; // You'll need to create this hook

import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";

// Create this hook in a new file: hooks/useDebounce.ts
// If you don't have it, here's the implementation:
/*
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
*/

export default function CheckoutsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { user, loading: userLoading, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
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
  const [searchInput, setSearchInput] = useState(""); // Separate state for input value
  const debouncedSearch = useDebounce(searchInput, 500); // Debounce the search input
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
  const [editVatPercent, setEditVatPercent] = useState<string>("");
  const [editVatAmount, setEditVatAmount] = useState<string>("");
  
  // New states for enhanced edit modal
  const [clientVatNumber, setClientVatNumber] = useState<string>("");
  const [clientVatCompany, setClientVatCompany] = useState<string>("");
  const [clientVatAddress, setClientVatAddress] = useState<string>("");
  const [advanceAmount, setAdvanceAmount] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");

  // Load data when page, status filter, or debounced search changes
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.status, debouncedSearch]);

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

  // Reset page to 1 on filter change
  useEffect(() => { 
    setPage(1); 
  }, [filters.status, debouncedSearch]);

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // This will trigger the debounced search to update immediately
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

  // Calculate days of stay
  const calculateDaysOfStay = (checkIn: string, checkOut: string) => {
    if (!checkIn) return 1;
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    // If end is before start, clamp to start
    const effectiveEnd = end < start ? start : end;
    const diffTime = Math.abs(effectiveEnd.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(diffDays, 1);
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
              <title>Hotel Bill - ${editCheckout?.guest?.firstName} ${editCheckout?.guest?.lastName}</title>
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
                .bill-footer {
                  margin-top: 15px;
                  text-align: center;
                  border-top: 1px solid #ccc;
                  padding-top: 8px;
                  font-size: 11px;
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
                        <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => { setDetailsCheckout(checkout); setShowDetails(true); }}>
                          {checkout.guest ? `${checkout.guest.firstName} ${checkout.guest.lastName}` : "-"}
                          <div className="text-xs text-gray-500">{checkout.guest?.email}</div>
                          {checkout.guest?.phone && (
                            <div className="text-xs text-gray-500">{checkout.guest.phone}</div>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => { setDetailsCheckout(checkout); setShowDetails(true); }}>
                          {checkout.rooms && checkout.rooms.length > 0 
                            ? checkout.rooms.map((r: any) => `#${r.roomNumber}`).join(', ')
                            : "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap capitalize cursor-pointer" onClick={() => { setDetailsCheckout(checkout); setShowDetails(true); }}>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            checkout.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {checkout.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold cursor-pointer" onClick={() => { setDetailsCheckout(checkout); setShowDetails(true); }}>₹{checkout.totalBill?.toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs cursor-pointer" onClick={() => { setDetailsCheckout(checkout); setShowDetails(true); }}>{checkout.createdAt ? new Date(checkout.createdAt).toLocaleString() : ""}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            className="text-blue-600 hover:underline text-sm mr-3"
                            onClick={() => {
                              setDetailsCheckout(checkout);
                              setShowDetails(true);
                            }}
                          >
                            View
                          </button>
                          <button
                            className="text-green-600 hover:underline text-sm"
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

                {/* Rest of the modal and pagination code remains the same */}
                {/* ... */}
                
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
        </div>
      </div>
    </div>
  );
}