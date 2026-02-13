"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { format } from "date-fns";

interface Referrer {
  _id: string;
  fullName: string;
  address?: string;
  idNo?: string;
  taxiNo?: string;
  referralPrice: number;
  totalAmountToReceive: number;
  totalAmountReceived: number;
  status: 'active' | 'inactive' | 'paid';
  hotel: string;
  createdBy: string;
  lastPaymentDate?: string;
  guestsReferred: Array<{
    guestId: string;
    guestName: string;
    checkInDate: string;
    amountEarned: number;
    isPaid: boolean;
    paymentDate?: string;
    expenditureId?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ReferrerForm {
  fullName: string;
  address: string;
  idNo: string;
  taxiNo: string;
  referralPrice: string;
}

interface PaymentForm {
  paymentMethod: 'cash' | 'online';
  paymentDate: string;
  notes: string;
  guestIndex?: number;
}

const navLinks = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Checkouts", href: "/checkouts" },
  { label: "Guests", href: "/guests" },
  { label: "Referrers", href: "/referrers" },
  { label: "Hotels", href: "/hotels" },
  { label: "Items", href: "/items" },
  { label: "Orders", href: "/orders" },
  { label: "Rooms", href: "/rooms" },
  { label: "Users", href: "/users" },
];

export default function ReferrersPage() {
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
      const handleStorage = (event: StorageEvent) => {

        if (event.key === 'hotel') {
          setHotel(event.newValue ? JSON.parse(event.newValue) : null);
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }, []);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [editingReferrer, setEditingReferrer] = useState<Referrer | null>(null);
  const [payingReferrer, setPayingReferrer] = useState<Referrer | null>(null);
  const [formData, setFormData] = useState<ReferrerForm>({
    fullName: "",
    address: "",
    idNo: "",
    taxiNo: "",
    referralPrice: "0"
  });
  const [paymentFormData, setPaymentFormData] = useState<PaymentForm>({
    paymentMethod: "cash",
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ""
  });
  const [formLoading, setFormLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [filters, setFilters] = useState({
    status: "",
    search: ""
  });
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalReferrers, setTotalReferrers] = useState(0);

  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRequestHeaders = (token: string) => {
    return {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const loadReferrers = useCallback(async (resetPage = false, customFilters?: typeof filters) => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");

      const currentFilters = customFilters || filters;
      const currentPage = resetPage ? 1 : page;

      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', limit.toString());

      if (currentFilters.status) queryParams.append('status', currentFilters.status);
      if (currentFilters.search) queryParams.append('search', currentFilters.search);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/referrers?${queryParams.toString()}`, {
        headers: getRequestHeaders(token),
      });

      if (!response.ok) throw new Error("Failed to fetch referrers");

      const data = await response.json();

      if (data.success && Array.isArray(data.data)) {
        setReferrers(data.data);
        setTotalReferrers(data.pagination?.total || data.data.length);
        setTotalPages(data.pagination?.pages || Math.ceil((data.pagination?.total || data.data.length) / limit));
      } else {
        setReferrers([]);
        setTotalReferrers(0);
        setTotalPages(0);
      }

      if (resetPage) {
        setPage(1);
      }
    } catch (e: any) {
      setError(e.message);
      setReferrers([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterKey]: value }));
    loadReferrers(true, { ...filters, [filterKey]: value });
  };

  const clearFilters = () => {
    setFilters({ status: "", search: "" });
    loadReferrers(true, { status: "", search: "" });
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      address: "",
      idNo: "",
      taxiNo: "",
      referralPrice: "0"
    });
    setEditingReferrer(null);
    setShowForm(false);
  };

  const resetPaymentForm = () => {
    setPaymentFormData({
      paymentMethod: "cash",
      paymentDate: new Date().toISOString().split('T')[0],
      notes: ""
    });
    setPayingReferrer(null);
    setShowPaymentForm(false);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.fullName.trim()) {
      errors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 3) {
      errors.fullName = "Full name must be at least 3 characters long";
    }

    if (formData.address && formData.address.trim().length > 0 && formData.address.trim().length < 5) {
      errors.address = "Address length must be at least 5 characters long";
    }

    if (!formData.referralPrice || parseFloat(formData.referralPrice) <= 0) {
      errors.referralPrice = "Referral price must be greater than 0";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setNotification({ type: 'error', message: 'Please fix validation errors' });
      return;
    }

    setFormLoading(true);
    setFormErrors({});
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");

      const payload = {
        fullName: formData.fullName,
        address: formData.address || undefined,
        idNo: formData.idNo || undefined,
        taxiNo: formData.taxiNo || undefined,
        referralPrice: parseFloat(formData.referralPrice)
      };

      let response;
      if (editingReferrer) {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/referrers/${editingReferrer._id}`, {
          method: 'PUT',
          headers: getRequestHeaders(token),
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/referrers`, {
          method: 'POST',
          headers: getRequestHeaders(token),
          body: JSON.stringify(payload)
        });
      }

      const responseData = await response.json();

      if (!response.ok) {
        // Handle API validation errors
        if (responseData.details) {
          // Parse validation error from details field
          const errorMessage = responseData.details;
          const fieldMatch = errorMessage.match(/"(\w+)"/);  // Extract field name from quotes
          if (fieldMatch) {
            const fieldName = fieldMatch[1];
            setFormErrors({ [fieldName]: errorMessage });
          }
          setNotification({ type: 'error', message: responseData.message || 'Validation error' });
        } else {
          setNotification({ type: 'error', message: responseData.message || 'Failed to save referrer' });
        }
        return;
      }

      const result = responseData;
      await loadReferrers();
      resetForm();
      setNotification({ type: 'success', message: result.message || 'Referrer saved successfully' });
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message });
    } finally {
      setFormLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token || !payingReferrer) throw new Error("No authentication token or referrer");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/referrers/${payingReferrer._id}/pay`, {
        method: 'POST',
        headers: getRequestHeaders(token),
        body: JSON.stringify(paymentFormData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to process payment');
      }

      const result = await response.json();
      await loadReferrers();
      resetPaymentForm();
      setNotification({ type: 'success', message: result.message || 'Payment processed successfully' });
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message });
    } finally {
      setPaymentLoading(false);
    }
  };

  const handleEdit = (referrer: Referrer) => {
    setEditingReferrer(referrer);
    setFormData({
      fullName: referrer.fullName,
      address: referrer.address || "",
      idNo: referrer.idNo || "",
      taxiNo: referrer.taxiNo || "",
      referralPrice: referrer.referralPrice.toString()
    });
    setShowForm(true);
  };

  const handlePayment = (referrer: Referrer) => {
    setPayingReferrer(referrer);
    setShowPaymentForm(true);
  };

  const handleStatusChange = async (referrerId: string, newStatus: 'active' | 'inactive' | 'paid') => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/referrers/${referrerId}`, {
        method: 'PUT',
        headers: getRequestHeaders(token),
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error("Failed to update status");

      await loadReferrers();
      setNotification({ type: 'success', message: 'Status updated successfully' });
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message });
    }
  };

  const handleDelete = async (referrerId: string) => {
    if (!confirm("Are you sure you want to delete this referrer? This action cannot be undone.")) {
      return;
    }

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/referrers/${referrerId}`, {
        method: 'DELETE',
        headers: getRequestHeaders(token)
      });

      if (!response.ok) throw new Error("Failed to delete referrer");

      await loadReferrers();
      setNotification({ type: 'success', message: 'Referrer deleted successfully' });
    } catch (e: any) {
      setNotification({ type: 'error', message: e.message });
    }
  };

  useEffect(() => {
    loadReferrers();
  }, [page]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const generatePaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          «
        </button>
      );
      buttons.push(
        <button
          key="prev"
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          ‹
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => setPage(i)}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            page === i
              ? 'text-white bg-blue-600 border border-blue-600'
              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      buttons.push(
        <button
          key="next"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          ›
        </button>
      );
      buttons.push(
        <button
          key="last"
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
        >
          »
        </button>
      );
    }

    return buttons;
  };

  if (loading && referrers.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <NavBar user={user} showUserMenu={showUserMenu} setShowUserMenu={setShowUserMenu} logout={logout} navLinks={navLinks} nepaliFlag={hotel?.nepaliFlag} />
        <div className="max-w-9xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        navLinks={navLinks}
        nepaliFlag={hotel?.nepaliFlag}
      />

      <div className="max-w-9xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Referrers Management</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Referrer
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError("")} className="float-right">×</button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button onClick={clearFilters} className="text-blue-600 hover:text-blue-800 underline text-sm">
              Clear Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Search</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search by name, taxi no, ID..."
              />
            </div>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-blue-600">{totalReferrers}</div>
            <div className="text-sm text-gray-600">Total Referrers</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-green-600">
              {referrers.filter(r => r.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {referrers.reduce((sum, r) => sum + r.totalAmountToReceive, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Amount to Receive</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow text-center">
            <div className="text-2xl font-bold text-purple-600">
              {referrers.reduce((sum, r) => sum + r.totalAmountReceived, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Amount Received</div>
          </div>
        </div>

        {/* Referrers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referrer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Financials</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {referrers.map((referrer) => (
                  <tr key={referrer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{referrer.fullName}</div>
                      <div className="text-sm text-gray-500">रु{referrer.referralPrice}/guest</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {referrer.taxiNo && <div>Taxi: {referrer.taxiNo}</div>}
                        {referrer.idNo && <div>ID: {referrer.idNo}</div>}
                        {referrer.address && <div className="truncate max-w-xs">{referrer.address}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-green-600">Received: रु{referrer.totalAmountReceived.toLocaleString()}</div>
                        <div className="text-blue-600">Pending: रु{referrer.totalAmountToReceive.toLocaleString()}</div>
                        <div className="text-gray-600">Total: रु{(referrer.totalAmountReceived + referrer.totalAmountToReceive).toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={referrer.status}
                        onChange={(e) => handleStatusChange(referrer._id, e.target.value as 'active' | 'inactive' | 'paid')}
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          referrer.status === 'active' ? 'bg-green-100 text-green-800' :
                          referrer.status === 'paid' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div>Total: {referrer.guestsReferred.length}</div>
                        <div>Paid: {referrer.guestsReferred.filter(g => g.isPaid).length}</div>
                        <div>Pending: {referrer.guestsReferred.filter(g => !g.isPaid).length}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => handleEdit(referrer)}
                        className="text-indigo-600 hover:text-indigo-900 text-sm"
                      >
                        Edit
                      </button>
                      {referrer.totalAmountToReceive > 0 && (
                        <button
                          onClick={() => handlePayment(referrer)}
                          className="text-green-600 hover:text-green-900 text-sm"
                        >
                          Pay
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(referrer._id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing {referrers.length} of {totalReferrers} referrers
                </div>
                <div className="flex space-x-2">
                  {generatePaginationButtons()}
                </div>
              </div>
            </div>
          )}

          {referrers.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500">No referrers found</div>
            </div>
          )}
        </div>

        {/* Add/Edit Referrer Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">
                {editingReferrer ? "Edit Referrer" : "Add New Referrer"}
              </h2>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${formErrors.fullName ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    required
                  />
                  {formErrors.fullName && <p className="text-red-600 text-sm mt-1">{formErrors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${formErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    rows={2}
                  />
                  {formErrors.address && <p className="text-red-600 text-sm mt-1">{formErrors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">ID Number</label>
                  <input
                    type="text"
                    value={formData.idNo}
                    onChange={(e) => setFormData({ ...formData, idNo: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${formErrors.idNo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {formErrors.idNo && <p className="text-red-600 text-sm mt-1">{formErrors.idNo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Taxi Number</label>
                  <input
                    type="text"
                    value={formData.taxiNo}
                    onChange={(e) => setFormData({ ...formData, taxiNo: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${formErrors.taxiNo ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {formErrors.taxiNo && <p className="text-red-600 text-sm mt-1">{formErrors.taxiNo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Referral Price (रु) *</label>
                  <input
                    type="number"
                    value={formData.referralPrice}
                    onChange={(e) => setFormData({ ...formData, referralPrice: e.target.value })}
                    className={`w-full border rounded px-3 py-2 ${formErrors.referralPrice ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    min="0"
                    step="0.01"
                    required
                  />
                  {formErrors.referralPrice && <p className="text-red-600 text-sm mt-1">{formErrors.referralPrice}</p>}
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
                  >
                    {formLoading ? "Saving..." : editingReferrer ? "Update" : "Add Referrer"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentForm && payingReferrer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold mb-4">Process Payment</h2>
              <div className="mb-4">
                <h3 className="font-semibold">{payingReferrer.fullName}</h3>
                <p>Amount to receive: रु{payingReferrer.totalAmountToReceive.toLocaleString()}</p>
                <p>Pending referrals: {payingReferrer.guestsReferred.filter(g => !g.isPaid).length}</p>
              </div>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method *</label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value as 'cash' | 'online' })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentFormData.paymentDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={resetPaymentForm}
                    className="px-4 py-2 border border-gray-300 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                  >
                    {paymentLoading ? "Processing..." : "Process Payment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white ${
            notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
}