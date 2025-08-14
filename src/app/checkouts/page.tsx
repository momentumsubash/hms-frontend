"use client";

import { getCheckouts } from "@/lib/api";
import { updateCheckoutPayment } from "@/lib/checkoutApi";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";


export default function CheckoutsPage() {
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const { user, loading: userLoading } = useAuth();
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
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalCount: 0 });
  const [showEdit, setShowEdit] = useState(false);
  const [editCheckout, setEditCheckout] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);
  const [detailsCheckout, setDetailsCheckout] = useState<any>(null);
  const [editVatPercent, setEditVatPercent] = useState<string>("");
  const [editVatAmount, setEditVatAmount] = useState<string>("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await getCheckouts(params);
      setCheckouts(res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 10, totalPages: 1, totalCount: 0 });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 on filter change
  useEffect(() => { setPage(1); }, [filters]);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center space-x-6">
            <span className="font-bold text-xl text-primary">Hotel HMS</span>
            <div className="flex space-x-4">
              {(!userLoading && user) && navLinks.filter(link => !link.superAdminOnly || user.role === "super_admin").map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-primary font-medium px-3 py-2 rounded transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Checkouts Management</h1>
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
        <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
          <div className="overflow-x-auto">
            {checkouts.length > 0 ? (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
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
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => { setDetailsCheckout(checkout); setShowDetails(true); }}>
                          {checkout.room ? `#${checkout.room.roomNumber} (${checkout.room.type})` : "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap capitalize cursor-pointer" onClick={() => { setDetailsCheckout(checkout); setShowDetails(true); }}>{checkout.status}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold cursor-pointer" onClick={() => { setDetailsCheckout(checkout); setShowDetails(true); }}>₹{checkout.totalBill}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs cursor-pointer" onClick={() => { setDetailsCheckout(checkout); setShowDetails(true); }}>{checkout.createdAt ? new Date(checkout.createdAt).toLocaleString() : ""}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            className="text-blue-600 hover:underline text-sm"
                            onClick={() => {
                              setEditCheckout(checkout);
                              setEditStatus(checkout.status);
                              setEditVatPercent(checkout.vatPercent?.toString() || "");
                              setEditVatAmount(checkout.vatAmount?.toString() || "");
                              setShowEdit(true);
                              setEditError("");
                            }}
                          >Edit</button>
                        </td>
                      </tr>
                    ))}
      {/* Edit Checkout Modal */}
      {showEdit && editCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Edit Checkout</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setEditLoading(true);
                setEditError("");
                try {
                  await updateCheckoutPayment(editCheckout.room?.roomNumber || "", editStatus, editVatPercent, editVatAmount);
                  setShowEdit(false);
                  setEditCheckout(null);
                  await loadData();
                } catch (e: any) {
                  setEditError(e.message || "Failed to update checkout");
                } finally {
                  setEditLoading(false);
                }
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium mb-1">Room Number</label>
                <input
                  type="text"
                  value={editCheckout.room?.roomNumber || ""}
                  disabled
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  disabled={editLoading}
                >
                  {editCheckout.status === "completed" ? (
                    <>
                      <option value="completed">Completed</option>
                      <option value="pending">Pending</option>
                    </>
                  ) : (
                    <>
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">VAT Percent</label>
                <input
                  type="number"
                  value={editVatPercent}
                  onChange={e => setEditVatPercent(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="0"
                  step="0.01"
                  disabled={editLoading}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">VAT Amount</label>
                <input
                  type="number"
                  value={editVatAmount}
                  onChange={e => setEditVatAmount(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  min="0"
                  step="0.01"
                  disabled={editLoading}
                />
              </div>
              {editError && <div className="text-red-600 text-sm">{editError}</div>}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEdit(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={editLoading}
                >Cancel</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={editLoading}
                >{editLoading ? "Saving..." : "Update Checkout"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Checkout Details Modal */}
      {showDetails && detailsCheckout && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Checkout Details</h2>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Room Info</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="font-medium">Room Number:</span> {detailsCheckout.room?.roomNumber || '-'}</div>
                <div><span className="font-medium">Type:</span> {detailsCheckout.room?.type || '-'}</div>
                <div><span className="font-medium">Occupied:</span> {detailsCheckout.room?.isOccupied ? 'Yes' : 'No'}</div>
                <div><span className="font-medium">Hotel:</span> {detailsCheckout.hotel?.name || '-'}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Orders</h3>
              {detailsCheckout.orders && detailsCheckout.orders.length > 0 ? (
                <table className="min-w-full text-sm border">
                  <thead>
                    <tr>
                      <th className="border px-2 py-1">Order ID</th>
                      <th className="border px-2 py-1">Items</th>
                      <th className="border px-2 py-1">Total</th>
                      <th className="border px-2 py-1">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailsCheckout.orders.map((order: any) => (
                      <tr key={order._id}>
                        <td className="border px-2 py-1">{order._id}</td>
                        <td className="border px-2 py-1">
                          {order.items && order.items.length > 0 ? (
                            <ul>
                              {order.items.map((item: any, idx: number) => (
                                <li key={idx}>{item.name} x{item.quantity} (₹{item.price})</li>
                              ))}
                            </ul>
                          ) : '-'}
                        </td>
                        <td className="border px-2 py-1">₹{order.totalAmount}</td>
                        <td className="border px-2 py-1">{order.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>No orders found for this checkout.</div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setShowDetails(false)}
              >Close</button>
            </div>
          </div>
        </div>
      )}
                  </tbody>
                </table>
                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                      className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                      onClick={() => setPage(page - 1)}
                      disabled={pagination.page === 1}
                    >Prev</button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={`px-3 py-1 rounded border ${pagination.page === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'}`}
                        onClick={() => setPage(i + 1)}
                      >{i + 1}</button>
                    ))}
                    <button
                      className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                      onClick={() => setPage(page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >Next</button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">No checkouts found matching your criteria.</div>
              </div>
            )}
          </div>
        </div>
  {/* Checkout Details Modal removed */}
      </div>
    </div>
  );
}

