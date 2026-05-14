"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { format } from "date-fns";
import { getDueCustomers, recordGuestDueTransaction } from "@/lib/api";

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
  const { user, loading, logout } = useAuth();
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

  const loadDueCustomers = async () => {
    setLoadingData(true);
    setError("");
    try {
      const response = await getDueCustomers({ limit: 100 });
      if (!response) {
        setDueGuests([]);
        return;
      }
      if (response.success && Array.isArray(response.data)) {
        setDueGuests(response.data);
      } else if (Array.isArray(response)) {
        setDueGuests(response);
      } else {
        setDueGuests(response.data || []);
      }
    } catch (err: any) {
      const message = err?.message || "Failed to load due customers.";
      if (typeof window !== 'undefined' && /(not authenticated|unauthorized|401|403)/i.test(message)) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      setError(message);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/login';
      return;
    }
    if (!loading && user) {
      loadDueCustomers();
    }
  }, [loading, user]);

  const openTransactionModal = (guest: Guest) => {
    setSelectedGuest(guest);
    setTransactionPayload({
      amount: guest.dueAmount ? guest.dueAmount.toString() : "",
      paymentMethod: "cash",
      date: getCurrentDateTimeLocal(),
      description: ""
    });
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
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Enter a valid payment amount.");
      }

      const description = transactionPayload.description?.trim();
      if (!description) {
        throw new Error("Description is required.");
      }

      const selectedDate = new Date(transactionPayload.date);
      const now = new Date();
      if (isNaN(selectedDate.getTime())) {
        throw new Error("Enter a valid payment date.");
      }
      if (selectedDate > now) {
        throw new Error("Payment date cannot be in the future.");
      }

      const transaction = {
        amount,
        paymentMethod: transactionPayload.paymentMethod,
        description,
        date: transactionPayload.date
      };

      const response = await recordGuestDueTransaction(selectedGuest._id, transaction);
      if (response && response.success) {
        setNotification("Payment recorded successfully.");
        setShowTransactionModal(false);
        setSelectedGuest(null);
        loadDueCustomers();
      } else {
        throw new Error(response?.message || "Failed to record payment.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to record due payment.");
    }
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return "रु0";
    return `रु${value.toLocaleString()}`;
  };

  const formatDate = (value?: string) => {
    if (!value) return "-";
    try {
      return format(new Date(value), "MMM dd, yyyy h:mm a");
    } catch {
      return value;
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar
        user={user}
        showUserMenu={false}
        setShowUserMenu={() => {}}
        logout={logout}
      />
      <div className="max-w-9xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Dues Management</h1>
            <p className="text-sm text-gray-600 mt-2">Manage outstanding dues for existing customers and record payments with logs.</p>
          </div>
          <div className="space-x-2">
            <button
              onClick={loadDueCustomers}
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Refresh
            </button>
            <button
              onClick={() => window.location.href = '/guests'}
              className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg hover:bg-gray-50 transition"
            >
              Go to Guests
            </button>
          </div>
        </div>

        {notification && (
          <div className="bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {notification}
            <button onClick={() => setNotification("")} className="float-right font-semibold">×</button>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
            <button onClick={() => setError("")} className="float-right font-semibold">×</button>
          </div>
        )}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stay</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Due</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dueGuests.length === 0 && !loadingData ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      No existing customers with outstanding dues found.
                    </td>
                  </tr>
                ) : dueGuests.map((guest) => (
                  <tr key={guest._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{guest.firstName} {guest.lastName}</div>
                      <div className="text-sm text-gray-500">{guest.existingCustomer ? 'Existing Customer' : 'Guest'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{guest.phone}</div>
                      {guest.email && <div className="text-gray-500">{guest.email}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>In: {guest.checkInDate ? formatDate(guest.checkInDate) : '-'}</div>
                      <div>Out: {guest.checkOutDate ? formatDate(guest.checkOutDate) : '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-700">
                      {formatCurrency(guest.dueAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {guest.dueTransactions && guest.dueTransactions.length > 0
                        ? formatDate(guest.dueTransactions[0].date)
                        : 'No payments yet'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => openTransactionModal(guest)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Record Payment
                      </button>
                      <button
                        onClick={() => openHistoryModal(guest)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View History
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loadingData && (
            <div className="px-6 py-4 bg-blue-50 text-blue-700">Loading dues...</div>
          )}
        </div>

        {showTransactionModal && selectedGuest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-xl p-6 shadow-lg overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Record Payment</h2>
                  <p className="text-sm text-gray-600">{selectedGuest.firstName} {selectedGuest.lastName}</p>
                  <p className="text-sm text-gray-600">Outstanding due: {formatCurrency(selectedGuest.dueAmount)}</p>
                </div>
                <button onClick={() => setShowTransactionModal(false)} className="text-gray-500 hover:text-gray-800">×</button>
              </div>
              <form onSubmit={handleTransactionSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={transactionPayload.amount}
                    onChange={(e) => setTransactionPayload({ ...transactionPayload, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Enter paid amount"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Method</label>
                  <select
                    value={transactionPayload.paymentMethod}
                    onChange={(e) => setTransactionPayload({ ...transactionPayload, paymentMethod: e.target.value as any })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="cheque">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Payment Date</label>
                  <input
                    type="datetime-local"
                    value={transactionPayload.date}
                    onChange={(e) => setTransactionPayload({ ...transactionPayload, date: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                <label className="block text-sm font-medium mb-1">
                  Description <span className="text-red-600">*</span>
                </label>
                <textarea
                  value={transactionPayload.description}
                  onChange={(e) => setTransactionPayload({ ...transactionPayload, description: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={3}
                  placeholder="Add a description or note"
                  required
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTransactionModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showHistoryModal && selectedGuest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg w-full max-w-3xl p-6 shadow-lg overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Payment History</h2>
                  <p className="text-sm text-gray-600">{selectedGuest.firstName} {selectedGuest.lastName}</p>
                </div>
                <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 hover:text-gray-800">×</button>
              </div>
              <div className="space-y-4">
                {selectedGuest.dueTransactions && selectedGuest.dueTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {selectedGuest.dueTransactions.map((tx, idx) => (
                      <div key={`${selectedGuest._id}-${idx}`} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <div className="font-semibold text-gray-900">{formatCurrency(tx.amount)}</div>
                          <div className="text-sm text-gray-500">{formatDate(tx.date)}</div>
                        </div>
                        <div className="text-sm text-gray-700">Method: {tx.paymentMethod}</div>
                        {tx.description && (
                          <div className="text-sm text-gray-600 mt-1">Note: {tx.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">No payment history available.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
