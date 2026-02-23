"use client";

import { getCheckouts, getCheckoutById } from "@/lib/api";
import { updateCheckoutPayment, updateCheckout } from "@/lib/checkoutApi";
import { useEffect, useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";

import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";

export default function CheckoutsPage() {
  // Load hotel from localStorage
  const [hotel, setHotel] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  
  // Listen for localStorage changes to hotel (for nepaliFlag)
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'hotel') {
        setHotel(event.newValue ? JSON.parse(event.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  
  const [page, setPage] = useState(1);
  const limit = 10;
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  
  const { loading: userLoading, logout } = useAuth();
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
  const debouncedSearch = useDebounce(searchInput, 1000);
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

  // Discount states
  const [roomDiscount, setRoomDiscount] = useState<string>("0");
  const [orderDiscount, setOrderDiscount] = useState<string>("0");
  const [extraDiscount, setExtraDiscount] = useState<string>("0");
  const [discountNote, setDiscountNote] = useState<string>("");

  // Calculated bill summary state - UPDATED with new fields
  const [billSummary, setBillSummary] = useState({
    roomCharges: 0,
    orderCharges: 0,
    extraCharges: 0,
    roomDiscount: 0,
    orderDiscount: 0,
    extraDiscount: 0,
    roomNet: 0,
    orderNet: 0,
    subtotalBeforeExtraDiscount: 0,
    subtotalAfterExtraDiscount: 0,
    vatPercent: 0,
    vatAmount: 0,
    advancePaid: 0,
    totalBeforeAdvance: 0,
    finalBill: 0,
    discountNote: ""
  });

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

  // Form errors state
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Reset form errors
  const resetFormErrors = () => setFormErrors({});

  // Validation function for edit form
  const validateCheckoutForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (advanceAmount && Number(advanceAmount) < 0) {
      errors.advanceAmount = 'Advance amount cannot be negative';
    }

    if (roomDiscount && Number(roomDiscount) < 0) {
      errors.roomDiscount = 'Room discount cannot be negative';
    }

    if (orderDiscount && Number(orderDiscount) < 0) {
      errors.orderDiscount = 'Order discount cannot be negative';
    }

    if (extraDiscount && Number(extraDiscount) < 0) {
      errors.extraDiscount = 'Extra discount cannot be negative';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Calculate bill summary whenever relevant fields change
  useEffect(() => {
    if (editCheckout) {
      const roomCharges = editCheckout.breakdown?.roomCharges || editCheckout.totalRoomCharge || 0;
      const orderCharges = editCheckout.breakdown?.orderCharges || editCheckout.totalOrderCharge || 0;
      const extraCharges = editCheckout.totalExtraCharge || 0;
      
      const roomDisc = Number(roomDiscount) || 0;
      const orderDisc = Number(orderDiscount) || 0;
      const extraDisc = Number(extraDiscount) || 0;
      
      const roomNet = roomCharges - roomDisc;
      const orderNet = orderCharges - orderDisc;
      const subtotalBeforeExtraDiscount = roomNet + orderNet + extraCharges;
      const subtotalAfterExtraDiscount = subtotalBeforeExtraDiscount - extraDisc;
      
      const vatPercent = Number(editVatPercent) || editCheckout.vatPercent || 0;
      const vatAmount = Number(editVatAmount) || (subtotalAfterExtraDiscount * vatPercent / 100) || 0;
      
      const advancePaid = Number(advanceAmount) || editCheckout.advancePaid || 0;
      const totalBeforeAdvance = subtotalAfterExtraDiscount + vatAmount;
      const finalBill = totalBeforeAdvance - advancePaid;

      setBillSummary({
        roomCharges,
        orderCharges,
        extraCharges,
        roomDiscount: roomDisc,
        orderDiscount: orderDisc,
        extraDiscount: extraDisc,
        roomNet,
        orderNet,
        subtotalBeforeExtraDiscount,
        subtotalAfterExtraDiscount,
        vatPercent,
        vatAmount,
        advancePaid,
        totalBeforeAdvance,
        finalBill: finalBill < 0 ? 0 : finalBill,
        discountNote: discountNote || ""
      });
    }
  }, [editCheckout, roomDiscount, orderDiscount, extraDiscount, editVatPercent, editVatAmount, advanceAmount, discountNote]);

  // Paper type selection for printing
  const [paperType, setPaperType] = useState<"a4" | "a5" | "thermal">("a4");

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

  // Print bill function with paper type selection
  const printBill = () => {
    const printContent = document.getElementById('bill-content');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        let printStyles = '';

        // Apply different styles based on paper type
        if (paperType === 'thermal') {
          printStyles = `
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
                padding: 1mm;
                font-size: 7px;
                line-height: 1;
              }
              .bill-header {
                text-align: center;
                border-bottom: 1px solid #000;
                padding-bottom: 0.5mm;
                margin-bottom: 0.5mm;
              }
              .bill-header h1 {
                font-size: 8px;
                font-weight: bold;
                margin-bottom: 0.3mm;
              }
              .bill-header h2 {
                font-size: 7px;
                margin-bottom: 0.3mm;
              }
              .bill-header p {
                font-size: 6px;
                margin: 0.2mm 0;
              }
              .bill-section {
                margin: 0.5mm 0;
              }
              .bill-section h3 {
                font-size: 7px;
                font-weight: bold;
                border-bottom: 1px dashed #ccc;
                padding-bottom: 0.3mm;
                margin-bottom: 0.3mm;
              }
              p {
                margin: 0.3mm 0;
                font-size: 6px;
              }
              .bill-table {
                width: 100%;
                border-collapse: collapse;
                margin: 0.3mm 0;
                font-size: 6px;
              }
              .bill-table th, .bill-table td {
                padding: 0.2mm;
                text-align: left;
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
                margin-top: 1mm;
                text-align: center;
                border-top: 1px dashed #ccc;
                padding-top: 0.5mm;
                font-size: 6px;
              }
              .order-table {
                width: 100%;
                border-collapse: collapse;
                margin: 0.3mm 0;
                font-size: 5px;
              }
              .order-table th, .order-table td {
                padding: 0.1mm;
              }
              .vat-info, .payment-info {
                margin-top: 0.3mm;
                padding: 0.3mm;
                border: 1px dashed #ccc;
                font-size: 5px;
              }
              .payment-method {
                display: inline-block;
                padding: 0.2mm 0.3mm;
                background: #f0f0f0;
                border-radius: 1px;
                margin-right: 0.3mm;
                font-size: 5px;
              }
              /* Prevent page breaks */
              html, body {
                height: auto !important;
                overflow: hidden !important;
              }
              /* Single page enforcement */
              .bill-content {
                height: auto !important;
                page-break-inside: avoid !important;
              }
              /* Compact everything */
              br {
                display: none;
              }
              /* Force single column layout */
              .two-columns {
                display: block !important;
              }
              .two-columns > div {
                width: 100% !important;
                margin-bottom: 0.5mm;
              }
            }
          `;
        } else if (paperType === 'a5') {
          printStyles = `
            @media print {
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
              }
              html, body {
                height: auto !important;
                overflow: hidden !important;
              }
              body {
                width: 148mm;
                padding: 4mm;
                font-size: 9px;
                line-height: 1.1;
              }
              .bill-header {
                text-align: center;
                border-bottom: 1px solid #000;
                padding-bottom: 1mm;
                margin-bottom: 1mm;
              }
              .bill-header h1 {
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 0.5mm;
              }
              .bill-header h2 {
                font-size: 11px;
                margin-bottom: 0.5mm;
              }
              .bill-header p {
                font-size: 8px;
                margin: 0.3mm 0;
              }
              .bill-section {
                margin: 1mm 0;
              }
              .bill-section h3 {
                font-size: 10px;
                font-weight: bold;
                border-bottom: 1px dashed #ccc;
                padding-bottom: 0.5mm;
                margin-bottom: 0.5mm;
              }
              p {
                margin: 0.5mm 0;
                font-size: 8px;
              }
              .bill-table {
                width: 100%;
                border-collapse: collapse;
                margin: 0.5mm 0;
                font-size: 8px;
              }
              .bill-table th, .bill-table td {
                padding: 0.5mm;
                text-align: left;
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
                margin-top: 2mm;
                text-align: center;
                border-top: 1px dashed #ccc;
                padding-top: 1mm;
                font-size: 8px;
              }
              .order-table {
                width: 100%;
                border-collapse: collapse;
                margin: 0.5mm 0;
                font-size: 7px;
              }
              .order-table th, .order-table td {
                padding: 0.3mm;
              }
              .vat-info, .payment-info {
                margin-top: 0.5mm;
                padding: 0.5mm;
                border: 1px dashed #ccc;
                font-size: 8px;
              }
              .payment-method {
                display: inline-block;
                padding: 0.3mm 0.5mm;
                background: #f0f0f0;
                border-radius: 1px;
                margin-right: 0.5mm;
                font-size: 7px;
              }
              /* Single page enforcement */
              .bill-content {
                height: auto !important;
                page-break-inside: avoid !important;
              }
              /* Prevent any page breaks */
              h1, h2, h3, p, table, div {
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
              }
              /* Compact layout */
              br {
                display: none;
              }
              /* Two columns for guest and stay info */
              .two-columns {
                display: flex;
                justify-content: space-between;
                margin: 0.5mm 0;
              }
              .two-columns > div {
                width: 48%;
              }
            }
          `;
        } else { // A4 paper
          printStyles = `
            @media print {
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
                font-family: Arial, sans-serif;
              }
              html, body {
                height: auto !important;
                overflow: hidden !important;
              }
              body {
                width: 210mm;
                padding: 8mm;
                font-size: 11px;
                line-height: 1.2;
              }
              .bill-header {
                text-align: center;
                border-bottom: 2px solid #000;
                padding-bottom: 2mm;
                margin-bottom: 2mm;
              }
              .bill-header h1 {
                font-size: 16px;
                font-weight: bold;
                margin-bottom: 1mm;
              }
              .bill-header h2 {
                font-size: 14px;
                margin-bottom: 1mm;
              }
              .bill-header p {
                font-size: 10px;
                margin: 0.5mm 0;
              }
              .bill-section {
                margin: 1.5mm 0;
              }
              .bill-section h3 {
                font-size: 13px;
                font-weight: bold;
                border-bottom: 1px dashed #ccc;
                padding-bottom: 1mm;
                margin-bottom: 1mm;
              }
              p {
                margin: 0.8mm 0;
                font-size: 10px;
              }
              .bill-table {
                width: 100%;
                border-collapse: collapse;
                margin: 1mm 0;
                font-size: 10px;
              }
              .bill-table th, .bill-table td {
                padding: 0.8mm;
                text-align: left;
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
                border-top: 2px dashed #000;
              }
              .bill-footer {
                margin-top: 3mm;
                text-align: center;
                border-top: 1px dashed #ccc;
                padding-top: 2mm;
                font-size: 10px;
              }
              .order-table {
                width: 100%;
                border-collapse: collapse;
                margin: 1mm 0;
                font-size: 9px;
              }
              .order-table th, .order-table td {
                padding: 0.5mm;
              }
              .vat-info, .payment-info {
                margin-top: 1mm;
                padding: 1mm;
                border: 1px dashed #ccc;
                font-size: 10px;
              }
              .payment-method {
                display: inline-block;
                padding: 0.5mm 1mm;
                background: #f0f0f0;
                border-radius: 2px;
                margin-right: 1mm;
                font-size: 9px;
              }
              /* Single page enforcement */
              .bill-content {
                height: auto !important;
                page-break-inside: avoid !important;
              }
              /* Prevent any page breaks */
              h1, h2, h3, p, table, div {
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
              }
              /* Two columns for better space usage */
              .two-columns {
                display: flex;
                justify-content: space-between;
                margin: 1mm 0;
              }
              .two-columns > div {
                width: 48%;
              }
            }
          `;
        }

        printWindow.document.write(`
          <html>
            <head>
              <title>Hotel Bill - ${detailsCheckout?.guest?.firstName} ${detailsCheckout?.guest?.lastName}</title>
              <style>${printStyles}</style>
            </head>
            <body onload="window.print(); setTimeout(() => { window.close(); }, 100);">
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

    if (!validateCheckoutForm()) {
      setEditError("Please fix validation errors");
      return;
    }

    setEditLoading(true);
    setEditError("");

    try {
      // Prepare the payload for the main checkout update including VAT and discounts
      const payload: any = {
        status: editStatus,
        advancePaid: parseFloat(advanceAmount) || 0,
        checkInDate,
        checkOutDate,
        paymentMethod,
        advancePaymentMethod,
        // Discount fields
        roomDiscount: parseFloat(roomDiscount) || 0,
        orderDiscount: parseFloat(orderDiscount) || 0,
        extraDiscount: parseFloat(extraDiscount) || 0,
        discountNote: discountNote || undefined
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
      } else {
        // Clear VAT percent if field is empty
        payload.vatPercent = null;
      }

      if (editVatAmount !== "") {
        payload.vatAmount = parseFloat(editVatAmount);
      } else {
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
        nepaliFlag={hotel?.nepaliFlag}
      />
      <div className="max-w-9xl mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Checkouts Management</h1>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search Input */}
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Search</label>
              <div className="relative">
                <input
                  data-cy="checkouts-search"
                  type="text"
                  placeholder="Search by guest name or room number..."
                  value={searchInput}
                  onChange={(e) => handleSearchInputChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                {searchInput && (
                  <button
                    data-cy="checkouts-search-clear"
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
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                data-cy="checkouts-status-filter"
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
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                data-cy="checkouts-search-btn"
                type="submit"
                className="flex-1 sm:flex-none bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                Search
              </button>
              <button
                data-cy="checkouts-clear-filters-btn"
                type="button"
                onClick={clearFilters}
                className="flex-1 sm:flex-none bg-gray-200 text-gray-700 rounded-lg px-4 py-2 hover:bg-gray-300 transition-colors"
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
                <table data-cy="checkouts-table" className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rooms</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bill</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Created At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody data-cy="checkouts-table-body" className="bg-white divide-y divide-gray-200">
                    {checkouts.map((checkout: any, index: number) => (
                      <tr key={checkout._id} data-cy={`checkouts-row-${index}`} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap cursor-pointer" onClick={() => {
                          setDetailsCheckout(checkout);
                          setShowDetails(true);
                          loadCheckoutDetails(checkout._id);
                        }}>
                          {checkout.guest ? `${checkout.guest.firstName} ${checkout.guest.lastName}` : "-"}
                          <div className="text-xs text-gray-500 hidden sm:block">{checkout.guest?.email}</div>
                          {checkout.guest?.phone && (
                            <div className="text-xs text-gray-500 hidden sm:block">{checkout.guest.phone}</div>
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
                        <td className="px-4 py-4 whitespace-nowrap text-xs hidden md:table-cell cursor-pointer" onClick={() => {
                          setDetailsCheckout(checkout);
                          setShowDetails(true);
                          loadCheckoutDetails(checkout._id);
                        }}>{checkout.createdAt ? new Date(checkout.createdAt).toLocaleString() : ""}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <button
                            data-cy={`checkouts-view-btn-${index}`}
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
                            data-cy={`checkouts-edit-btn-${index}`}
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
                              // Set discount values
                              setRoomDiscount(checkout.roomDiscount?.toString() || "0");
                              setOrderDiscount(checkout.orderDiscount?.toString() || "0");
                              setExtraDiscount(checkout.extraDiscount?.toString() || "0");
                              setDiscountNote(checkout.discountNote || "");
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
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 bg-white border-t border-gray-200 gap-4">
            <button
              onClick={() => setPage(page => Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700 order-first sm:order-none">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page => page + 1)}
              disabled={page === pagination.totalPages}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && editCheckout && (
        <div data-cy="checkouts-edit-modal" className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-start justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-semibold">Edit Checkout</h3>
              <button
                data-cy="checkouts-edit-modal-close"
                onClick={() => setShowEdit(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {editError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{editError}</div>}
              
              {/* Bill Summary Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-blue-800 mb-3">Bill Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Room Charges</p>
                    <p className="text-lg font-semibold">रु{billSummary.roomCharges.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Room Discount</p>
                    <p className="text-lg font-semibold text-red-600">-रु{billSummary.roomDiscount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Room</p>
                    <p className="text-lg font-semibold">रु{(billSummary.roomCharges - billSummary.roomDiscount).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Order Charges</p>
                    <p className="text-lg font-semibold">रु{billSummary.orderCharges.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Order Discount</p>
                    <p className="text-lg font-semibold text-red-600">-रु{billSummary.orderDiscount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Net Order</p>
                    <p className="text-lg font-semibold">रु{(billSummary.orderCharges - billSummary.orderDiscount).toLocaleString()}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Subtotal (Before Extra)</p>
                    <p className="text-lg font-semibold">रु{(billSummary.roomCharges - billSummary.roomDiscount + billSummary.orderCharges - billSummary.orderDiscount).toLocaleString()}</p>
                  </div>
                  
                  {/* Extra Discount Line */}
                  {/* <div>
                    <p className="text-sm text-gray-600">Extra Discount</p>
                    <p className="text-lg font-semibold text-red-600">-रु{billSummary.extraDiscount.toLocaleString()}</p>
                  </div> */}
                  
                  {/* <div>
                    <p className="text-sm text-gray-600">Subtotal After All Discounts</p>
                    <p className="text-lg font-semibold">रु{billSummary.subtotalAfterExtraDiscount.toLocaleString()}</p>
                  </div> */}
                  
                  <div>
                    <p className="text-sm text-gray-600">VAT Amount</p>
                    <p className="text-lg font-semibold">रु{billSummary.vatAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Advance Paid</p>
                    <p className="text-lg font-semibold">-रु{billSummary.advancePaid.toLocaleString()}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2 lg:col-span-3 border-t pt-2 mt-2">
                    <p className="text-base font-bold text-blue-800">Final Bill Amount: रु{billSummary.finalBill.toLocaleString()}</p>
                    {billSummary.discountNote && (
                      <p className="text-sm text-gray-600 mt-1">Note: {billSummary.discountNote}</p>
                    )}
                  </div>
                </div>
              </div>

              <form onSubmit={handleEditSubmit}>
                <div className="space-y-4">
                  {/* Status */}
                  <div>
                    <label htmlFor="editStatus" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      data-cy="checkouts-edit-status"
                      id="editStatus"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  {/* Discounts Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-3">Discounts</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label htmlFor="roomDiscount" className="block text-sm font-medium text-gray-700 mb-1">Room Discount (रु)</label>
                        <input
                          type="number"
                          id="roomDiscount"
                          value={roomDiscount}
                          onChange={(e) => setRoomDiscount(e.target.value)}
                          className={`w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.roomDiscount ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                          min="0"
                          step="0.01"
                        />
                        {formErrors.roomDiscount && <p className="text-red-600 text-sm mt-1">{formErrors.roomDiscount}</p>}
                      </div>
                      <div>
                        <label htmlFor="orderDiscount" className="block text-sm font-medium text-gray-700 mb-1">Order Discount (रु)</label>
                        <input
                          type="number"
                          id="orderDiscount"
                          value={orderDiscount}
                          onChange={(e) => setOrderDiscount(e.target.value)}
                          className={`w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.orderDiscount ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                          min="0"
                          step="0.01"
                        />
                        {formErrors.orderDiscount && <p className="text-red-600 text-sm mt-1">{formErrors.orderDiscount}</p>}
                      </div>
                      {/* <div>
                        <label htmlFor="extraDiscount" className="block text-sm font-medium text-gray-700 mb-1">Extra Discount (रु)</label>
                        <input
                          type="number"
                          id="extraDiscount"
                          value={extraDiscount}
                          onChange={(e) => setExtraDiscount(e.target.value)}
                          className={`w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.extraDiscount ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                          min="0"
                          step="0.01"
                        />
                        {formErrors.extraDiscount && <p className="text-red-600 text-sm mt-1">{formErrors.extraDiscount}</p>}
                      </div> */}
                    </div>
                    
                    {/* Discount Note */}
                    <div className="mt-3">
                      <label htmlFor="discountNote" className="block text-sm font-medium text-gray-700 mb-1">Discount Note (Optional)</label>
                      <textarea
                        id="discountNote"
                        value={discountNote}
                        onChange={(e) => setDiscountNote(e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={2}
                        placeholder="Reason for discount, approval details, etc."
                      />
                    </div>
                  </div>

                  {/* Advance Amount */}
                  <div>
                    <label htmlFor="advanceAmount" className="block text-sm font-medium text-gray-700 mb-1">Advance Paid (रु)</label>
                    <input
                      type="number"
                      id="advanceAmount"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(e.target.value)}
                      className={`w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.advanceAmount ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                    />
                    {formErrors.advanceAmount && <p className="text-red-600 text-sm mt-1">{formErrors.advanceAmount}</p>}
                  </div>

                  {/* Payment Methods Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-3">Payment Method</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Final Payment Method</label>
                        <select
                          id="paymentMethod"
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="cash">Cash</option>
                          <option value="online">Online</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor="advancePaymentMethod" className="block text-sm font-medium text-gray-700 mb-1">Advance Payment Method</label>
                        <select
                          id="advancePaymentMethod"
                          value={advancePaymentMethod}
                          onChange={(e) => setAdvancePaymentMethod(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="cash">Cash</option>
                          <option value="online">Online</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Online Payment Details - Final Payment */}
                  {paymentMethod === "online" && (
                    <div className="bg-blue-50 p-4 rounded-md space-y-4">
                      <h5 className="font-medium text-blue-800">Final Payment Details</h5>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                          <input
                            type="text"
                            id="transactionId"
                            value={paymentDetails.transactionId}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter transaction ID"
                          />
                        </div>
                        <div>
                          <label htmlFor="paymentGateway" className="block text-sm font-medium text-gray-700 mb-1">Payment Gateway</label>
                          <input
                            type="text"
                            id="paymentGateway"
                            value={paymentDetails.paymentGateway}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentGateway: e.target.value })}
                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., stripe, paypal"
                          />
                        </div>
                        <div>
                          <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                          <input
                            type="datetime-local"
                            id="paymentDate"
                            value={paymentDetails.paymentDate}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Online Payment Details - Advance Payment */}
                  {advancePaymentMethod === "online" && (
                    <div className="bg-green-50 p-4 rounded-md space-y-4">
                      <h5 className="font-medium text-green-800">Advance Payment Details</h5>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="advanceTransactionId" className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                          <input
                            type="text"
                            id="advanceTransactionId"
                            value={advancePaymentDetails.transactionId}
                            onChange={(e) => setAdvancePaymentDetails({ ...advancePaymentDetails, transactionId: e.target.value })}
                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Enter transaction ID"
                          />
                        </div>
                        <div>
                          <label htmlFor="advancePaymentGateway" className="block text-sm font-medium text-gray-700 mb-1">Payment Gateway</label>
                          <input
                            type="text"
                            id="advancePaymentGateway"
                            value={advancePaymentDetails.paymentGateway}
                            onChange={(e) => setAdvancePaymentDetails({ ...advancePaymentDetails, paymentGateway: e.target.value })}
                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., stripe, paypal"
                          />
                        </div>
                        <div>
                          <label htmlFor="advancePaymentDate" className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                          <input
                            type="datetime-local"
                            id="advancePaymentDate"
                            value={advancePaymentDetails.paymentDate}
                            onChange={(e) => setAdvancePaymentDetails({ ...advancePaymentDetails, paymentDate: e.target.value })}
                            className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Check-in/out Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700 mb-1">Check-in Date</label>
                      <input
                        type="date"
                        id="checkInDate"
                        value={checkInDate}
                        onChange={(e) => setCheckInDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                      <input
                        type="date"
                        id="checkOutDate"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* VAT Information Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-3">VAT Information</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="editVatPercent" className="block text-sm font-medium text-gray-700 mb-1">VAT Percent (%)</label>
                        <input
                          type="number"
                          step="0.01"
                          id="editVatPercent"
                          value={editVatPercent}
                          onChange={(e) => setEditVatPercent(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter VAT percentage"
                        />
                      </div>
                      <div>
                        <label htmlFor="editVatAmount" className="block text-sm font-medium text-gray-700 mb-1">VAT Amount (रु)</label>
                        <input
                          type="number"
                          step="0.01"
                          id="editVatAmount"
                          value={editVatAmount}
                          onChange={(e) => setEditVatAmount(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter VAT amount"
                        />
                        <p className="text-xs text-gray-500 mt-1">Enter either percentage or amount</p>
                      </div>
                    </div>
                  </div>

                  {/* Client VAT Information Section */}
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold mb-3">Client VAT Information</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="clientVatNumber" className="block text-sm font-medium text-gray-700 mb-1">VAT Number</label>
                        <input
                          type="text"
                          id="clientVatNumber"
                          value={clientVatNumber}
                          onChange={(e) => setClientVatNumber(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="clientVatCompany" className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                        <input
                          type="text"
                          id="clientVatCompany"
                          value={clientVatCompany}
                          onChange={(e) => setClientVatCompany(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="clientVatAddress" className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                        <input
                          type="text"
                          id="clientVatAddress"
                          value={clientVatAddress}
                          onChange={(e) => setClientVatAddress(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEdit(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 order-2 sm:order-1"
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button
                    data-cy="checkouts-edit-save-btn"
                    type="submit"
                    className={`px-4 py-2 rounded-md text-white order-1 sm:order-2 ${editLoading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}
                    disabled={editLoading}
                  >
                    {editLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* VAT Edit Modal */}
      {showVatEdit && editCheckout && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-start justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md my-8">
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-semibold">Edit VAT Information</h3>
              <button
                onClick={() => setShowVatEdit(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {vatEditError && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{vatEditError}</div>}
              <form onSubmit={handleVatEditSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="editVatPercent" className="block text-sm font-medium text-gray-700 mb-1">VAT Percent (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      id="editVatPercent"
                      value={editVatPercent}
                      onChange={(e) => setEditVatPercent(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter VAT percentage"
                    />
                  </div>
                  <div>
                    <label htmlFor="editVatAmount" className="block text-sm font-medium text-gray-700 mb-1">VAT Amount (रु)</label>
                    <input
                      type="number"
                      step="0.01"
                      id="editVatAmount"
                      value={editVatAmount}
                      onChange={(e) => setEditVatAmount(e.target.value)}
                      className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter VAT amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter either percentage or amount</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowVatEdit(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 order-2 sm:order-1"
                    disabled={vatEditLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 rounded-md text-white order-1 sm:order-2 ${vatEditLoading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'}`}
                    disabled={vatEditLoading}
                  >
                    {vatEditLoading ? 'Updating...' : 'Update VAT'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetails && (
        <div data-cy="checkouts-details-modal" className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-start justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg sm:text-xl font-semibold">Checkout Details</h3>
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {/* Paper Type Selection */}
                <div className="flex items-center gap-2 flex-1 sm:flex-none">
                  <label htmlFor="paperType" className="text-sm whitespace-nowrap">Paper:</label>
                  <select
                    data-cy="checkouts-paper-type"
                    id="paperType"
                    value={paperType}
                    onChange={(e) => setPaperType(e.target.value as "a4" | "a5" | "thermal")}
                    className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 sm:w-auto"
                  >
                    <option value="a4">A4</option>
                    <option value="a5">A5</option>
                    <option value="thermal">Thermal</option>
                  </select>
                </div>
                <button
                  data-cy="checkouts-print-bill-btn"
                  onClick={printBill}
                  className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex-1 sm:flex-none"
                >
                  Print Bill
                </button>
                <button
                  data-cy="checkouts-details-modal-close"
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center flex-1 sm:flex-none"
                  aria-label="Close"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-6">
              {detailsLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div>Loading checkout details...</div>
                </div>
              ) : (
                <div
                  id="bill-content"
                  className="mx-auto"
                  style={{
                    ...(paperType === 'thermal' && {
                      width: '57mm',
                      maxWidth: '57mm',
                      padding: '2mm',
                      fontSize: '8px',
                      lineHeight: '1.1',
                      fontFamily: "'Courier New', monospace"
                    }),
                    ...(paperType === 'a5' && {
                      width: '148mm',
                      maxWidth: '148mm',
                      padding: '5mm',
                      fontSize: '10px',
                      lineHeight: '1.3',
                      fontFamily: 'Arial, sans-serif'
                    }),
                    ...(paperType === 'a4' && {
                      width: '210mm',
                      maxWidth: '210mm',
                      padding: '10mm',
                      fontSize: '12px',
                      lineHeight: '1.4',
                      fontFamily: 'Arial, sans-serif'
                    })
                  }}
                >
                  {/* Bill Header */}
                  <div style={{
                    textAlign: 'center',
                    borderBottom: '1px solid #000',
                    paddingBottom: paperType === 'thermal' ? '2mm' : paperType === 'a5' ? '3mm' : '5mm',
                    marginBottom: paperType === 'thermal' ? '2mm' : paperType === 'a5' ? '3mm' : '5mm'
                  }}>
                    <h1 style={{
                      fontSize: paperType === 'thermal' ? '10px' : paperType === 'a5' ? '14px' : '18px',
                      fontWeight: 'bold',
                      marginBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '2mm' : '3mm'
                    }}>{hotelName.toUpperCase()}</h1>
                    <h2 style={{
                      fontSize: paperType === 'thermal' ? '9px' : paperType === 'a5' ? '12px' : '16px',
                      marginBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '2mm' : '3mm'
                    }}>HOTEL BILL</h2>
                    <p style={{
                      fontSize: paperType === 'thermal' ? '7px' : paperType === 'a5' ? '9px' : '11px',
                      margin: paperType === 'thermal' ? '0.5mm 0' : paperType === 'a5' ? '1mm 0' : '1.5mm 0'
                    }}>Date: {new Date().toLocaleDateString()}</p>
                    <p style={{
                      fontSize: paperType === 'thermal' ? '7px' : paperType === 'a5' ? '9px' : '11px',
                      margin: paperType === 'thermal' ? '0.5mm 0' : paperType === 'a5' ? '1mm 0' : '1.5mm 0'
                    }}>Invoice #: {detailsCheckout?._id?.slice(-8)}</p>
                  </div>

                  {/* Guest & Room Details */}
                  <div style={{
                    margin: paperType === 'thermal' ? '2mm 0' : paperType === 'a5' ? '3mm 0' : '4mm 0'
                  }}>
                    <h3 style={{
                      fontSize: paperType === 'thermal' ? '8px' : paperType === 'a5' ? '11px' : '14px',
                      fontWeight: 'bold',
                      borderBottom: '1px dashed #ccc',
                      paddingBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                      marginBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm'
                    }}>Guest Information</h3>
                    <p><strong>Name:</strong> {detailsCheckout?.guest?.firstName} {detailsCheckout?.guest?.lastName}</p>
                    <p><strong>Phone:</strong> {detailsCheckout?.guest?.phone}</p>
                  </div>

                  <div style={{
                    margin: paperType === 'thermal' ? '2mm 0' : paperType === 'a5' ? '3mm 0' : '4mm 0'
                  }}>
                    <h3 style={{
                      fontSize: paperType === 'thermal' ? '8px' : paperType === 'a5' ? '11px' : '14px',
                      fontWeight: 'bold',
                      borderBottom: '1px dashed #ccc',
                      paddingBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                      marginBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm'
                    }}>Stay Information</h3>
                    <p><strong>Rooms:</strong> {detailsCheckout?.rooms?.map((r: any) => `#${r.roomNumber}`).join(', ') || 'N/A'}</p>
                    <p><strong>Nights:</strong> {detailsCheckout?.nights || 1}</p>
                    <p><strong>Check-in:</strong> {detailsCheckout?.checkInDate ? new Date(detailsCheckout.checkInDate).toLocaleDateString() : 'N/A'}</p>
                    <p><strong>Check-out:</strong> {detailsCheckout?.checkOutDate ? new Date(detailsCheckout.checkOutDate).toLocaleDateString() : 'N/A'}</p>
                  </div>

                  {/* Client VAT Info (if available) */}
                  {detailsCheckout?.clientVatInfo?.vatNumber && (
                    <div style={{
                      marginTop: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                      padding: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                      border: '1px dashed #ccc',
                      fontSize: paperType === 'thermal' ? '7px' : paperType === 'a5' ? '9px' : '11px'
                    }}>
                      <h3 style={{
                        fontSize: paperType === 'thermal' ? '8px' : paperType === 'a5' ? '11px' : '14px',
                        fontWeight: 'bold',
                        borderBottom: '1px dashed #ccc',
                        paddingBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                        marginBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm'
                      }}>Client VAT Information</h3>
                      <p><strong>VAT No:</strong> {detailsCheckout.clientVatInfo.vatNumber}</p>
                      <p><strong>Company:</strong> {detailsCheckout.clientVatInfo.companyName}</p>
                      <p><strong>Address:</strong> {detailsCheckout.clientVatInfo.address}</p>
                    </div>
                  )}

                  {/* Payment Information */}
                  <div style={{
                    marginTop: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                    padding: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                    border: '1px dashed #ccc',
                    fontSize: paperType === 'thermal' ? '7px' : paperType === 'a5' ? '9px' : '11px'
                  }}>
                    <h3 style={{
                      fontSize: paperType === 'thermal' ? '8px' : paperType === 'a5' ? '11px' : '14px',
                      fontWeight: 'bold',
                      borderBottom: '1px dashed #ccc',
                      paddingBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                      marginBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm'
                    }}>Payment Information</h3>

                    {/* Final Payment */}
                    <p>
                      <strong>Final Payment:</strong>
                      <span style={{
                        display: 'inline-block',
                        padding: paperType === 'thermal' ? '0.5mm 1mm' : paperType === 'a5' ? '0.8mm 1.5mm' : '1mm 2mm',
                        background: '#f0f0f0',
                        borderRadius: paperType === 'thermal' ? '2px' : paperType === 'a5' ? '2px' : '3px',
                        marginRight: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                        fontSize: paperType === 'thermal' ? '6px' : paperType === 'a5' ? '8px' : '10px'
                      }}>{detailsCheckout?.paymentMethod?.toUpperCase() || 'CASH'}</span>
                    </p>

                    {/* Advance Payment */}
                    {detailsCheckout?.advancePaid > 0 && (
                      <p>
                        <strong>Advance Paid:</strong>
                        <span style={{
                          display: 'inline-block',
                          padding: paperType === 'thermal' ? '0.5mm 1mm' : paperType === 'a5' ? '0.8mm 1.5mm' : '1mm 2mm',
                          background: '#f0f0f0',
                          borderRadius: paperType === 'thermal' ? '2px' : paperType === 'a5' ? '2px' : '3px',
                          marginRight: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                          fontSize: paperType === 'thermal' ? '6px' : paperType === 'a5' ? '8px' : '10px'
                        }}>{detailsCheckout?.advancePaymentMethod?.toUpperCase() || 'CASH'}</span>
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
                  <div style={{
                    margin: paperType === 'thermal' ? '2mm 0' : paperType === 'a5' ? '3mm 0' : '4mm 0'
                  }}>
                    <h3 style={{
                      fontSize: paperType === 'thermal' ? '8px' : paperType === 'a5' ? '11px' : '14px',
                      fontWeight: 'bold',
                      borderBottom: '1px dashed #ccc',
                      paddingBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                      marginBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm'
                    }}>Room Charges</h3>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      margin: paperType === 'thermal' ? '1mm 0' : paperType === 'a5' ? '1.5mm 0' : '2mm 0',
                      fontSize: paperType === 'thermal' ? '7px' : paperType === 'a5' ? '9px' : '11px'
                    }}>
                      <thead>
                        <tr>
                          <th>Room</th>
                          <th style={{ textAlign: 'right' }}>Rate/Night</th>
                          <th style={{ textAlign: 'center' }}>Nights</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailsCheckout?.rooms?.map((room: any, index: number) => {
                          const nights = detailsCheckout.nights || 1;
                          const roomTotal = room.rate * nights;
                          return (
                            <tr key={index}>
                              <td>#{room.roomNumber}</td>
                              <td style={{ textAlign: 'right' }}>रु{room.rate?.toLocaleString()}</td>
                              <td style={{ textAlign: 'center' }}>{nights}</td>
                              <td style={{ textAlign: 'right' }}>रु{roomTotal.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Order Details with pagination for print */}
                  {detailsCheckout?.orders && detailsCheckout.orders.length > 0 && (
                    <div style={{
                      margin: paperType === 'thermal' ? '2mm 0' : paperType === 'a5' ? '3mm 0' : '4mm 0'
                    }}>
                      <h3 style={{
                        fontSize: paperType === 'thermal' ? '8px' : paperType === 'a5' ? '11px' : '14px',
                        fontWeight: 'bold',
                        borderBottom: '1px dashed #ccc',
                        paddingBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                        marginBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm'
                      }}>Order Details ({detailsCheckout.orders.length} orders)</h3>
                      {detailsCheckout.orders.map((order: any, index: number) => (
                        <div key={index} className={index > 0 ? 'page-break' : ''}>
                          <p><strong>Order #{index + 1}</strong> - {new Date(order.createdAt).toLocaleDateString()}</p>
                          <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            margin: paperType === 'thermal' ? '1mm 0' : paperType === 'a5' ? '1.5mm 0' : '2mm 0',
                            fontSize: paperType === 'thermal' ? '6px' : paperType === 'a5' ? '8px' : '10px'
                          }}>
                            <thead>
                              <tr>
                                <th>Item</th>
                                <th style={{ textAlign: 'center' }}>Qty</th>
                                <th style={{ textAlign: 'right' }}>Price</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {order.items.map((item: any, itemIndex: number) => (
                                <tr key={itemIndex}>
                                  <td>{item.name.length > 20 ? item.name.substring(0, 17) + '...' : item.name}</td>
                                  <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                  <td style={{ textAlign: 'right' }}>रु{item.price?.toLocaleString()}</td>
                                  <td style={{ textAlign: 'right' }}>रु{item.total?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr style={{
                                fontWeight: 'bold',
                                borderTop: paperType === 'thermal' ? '1px dashed #000' : paperType === 'a5' ? '1px dashed #000' : '2px dashed #000'
                              }}>
                                <td colSpan={3} style={{ textAlign: 'right' }}>Order Total:</td>
                                <td style={{ textAlign: 'right' }}>रु{order.totalAmount?.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Billing Summary */}
                  <div style={{
                    margin: paperType === 'thermal' ? '2mm 0' : paperType === 'a5' ? '3mm 0' : '4mm 0'
                  }}>
                    <h3 style={{
                      fontSize: paperType === 'thermal' ? '8px' : paperType === 'a5' ? '11px' : '14px',
                      fontWeight: 'bold',
                      borderBottom: '1px dashed #ccc',
                      paddingBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm',
                      marginBottom: paperType === 'thermal' ? '1mm' : paperType === 'a5' ? '1.5mm' : '2mm'
                    }}>Bill Summary</h3>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      margin: paperType === 'thermal' ? '1mm 0' : paperType === 'a5' ? '1.5mm 0' : '2mm 0',
                      fontSize: paperType === 'thermal' ? '7px' : paperType === 'a5' ? '9px' : '11px'
                    }}>
                      <tbody>
                        <tr>
                          <td>Room Charges</td>
                          <td style={{ textAlign: 'right' }}>रु{detailsCheckout?.breakdown?.roomCharges?.toLocaleString()}</td>
                        </tr>
                        {detailsCheckout?.breakdown?.roomDiscount > 0 && (
                          <tr>
                            <td style={{ color: '#dc2626' }}>Room Discount</td>
                            <td style={{ textAlign: 'right', color: '#dc2626' }}>-रु{detailsCheckout.breakdown.roomDiscount?.toLocaleString()}</td>
                          </tr>
                        )}
                        <tr>
                          <td><strong>Net Room Charges</strong></td>
                          <td style={{ textAlign: 'right' }}><strong>रु{(detailsCheckout?.breakdown?.roomCharges - (detailsCheckout?.breakdown?.roomDiscount || 0))?.toLocaleString()}</strong></td>
                        </tr>
                        
                        {detailsCheckout?.breakdown?.orderCharges > 0 && (
                          <>
                            <tr>
                              <td>Food & Beverage</td>
                              <td style={{ textAlign: 'right' }}>रु{detailsCheckout.breakdown.orderCharges?.toLocaleString()}</td>
                            </tr>
                            {detailsCheckout?.breakdown?.orderDiscount > 0 && (
                              <tr>
                                <td style={{ color: '#dc2626' }}>Order Discount</td>
                                <td style={{ textAlign: 'right', color: '#dc2626' }}>-रु{detailsCheckout.breakdown.orderDiscount?.toLocaleString()}</td>
                              </tr>
                            )}
                            <tr>
                              <td><strong>Net Food & Beverage</strong></td>
                              <td style={{ textAlign: 'right' }}><strong>रु{(detailsCheckout?.breakdown?.orderCharges - (detailsCheckout?.breakdown?.orderDiscount || 0))?.toLocaleString()}</strong></td>
                            </tr>
                          </>
                        )}
                        
                        {detailsCheckout?.breakdown?.extraCharges > 0 && (
                          <>
                            <tr>
                              <td>Other Charges</td>
                              <td style={{ textAlign: 'right' }}>रु{detailsCheckout.breakdown.extraCharges?.toLocaleString()}</td>
                            </tr>
                            {/* {detailsCheckout?.breakdown?.extraDiscount > 0 && (
                              <tr>
                                <td style={{ color: '#dc2626' }}>Other Discount</td>
                                <td style={{ textAlign: 'right', color: '#dc2626' }}>-रु{detailsCheckout.breakdown.extraDiscount?.toLocaleString()}</td>
                              </tr>
                            )} */}
                            <tr>
                              <td><strong>Net Other Charges</strong></td>
                              <td style={{ textAlign: 'right' }}><strong>रु{(detailsCheckout?.breakdown?.extraCharges - (detailsCheckout?.breakdown?.extraDiscount || 0))?.toLocaleString()}</strong></td>
                            </tr>
                          </>
                        )}
                        
                        {/* Subtotal Before Extra Discount */}
                        <tr style={{
                          borderTop: '1px dashed #ccc',
                          fontWeight: 'bold'
                        }}>
                          <td>Subtotal (After Room & Order Discounts)</td>
                          <td style={{ textAlign: 'right' }}>रु{(detailsCheckout?.breakdown?.subtotalBeforeExtraDiscount || 0).toLocaleString()}</td>
                        </tr>

                        {/* Extra Discount - THIS SHOWS THE EXTRA DISCOUNT */}
                        {/* {detailsCheckout?.breakdown?.extraDiscount > 0 && (
                          <tr>
                            <td style={{ color: '#dc2626', fontWeight: 'bold' }}>Extra Discount</td>
                            <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: 'bold' }}>-रु{detailsCheckout.breakdown.extraDiscount.toLocaleString()}</td>
                          </tr>
                        )} */}

                        {/* Subtotal After Extra Discount */}
                        {/* <tr style={{
                          fontWeight: 'bold',
                          borderTop: '1px dashed #000'
                        }}>
                          <td>Subtotal After All Discounts</td>
                          <td style={{ textAlign: 'right' }}>रु{(detailsCheckout?.breakdown?.subtotalAfterExtraDiscount || 0).toLocaleString()}</td>
                        </tr> */}
                        
                        {detailsCheckout?.breakdown?.vatAmount > 0 && (
                          <tr>
                            <td>VAT ({detailsCheckout.breakdown.vatPercent || 0}%)</td>
                            <td style={{ textAlign: 'right' }}>रु{detailsCheckout.breakdown.vatAmount?.toLocaleString()}</td>
                          </tr>
                        )}
                        
                        <tr style={{
                          fontWeight: 'bold',
                          borderTop: '1px dashed #000'
                        }}>
                          <td>Total Before Advance</td>
                          <td style={{ textAlign: 'right' }}>रु{(detailsCheckout?.breakdown?.totalBeforeAdvance || 0).toLocaleString()}</td>
                        </tr>
                        
                        {detailsCheckout?.breakdown?.advancePaid > 0 && (
                          <tr>
                            <td>Advance Paid</td>
                            <td style={{ textAlign: 'right' }}>-रु{detailsCheckout.breakdown.advancePaid?.toLocaleString()}</td>
                          </tr>
                        )}
                        
                        {/* Discount Note */}
                        {detailsCheckout?.breakdown?.discountNote && (
                          <tr>
                            <td colSpan={2} style={{ 
                              fontSize: paperType === 'thermal' ? '6px' : paperType === 'a5' ? '8px' : '10px',
                              color: '#4b5563',
                              fontStyle: 'italic',
                              paddingTop: '2mm'
                            }}>
                              Note: {detailsCheckout.breakdown.discountNote}
                            </td>
                          </tr>
                        )}
                        
                        <tr style={{
                          fontWeight: 'bold',
                          borderTop: paperType === 'thermal' ? '1px dashed #000' : paperType === 'a5' ? '1px dashed #000' : '2px dashed #000',
                          fontSize: paperType === 'thermal' ? '8px' : paperType === 'a5' ? '11px' : '14px'
                        }}>
                          <td><strong>GRAND TOTAL</strong></td>
                          <td style={{ textAlign: 'right' }}><strong>रु{(detailsCheckout?.breakdown?.finalBill || 0).toLocaleString()}</strong></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div style={{
                    marginTop: paperType === 'thermal' ? '3mm' : paperType === 'a5' ? '4mm' : '6mm',
                    textAlign: 'center',
                    borderTop: '1px dashed #ccc',
                    paddingTop: paperType === 'thermal' ? '2mm' : paperType === 'a5' ? '3mm' : '4mm',
                    fontSize: paperType === 'thermal' ? '7px' : paperType === 'a5' ? '9px' : '11px'
                  }}>
                    <p>Thank you for staying with us!</p>
                    <p>For queries, contact hotel management</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}