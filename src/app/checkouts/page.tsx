"use client";

import { getCheckouts, getCheckoutById, processCheckoutPaymentWithDues } from "@/lib/api";
import { updateCheckout } from "@/lib/checkoutApi";
import React, { useEffect, useState, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, X, Eye, Edit, Trash2, Info, SlidersHorizontal } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";

import { useAuth } from "@/components/ui/auth-provider";
import { DashboardLayout } from "@/components/dashboard-layout";

export default function CheckoutsPage() {
  const [hotel, setHotel] = useState<any>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      if (stored) setHotel(JSON.parse(stored));
    }
  }, []);
  
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
  const { user } = useAuth();

  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    search: ""
  });
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebounce(searchInput, 1000);
  const [showMobileStats, setShowMobileStats] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
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
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRow = (id: string) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  // States for VAT editing

  const [showAdvanced, setShowAdvanced] = useState(false);
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
  const [discountNote, setDiscountNote] = useState<string>("");

  // Calculated bill summary state - UPDATED with new fields
  const [billSummary, setBillSummary] = useState({
    roomCharges: 0,
    orderCharges: 0,
    extraCharges: 0,
    roomDiscount: 0,
    orderDiscount: 0,
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

  // Payment amount for Edit modal payment processing
  const [paymentAmountEdit, setPaymentAmountEdit] = useState<string>("");

  // Payment modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentFormData, setPaymentFormData] = useState({
    checkout: null as any,
    amountToPay: 0,
    paymentAmount: "" as string,
    paymentMethod: "cash" as string,
    description: ""
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");

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
      
      const roomNet = roomCharges - roomDisc;
      const orderNet = orderCharges - orderDisc;
      const subtotalBeforeExtraDiscount = roomNet + orderNet + extraCharges;
      const subtotalAfterExtraDiscount = subtotalBeforeExtraDiscount;
      
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
  }, [editCheckout, roomDiscount, orderDiscount, editVatPercent, editVatAmount, advanceAmount, discountNote]);

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

  // Function to open payment modal
  const openPaymentModal = (checkout: any) => {
    const totalBill = checkout.totalBill || 0;
    setPaymentFormData({
      checkout,
      amountToPay: totalBill,
      paymentAmount: "",
      paymentMethod: "cash",
      description: ""
    });
    setPaymentError("");
    setShowPaymentModal(true);
  };

  // Calculate guest due information
  const calculateGuestDues = (guest: any) => {
    const currentDue = guest?.dueAmount || 0;
    const pastDues = guest?.dueTransactions || [];
    const pastDueTotal = pastDues.reduce((sum: number, tx: any) => sum + tx.amount, 0);
    return {
      currentDue,
      pastDues,
      pastDueTotal,
      totalDue: currentDue + pastDueTotal
    };
  };

  const parseNumber = (value: any) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  // Calculate original bill from checkout components
  const calculateOriginalBill = (checkout: any) => {
    const totalRoomCharge = parseNumber(checkout.totalRoomCharge);
    const totalOrderCharge = parseNumber(checkout.totalOrderCharge);
    const totalExtraCharge = parseNumber(checkout.totalExtraCharge);
    const roomDisc = parseNumber(checkout.roomDiscount);
    const orderDisc = parseNumber(checkout.orderDiscount);
    const vatAmount = parseNumber(checkout.vatAmount);

    const roomNet = Math.max(0, totalRoomCharge - roomDisc);
    const orderNet = Math.max(0, totalOrderCharge - orderDisc);
    const extraNet = totalExtraCharge;
    const subtotal = roomNet + orderNet + extraNet;
    const totalBeforeAdvance = subtotal + vatAmount;
    const advancePaid = parseNumber(checkout.advancePaid);
    const originalBill = Math.max(0, totalBeforeAdvance - advancePaid);

    return originalBill;
  };

  const calculateCheckoutSummary = () => {
    if (!editCheckout) return null;

    const totalRoomCharge = parseNumber(editCheckout.totalRoomCharge);
    const totalOrderCharge = parseNumber(editCheckout.totalOrderCharge);
    const totalExtraCharge = parseNumber(editCheckout.totalExtraCharge);
    const roomDisc = roomDiscount !== '' ? parseNumber(roomDiscount) : parseNumber(editCheckout.roomDiscount);
    const orderDisc = orderDiscount !== '' ? parseNumber(orderDiscount) : parseNumber(editCheckout.orderDiscount);
    const extraDisc = 0; // Extra discount is not currently implemented
    const advancePaid = parseNumber(advanceAmount !== '' ? advanceAmount : editCheckout.advancePaid);

    const roomNet = Math.max(0, totalRoomCharge - roomDisc);
    const orderNet = Math.max(0, totalOrderCharge - orderDisc);
    const extraNet = Math.max(0, totalExtraCharge - extraDisc);
    const subtotal = roomNet + orderNet + extraNet;

    const vatPercentValue = editVatPercent !== '' ? parseNumber(editVatPercent) : parseNumber(editCheckout.vatPercent);
    const vatAmountValue = editVatAmount !== '' ? parseNumber(editVatAmount) : parseNumber(editCheckout.vatAmount);
    const vatAmount = vatAmountValue > 0 ? vatAmountValue : Math.round((subtotal * vatPercentValue) / 100);

    const totalBeforeAdvance = subtotal + vatAmount;
    const finalBill = Math.max(0, totalBeforeAdvance - advancePaid);

    const paymentAmount = parseNumber(paymentAmountEdit);
    const currentGuestDue = parseNumber(editCheckout.guest?.dueAmount || 0);
    const amountDueAfterPayment = Math.max(0, finalBill - paymentAmount);
    const excessPayment = Math.max(0, paymentAmount - finalBill);
    let remainingGuestDue = currentGuestDue;
    let dueNote = '';

    if (paymentAmount > 0) {
      if (paymentAmount >= finalBill) {
        const appliedToExistingDue = Math.min(excessPayment, currentGuestDue);
        remainingGuestDue = Math.max(0, currentGuestDue - appliedToExistingDue);
        dueNote = appliedToExistingDue > 0
          ? `₹${appliedToExistingDue.toLocaleString()} will be applied to existing dues.`
          : 'This payment covers the current checkout balance in full.';
      } else {
        remainingGuestDue = currentGuestDue + amountDueAfterPayment;
        dueNote = `₹${amountDueAfterPayment.toLocaleString()} will be added to the guest due balance.`;
      }
    }

    return {
      totalRoomCharge,
      totalOrderCharge,
      totalExtraCharge,
      roomDisc,
      orderDisc,
      extraDisc,
      roomNet,
      orderNet,
      extraNet,
      subtotal,
      vatAmount,
      totalBeforeAdvance,
      advancePaid,
      finalBill,
      paymentAmount,
      amountDueAfterPayment,
      currentGuestDue,
      remainingGuestDue,
      dueNote
    };
  };

  // Handle payment submission
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setPaymentLoading(true);
      setPaymentError("");

      const paymentAmount = parseFloat(paymentFormData.paymentAmount);
      if (!paymentFormData.paymentAmount || isNaN(paymentAmount) || paymentAmount <= 0) {
        setPaymentError("Please enter a valid payment amount");
        setPaymentLoading(false);
        return;
      }

      await processCheckoutPaymentWithDues(paymentFormData.checkout._id, {
        paymentAmount,
        paymentMethod: paymentFormData.paymentMethod,
        checkOutDate: paymentFormData.checkout.checkOutDate
      });

      // Reload data
      loadData();
      setShowPaymentModal(false);
    } catch (e: any) {
      setPaymentError(e.message || "Failed to process payment");
    } finally {
      setPaymentLoading(false);
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
              * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Courier New', monospace !important; }
              body { width: 57mm; max-width: 57mm; padding: 1mm; font-size: 7px; line-height: 1; }
              h1 { font-size: 8px !important; font-weight: bold !important; text-align: center !important; margin: 0 0 0.3mm 0 !important; }
              h2 { font-size: 7px !important; font-weight: bold !important; text-align: center !important; margin: 0 0 0.3mm 0 !important; }
              h3 { font-size: 7px !important; font-weight: bold !important; border-bottom: 1px dashed #ccc !important; padding-bottom: 0.3mm !important; margin: 0.3mm 0 !important; }
              p { font-size: 6px !important; margin: 0.2mm 0 !important; }
              table { width: 100% !important; border-collapse: collapse !important; margin: 0.3mm 0 !important; font-size: 6px !important; }
              th, td { padding: 0.2mm !important; vertical-align: top !important; }
              th { font-weight: bold !important; border-bottom: 1px solid #ccc !important; }
              td[style*="text-align: right"], th[style*="text-align: right"] { text-align: right !important; }
              td[style*="text-align: center"], th[style*="text-align: center"] { text-align: center !important; }
              .text-right { text-align: right !important; }
              .text-center { text-align: center !important; }
              .text-red-600 { color: #dc2626 !important; }
              .font-bold { font-weight: bold !important; }
              .font-medium { font-weight: 500 !important; }
              strong { font-weight: bold !important; }
              .border-b, .border-t, .border-t-2, .border-dashed, .border-double, .border-gray-200, .border-gray-300, .border-gray-800 { border: none !important; }
              .bg-white, .bg-gray-100 { background: none !important; }
              .shadow-sm { box-shadow: none !important; }
              .rounded-lg, .rounded { border-radius: 0 !important; }
              .w-full { width: 100% !important; }
              .max-w-2xl { max-width: 100% !important; }
              .mx-auto { margin: 0 auto !important; }
              .text-left { text-align: left !important; }
              .text-gray-500, .text-gray-600 { color: #555 !important; }
              .text-gray-900 { color: #000 !important; }
              .italic { font-style: italic !important; }
              .inline-block { display: inline !important; }
              .ml-1 { margin-left: 0.2mm !important; }
              br { display: none; }
              .hidden { display: none !important; }
            }
          `;
        } else if (paperType === 'a5') {
          printStyles = `
            @media print {
              * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif !important; }
              html, body { height: auto !important; }
              body { width: 148mm; padding: 4mm; font-size: 9px; line-height: 1.2; }
              h1 { font-size: 12px !important; font-weight: bold !important; text-align: center !important; margin: 0 0 0.5mm 0 !important; }
              h2 { font-size: 11px !important; font-weight: bold !important; text-align: center !important; margin: 0 0 0.5mm 0 !important; }
              h3 { font-size: 10px !important; font-weight: bold !important; border-bottom: 1px dashed #ccc !important; padding-bottom: 0.5mm !important; margin: 0.5mm 0 !important; }
              p { font-size: 8px !important; margin: 0.4mm 0 !important; }
              table { width: 100% !important; border-collapse: collapse !important; margin: 0.5mm 0 !important; font-size: 8px !important; }
              th, td { padding: 0.4mm !important; vertical-align: top !important; }
              th { font-weight: bold !important; border-bottom: 1px solid #ccc !important; }
              td[style*="text-align: right"], th[style*="text-align: right"] { text-align: right !important; }
              td[style*="text-align: center"], th[style*="text-align: center"] { text-align: center !important; }
              .text-right { text-align: right !important; }
              .text-center { text-align: center !important; }
              .text-red-600 { color: #dc2626 !important; }
              .font-bold { font-weight: bold !important; }
              .font-medium { font-weight: 500 !important; }
              strong { font-weight: bold !important; }
              .w-full { width: 100% !important; }
              .max-w-2xl { max-width: 100% !important; }
              .mx-auto { margin: 0 auto !important; }
              .bg-white, .bg-gray-100 { background: none !important; }
              .shadow-sm { box-shadow: none !important; }
              .rounded-lg, .rounded { border-radius: 0 !important; }
              .text-gray-500, .text-gray-600 { color: #555 !important; }
              .text-gray-900 { color: #000 !important; }
              .border, .border-dashed, .border-gray-200, .border-gray-300, .border-gray-800, .border-double, .border-b, .border-t, .border-t-2 { border-color: #ccc !important; }
              .inline-block { display: inline !important; }
              .italic { font-style: italic !important; }
              .ml-1 { margin-left: 0.3mm !important; }
              br { display: none; }
              h1, h2, h3, p, table, div { page-break-inside: avoid !important; }
            }
          `;
        } else { // A4 paper
          printStyles = `
            @media print {
              * { margin: 0; padding: 0; box-sizing: border-box; font-family: Arial, sans-serif !important; }
              html, body { height: auto !important; }
              body { width: 210mm; padding: 8mm; font-size: 11px; line-height: 1.3; }
              h1 { font-size: 18px !important; font-weight: bold !important; text-align: center !important; margin: 0 0 1mm 0 !important; }
              h2 { font-size: 16px !important; font-weight: bold !important; text-align: center !important; margin: 0 0 1mm 0 !important; }
              h3 { font-size: 13px !important; font-weight: bold !important; border-bottom: 1px dashed #ccc !important; padding-bottom: 1mm !important; margin: 1mm 0 !important; }
              p { font-size: 10px !important; margin: 0.6mm 0 !important; }
              table { width: 100% !important; border-collapse: collapse !important; margin: 1mm 0 !important; font-size: 10px !important; }
              th, td { padding: 0.6mm !important; vertical-align: top !important; }
              th { font-weight: bold !important; border-bottom: 2px solid #ccc !important; }
              td[style*="text-align: right"], th[style*="text-align: right"] { text-align: right !important; }
              td[style*="text-align: center"], th[style*="text-align: center"] { text-align: center !important; }
              .text-right { text-align: right !important; }
              .text-center { text-align: center !important; }
              .text-red-600 { color: #dc2626 !important; }
              .font-bold { font-weight: bold !important; }
              .font-medium { font-weight: 500 !important; }
              strong { font-weight: bold !important; }
              .w-full { width: 100% !important; }
              .max-w-2xl { max-width: 100% !important; }
              .mx-auto { margin: 0 auto !important; }
              .bg-white, .bg-gray-100 { background: none !important; }
              .shadow-sm { box-shadow: none !important; }
              .rounded-lg, .rounded { border-radius: 0 !important; }
              .text-gray-500, .text-gray-600 { color: #555 !important; }
              .text-gray-900 { color: #000 !important; }
              .border, .border-dashed, .border-gray-200, .border-gray-300, .border-gray-800, .border-double, .border-b, .border-t, .border-t-2 { border-color: #ccc !important; }
              .inline-block { display: inline !important; }
              .italic { font-style: italic !important; }
              .ml-1 { margin-left: 0.5mm !important; }
              br { display: none; }
              h1, h2, h3, p, table, div { page-break-inside: avoid !important; }
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
        discountNote: discountNote || undefined
      };

      // Add discount fields if provided
      if (roomDiscount !== "") {
        payload.roomDiscount = parseFloat(roomDiscount) || 0;
      }
      if (orderDiscount !== "") {
        payload.orderDiscount = parseFloat(orderDiscount) || 0;
      }
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

      // Process payment if payment amount is provided
      if (paymentAmountEdit && parseFloat(paymentAmountEdit) > 0) {
        try {
          await processCheckoutPaymentWithDues(editCheckout._id, {
            paymentAmount: parseFloat(paymentAmountEdit),
            paymentMethod: paymentMethod || "cash",
            paymentDetails: paymentMethod === "online" ? paymentDetails : undefined,
            advancePaymentMethod,
            advancePaymentDetails,
            checkOutDate,
            roomDiscount: roomDiscount !== "" ? parseFloat(roomDiscount) : undefined,
            orderDiscount: orderDiscount !== "" ? parseFloat(orderDiscount) : undefined,
            vatPercent: editVatPercent !== "" ? parseFloat(editVatPercent) : undefined,
            vatAmount: editVatAmount !== "" ? parseFloat(editVatAmount) : undefined,
            clientVatInfo: clientVatNumber || clientVatCompany || clientVatAddress ? {
              vatNumber: clientVatNumber,
              companyName: clientVatCompany,
              address: clientVatAddress,
            } : undefined
          });
        } catch (paymentError: any) {
          console.error("Payment processing error:", paymentError);
          // Checkout was updated, but payment processing failed - show error but continue
          setEditError("Checkout updated, but payment processing failed: " + paymentError.message);
          setEditLoading(false);
          // Don't close modal yet so user can see the error
          return;
        }
      }

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



  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6">

        <div className="bg-card rounded-xl border border-border p-3 mb-5">

          {/* Mobile row: search + filter toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                placeholder="Search by guest name or room..."
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setFilters(prev => ({ ...prev, search: "" }));
                  }}
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
          </div>

          {/* Mobile filter panel */}
          {showMobileFilters && (
            <div className="mt-3 space-y-2 md:hidden">
              <select
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm max-w-full truncate"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setShowMobileStats(!showMobileStats)}
                  className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showMobileStats ? 'Hide' : 'Show'} Stats
                </button>
                {(filters.status || searchInput) && (
                  <button onClick={clearFilters} className="text-xs font-medium text-primary hover:text-primary/80 ml-auto shrink-0">
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Desktop: all filters in one row */}
          <div className="hidden md:flex items-center gap-3 flex-nowrap overflow-x-auto">
            <div className="relative flex-1 min-w-[180px] max-w-sm shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                data-cy="checkouts-search"
                type="text"
                placeholder="Search by guest name or room..."
                value={searchInput}
                onChange={(e) => handleSearchInputChange(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
              />
              {searchInput && (
                <button
                  data-cy="checkouts-search-clear"
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setFilters(prev => ({ ...prev, search: "" }));
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select
              data-cy="checkouts-status-filter"
              value={filters.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[120px] shrink-0"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
            </select>
            <button
              onClick={() => setShowMobileStats(!showMobileStats)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0"
              title={showMobileStats ? 'Hide Stats' : 'Show Stats'}
            >
              <Info className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{showMobileStats ? 'Hide' : 'Show'} Stats</span>
            </button>
            {(filters.status || searchInput) && (
              <button onClick={clearFilters} className="text-xs font-medium text-primary hover:text-primary/80 shrink-0 whitespace-nowrap">
                Clear
              </button>
            )}
            <div className="text-xs text-muted-foreground ml-auto shrink-0 whitespace-nowrap">
              {pagination.totalCount === 0 ? 'No results' :
                `${((pagination.page - 1) * pagination.limit) + 1}-${Math.min(pagination.page * pagination.limit, pagination.totalCount)} of ${pagination.totalCount}`}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className={`mb-5 grid grid-cols-2 sm:grid-cols-4 gap-4 ${showMobileStats ? '' : 'hidden'} md:grid`}>
          <div className="bg-blue-100/60 rounded-lg p-4 text-center">
            <div className="text-blue-700 text-xs font-semibold">Total Checkouts</div>
            <div className="text-xl font-bold text-blue-900">{pagination.totalCount}</div>
          </div>
          <div className="bg-green-100/60 rounded-lg p-4 text-center">
            <div className="text-green-700 text-xs font-semibold">Completed</div>
            <div className="text-xl font-bold text-green-900">{checkouts.filter((c: any) => c.status === 'completed').length}</div>
          </div>
          <div className="bg-amber-100/60 rounded-lg p-4 text-center">
            <div className="text-amber-700 text-xs font-semibold">Pending</div>
            <div className="text-xl font-bold text-amber-900">{checkouts.filter((c: any) => c.status === 'pending').length}</div>
          </div>
          <div className="bg-purple-100/60 rounded-lg p-4 text-center">
            <div className="text-purple-700 text-xs font-semibold">Revenue (Page)</div>
            <div className="text-xl font-bold text-purple-900">रु{checkouts.reduce((sum: number, c: any) => sum + (c.totalBill || 0), 0).toLocaleString()}</div>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-5 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:bg-destructive/10 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            {checkouts.length > 0 ? (
              <>
                <table data-cy="checkouts-table" className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Rooms</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Total Bill</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Created At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody data-cy="checkouts-table-body" className="bg-card divide-y divide-border">
                    {checkouts.map((checkout: any, index: number) => (
                      <React.Fragment key={checkout._id}>
                      <tr data-cy={`checkouts-row-${index}`} className="hover:bg-muted/50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => toggleRow(checkout._id)}
                              className="p-0.5 rounded text-muted-foreground hover:text-foreground md:hidden shrink-0"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                            <div>
                              <div className="text-sm font-medium">{checkout.guest ? `${checkout.guest.firstName} ${checkout.guest.lastName}` : "-"}</div>
                              <div className="text-xs text-muted-foreground">{checkout.guest?.phone || checkout.guest?.email || ''}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                          {checkout.rooms && checkout.rooms.length > 0
                            ? checkout.rooms.map((r: any) => `#${r.roomNumber}`).join(', ')
                            : "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap capitalize hidden md:table-cell">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${checkout.status === 'completed'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-green-800'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-yellow-800'
                            }`}>
                            {checkout.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold hidden md:table-cell">रु{checkout.totalBill?.toLocaleString()}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs hidden md:table-cell">{checkout.createdAt ? new Date(checkout.createdAt).toLocaleString() : ""}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <button
                              data-cy={`checkouts-view-btn-${index}`}
                              onClick={() => {
                                setDetailsCheckout(checkout);
                                setShowDetails(true);
                                loadCheckoutDetails(checkout._id);
                              }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              data-cy={`checkouts-edit-btn-${index}`}
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
                                setRoomDiscount(checkout.roomDiscount?.toString() || "");
                                setOrderDiscount(checkout.orderDiscount?.toString() || "");
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
                                setPaymentAmountEdit("");
                                // Set discount values
                                setRoomDiscount(checkout.roomDiscount?.toString() || "0");
                                setOrderDiscount(checkout.orderDiscount?.toString() || "0");
                                setDiscountNote(checkout.discountNote || "");
                                setShowEdit(true);
                                setEditError("");
                              }}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedRows[checkout._id] && (
                        <tr className="md:hidden">
                          <td colSpan={6} className="px-4 py-3 bg-muted/20">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><span className="text-muted-foreground">Rooms:</span> {checkout.rooms?.length ? checkout.rooms.map((r: any) => `#${r.roomNumber}`).join(', ') : '-'}</div>
                              <div><span className="text-muted-foreground">Status:</span> {checkout.status}</div>
                              <div><span className="text-muted-foreground">Bill:</span> रु{checkout.totalBill?.toLocaleString()}</div>
                              <div><span className="text-muted-foreground">Created:</span> {checkout.createdAt ? new Date(checkout.createdAt).toLocaleString() : ''}</div>
                              {checkout.guest?.email && <div className="col-span-2"><span className="text-muted-foreground">Email:</span> {checkout.guest.email}</div>}
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground">No checkouts found matching your criteria.</div>
                {(filters.search || filters.status) && (
                  <button
                    onClick={clearFilters}
                    className="mt-4 text-primary hover:text-blue-800"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
            disabled={loading}
          />
        </div>
      </div>

      {/* Edit Modal */}
      {showEdit && editCheckout && (
        <div data-cy="checkouts-edit-modal" className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-start justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b px-4 sm:px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg sm:text-xl font-semibold">Edit Checkout</h3>
              <button
                data-cy="checkouts-edit-modal-close"
                onClick={() => setShowEdit(false)}
                className="text-muted-foreground hover:text-muted-foreground text-2xl"
              >
                &times;
              </button>
            </div>
            <div className="p-4 sm:p-6">
              {editError && <div className="bg-destructive/10 border border-destructive/30 text-destructive px-4 py-3 rounded mb-4">{editError}</div>}
              
              {/* Bill Summary - Compact */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300">Bill Summary</h4>
                  <span className="text-xs text-muted-foreground">रु{billSummary.finalBill.toLocaleString()}</span>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Room</span><span>रु{billSummary.roomCharges.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Room Discount</span><span className="text-destructive">-रु{billSummary.roomDiscount.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Orders</span><span>रु{billSummary.orderCharges.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Order Discount</span><span className="text-destructive">-रु{billSummary.orderDiscount.toLocaleString()}</span></div>
                  {billSummary.vatAmount > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">VAT</span><span>रु{billSummary.vatAmount.toLocaleString()}</span></div>
                  )}
                  {billSummary.advancePaid > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">Advance</span><span className="text-destructive">-रु{billSummary.advancePaid.toLocaleString()}</span></div>
                  )}
                  <div className="flex justify-between font-semibold border-t border-blue-200 dark:border-blue-800 pt-1.5 mt-1.5 text-blue-800 dark:text-blue-300">
                    <span>Total</span><span>रु{billSummary.finalBill.toLocaleString()}</span>
                  </div>
                  {billSummary.discountNote && (
                    <p className="text-xs text-muted-foreground italic mt-1">{billSummary.discountNote}</p>
                  )}
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
                      className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 max-w-full truncate"
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
                          className={`w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.roomDiscount ? 'border-destructive bg-destructive/10' : 'border-input'}`}
                          min="0"
                          step="0.01"
                        />
                        {formErrors.roomDiscount && <p className="text-destructive text-sm mt-1">{formErrors.roomDiscount}</p>}
                      </div>
                      <div>
                        <label htmlFor="orderDiscount" className="block text-sm font-medium text-gray-700 mb-1">Order Discount (रु)</label>
                        <input
                          type="number"
                          id="orderDiscount"
                          value={orderDiscount}
                          onChange={(e) => setOrderDiscount(e.target.value)}
                          className={`w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.orderDiscount ? 'border-destructive bg-destructive/10' : 'border-input'}`}
                          min="0"
                          step="0.01"
                        />
                        {formErrors.orderDiscount && <p className="text-destructive text-sm mt-1">{formErrors.orderDiscount}</p>}
                      </div>
                      {/* <div>
                        <label htmlFor="extraDiscount" className="block text-sm font-medium text-gray-700 mb-1">Extra Discount (रु)</label>
                        <input
                          type="number"
                          id="extraDiscount"
                          value={extraDiscount}
                          onChange={(e) => setExtraDiscount(e.target.value)}
                          className={`w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.extraDiscount ? 'border-destructive bg-destructive/10' : 'border-input'}`}
                          min="0"
                          step="0.01"
                        />
                        {formErrors.extraDiscount && <p className="text-destructive text-sm mt-1">{formErrors.extraDiscount}</p>}
                      </div> */}
                    </div>
                    
                    {/* Discount Note */}
                    <div className="mt-3">
                      <label htmlFor="discountNote" className="block text-sm font-medium text-gray-700 mb-1">Discount Note (Optional)</label>
                      <textarea
                        id="discountNote"
                        value={discountNote}
                        onChange={(e) => setDiscountNote(e.target.value)}
                        className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
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
                      className={`w-full border rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 ${formErrors.advanceAmount ? 'border-destructive bg-destructive/10' : 'border-input'}`}
                    />
                    {formErrors.advanceAmount && <p className="text-destructive text-sm mt-1">{formErrors.advanceAmount}</p>}
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
                          className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 max-w-full truncate"
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
                          className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 max-w-full truncate"
                        >
                          <option value="cash">Cash</option>
                          <option value="online">Online</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Online Payment Details - Final Payment */}
                  {paymentMethod === "online" && (
                    <div className="bg-primary/5 p-4 rounded-md space-y-4">
                      <h5 className="font-medium text-blue-800">Final Payment Details</h5>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="transactionId" className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                          <input
                            type="text"
                            id="transactionId"
                            value={paymentDetails.transactionId}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })}
                            className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Online Payment Details - Advance Payment */}
                  {advancePaymentMethod === "online" && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-md space-y-4">
                      <h5 className="font-medium text-green-800">Advance Payment Details</h5>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label htmlFor="advanceTransactionId" className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                          <input
                            type="text"
                            id="advanceTransactionId"
                            value={advancePaymentDetails.transactionId}
                            onChange={(e) => setAdvancePaymentDetails({ ...advancePaymentDetails, transactionId: e.target.value })}
                            className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
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
                            className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700 mb-1">Check-out Date</label>
                      <input
                        type="date"
                        id="checkOutDate"
                        value={checkOutDate}
                        onChange={(e) => setCheckOutDate(e.target.value)}
                        className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>



                  {/* Advanced Toggle */}
                  <div className="border-t pt-3">
                    <button
                      type="button"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                      Advanced
                    </button>
                  </div>

                  {showAdvanced && (
                    <>
                      {/* VAT Information */}
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3">VAT Information</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="editVatPercent" className="block text-sm font-medium text-gray-700 mb-1">VAT Percent (%)</label>
                            <input
                              type="number"
                              step="0.01"
                              id="editVatPercent"
                              value={editVatPercent}
                              onChange={(e) => setEditVatPercent(e.target.value)}
                              className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., 13"
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
                              className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., 1690"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Client VAT Information */}
                      <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold mb-3">Client VAT Info</h4>
                        <div className="space-y-3">
                          <div>
                            <label htmlFor="clientVatNumber" className="block text-xs font-medium text-gray-700 mb-1">VAT Number</label>
                            <input
                              type="text"
                              id="clientVatNumber"
                              value={clientVatNumber}
                              onChange={(e) => setClientVatNumber(e.target.value)}
                              className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label htmlFor="clientVatCompany" className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                              <input
                                type="text"
                                id="clientVatCompany"
                                value={clientVatCompany}
                                onChange={(e) => setClientVatCompany(e.target.value)}
                                className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor="clientVatAddress" className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                              <input
                                type="text"
                                id="clientVatAddress"
                                value={clientVatAddress}
                                onChange={(e) => setClientVatAddress(e.target.value)}
                                className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Payment Processing Section */}
                  <div className="border-t pt-4 bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-md">
                    <h4 className="text-lg font-semibold mb-3 text-orange-900">Payment Processing</h4>
                    {editCheckout.guest && (
                      <>
                        {/* Guest Info */}
                        <div className="bg-card p-3 rounded-md mb-3 border border-amber-200 dark:border-amber-800">
                          <p><strong>Guest:</strong> {editCheckout.guest?.firstName} {editCheckout.guest?.lastName}</p>
                          
                          {editCheckout.status === 'completed' ? (
                            <>
                              {/* Show payment details for completed checkouts */}
                              <div className="mt-2 space-y-1 text-sm">
                                <p><strong>Original Bill:</strong> रु {calculateOriginalBill(editCheckout).toLocaleString()}</p>
                                <p><strong>Amount Paid:</strong> रु {(editCheckout.totalBill || 0).toLocaleString()}</p>
                                {editCheckout.paymentMethod && (
                                  <p><strong>Payment Method:</strong> {editCheckout.paymentMethod}</p>
                                )}
                                {editCheckout.guest?.dueTransactions && editCheckout.guest.dueTransactions.length > 0 && (
                                  <>
                                    <p><strong>Payment Date:</strong> {new Date(editCheckout.guest.dueTransactions[0].date).toLocaleDateString()}</p>
                                    <p><strong className={editCheckout.guest.dueAmount > 0 ? "text-destructive" : ""}>
                                      Remaining Due: रु {(editCheckout.guest?.dueAmount || 0).toLocaleString()}
                                    </strong></p>
                                  </>
                                )}
                              </div>

                              {/* Show transaction history */}
                              {editCheckout.guest?.dueTransactions && editCheckout.guest.dueTransactions.length > 0 && (
                                <div className="mt-3 pt-2 border-t border-yellow-100">
                                  <p className="font-semibold text-xs text-gray-700 mb-2">Payment Transactions:</p>
                                  <div className="space-y-1 text-xs">
                                    {editCheckout.guest.dueTransactions.map((tx: any, idx: number) => (
                                      <div key={idx} className="flex justify-between p-1 bg-amber-50 dark:bg-amber-950/20 rounded">
                                        <span>{new Date(tx.date).toLocaleDateString()} - {tx.paymentMethod || 'cash'}</span>
                                        <span className="font-semibold">रु {(tx.amount || 0).toLocaleString()}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <p><strong>Amount Due:</strong> रु {(editCheckout.totalBill || 0).toLocaleString()}</p>
                              {calculateGuestDues(editCheckout.guest).currentDue > 0 && (
                                <p><strong className="text-destructive">Outstanding Due:</strong> रु {(calculateGuestDues(editCheckout.guest).currentDue || 0).toLocaleString()}</p>
                              )}
                            </>
                          )}
                        </div>

                        {/* Payment Amount */}
                        <div>
                          <label htmlFor="paymentAmount" className="block text-sm font-medium text-gray-700 mb-1">Amount Customer Pays (रु)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            id="paymentAmount"
                            value={paymentAmountEdit}
                            onChange={(e) => setPaymentAmountEdit(e.target.value)}
                            placeholder="Leave empty to only update checkout info"
                            className="w-full border border-input rounded-md shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <p className="text-xs text-muted-foreground mt-1">Leave empty to save changes without processing payment</p>
                        </div>

                        {/* Payment Balance Summary */}
                        {paymentAmountEdit && (() => {
                          const summary = calculateCheckoutSummary();
                          if (!summary) return null;
                          return (
                            <div className="bg-card p-3 rounded-md my-3 border-2 border-orange-300">
                              <div className="grid grid-cols-1 gap-3 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-muted-foreground">Updated Amount to Pay</label>
                                    <p className="font-semibold">रु {summary.finalBill.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <label className="text-muted-foreground">Amount Received</label>
                                    <p className="font-semibold">रु {summary.paymentAmount.toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-muted-foreground">Remaining Checkout Due</label>
                                    <p className={`font-semibold ${summary.amountDueAfterPayment > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                      रु {summary.amountDueAfterPayment.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <label className="text-muted-foreground">Guest Due After Payment</label>
                                    <p className="font-semibold">रु {summary.remainingGuestDue.toLocaleString()}</p>
                                  </div>
                                </div>
                                <div>
                                  <label className="text-muted-foreground">Discount Summary</label>
                                  <p className="text-sm text-gray-700">Room: रु {summary.roomDisc.toLocaleString()}, Item: रु {summary.orderDisc.toLocaleString()}, Extra: रु {summary.extraDisc.toLocaleString()}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">{summary.dueNote || 'Payment and due amounts will be calculated after saving.'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEdit(false)}
                    className="px-4 py-2 border border-input rounded-md text-gray-700 hover:bg-muted order-2 sm:order-1"
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button
                    data-cy="checkouts-edit-save-btn"
                    type="submit"
                    className={`px-4 py-2 rounded-md text-white order-1 sm:order-2 ${editLoading ? 'bg-blue-400' : 'bg-primary hover:bg-primary/90'}`}
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

      {/* View Details Modal */}
      {showDetails && (
        <div data-cy="checkouts-details-modal" className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-start justify-center p-4 z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl my-8 max-h-[90vh] overflow-y-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-card border-b px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
                    className="border border-input rounded px-2 py-1 text-sm flex-1 sm:w-auto max-w-full truncate"
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
                  className="text-muted-foreground hover:text-gray-700 text-2xl bg-muted hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center flex-1 sm:flex-none"
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
                  className="w-full max-w-2xl mx-auto bg-white text-gray-900 rounded-lg border border-gray-200 p-4 sm:p-6 md:p-8"
                >
                  {/* Bill Header */}
                  <div className="text-center border-b border-gray-300 pb-4 sm:pb-5 mb-4 sm:mb-5">
                    <h1 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">{hotelName.toUpperCase()}</h1>
                    <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-1 sm:mb-2">HOTEL BILL</h2>
                    <p className="text-xs sm:text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-xs sm:text-sm text-gray-500">Invoice #: {detailsCheckout?._id?.slice(-8)}</p>
                  </div>

                  {/* Guest & Room Details */}
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base font-bold border-b border-dashed border-gray-300 pb-1 sm:pb-2 mb-1 sm:mb-2">Guest Information</h3>
                    <p className="text-xs sm:text-sm"><strong>Name:</strong> {detailsCheckout?.guest?.firstName} {detailsCheckout?.guest?.lastName}</p>
                    <p className="text-xs sm:text-sm"><strong>Phone:</strong> {detailsCheckout?.guest?.phone}</p>
                  </div>

                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base font-bold border-b border-dashed border-gray-300 pb-1 sm:pb-2 mb-1 sm:mb-2">Stay Information</h3>
                    <p className="text-xs sm:text-sm"><strong>Rooms:</strong> {detailsCheckout?.rooms?.map((r: any) => `#${r.roomNumber}`).join(', ') || 'N/A'}</p>
                    <p className="text-xs sm:text-sm"><strong>Nights:</strong> {detailsCheckout?.nights || 1}</p>
                    <p className="text-xs sm:text-sm"><strong>Check-in:</strong> {detailsCheckout?.checkInDate ? new Date(detailsCheckout.checkInDate).toLocaleDateString() : 'N/A'}</p>
                    <p className="text-xs sm:text-sm"><strong>Check-out:</strong> {detailsCheckout?.checkOutDate ? new Date(detailsCheckout.checkOutDate).toLocaleDateString() : 'N/A'}</p>
                  </div>

                  {/* Client VAT Info (if available) */}
                  {detailsCheckout?.clientVatInfo?.vatNumber && (
                    <div className="mb-3 sm:mb-4 p-2 sm:p-3 border border-dashed border-gray-300 rounded">
                      <h3 className="text-sm sm:text-base font-bold border-b border-dashed border-gray-300 pb-1 mb-1 sm:mb-2">Client VAT Information</h3>
                      <p className="text-xs sm:text-sm"><strong>VAT No:</strong> {detailsCheckout.clientVatInfo.vatNumber}</p>
                      <p className="text-xs sm:text-sm"><strong>Company:</strong> {detailsCheckout.clientVatInfo.companyName}</p>
                      <p className="text-xs sm:text-sm"><strong>Address:</strong> {detailsCheckout.clientVatInfo.address}</p>
                    </div>
                  )}

                  {/* Payment Information */}
                  <div className="mb-3 sm:mb-4 p-2 sm:p-3 border border-dashed border-gray-300 rounded">
                    <h3 className="text-sm sm:text-base font-bold border-b border-dashed border-gray-300 pb-1 mb-1 sm:mb-2">Payment Information</h3>

                    {/* Final Payment */}
                    <p className="text-xs sm:text-sm">
                      <strong>Final Payment:</strong>
                      <span className="inline-block ml-1 px-1.5 sm:px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{detailsCheckout?.paymentMethod?.toUpperCase() || 'CASH'}</span>
                    </p>

                    {/* Advance Payment */}
                    {detailsCheckout?.advancePaid > 0 && (
                      <p className="text-xs sm:text-sm">
                        <strong>Advance Paid:</strong>
                        <span className="inline-block ml-1 px-1.5 sm:px-2 py-0.5 bg-gray-100 rounded text-xs font-medium">{detailsCheckout?.advancePaymentMethod?.toUpperCase() || 'CASH'}</span>
                        ₹{detailsCheckout.advancePaid.toLocaleString()}
                      </p>
                    )}

                    {/* Online Payment Details */}
                    {detailsCheckout?.paymentMethod === 'online' && detailsCheckout?.paymentDetails?.transactionId && (
                      <p className="text-xs sm:text-sm">
                        <strong>Transaction ID:</strong> {detailsCheckout.paymentDetails.transactionId}
                        {detailsCheckout.paymentDetails.paymentGateway && (<span> ({detailsCheckout.paymentDetails.paymentGateway})</span>)}
                      </p>
                    )}

                    {/* Advance Online Payment Details */}
                    {detailsCheckout?.advancePaymentMethod === 'online' && detailsCheckout?.advancePaymentDetails?.transactionId && (
                      <p className="text-xs sm:text-sm">
                        <strong>Advance Txn ID:</strong> {detailsCheckout.advancePaymentDetails.transactionId}
                        {detailsCheckout.advancePaymentDetails.paymentGateway && (<span> ({detailsCheckout.advancePaymentDetails.paymentGateway})</span>)}
                      </p>
                    )}
                  </div>

                  {/* Room Charges Details */}
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base font-bold border-b border-dashed border-gray-300 pb-1 sm:pb-2 mb-1 sm:mb-2">Room Charges</h3>
                    <table className="w-full border-collapse text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-1 sm:py-1.5">Room</th>
                          <th className="text-right py-1 sm:py-1.5">Rate/Night</th>
                          <th className="text-center py-1 sm:py-1.5">Nights</th>
                          <th className="text-right py-1 sm:py-1.5">Total</th>
                        </tr>
                      </thead>
                      <tbody>{detailsCheckout?.rooms?.map((room: any, index: number) => {
                          const nights = detailsCheckout.nights || 1;
                          const roomTotal = room.rate * nights;
                          return (
                            <tr key={index} className="border-b border-gray-100">
                              <td className="py-1 sm:py-1.5">#{room.roomNumber}</td>
                              <td className="text-right py-1 sm:py-1.5">रु{room.rate?.toLocaleString()}</td>
                              <td className="text-center py-1 sm:py-1.5">{nights}</td>
                              <td className="text-right py-1 sm:py-1.5">रु{roomTotal.toLocaleString()}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Order Details */}
                  {detailsCheckout?.orders && detailsCheckout.orders.length > 0 && (
                    <div className="mb-3 sm:mb-4">
                      <h3 className="text-sm sm:text-base font-bold border-b border-dashed border-gray-300 pb-1 sm:pb-2 mb-1 sm:mb-2">Order Details ({detailsCheckout.orders.length} orders)</h3>
                      {detailsCheckout.orders.map((order: any, index: number) => (
                        <div key={index} className={`mb-2 sm:mb-3 ${index > 0 ? 'border-t border-dashed border-gray-200 pt-2 sm:pt-3 mt-2 sm:mt-3' : ''}`}>
                          <p className="text-xs sm:text-sm font-medium mb-1">Order #{index + 1} - {new Date(order.createdAt).toLocaleDateString()}</p>
                          <table className="w-full border-collapse text-xs sm:text-sm">
                            <thead>
                              <tr className="border-b border-gray-200">
                                <th className="text-left py-1">Item</th>
                                <th className="text-center py-1">Qty</th>
                                <th className="text-right py-1">Price</th>
                                <th className="text-right py-1">Total</th>
                              </tr>
                            </thead>
                            <tbody>{order.items.map((item: any, itemIndex: number) => (
                                <tr key={itemIndex} className="border-b border-gray-100">
                                  <td className="py-0.5 sm:py-1">{item.name && item.name.length > 25 ? item.name.substring(0, 22) + '...' : item.name}</td>
                                  <td className="text-center py-0.5 sm:py-1">{item.quantity}</td>
                                  <td className="text-right py-0.5 sm:py-1">रु{item.price?.toLocaleString()}</td>
                                  <td className="text-right py-0.5 sm:py-1">रु{item.total?.toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="font-bold border-t border-dashed border-gray-400">
                                <td colSpan={3} className="text-right py-1">Order Total:</td>
                                <td className="text-right py-1">रु{order.totalAmount?.toLocaleString()}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Billing Summary */}
                  <div className="mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base font-bold border-b border-dashed border-gray-300 pb-1 sm:pb-2 mb-1 sm:mb-2">Bill Summary</h3>
                    <table className="w-full border-collapse text-xs sm:text-sm">
                      <tbody>
                        <tr>
                          <td className="py-1">Room Charges</td>
                          <td className="text-right py-1">रु{detailsCheckout?.breakdown?.roomCharges?.toLocaleString()}</td>
                        </tr>
                        {detailsCheckout?.breakdown?.roomDiscount > 0 && (
                          <tr>
                            <td className="py-1 text-red-600">Room Discount</td>
                            <td className="text-right py-1 text-red-600">-रु{detailsCheckout.breakdown.roomDiscount?.toLocaleString()}</td>
                          </tr>
                        )}
                        <tr className="font-medium">
                          <td className="py-1"><strong>Net Room Charges</strong></td>
                          <td className="text-right py-1"><strong>रु{(detailsCheckout?.breakdown?.roomCharges - (detailsCheckout?.breakdown?.roomDiscount || 0))?.toLocaleString()}</strong></td>
                        </tr>

                        {detailsCheckout?.breakdown?.orderCharges > 0 && (
                          <>
                            <tr>
                              <td className="py-1">Food & Beverage</td>
                              <td className="text-right py-1">रु{detailsCheckout.breakdown.orderCharges?.toLocaleString()}</td>
                            </tr>
                            {detailsCheckout?.breakdown?.orderDiscount > 0 && (
                              <tr>
                                <td className="py-1 text-red-600">Order Discount</td>
                                <td className="text-right py-1 text-red-600">-रु{detailsCheckout.breakdown.orderDiscount?.toLocaleString()}</td>
                              </tr>
                            )}
                            <tr className="font-medium">
                              <td className="py-1"><strong>Net Food & Beverage</strong></td>
                              <td className="text-right py-1"><strong>रु{(detailsCheckout?.breakdown?.orderCharges - (detailsCheckout?.breakdown?.orderDiscount || 0))?.toLocaleString()}</strong></td>
                            </tr>
                          </>
                        )}

                        {detailsCheckout?.breakdown?.extraCharges > 0 && (
                          <>
                            <tr>
                              <td className="py-1">Other Charges</td>
                              <td className="text-right py-1">रु{detailsCheckout.breakdown.extraCharges?.toLocaleString()}</td>
                            </tr>
                            <tr className="font-medium">
                              <td className="py-1"><strong>Net Other Charges</strong></td>
                              <td className="text-right py-1"><strong>रु{(detailsCheckout?.breakdown?.extraCharges - (detailsCheckout?.breakdown?.extraDiscount || 0))?.toLocaleString()}</strong></td>
                            </tr>
                          </>
                        )}

                        {detailsCheckout?.breakdown?.extraDiscount > 0 && (
                          <tr>
                            <td className="py-1">Extra Discount</td>
                            <td className="text-right py-1">-₹{detailsCheckout.breakdown.extraDiscount?.toLocaleString()}</td>
                          </tr>
                        )}
                        <tr className="font-bold border-t border-dashed border-gray-400">
                          <td className="py-1">Subtotal</td>
                          <td className="text-right py-1">रु{(detailsCheckout?.breakdown?.subtotalBeforeExtraDiscount || 0).toLocaleString()}</td>
                        </tr>

                        {detailsCheckout?.breakdown?.vatAmount > 0 && (
                          <tr>
                            <td className="py-1">VAT ({detailsCheckout.breakdown.vatPercent || 0}%)</td>
                            <td className="text-right py-1">रु{detailsCheckout.breakdown.vatAmount?.toLocaleString()}</td>
                          </tr>
                        )}

                        <tr className="font-bold">
                          <td className="py-1">Total Before Advance</td>
                          <td className="text-right py-1">रु{(detailsCheckout?.breakdown?.totalBeforeAdvance || 0).toLocaleString()}</td>
                        </tr>

                        {detailsCheckout?.breakdown?.advancePaid > 0 && (
                          <tr>
                            <td className="py-1">Advance Paid</td>
                            <td className="text-right py-1">-रु{detailsCheckout.breakdown.advancePaid?.toLocaleString()}</td>
                          </tr>
                        )}

                        {/* Discount Note */}
                        {detailsCheckout?.breakdown?.discountNote && (
                          <tr>
                            <td colSpan={2} className="text-xs text-gray-500 italic py-1">
                              Note: {detailsCheckout.breakdown.discountNote}
                            </td>
                          </tr>
                        )}

                        <tr className="font-bold border-t-2 border-double border-gray-800 text-sm sm:text-base">
                          <td className="py-2">GRAND TOTAL</td>
                          <td className="text-right py-2">रु{(detailsCheckout?.breakdown?.finalBill || 0).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Footer */}
                  <div className="text-center border-t border-dashed border-gray-300 pt-3 sm:pt-4 mt-3 sm:mt-4">
                    <p className="text-xs sm:text-sm text-gray-600">Thank you for staying with us!</p>
                    <p className="text-xs sm:text-sm text-gray-500">For queries, contact hotel management</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}