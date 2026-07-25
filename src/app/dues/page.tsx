"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getDueCustomers, recordGuestDueTransaction } from "@/lib/api";
import { DollarSign, Search, X, Phone, Calendar, History, Plus, Info, SlidersHorizontal } from "lucide-react";

interface DueTransaction {
  amount: number;
  paymentMethod: "cash" | "online" | "cheque";
  description?: string;
  date: string;
  createdBy?: string;
}

interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  existingCustomer?: boolean;
  dueAmount?: number;
  isCheckedOut?: boolean;
  checkInDate?: string;
  checkOutDate?: string;
  dueTransactions?: DueTransaction[];
  checkouts?: any[];
}

const getCurrentDateTimeLocal = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export default function DuesManagementPage() {
  const { user, loading } = useAuth();
  const [dueGuests, setDueGuests] = useState<Guest[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [notification, setNotification] = useState("");
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [transactionPayload, setTransactionPayload] = useState({
    amount: "",
    paymentMethod: "cash",
    date: getCurrentDateTimeLocal(),
    description: ""
  });

  const [filters, setFilters] = useState({ search: "", hasDue: "" });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRow = (id: string) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const hasActiveFilters = () => filters.search || filters.hasDue;

  const clearFilters = () => {
    setFilters({ search: "", hasDue: "" });
  };

  const filteredGuests = dueGuests.filter(g => {
    const name = `${g.firstName} ${g.lastName}`.toLowerCase();
    const phone = (g.phone || "").toLowerCase();
    const q = filters.search.toLowerCase();
    if (q && !name.includes(q) && !phone.includes(q)) return false;
    if (filters.hasDue === "true" && (!g.dueAmount || g.dueAmount <= 0)) return false;
    if (filters.hasDue === "false" && g.dueAmount && g.dueAmount > 0) return false;
    return true;
  });

  const loadDueCustomers = async () => {
    setLoadingData(true);
    setError("");
    try {
      const response = await getDueCustomers({ limit: 100 });
      if (!response) { setDueGuests([]); return; }
      if (response.success && Array.isArray(response.data)) setDueGuests(response.data);
      else if (Array.isArray(response)) setDueGuests(response);
      else setDueGuests(response.data || []);
    } catch (err: any) {
      const message = err?.message || "Failed to load due customers.";
      if (typeof window !== 'undefined' && /(not authenticated|unauthorized|401|403)/i.test(message)) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setError(message);
    } finally { setLoadingData(false); }
  };

  useEffect(() => {
    if (!loading && !user) { window.location.href = '/login'; return; }
    if (!loading && user) loadDueCustomers();
  }, [loading, user]);

  const openTransactionModal = (guest: Guest) => {
    setSelectedGuest(guest);
    setTransactionPayload({ amount: guest.dueAmount ? guest.dueAmount.toString() : "", paymentMethod: "cash", date: getCurrentDateTimeLocal(), description: "" });
    setShowTransactionModal(true);
  };

  const openHistoryModal = (guest: Guest) => {
    setSelectedGuest(guest);
    setShowHistoryModal(true);
  };

  const handleTransactionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedGuest) return;
    setError("");
    try {
      const amount = parseFloat(transactionPayload.amount || "0");
      if (isNaN(amount) || amount <= 0) throw new Error("Enter a valid payment amount.");
      const description = transactionPayload.description?.trim();
      if (!description) throw new Error("Description is required.");
      const selectedDate = new Date(transactionPayload.date);
      const now = new Date();
      if (isNaN(selectedDate.getTime())) throw new Error("Enter a valid payment date.");
      if (selectedDate > now) throw new Error("Payment date cannot be in the future.");
      const response = await recordGuestDueTransaction(selectedGuest._id, {
        amount, paymentMethod: transactionPayload.paymentMethod as any, description, date: transactionPayload.date
      });
      if (response && response.success) {
        setNotification("Payment recorded successfully.");
        setShowTransactionModal(false);
        setSelectedGuest(null);
        loadDueCustomers();
      } else {
        throw new Error(response?.message || "Failed to record payment.");
      }
    } catch (err: any) { setError(err.message || "Failed to record due payment."); }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "रु0";
    return `रु${value.toLocaleString()}`;
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    try { return format(new Date(value), "MMM dd, yyyy h:mm a"); }
    catch { return value; }
  };

  const Modal = ({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode }) => show ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full bg-card rounded-xl shadow-elevated animate-scale-in overflow-hidden border border-border max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-card z-10">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  ) : null;

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    </DashboardLayout>
  );
  if (!user) return null;

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-5">

        <div className="bg-card rounded-xl border border-border p-3">
          {/* Mobile row: search + filter toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                placeholder="Search guests..."
                data-cy="dues-search"
              />
              {filters.search && (
                <button
                  onClick={() => setFilters(f => ({ ...f, search: "" }))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`h-9 w-9 flex items-center justify-center rounded-lg border transition-all shrink-0 ${showMobileFilters ? 'bg-primary text-white border-primary' : 'bg-muted/50 border-input text-muted-foreground hover:text-foreground'}`}
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              onClick={() => window.location.href = '/guests'}
              className="shrink-0 h-9 px-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile filter panel */}
          {showMobileFilters && (
            <div className="mt-3 space-y-2 md:hidden">
              <select
                value={filters.hasDue}
                onChange={(e) => setFilters(f => ({ ...f, hasDue: e.target.value }))}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm max-w-full truncate"
              >
                <option value="">All Guests</option>
                <option value="true">Has Due</option>
                <option value="false">No Due</option>
              </select>
              {hasActiveFilters() && (
                <button onClick={clearFilters} className="text-xs font-medium text-primary hover:text-primary/80">
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Desktop: scrollable filters + fixed actions */}
          <div className="hidden md:flex items-start gap-3">
            <div className="flex items-center gap-3 flex-nowrap overflow-x-auto flex-1 min-w-0">
              <div className="relative flex-1 min-w-[160px] max-w-xs shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
                  className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                  placeholder="Search guests..."
                  data-cy="dues-search"
                />
                {filters.search && (
                  <button
                    onClick={() => setFilters(f => ({ ...f, search: "" }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                    data-cy="dues-search-clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <select
                value={filters.hasDue}
                onChange={(e) => setFilters(f => ({ ...f, hasDue: e.target.value }))}
                className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[110px] shrink-0"
                data-cy="dues-filter"
              >
                <option value="">All Guests</option>
                <option value="true">Has Due</option>
                <option value="false">No Due</option>
              </select>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {hasActiveFilters() && (
                <button onClick={clearFilters} className="text-xs font-medium text-primary hover:text-primary/80 shrink-0 whitespace-nowrap">
                  Clear
                </button>
              )}
              <Button variant="outline" size="sm" onClick={loadDueCustomers} disabled={loadingData}>
                <div className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </div>
              </Button>
              <Button
                size="sm"
                onClick={() => window.location.href = '/guests'}
                data-cy="dues-add-btn"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">New Guest</span>
              </Button>
            </div>
          </div>
        </div>

        {notification && (
          <div className="bg-emerald-100 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="text-sm">{notification}</span>
            <button onClick={() => setNotification("")} className="p-1 hover:bg-emerald-200 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:bg-destructive/10 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Guest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Stay</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Last Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGuests.length === 0 && !loadingData ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <DollarSign className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-muted-foreground">{hasActiveFilters() ? 'No dues match your filters.' : 'No outstanding dues found.'}</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredGuests.map((guest) => (
                  <React.Fragment key={guest._id}>
                    <tr className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <span className="md:hidden inline-flex items-center">
                            <button
                              onClick={() => toggleRow(guest._id)}
                              className="p-0.5 rounded text-muted-foreground hover:text-foreground"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </span>
                          <div>
                            <div className="text-sm font-medium text-foreground">{guest.firstName} {guest.lastName}</div>
                            <div className="text-xs text-muted-foreground">{guest.existingCustomer ? 'Existing Customer' : 'Guest'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm hidden md:table-cell">
                        <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-muted-foreground" />{guest.phone}</div>
                        {guest.email && <div className="text-muted-foreground text-xs mt-0.5">{guest.email}</div>}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground hidden lg:table-cell">
                        <div>In: {guest.checkInDate ? formatDate(guest.checkInDate) : '-'}</div>
                        <div>Out: {guest.checkOutDate ? formatDate(guest.checkOutDate) : '-'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-destructive">
                        {formatCurrency(guest.dueAmount)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground hidden md:table-cell">
                        {guest.dueTransactions && guest.dueTransactions.length > 0 ? formatDate(guest.dueTransactions[0].date) : 'No payments'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openTransactionModal(guest)} data-cy="dues-record-payment" className="text-sm font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1">
                            <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Record</span> Payment
                          </button>
                          <button onClick={() => openHistoryModal(guest)} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                            <History className="w-3.5 h-3.5" /> <span className="hidden sm:inline">History</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRows[guest._id] && (
                      <tr className="md:hidden">
                        <td colSpan={6} className="px-4 py-3 bg-muted/20">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="col-span-2 break-words min-w-0"><span className="text-muted-foreground">Phone:</span> {guest.phone}</div>
                            {guest.email && <div className="col-span-2 break-words min-w-0"><span className="text-muted-foreground">Email:</span> {guest.email}</div>}
                            <div className="break-words min-w-0"><span className="text-muted-foreground">Check-in:</span> {guest.checkInDate ? formatDate(guest.checkInDate) : '-'}</div>
                            <div className="break-words min-w-0"><span className="text-muted-foreground">Check-out:</span> {guest.checkOutDate ? formatDate(guest.checkOutDate) : '-'}</div>
                            <div className="col-span-2 break-words min-w-0"><span className="text-muted-foreground">Last Payment:</span> {guest.dueTransactions && guest.dueTransactions.length > 0 ? formatDate(guest.dueTransactions[0].date) : 'No payments'}</div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {loadingData && (
            <div className="px-4 py-3 border-t border-border bg-primary/5 text-sm text-primary flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              Loading dues...
            </div>
          )}
          {filteredGuests.length > 0 && (
            <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
              Showing {filteredGuests.length} of {dueGuests.length} guest(s)
              {hasActiveFilters() && (
                <button onClick={clearFilters} className="ml-2 text-primary hover:text-primary/80">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        <Modal show={showTransactionModal} onClose={() => setShowTransactionModal(false)} title="Record Payment">
          <form onSubmit={handleTransactionSubmit} className="p-5 space-y-4">
            <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">Guest:</span> <span className="font-medium">{selectedGuest?.firstName} {selectedGuest?.lastName}</span></p>
              <p><span className="text-muted-foreground">Outstanding:</span> <span className="font-semibold text-destructive">{formatCurrency(selectedGuest?.dueAmount)}</span></p>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Amount</label>
              <input type="number" step="0.01" min="0" value={transactionPayload.amount}
                onChange={(e) => setTransactionPayload({ ...transactionPayload, amount: e.target.value })}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Method</label>
              <select value={transactionPayload.paymentMethod}
                onChange={(e) => setTransactionPayload({ ...transactionPayload, paymentMethod: e.target.value as any })}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all max-w-full truncate">
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Payment Date</label>
              <input type="datetime-local" value={transactionPayload.date}
                onChange={(e) => setTransactionPayload({ ...transactionPayload, date: e.target.value })}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Description <span className="text-destructive">*</span></label>
              <textarea value={transactionPayload.description}
                onChange={(e) => setTransactionPayload({ ...transactionPayload, description: e.target.value })}
                className="w-full px-3 py-2 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all" rows={3} required />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setShowTransactionModal(false)}>Cancel</Button>
              <Button type="submit" data-cy="dues-save-payment">Save Payment</Button>
            </div>
          </form>
        </Modal>

        <Modal show={showHistoryModal} onClose={() => setShowHistoryModal(false)} title={`Payment History - ${selectedGuest?.firstName} ${selectedGuest?.lastName}`}>
          <div className="p-5 space-y-3">
            {selectedGuest?.dueTransactions && selectedGuest.dueTransactions.length > 0 ? (
              selectedGuest.dueTransactions.map((tx, idx) => (
                <div key={`${selectedGuest._id}-${idx}`} className="border border-border rounded-lg p-4 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <div className="font-semibold text-foreground">{formatCurrency(tx.amount)}</div>
                    <Badge variant="secondary" className="text-xs rounded px-2 py-0.5 font-normal capitalize">{tx.paymentMethod}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(tx.date)}</div>
                  {tx.description && <div className="text-sm text-foreground/70 mt-1">Note: {tx.description}</div>}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">No payment history available.</div>
            )}
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
}
