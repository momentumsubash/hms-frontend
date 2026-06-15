"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { format } from "date-fns";
import { Search, X, Edit, Trash2, Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PaginationControls } from "@/components/ui/pagination-controls";

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

// const navLinks = [
//   { label: "Dashboard", href: "/dashboard" },
//   { label: "Checkouts", href: "/checkouts" },
//   { label: "Guests", href: "/guests" },
//   { label: "Referrers", href: "/referrers" },
//   { label: "Hotels", href: "/hotels" },
//   { label: "Items", href: "/items" },
//   { label: "Orders", href: "/orders" },
//   { label: "Rooms", href: "/rooms" },
//   { label: "Users", href: "/users" },
// ];

export default function ReferrersPage() {
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



  if (loading && referrers.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading referrers...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-5">

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-5 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:bg-destructive/10 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                placeholder="Search by name, taxi no, ID..."
                data-cy="referrers-search"
              />
              {filters.search && (
                <button onClick={() => handleFilterChange('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[120px]"
              data-cy="referrers-status-filter"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="paid">Paid</option>
            </select>
            {(filters.search || filters.status) && (
              <button onClick={clearFilters} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0" data-cy="referrers-clear-filters">
                Clear
              </button>
            )}
            <Button onClick={() => setShowForm(true)} className="ml-auto shrink-0" data-cy="referrers-add-new">
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl shadow-sm p-4 text-center" data-cy="referrers-stat-total">
            <div className="text-2xl font-bold text-primary">{totalReferrers}</div>
            <div className="text-sm text-muted-foreground">Total Referrers</div>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4 text-center" data-cy="referrers-stat-active">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {referrers.filter(r => r.status === 'active').length}
            </div>
            <div className="text-sm text-muted-foreground">Active</div>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4 text-center" data-cy="referrers-stat-amount-to-receive">
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {referrers.reduce((sum, r) => sum + r.totalAmountToReceive, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Amount to Receive</div>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-sm p-4 text-center" data-cy="referrers-stat-amount-received">
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {referrers.reduce((sum, r) => sum + r.totalAmountReceived, 0).toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Amount Received</div>
          </div>
        </div>

        {/* Referrers Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border" data-cy="referrers-table">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Referrer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Financials</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Guests</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {referrers.map((referrer) => (
                  <tr key={referrer._id} className="hover:bg-muted/30 transition-colors" data-cy={`referrers-row-${referrer._id}`}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-foreground">{referrer.fullName}</div>
                      <div className="text-sm text-muted-foreground">रु{referrer.referralPrice}/guest</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground space-y-0.5">
                        {referrer.taxiNo && <div>Taxi: {referrer.taxiNo}</div>}
                        {referrer.idNo && <div>ID: {referrer.idNo}</div>}
                        {referrer.address && <div className="truncate max-w-xs text-muted-foreground">{referrer.address}</div>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm space-y-0.5">
                        <div className="text-emerald-600 dark:text-emerald-400">Received: रु{referrer.totalAmountReceived.toLocaleString()}</div>
                        <div className="text-primary">Pending: रु{referrer.totalAmountToReceive.toLocaleString()}</div>
                        <div className="text-muted-foreground">Total: रु{(referrer.totalAmountReceived + referrer.totalAmountToReceive).toLocaleString()}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={referrer.status}
                        onChange={(e) => handleStatusChange(referrer._id, e.target.value as 'active' | 'inactive' | 'paid')}
                        className={`text-xs font-medium px-2 py-1 rounded-lg border-0 cursor-pointer ${referrer.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
                            referrer.status === 'paid' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                              'bg-muted text-muted-foreground'
                          }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-foreground space-y-0.5">
                        <div>Total: {referrer.guestsReferred.length}</div>
                        <div>Paid: {referrer.guestsReferred.filter(g => g.isPaid).length}</div>
                        <div>Pending: {referrer.guestsReferred.filter(g => !g.isPaid).length}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleEdit(referrer)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Edit" data-cy={`referrers-edit-btn-${referrer._id}`}>
                          <Edit className="w-4 h-4" />
                        </button>
                        {referrer.totalAmountToReceive > 0 && (
                          <button onClick={() => handlePayment(referrer)} className="p-1.5 rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all" title="Pay" data-cy={`referrers-pay-btn-${referrer._id}`}>
                            <DollarSign className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(referrer._id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" title="Delete" data-cy={`referrers-delete-btn-${referrer._id}`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
          />

          {referrers.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">No referrers found</div>
            </div>
          )}
        </div>

        {/* Add/Edit Referrer Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-elevated animate-scale-in">
              <h2 className="text-2xl font-bold text-foreground mb-4">
                {editingReferrer ? "Edit Referrer" : "Add New Referrer"}
              </h2>
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${formErrors.fullName ? 'border-destructive bg-destructive/5' : 'border-input'}`}
                    required
                  />
                  {formErrors.fullName && <p className="text-destructive text-sm mt-1">{formErrors.fullName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${formErrors.address ? 'border-destructive bg-destructive/5' : 'border-input'}`}
                    rows={2}
                  />
                  {formErrors.address && <p className="text-destructive text-sm mt-1">{formErrors.address}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">ID Number</label>
                  <input
                    type="text"
                    value={formData.idNo}
                    onChange={(e) => setFormData({ ...formData, idNo: e.target.value })}
                    className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${formErrors.idNo ? 'border-destructive bg-destructive/5' : 'border-input'}`}
                  />
                  {formErrors.idNo && <p className="text-destructive text-sm mt-1">{formErrors.idNo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Taxi Number</label>
                  <input
                    type="text"
                    value={formData.taxiNo}
                    onChange={(e) => setFormData({ ...formData, taxiNo: e.target.value })}
                    className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${formErrors.taxiNo ? 'border-destructive bg-destructive/5' : 'border-input'}`}
                  />
                  {formErrors.taxiNo && <p className="text-destructive text-sm mt-1">{formErrors.taxiNo}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Referral Price (रु) *</label>
                  <input
                    type="number"
                    value={formData.referralPrice}
                    onChange={(e) => setFormData({ ...formData, referralPrice: e.target.value })}
                    className={`w-full bg-background border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring ${formErrors.referralPrice ? 'border-destructive bg-destructive/5' : 'border-input'}`}
                    min="0"
                    step="0.01"
                    required
                  />
                  {formErrors.referralPrice && <p className="text-destructive text-sm mt-1">{formErrors.referralPrice}</p>}
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-input bg-background text-foreground rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                    data-cy="referrers-form-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium"
                    data-cy="referrers-form-submit"
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
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md shadow-elevated animate-scale-in">
              <h2 className="text-2xl font-bold text-foreground mb-4">Process Payment</h2>
              <div className="mb-4 p-3 bg-muted/30 rounded-lg space-y-1">
                <h3 className="font-semibold text-foreground">{payingReferrer.fullName}</h3>
                <p className="text-sm text-muted-foreground">Amount to receive: <span className="text-foreground font-medium">रु{payingReferrer.totalAmountToReceive.toLocaleString()}</span></p>
                <p className="text-sm text-muted-foreground">Pending referrals: <span className="text-foreground font-medium">{payingReferrer.guestsReferred.filter(g => !g.isPaid).length}</span></p>
              </div>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Payment Method *</label>
                  <select
                    value={paymentFormData.paymentMethod}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentMethod: e.target.value as 'cash' | 'online' })}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Payment Date *</label>
                  <input
                    type="date"
                    value={paymentFormData.paymentDate}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, paymentDate: e.target.value })}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Notes</label>
                  <textarea
                    value={paymentFormData.notes}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, notes: e.target.value })}
                    className="w-full bg-background border border-input rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={resetPaymentForm}
                    className="px-4 py-2 border border-input bg-background text-foreground rounded-lg hover:bg-muted transition-colors text-sm font-medium"
                    data-cy="referrers-payment-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paymentLoading}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors text-sm font-medium"
                    data-cy="referrers-payment-submit"
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
          <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-elevated flex items-center gap-3 animate-slide-up ${
            notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-destructive text-destructive-foreground'
          }`}>
            <span className="text-sm font-medium flex-1">{notification.message}</span>
            <button onClick={() => setNotification(null)} className="p-0.5 hover:opacity-70 transition-opacity">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}