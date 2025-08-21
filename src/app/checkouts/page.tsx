"use client";

import { getCheckouts } from "@/lib/api";
import { updateCheckoutPayment, updateCheckout } from "@/lib/checkoutApi";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";

export default function CheckoutsPage() {
  // Pagination state
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
  
  // New states for enhanced edit modal
  const [clientVatNumber, setClientVatNumber] = useState<string>("");
  const [clientVatCompany, setClientVatCompany] = useState<string>("");
  const [clientVatAddress, setClientVatAddress] = useState<string>("");
  const [advanceAmount, setAdvanceAmount] = useState<string>("");
  const [checkInDate, setCheckInDate] = useState<string>("");
  const [checkOutDate, setCheckOutDate] = useState<string>("");

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
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => { setDetailsCheckout(checkout); setShowDetails(true); }}>
                          {checkout.rooms && checkout.rooms.length > 0 
                            ? checkout.rooms.map((r: any) => `#${r.roomNumber}`).join(', ')
                            : "-"}
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
                              setClientVatNumber(checkout.clientVatInfo?.vatNumber || "");
                              setClientVatCompany(checkout.clientVatInfo?.companyName || "");
                              setClientVatAddress(checkout.clientVatInfo?.address || "");
                              setAdvanceAmount(checkout.advancePaid?.toString() || "0");
                              setCheckInDate(checkout.checkInDate ? checkout.checkInDate.slice(0, 10) : "");
                              setCheckOutDate(checkout.checkOutDate ? checkout.checkOutDate.slice(0, 10) : "");
                              setShowEdit(true);
                              setEditError("");
                            }}
                          >Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Enhanced Edit Checkout Modal with Print Bill */}
                {showEdit && editCheckout && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] overflow-y-auto">
                      <div className="p-6">
                        <h2 className="text-2xl font-bold mb-4">Edit Checkout & Print Bill</h2>
                        
                        {/* Edit Form */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Left Column - Edit Form */}
                          <div>
                            <form
                              onSubmit={async (e) => {
                                e.preventDefault();
                                setEditLoading(true);
                                setEditError("");
                                try {
                                  // If status remains pending, allow schedules edit without completing
                                  if (editStatus === 'pending') {
                                    await updateCheckout(editCheckout._id, {
                                      checkInDate: checkInDate ? new Date(checkInDate).toISOString() : undefined,
                                      checkOutDate: checkOutDate ? new Date(checkOutDate).toISOString() : undefined,
                                      vatPercent: editVatPercent ? Number(editVatPercent) : undefined,
                                    });
                                  } else {
                                    const roomNumbers = (editCheckout.rooms || []).map((r: any) => r.roomNumber);
                                    await updateCheckoutPayment(
                                      roomNumbers.length === 1 ? roomNumbers[0] : roomNumbers,
                                      editStatus,
                                      editVatPercent,
                                      editVatAmount,
                                      {
                                        clientVatInfo: {
                                          vatNumber: clientVatNumber,
                                          companyName: clientVatCompany,
                                          address: clientVatAddress,
                                        },
                                        checkInDate: checkInDate ? new Date(checkInDate).toISOString() : undefined,
                                        checkOutDate: checkOutDate ? new Date(checkOutDate).toISOString() : undefined,
                                      }
                                    );
                                  }
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
                                <label className="block text-sm font-medium mb-1">Rooms</label>
                                <div className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-100 text-sm">
                                  {Array.isArray(editCheckout.rooms) && editCheckout.rooms.length > 0
                                    ? editCheckout.rooms.map((r: any) => `#${r.roomNumber}`).join(', ')
                                    : '-'}
                                </div>
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
                                <label className="block text-sm font-medium mb-1">VAT Percent (%)</label>
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
                                <label className="block text-sm font-medium mb-1">VAT Amount (₹)</label>
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

                              {/* Additional fields for billing */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Client VAT Number</label>
                                  <input
                                    type="text"
                                    value={clientVatNumber}
                                    onChange={e => setClientVatNumber(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    disabled={editLoading}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Client Company</label>
                                  <input
                                    type="text"
                                    value={clientVatCompany}
                                    onChange={e => setClientVatCompany(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    disabled={editLoading}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Client Address</label>
                                  <input
                                    type="text"
                                    value={clientVatAddress}
                                    onChange={e => setClientVatAddress(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    disabled={editLoading}
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-sm font-medium mb-1">Advance Amount (₹)</label>
                                <input
                                  type="number"
                                  value={advanceAmount}
                                  onChange={e => setAdvanceAmount(e.target.value)}
                                  className="w-full border border-gray-300 rounded px-3 py-2"
                                  min="0"
                                  step="0.01"
                                  disabled={editLoading}
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-sm font-medium mb-1">Check-in Date</label>
                                  <input
                                    type="date"
                                    value={checkInDate}
                                    onChange={e => setCheckInDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    disabled={editLoading}
                                  />
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-1">Check-out Date</label>
                                  <input
                                    type="date"
                                    value={checkOutDate}
                                    onChange={e => setCheckOutDate(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    disabled={editLoading}
                                  />
                                </div>
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

                          {/* Right Column - Bill Preview */}
                          <div className="border-l pl-6">
                            <div className="flex justify-between items-center mb-4">
                              <h3 className="text-lg font-semibold">Bill Preview</h3>
                              <button
                                type="button"
                                onClick={printBill}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                              >Print Bill</button>
                            </div>

                            {/* Bill Content */}
                            <div id="bill-content" className="text-sm">
                              <div className="bill-header">
                                <h1 className="text-lg font-bold">{editCheckout.hotel?.name || 'Hotel Name'}</h1>
                                <p>Hotel Bill Receipt</p>
                                {editCheckout.hotelVatInfo && (
                                  <p>Hotel VAT: {editCheckout.hotelVatInfo.vatNumber} · {editCheckout.hotelVatInfo.companyName}</p>
                                )}
                                <p>Date: {new Date().toLocaleDateString()}</p>
                              </div>

                              <div className="bill-section">
                                <h3 className="font-semibold mb-1 text-sm">Guest Information</h3>
                                <table className="bill-table">
                                  <tr><td><strong>Name:</strong></td><td>{editCheckout.guest?.firstName} {editCheckout.guest?.lastName}</td><td><strong>Rooms:</strong></td><td>{Array.isArray(editCheckout.rooms) ? editCheckout.rooms.map((r: any) => `#${r.roomNumber}`).join(', ') : '-'}</td></tr>
                                  <tr><td><strong>Email:</strong></td><td>{editCheckout.guest?.email}</td><td><strong>Days:</strong></td><td>{calculateDaysOfStay(checkInDate, checkOutDate)} days</td></tr>
                                  <tr><td><strong>Check-in:</strong></td><td>{checkInDate || 'N/A'}</td><td><strong>Check-out:</strong></td><td>{checkOutDate || 'N/A'}</td></tr>
                                  {(clientVatNumber || clientVatCompany || clientVatAddress) && (
                                    <tr>
                                      <td><strong>Client VAT:</strong></td>
                                      <td colSpan={3}>{clientVatNumber} · {clientVatCompany} · {clientVatAddress}</td>
                                      </tr>
                                  )}
                                </table>
                              </div>

                              <div className="bill-section">
                                <h3 className="font-semibold mb-1 text-sm">Charges Breakdown</h3>
                                <table className="bill-table">
                                  <thead>
                                    <tr>
                                      <th>Description</th>
                                      <th>Qty/Days</th>
                                      <th>Rate</th>
                                      <th className="text-right">Amount</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Array.isArray(editCheckout.rooms) && editCheckout.rooms.length > 0 && (
                                      editCheckout.rooms.map((r: any, idx: number) => (
                                        <tr key={`room-${idx}`}>
                                          <td>Room #{r.roomNumber}</td>
                                          <td>{calculateDaysOfStay(checkInDate, checkOutDate)}</td>
                                          <td>₹{editCheckout.totalRoomCharge ? (editCheckout.totalRoomCharge / editCheckout.rooms.length / calculateDaysOfStay(checkInDate, checkOutDate)).toFixed(2) : '0'}</td>
                                          <td className="text-right">₹{editCheckout.totalRoomCharge ? (editCheckout.totalRoomCharge / editCheckout.rooms.length).toFixed(2) : '0'}</td>
                                        </tr>
                                      ))
                                    )}
                                      {editCheckout.orders && editCheckout.orders.length > 0 && 
                                      editCheckout.orders.map((order: any) => 
                                        order.items?.map((item: any, idx: number) => (
                                          <tr key={`${order._id}-${idx}`}>
                                            <td>{item.name}</td>
                                            <td>{item.quantity}</td>
                                            <td>₹{item.price}</td>
                                            <td className="text-right">₹{item.total}</td>
                                          </tr>
                                        ))
                                      )}
                                  </tbody>
                                </table>
                              </div>

                              <div className="bill-section">
                                <h3 className="font-semibold mb-1 text-sm">Bill Summary</h3>
                                <table className="bill-table">
                                  <tr><td>Room Charges</td><td className="text-right">₹{editCheckout.totalRoomCharge || 0}</td></tr>
                                  <tr><td>Food & Beverage</td><td className="text-right">₹{editCheckout.totalOrderCharge || 0}</td></tr>
                                  {editCheckout.totalExtraCharge && editCheckout.totalExtraCharge > 0 && (
                                    <tr><td>Extra Charges</td><td className="text-right">₹{editCheckout.totalExtraCharge}</td></tr>
                                  )}
                                  <tr><td>Subtotal</td><td className="text-right">₹{(editCheckout.totalRoomCharge || 0) + (editCheckout.totalOrderCharge || 0) + (editCheckout.totalExtraCharge || 0)}</td></tr>
                                  {editCheckout.roomDiscount && editCheckout.roomDiscount > 0 && (
                                    <tr><td>Room Discount</td><td className="text-right">-₹{editCheckout.roomDiscount}</td></tr>
                                  )}
                                  {(parseFloat(editVatPercent) > 0 || parseFloat(editVatAmount) > 0) && (
                                    <tr><td>VAT ({editVatPercent}%)</td><td className="text-right">₹{editVatAmount}</td></tr>
                                  )}
                                  <tr className="total-row">
                                    <td><strong>Total Amount</strong></td>
                                    <td className="text-right"><strong>₹{editCheckout.totalBill}</strong></td>
                                  </tr>
                                  {parseFloat(advanceAmount) > 0 && (
                                    <>
                                      <tr><td>Advance Paid</td><td className="text-right">-₹{advanceAmount}</td></tr>
                                      <tr className="total-row">
                                        <td><strong>Amount Due</strong></td>
                                        <td className="text-right"><strong>₹{(editCheckout.totalBill - parseFloat(advanceAmount)).toFixed(2)}</strong></td>
                                      </tr>
                                    </>
                                  )}
                                </table>
                              </div>

                              <div className="bill-footer">
                                <p><strong>Thank you for staying with us!</strong></p>
                                <p>Status: <strong>{editStatus}</strong></p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Checkout Details Modal */}
                {showDetails && detailsCheckout && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                      <h2 className="text-2xl font-bold mb-4">Checkout Details</h2>
                      <div className="mb-4">
                        <h3 className="font-semibold mb-2">Rooms Info</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Rooms:</span> {Array.isArray(detailsCheckout.rooms) && detailsCheckout.rooms.length > 0
                              ? detailsCheckout.rooms.map((r: any) => `#${r.roomNumber}`).join(', ')
                              : '-'}
                          </div>
                          <div>
                            <span className="font-medium">Types:</span> {Array.isArray(detailsCheckout.rooms) && detailsCheckout.rooms.length > 0
                              ? Array.from(new Set(detailsCheckout.rooms.map((r: any) => r.type))).join(', ')
                              : '-'}
                          </div>
                          <div>
                            <span className="font-medium">Any Occupied:</span> {Array.isArray(detailsCheckout.rooms) && detailsCheckout.rooms.length > 0
                              ? (detailsCheckout.rooms.some((r: any) => r.isOccupied) ? 'Yes' : 'No')
                              : '-'}
                          </div>
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
      </div>
    </div>
  );
}