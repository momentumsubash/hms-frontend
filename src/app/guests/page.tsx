"use client";

import { getGuests, getRooms, updateGuest, addGuest as createGuest, getMe, getAvailableRooms, uploadGuestDocument, getGuestDocuments, deleteGuestDocument } from "@/lib/api";
import React, { useEffect, useState, useRef, useCallback } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { format } from "date-fns";
import { isAPIResponse } from "@/types/api";
import { Search, X, Eye, Edit, Plus, Info, SlidersHorizontal } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";

interface AdditionalGuest {
  name: string;
  gender: string;
  relationship: string;
}

interface Referrer {
  _id: string;
  fullName: string;
  address?: string;
  idNo?: string;
  taxiNo?: string;
  referralPrice: number;
  totalAmountToReceive: number;
  totalAmountReceived: number;
  status: string;
  hotel: string;
  createdBy: string;
}

interface RoomInfo {
  _id: string;
  roomNumber: string;
  type: string;
  isOccupied: boolean;
  rate?: number;
}

interface Checkout {
  _id: string;
  status: string;
  guest: string;
  rooms: RoomInfo[];
  orders: any[];
  hotel: {
    _id: string;
    name: string;
  };
  totalRoomCharge: number;
  roomDiscount: number;
  totalOrderCharge: number;
  totalExtraCharge: number;
  vatPercent: number;
  vatAmount: number;
  checkInDate: string;
  checkOutDate: string;
  totalBill: number;
  advancePaid: number;
  createdBy: {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    id: string;
  };
  nights: number;
  paymentMethod: string;
  advancePaymentMethod: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface GuestDocument {
  _id: string;
  guest: string;
  hotel: string;
  documentType: 'passport' | 'license' | 'citizenship' | 'other';
  fileName: string;
  fileUrl: string;
  fileKey: string;
  signedUrl?: string;
  mimeType: string;
  fileSize: number;
  ocrData?: {
    firstName?: string;
    lastName?: string;
    idNo?: string;
    citizenshipNo?: string;
    address?: string;
    phone?: string;
    occupation?: string;
  } | null;
  createdBy: { _id: string; firstName: string; lastName: string };
  createdAt: string;
}

interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  idNo?: string;
  occupation?: string;
  vehicleNo?: string;
  noOfAdditionalGuests?: number;
  additionalGuests?: AdditionalGuest[];
  purposeOfStay?: string;
  referrer?: string;
  referralStatus?: string;
  existingCustomer?: boolean;
  dueAmount?: number;
  documents?: GuestDocument[];
  rooms: string[];
  checkInDate: string;
  checkOutDate?: string;
  isCheckedOut: boolean;
  totalBill: number;
  roomDiscount?: number;
  advancePaid?: number;
  createdBy: string | {
    _id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    id: string;
  };
  hotel: string | {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
  checkouts?: Checkout[];
  totalSpent?: number;
}

interface Room {
  _id: string;
  roomNumber: string;
  type: string;
  rate: number;
  isOccupied: boolean;
  capacity: number;
}

interface GuestForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  idNo: string;
  occupation: string;
  vehicleNo: string;
  noOfAdditionalGuests: string;
  additionalGuests: AdditionalGuest[];
  purposeOfStay: string;
  referrer: string;
  existingCustomer: boolean;
  rooms: string[];
  roomDiscount: string;
  advancePaid: string;
  checkInDate: string;
  checkOutDate?: string;
}

// Update the getCurrentDateTimeLocal function to add 5-minute buffer
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Add guest search function
const searchGuestByPhone = async (phone: string, token: string): Promise<Guest | null> => {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/guests?search=${phone}`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) throw new Error("Failed to search guest");

    const data = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      return data.data[0];
    }

    return null;
  } catch (error) {
    console.error("Error searching guest:", error);
    return null;
  }
};

// Previous Stay Modal Component
const PreviousStayModal = ({ 
  guest, 
  onClose 
}: { 
  guest: Guest | null; 
  onClose: () => void;
}) => {
  const [documents, setDocuments] = useState<GuestDocument[]>([]);
  const [previewDoc, setPreviewDoc] = useState<GuestDocument | null>(null);

  useEffect(() => {
    if (guest?._id) {
      getGuestDocuments(guest._id).then(res => {
        if (res?.success && res.data) setDocuments(res.data);
      }).catch(() => {});
    }
  }, [guest?._id]);

  if (!guest) return null;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM dd, yyyy hh:mm a");
  };

  const formatCurrency = (amount: number) => {
    return `रु${amount.toLocaleString()}`;
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4 modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-card rounded-lg p-4 sm:p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto modal-content modal-panel safe-bottom">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">
            Previous Stay Details - {guest.firstName} {guest.lastName}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-gray-700 text-2xl font-semibold p-1 touch-target-sm"
          >
            ×
          </button>
        </div>

        {/* Guest Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-primary font-medium">Total Stays</p>
              <p className="text-xl font-bold text-foreground">{guest.checkouts?.length || 0}</p>
            </div>
            <div>
              <p className="text-xs text-primary font-medium">Total Spent</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(guest.totalSpent || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-primary font-medium">Phone</p>
              <p className="text-sm font-medium text-foreground">{guest.phone}</p>
            </div>
            <div>
              <p className="text-xs text-primary font-medium">Email</p>
              <p className="text-sm font-medium text-foreground">{guest.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Previous Stays List */}
        <h3 className="text-lg font-semibold mb-4">Stay History</h3>
        <div className="space-y-4 mb-6">
          {guest.checkouts && guest.checkouts.length > 0 ? (
            guest.checkouts.map((checkout) => (
              <div key={checkout._id} className="border rounded-lg p-4 hover:bg-muted/30">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                      Checkout ID: {checkout._id.slice(-6)}
                    </span>
                    <span className="ml-2 text-sm text-muted-foreground">
                      {formatDate(checkout.createdAt)}
                    </span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    checkout.status === 'completed' ? 'bg-muted text-muted-foreground' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                  }`}>
                    {checkout.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Stay Period</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(checkout.checkInDate)} - {formatDate(checkout.checkOutDate)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{checkout.nights} night(s)</p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Rooms</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {checkout.rooms.map((room) => (
                        <span
                          key={room._id}
                          className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                        >
                          {room.roomNumber} ({room.type})
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground">Billing Summary</p>
                    <div className="space-y-1 mt-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Room Charge:</span>
                        <span className="font-medium">{formatCurrency(checkout.totalRoomCharge)}</span>
                      </div>
                      {checkout.roomDiscount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Discount:</span>
                          <span className="font-medium text-emerald-600 dark:text-emerald-400">-{formatCurrency(checkout.roomDiscount)}</span>
                        </div>
                      )}
                      {checkout.totalOrderCharge > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Orders:</span>
                          <span className="font-medium">{formatCurrency(checkout.totalOrderCharge)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold border-t pt-1 mt-1">
                        <span>Total Bill:</span>
                        <span>{formatCurrency(checkout.totalBill)}</span>
                      </div>
                      {checkout.advancePaid > 0 && (
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Advance Paid:</span>
                          <span>{formatCurrency(checkout.advancePaid)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                  <div className="flex flex-wrap gap-3">
                    <span>Payment Method: {checkout.paymentMethod}</span>
                    {checkout.advancePaymentMethod && (
                      <span>Advance Method: {checkout.advancePaymentMethod}</span>
                    )}
                    <span>Created By: {checkout.createdBy.fullName}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <p className="text-muted-foreground">No previous stay history available for this guest.</p>
            </div>
          )}
        </div>

        <div className="border-t pt-4">
          <h3 className="text-lg font-semibold mb-4">Identity Documents</h3>
          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc._id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-muted/30 rounded p-3 border gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-wrap">
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium shrink-0 ${
                      doc.documentType === 'passport' ? 'bg-blue-100 text-blue-800' :
                      doc.documentType === 'license' ? 'bg-orange-100 text-orange-800' :
                      doc.documentType === 'citizenship' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {doc.documentType}
                    </span>
                    <span className="text-sm truncate flex-1 min-w-0">{doc.fileName}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button type="button" onClick={() => setPreviewDoc(doc)} className="px-2 py-1 text-xs text-primary hover:underline touch-target-sm">View</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No documents uploaded for this guest.</p>
          )}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 touch-target"
          >
            Close
          </button>
        </div>
      </div>

      {previewDoc && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4 modal-overlay" 
          onClick={() => setPreviewDoc(null)}
        >
          <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto modal-content" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-3 border-b">
              <span className="text-sm font-medium truncate">{previewDoc.fileName}</span>
              <button onClick={() => setPreviewDoc(null)} className="text-muted-foreground hover:text-foreground touch-target-sm">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col items-center gap-4">
              {previewDoc.mimeType?.startsWith('image/') ? (
                <img
                  src={previewDoc.signedUrl || previewDoc.fileUrl}
                  alt={previewDoc.fileName}
                  className="max-w-full h-auto rounded border"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                  <span className="text-4xl">📄</span>
                  <p>Preview not available for this file type</p>
                </div>
              )}
              <a
                href={previewDoc.signedUrl || previewDoc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm touch-target"
              >
                Open in new tab
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function GuestsPage() {
  const [hotel, setHotel] = useState<any>(null);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      if (stored) setHotel(JSON.parse(stored));
    }
  }, []);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'hotel') {
        setHotel(event.newValue ? JSON.parse(event.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'warning', message: string } | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalGuests, setTotalGuests] = useState(0);

  const [guests, setGuests] = useState<Guest[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [allRooms, setAllRooms] = useState<Room[]>([]);
  const [referrers, setReferrers] = useState<Referrer[]>([]);
  const [loadingReferrers, setLoadingReferrers] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [formData, setFormData] = useState<GuestForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    idNo: "",
    occupation: "",
    vehicleNo: "",
    noOfAdditionalGuests: "0",
    additionalGuests: [],
    purposeOfStay: "",
    referrer: "",
    existingCustomer: false,
    rooms: [],
    roomDiscount: "0",
    advancePaid: "0",
    checkInDate: "",
    checkOutDate: ""
  });
  const [formLoading, setFormLoading] = useState(false);

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('passport');
  const [documentUploading, setDocumentUploading] = useState(false);
  const [guestDocuments, setGuestDocuments] = useState<GuestDocument[]>([]);
  const [previewDocument, setPreviewDocument] = useState<GuestDocument | null>(null);

  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [filters, setFilters] = useState({
    isCheckedOut: "",
    roomNumber: "",
    search: "",
    existingCustomer: "",
    hasDue: ""
  });
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  const [isSearchingGuest, setIsSearchingGuest] = useState(false);
  const [existingGuest, setExistingGuest] = useState<Guest | null>(null);
  const [guestSearchMessage, setGuestSearchMessage] = useState("");

  const [showPreviousStayModal, setShowPreviousStayModal] = useState(false);
  const [selectedGuestForHistory, setSelectedGuestForHistory] = useState<Guest | null>(null);
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const toggleRow = (id: string) => setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));

  const getRequestHeaders = (token: string) => {
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchReferrers = async () => {
    try {
      setLoadingReferrers(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/referrers?status=active`, {
        headers: getRequestHeaders(token),
      });

      if (!response.ok) throw new Error("Failed to fetch referrers");

      const data = await response.json();
      if (data.success && Array.isArray(data.data)) {
        setReferrers(data.data);
      }
    } catch (error) {
      console.error("Error fetching referrers:", error);
    } finally {
      setLoadingReferrers(false);
    }
  };

  const loadData = useCallback(async (resetPage = false, customFilters?: typeof filters) => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");

      const currentFilters = customFilters || filters;
      const currentPage = resetPage ? 1 : page;

      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', limit.toString());

      if (currentFilters.search) queryParams.append('search', currentFilters.search);
      if (currentFilters.roomNumber) queryParams.append('roomNumber', currentFilters.roomNumber);
      if (currentFilters.isCheckedOut !== "") queryParams.append('isCheckedOut', currentFilters.isCheckedOut);
      if (currentFilters.existingCustomer !== "") queryParams.append('existingCustomer', currentFilters.existingCustomer);
      if (currentFilters.hasDue !== "") queryParams.append('hasDue', currentFilters.hasDue);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/guests?${queryParams.toString()}`, {
        headers: getRequestHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch guests');
      }

      const data = await response.json();

      let guestsData: Guest[] = [];
      let totalCount = 0;
      let totalPagesCount = 0;

      if (data.success && Array.isArray(data.data)) {
        guestsData = data.data;
        totalCount = data.pagination?.total || 0;
        totalPagesCount = data.pagination?.pages || Math.ceil(totalCount / limit);
      } else if (Array.isArray(data)) {
        guestsData = data;
        totalCount = data.length;
        totalPagesCount = Math.ceil(totalCount / limit);
      } else {
        guestsData = [];
        totalCount = 0;
        totalPagesCount = 0;
      }

      setGuests(guestsData);
      setTotalPages(totalPagesCount);
      setTotalGuests(totalCount);

      if (resetPage) {
        setPage(1);
      }
    } catch (e: any) {
      setError(e.message);
      setGuests([]);
      setTotalPages(0);
      setTotalGuests(0);
    } finally {
      setLoading(false);
    }
  }, [filters, page, limit]);

  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);

    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    if (filterKey === 'search' || filterKey === 'roomNumber') {
      setSearchDebounce(setTimeout(() => {
        loadData(true, newFilters);
      }, 500));
    } else {
      loadData(true, newFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      isCheckedOut: "",
      roomNumber: "",
      search: "",
      existingCustomer: "",
      hasDue: ""
    };
    setFilters(clearedFilters);
    loadData(true, clearedFilters);
  };

  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  useEffect(() => {
    if (showForm || showPreviousStayModal) {
      document.documentElement.classList.add('modal-open');
      document.body.classList.add('modal-open');
    } else {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.documentElement.classList.remove('modal-open');
      document.body.classList.remove('modal-open');
    };
  }, [showForm, showPreviousStayModal]);

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("No authentication token");
        setLoading(false);
        return;
      }
      try {
        await loadData();
        await fetchReferrers();
      } catch (e: any) {
        setError(e.message);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    loadData(false);
  }, [page, loadData]);

  useEffect(() => {
    return () => {
      if (searchDebounce) {
        clearTimeout(searchDebounce);
      }
    };
  }, [searchDebounce]);

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      idNo: "",
      occupation: "",
      vehicleNo: "",
      noOfAdditionalGuests: "0",
      additionalGuests: [],
      purposeOfStay: "",
      referrer: "",
      existingCustomer: false,
      rooms: [],
      roomDiscount: "0",
      advancePaid: "0",
      checkInDate: getCurrentDateTimeLocal(),
      checkOutDate: ""
    });
    setEditingGuest(null);
    setExistingGuest(null);
    setGuestSearchMessage("");
    setGuestDocuments([]);
    setDocumentFile(null);
    setShowForm(false);
    setFormErrors({});
    setDocumentType('passport');
  };

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setFormData({ ...formData, phone });

    if (existingGuest) {
      setExistingGuest(null);
      setGuestSearchMessage("");
    }

    if (phone.length >= 10) {
      setIsSearchingGuest(true);
      setGuestSearchMessage("Searching for existing guest...");

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setGuestSearchMessage("Authentication error");
        setIsSearchingGuest(false);
        return;
      }

      try {
        const foundGuest = await searchGuestByPhone(phone, token);

        if (foundGuest) {
          setExistingGuest(foundGuest);
          setGuestSearchMessage("Existing guest found! Auto-populating details...");

          setFormData(prev => ({
            ...prev,
            firstName: foundGuest.firstName || "",
            lastName: foundGuest.lastName || "",
            email: foundGuest.email || "",
            address: foundGuest.address || "",
            idNo: foundGuest.idNo || "",
            occupation: foundGuest.occupation || "",
            vehicleNo: foundGuest.vehicleNo || "",
            purposeOfStay: foundGuest.purposeOfStay || "",
            referrer: foundGuest.referrer || "",
            existingCustomer: foundGuest.existingCustomer || false,
          }));

          fetchGuestDocuments(foundGuest._id);
        } else {
          setGuestSearchMessage("New guest - please fill in details");
        }
      } catch (error) {
        setGuestSearchMessage("Error searching for guest");
      } finally {
        setIsSearchingGuest(false);
      }
    }
  };

  const handlePhoneBlur = async () => {
    if (formData.phone.length >= 10 && !existingGuest) {
      setIsSearchingGuest(true);
      setGuestSearchMessage("Searching for existing guest...");

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setGuestSearchMessage("Authentication error");
        setIsSearchingGuest(false);
        return;
      }

      try {
        const foundGuest = await searchGuestByPhone(formData.phone, token);

        if (foundGuest) {
          setExistingGuest(foundGuest);
          setGuestSearchMessage("Existing guest found! Auto-populating details...");

          setFormData(prev => ({
            ...prev,
            firstName: foundGuest.firstName || "",
            lastName: foundGuest.lastName || "",
            email: foundGuest.email || "",
            address: foundGuest.address || "",
            idNo: foundGuest.idNo || "",
            occupation: foundGuest.occupation || "",
            vehicleNo: foundGuest.vehicleNo || "",
            purposeOfStay: foundGuest.purposeOfStay || "",
            referrer: foundGuest.referrer || "",
            existingCustomer: foundGuest.existingCustomer || false,
          }));

          fetchGuestDocuments(foundGuest._id);
        } else {
          setGuestSearchMessage("New guest - please fill in details");
        }
      } catch (error) {
        setGuestSearchMessage("Error searching for guest");
      } finally {
        setIsSearchingGuest(false);
      }
    }
  };

  const clearGuestSearch = () => {
    setExistingGuest(null);
    setGuestSearchMessage("");
    setGuestDocuments([]);
    setDocumentFile(null);
    setFormData(prev => ({
      ...prev,
      firstName: "",
      lastName: "",
      email: "",
      address: "",
      idNo: "",
      occupation: "",
      vehicleNo: "",
      purposeOfStay: "",
      referrer: "",
    }));
  };

  const fetchGuestDocuments = async (guestId: string) => {
    try {
      const res = await getGuestDocuments(guestId);
      if (res?.success && Array.isArray(res.data)) {
        setGuestDocuments(res.data);
      }
    } catch (err) {
      console.error('Error fetching guest documents:', err);
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentFile || !editingGuest && !existingGuest) return;
    const guestId = editingGuest?._id || existingGuest?._id;
    if (!guestId) return;

    setDocumentUploading(true);
    try {
      const res = await uploadGuestDocument(guestId, documentFile, documentType);
      if (res?.success) {
        await fetchGuestDocuments(guestId);
        setDocumentFile(null);
        setNotification({ type: 'success', message: 'Document uploaded successfully' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to upload document' });
    } finally {
      setDocumentUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    const guestId = editingGuest?._id || existingGuest?._id;
    if (!guestId) return;
    try {
      await deleteGuestDocument(guestId, docId);
      setGuestDocuments(prev => prev.filter(d => d._id !== docId));
      setNotification({ type: 'success', message: 'Document deleted' });
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to delete document' });
    }
  };

  const handleViewPreviousStays = (guest: Guest) => {
    setSelectedGuestForHistory(guest);
    setShowPreviousStayModal(true);
  };

  const handleClosePreviousStayModal = () => {
    setShowPreviousStayModal(false);
    setSelectedGuestForHistory(null);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const now = new Date();
    const isAdmin = user?.role === 'manager' || user?.role === 'super_admin';

    if (!formData.checkInDate) {
      errors.checkInDate = "Check-in date is required";
    } else {
      const originalDate = new Date(formData.checkInDate);
      const checkInDate = new Date(originalDate.getTime() + (5 * 60 * 1000));
      if (!editingGuest && checkInDate < now) {
        if (isAdmin) {
          const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
          if (checkInDate < oneWeekAgo) {
            errors.checkInDate = "Check-in date cannot be more than 7 days in the past";
          }
        } else {
          errors.checkInDate = "Check-in date cannot be in the past";
        }
      }
    }

    if (formData.checkOutDate && formData.checkInDate) {
      const originalDate = new Date(formData.checkInDate);
      const checkInDate = new Date(originalDate.getTime() + (5 * 60 * 1000));
      const checkOutDate = new Date(formData.checkOutDate);
      if (checkOutDate <= checkInDate) {
        errors.checkOutDate = "Check-out date must be after check-in date";
      }
    }

    if (!formData.rooms || formData.rooms.length === 0) {
      errors.rooms = "At least one room must be selected";
    }

    const roomDiscountValue = parseFloat(formData.roomDiscount || '0');
    const advancePaidValue = parseFloat(formData.advancePaid || '0');
    if (isNaN(roomDiscountValue) || roomDiscountValue < 0) {
      errors.roomDiscount = "Room discount must be a non-negative number";
    }
    if (isNaN(advancePaidValue) || advancePaidValue < 0) {
      errors.advancePaid = "Advance paid must be a non-negative number";
    }

    const emailValue = formData.email || '';
    if (emailValue.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        errors.email = "Please enter a valid email address";
      }
    }

    if (formData.phone.length < 10) {
      errors.phone = "Phone number should be at least 10 digits";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setNotification({ type: 'error', message: 'Please fix the validation errors' });
      return;
    }

    setFormLoading(true);
    try {
      let resp;

      const validAdditionalGuests: AdditionalGuest[] = [];

      if (formData.additionalGuests && Array.isArray(formData.additionalGuests)) {
        for (const guest of formData.additionalGuests) {
          if (guest && typeof guest === 'object') {
            const name = guest.name || '';
            const relationship = guest.relationship || '';

            if (typeof name === 'string' &&
              typeof relationship === 'string' &&
              name.trim() !== '' &&
              relationship.trim() !== '') {
              validAdditionalGuests.push({
                name: name.trim(),
                gender: guest.gender || 'male',
                relationship: relationship.trim()
              });
            }
          }
        }
      }

      const additionalGuestsCount = validAdditionalGuests.length;

      if (editingGuest) {
        const roomNumbers = formData.rooms.map(resolveRoomNumberFromId);
        let hotelId = '';

        try {
          if (user?.hotel) {
            hotelId = typeof user.hotel === 'string' ? user.hotel : user.hotel._id || user.hotel.id || '';
          }

          if (!hotelId) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              try {
                const userData = JSON.parse(storedUser);
                if (userData.hotel) {
                  hotelId = typeof userData.hotel === 'string' ? userData.hotel : userData.hotel._id || userData.hotel.id || '';
                }
              } catch (parseError) {
                console.error('Error parsing user data from localStorage:', parseError);
              }
            }
          }

          if (!hotelId) {
            console.warn('Hotel ID not found in context or localStorage, fetching fresh user data...');
            try {
              const freshUserData = await getMe();
              if (freshUserData?.data?.hotel) {
                const hotelField = freshUserData.data.hotel;
                hotelId = typeof hotelField === 'string' ? hotelField : hotelField._id || hotelField.id || '';
              }
            } catch (fetchError) {
              console.error('Error fetching user data:', fetchError);
            }
          }
        } catch (e) {
          console.error('Error retrieving hotel ID:', e);
        }

        if (!hotelId) {
          throw new Error("Hotel ID is required. Please contact your administrator. Make sure you are logged in properly.");
        }

        const updatePayload: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          idNo: formData.idNo || undefined,
          occupation: formData.occupation || undefined,
          vehicleNo: formData.vehicleNo || undefined,
          noOfAdditionalGuests: additionalGuestsCount,
          additionalGuests: validAdditionalGuests,
          purposeOfStay: formData.purposeOfStay || undefined,
          referrer: formData.referrer || undefined,
          existingCustomer: formData.existingCustomer,
          rooms: roomNumbers,
          hotel: hotelId,
          checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined,
          roomDiscount: parseFloat(formData.roomDiscount || '0') || 0,
          advancePaid: parseFloat(formData.advancePaid || '0') || 0,
        };

        const emailValue = formData.email || '';
        if (emailValue.trim() !== '') {
          updatePayload.email = emailValue;
        }

        resp = await updateGuest(editingGuest._id, updatePayload);
        
          if (documentFile && resp?.data?._id) {
            try {
              setDocumentUploading(true);
              const docRes = await uploadGuestDocument(resp.data._id, documentFile, documentType);
              if (docRes?.success) {
                setDocumentFile(null);
                await fetchGuestDocuments(resp.data._id);
              }
            } catch (docErr) {
              console.error('Document upload failed:', docErr);
              setNotification({ type: 'warning', message: 'Guest updated but document upload failed. You can try again.' });
            } finally {
              setDocumentUploading(false);
            }
          }
      } else {
        const roomNumbers = formData.rooms.map(resolveRoomNumberFromId);
        let hotelId = '';

        try {
          if (user?.hotel) {
            hotelId = typeof user.hotel === 'string' ? user.hotel : user.hotel._id || user.hotel.id || '';
          }

          if (!hotelId) {
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              try {
                const userData = JSON.parse(storedUser);
                if (userData.hotel) {
                  hotelId = typeof userData.hotel === 'string' ? userData.hotel : userData.hotel._id || userData.hotel.id || '';
                }
              } catch (parseError) {
                console.error('Error parsing user data from localStorage:', parseError);
              }
            }
          }

          if (!hotelId) {
            console.warn('Hotel ID not found in context or localStorage, fetching fresh user data...');
            try {
              const freshUserData = await getMe();
              if (freshUserData?.data?.hotel) {
                const hotelField = freshUserData.data.hotel;
                hotelId = typeof hotelField === 'string' ? hotelField : hotelField._id || hotelField.id || '';
              }
            } catch (fetchError) {
              console.error('Error fetching user data:', fetchError);
            }
          }
        } catch (e) {
          console.error('Error retrieving hotel ID:', e);
        }

        if (!hotelId) {
          throw new Error("Hotel ID is required. Please contact your administrator. Make sure you are logged in properly.");
        }

        const createPayload: any = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          idNo: formData.idNo || undefined,
          occupation: formData.occupation || undefined,
          vehicleNo: formData.vehicleNo || undefined,
          noOfAdditionalGuests: additionalGuestsCount,
          additionalGuests: validAdditionalGuests,
          purposeOfStay: formData.purposeOfStay || undefined,
          referrer: formData.referrer || undefined,
          existingCustomer: formData.existingCustomer,
          rooms: roomNumbers,
          hotel: hotelId,
          checkInDate: new Date(formData.checkInDate).toISOString(),
          checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined,
          roomDiscount: parseFloat(formData.roomDiscount || '0') || 0,
          advancePaid: parseFloat(formData.advancePaid || '0') || 0,
        };

        const emailValue = formData.email || '';
        createPayload.email = emailValue.trim() !== '' ? emailValue : 'noemail@gmail.com';

        resp = await createGuest(createPayload);

        if (documentFile && resp?.data?._id) {
          try {
            setDocumentUploading(true);
            const docRes = await uploadGuestDocument(resp.data._id, documentFile, documentType);
            if (docRes?.success) {
              setDocumentFile(null);
            }
          } catch (docErr) {
            console.error('Document upload failed:', docErr);
            setNotification({ type: 'warning', message: 'Guest created but document upload failed. You can try again.' });
          } finally {
            setDocumentUploading(false);
          }
        }
      }

      await loadData(true);
      resetForm();
      if (!documentFile) {
        setNotification({ type: 'success', message: editingGuest ? 'Guest updated successfully!' : 'Guest created successfully!' });
      }
    } catch (e: any) {
      if (e.response && e.response.data && e.response.data.details) {
        const errorDetails = e.response.data.details;
        const fieldMatch = errorDetails.match(/\"(\w+)\"/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          setFormErrors({ [fieldName]: errorDetails });
        }
        setNotification({ type: 'error', message: 'Validation error - please check the form' });
      } else {
        setError(e.message);
        setNotification({ type: 'error', message: e.message || 'Operation failed' });
      }
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = async (guest: Guest) => {
    try {
      setEditingGuest(guest);
      const normalizedRooms = normalizeGuestRoomIds(guest);

      const formDataUpdate = {
        firstName: guest.firstName || "",
        lastName: guest.lastName || "",
        email: guest.email || "",
        phone: guest.phone || "",
        address: guest.address || "",
        idNo: guest.idNo || "",
        occupation: guest.occupation || "",
        vehicleNo: guest.vehicleNo || "",
        purposeOfStay: guest.purposeOfStay || "",
        referrer: guest.referrer || "",
        roomDiscount: guest.roomDiscount ? guest.roomDiscount.toString() : "0",
        advancePaid: guest.advancePaid ? guest.advancePaid.toString() : "0",
        checkInDate: guest.checkInDate ? format(new Date(guest.checkInDate), "yyyy-MM-dd'T'HH:mm") : "",
        checkOutDate: guest.checkOutDate ? format(new Date(guest.checkOutDate), "yyyy-MM-dd'T'HH:mm") : "",
        rooms: normalizedRooms,
      };

      const additionalGuests = guest.additionalGuests || [];
      const noOfAdditionalGuests = additionalGuests.length.toString();

      setFormData(prev => ({
        ...prev,
        ...formDataUpdate,
        noOfAdditionalGuests,
        additionalGuests,
      }));

      setFormErrors({});

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms?page=1&limit=100`, {
          headers: getRequestHeaders(token),
        });
        if (res.ok) {
          const response = await res.json();
          let allRoomsData: Room[] = [];
          if (response && isAPIResponse<Room[]>(response)) {
            allRoomsData = Array.isArray(response.data) ? response.data : [];
          } else if (Array.isArray(response)) {
            allRoomsData = response;
          }
          setAvailableRooms(allRoomsData);
          setAllRooms(allRoomsData);
        }
      }

      await fetchReferrers();

      if (guest._id) {
        fetchGuestDocuments(guest._id);
      }

      setShowForm(true);
    } catch (error) {
      console.error("Error in handleEdit:", error);
      setNotification({ type: 'error', message: 'Failed to load guest data for editing' });
    }
  };

  const handleAddNewGuest = async () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      idNo: "",
      occupation: "",
      vehicleNo: "",
      noOfAdditionalGuests: "0",
      additionalGuests: [],
      purposeOfStay: "",
      referrer: "",
      existingCustomer: false,
      rooms: [],
      roomDiscount: "0",
      advancePaid: "0",
      checkInDate: getCurrentDateTimeLocal(),
      checkOutDate: ""
    });
    setFormErrors({});
    setExistingGuest(null);
    setGuestSearchMessage("");
    setGuestDocuments([]);
    setDocumentFile(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms/available`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Origin': window.location.origin
        },
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error('Response error:', res.status, errorText);
        throw new Error(`Failed to fetch available rooms: ${res.status}`);
      }
      
      const response = await res.json();

      let availableRoomsData: Room[] = [];
      if (response && response.data && response.data.rooms) {
        availableRoomsData = Array.isArray(response.data.rooms) ? response.data.rooms : [];
      } else if (response && isAPIResponse<Room[]>(response)) {
        availableRoomsData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        availableRoomsData = response;
      }
      setAvailableRooms(availableRoomsData);

      await fetchReferrers();
    } catch (e) {
      console.error('Error fetching available rooms:', e);
      setAvailableRooms([]);
      setNotification({ type: 'error', message: 'Failed to load available rooms' });
    }
    setShowForm(true);
  };

  const handleCheckInDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newCheckInDate = e.target.value;
    setFormData(prev => ({
      ...prev,
      checkInDate: newCheckInDate,
      checkOutDate: prev.checkOutDate && new Date(prev.checkOutDate) <= new Date(newCheckInDate) ? "" : prev.checkOutDate
    }));
    if (formErrors.checkInDate) {
      setFormErrors(prev => ({ ...prev, checkInDate: "" }));
    }
  };

  const handleCheckOutDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, checkOutDate: e.target.value }));
    if (formErrors.checkOutDate) {
      setFormErrors(prev => ({ ...prev, checkOutDate: "" }));
    }
  };

  const handleAdditionalGuestChange = (index: number, field: keyof AdditionalGuest, value: string) => {
    const updatedGuests = [...(formData.additionalGuests || [])];

    while (updatedGuests.length <= index) {
      updatedGuests.push({ name: '', gender: 'male', relationship: '' });
    }

    if (!updatedGuests[index]) {
      updatedGuests[index] = { name: '', gender: 'male', relationship: '' };
    }

    updatedGuests[index] = { ...updatedGuests[index], [field]: value };
    setFormData(prev => ({ ...prev, additionalGuests: updatedGuests }));
  };

  const addAdditionalGuest = () => {
    setFormData(prev => ({
      ...prev,
      additionalGuests: [...(prev.additionalGuests || []), { name: '', gender: 'male', relationship: '' }],
      noOfAdditionalGuests: (parseInt(prev.noOfAdditionalGuests) + 1).toString()
    }));
  };

  const removeAdditionalGuest = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalGuests: (prev.additionalGuests || []).filter((_, i) => i !== index),
      noOfAdditionalGuests: Math.max(0, parseInt(prev.noOfAdditionalGuests) - 1).toString()
    }));
  };

  const getMinCheckOutDateTime = () => {
    if (!formData.checkInDate) return getCurrentDateTimeLocal();
    const checkInDate = new Date(formData.checkInDate);
    checkInDate.setHours(checkInDate.getHours() + 1);
    return format(checkInDate, "yyyy-MM-dd'T'HH:mm");
  };

  const getRoomNumberFromGuest = (guest: Guest, roomId: string): string => {
    if (guest.checkouts) {
      for (const checkout of guest.checkouts) {
        const foundRoom = checkout.rooms.find(room => room._id === roomId);
        if (foundRoom) {
          return foundRoom.roomNumber;
        }
      }
    }
    const room = allRooms.find(r => r._id === roomId);
    return room ? room.roomNumber : roomId;
  };

  const normalizeGuestRoomIds = (guest: Guest): string[] => {
    const result: string[] = [];
    const allById = new Map(allRooms.map(r => [r._id, r]));
    const allByNumber = new Map(allRooms.map(r => [r.roomNumber, r]));
    const checkoutById = new Map<string, string>();
    const checkoutByNumberToId = new Map<string, string>();

    if (guest.checkouts) {
      for (const co of guest.checkouts) {
        for (const r of co.rooms) {
          checkoutById.set(r._id, r.roomNumber);
          checkoutByNumberToId.set(r.roomNumber, r._id);
        }
      }
    }

    for (const value of guest.rooms || []) {
      if (allById.has(value)) {
        result.push(value);
        continue;
      }
      const asIdFromCheckout = checkoutByNumberToId.get(value);
      if (asIdFromCheckout) {
        result.push(asIdFromCheckout);
        continue;
      }
      const byNumber = allByNumber.get(value);
      if (byNumber) {
        result.push(byNumber._id);
        continue;
      }
      result.push(value);
    }
    return Array.from(new Set(result));
  };

  const resolveRoomNumberFromId = (roomId: string): string => {
    const inAll = allRooms.find(r => r._id === roomId);
    if (inAll) return inAll.roomNumber;
    const inAvailable = availableRooms.find(r => r._id === roomId);
    if (inAvailable) return inAvailable.roomNumber;
    const inRoomsList = rooms.find(r => r._id === roomId);
    if (inRoomsList) return inRoomsList.roomNumber;
    if (editingGuest?.checkouts) {
      for (const checkout of editingGuest.checkouts) {
        const found = checkout.rooms.find(r => r._id === roomId);
        if (found) return found.roomNumber;
      }
    }
    return roomId;
  };

  if (loading && guests.length === 0) return (
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
      <div className="p-6">

        {/* Filter and Search Section */}
        <div className="bg-card rounded-xl border border-border p-3 mb-5">
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                placeholder="Search guests..."
                data-cy="guests-search"
              />
              {filters.search && (
                <button
                  onClick={() => handleFilterChange('search', '')}
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
              onClick={handleAddNewGuest}
              className="shrink-0 h-9 px-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              data-cy="guests-add-new"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {showMobileFilters && (
            <div className="mt-3 space-y-2 md:hidden">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={filters.roomNumber}
                  onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
                  className="w-full h-9 pl-8 pr-3 bg-muted/50 border border-input rounded-lg text-sm"
                  placeholder="Room #..."
                  data-cy="guests-room-filter"
                />
                {filters.roomNumber && (
                  <button
                    onClick={() => handleFilterChange('roomNumber', '')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <select
                value={filters.existingCustomer}
                onChange={(e) => handleFilterChange('existingCustomer', e.target.value)}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm max-w-full truncate"
                data-cy="guests-customer-filter"
              >
                <option value="">All Customers</option>
                <option value="true">Existing</option>
                <option value="false">New</option>
              </select>
              <select
                value={filters.hasDue}
                onChange={(e) => handleFilterChange('hasDue', e.target.value)}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm max-w-full truncate"
                data-cy="guests-due-filter"
              >
                <option value="">Any Dues</option>
                <option value="true">Has Due</option>
                <option value="false">No Due</option>
              </select>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => setShowMobileSummary(!showMobileSummary)}
                  className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-xs font-medium flex items-center gap-1.5"
                >
                  <Info className="w-3.5 h-3.5" />
                  {showMobileSummary ? 'Hide' : 'Show'} Stats
                </button>
                {(filters.search || filters.roomNumber || filters.existingCustomer || filters.hasDue) && (
                  <button onClick={clearFilters} className="text-xs font-medium text-primary hover:text-primary/80 ml-auto shrink-0" data-cy="guests-clear-filters">
                    Clear
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="hidden md:flex items-start gap-3">
            <div className="flex items-center gap-3 flex-nowrap overflow-x-auto flex-1 min-w-0">
              <div className="relative flex-1 min-w-[160px] max-w-xs shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                  placeholder="Search guests..."
                  data-cy="guests-search"
                />
                {filters.search && (
                  <button
                    onClick={() => handleFilterChange('search', '')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="relative min-w-[120px] shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                <input
                  type="text"
                  value={filters.roomNumber}
                  onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
                  className="w-full h-9 pl-8 pr-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                  placeholder="Room #..."
                  data-cy="guests-room-filter"
                />
                {filters.roomNumber && (
                  <button
                    onClick={() => handleFilterChange('roomNumber', '')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <select
                value={filters.existingCustomer}
                onChange={(e) => handleFilterChange('existingCustomer', e.target.value)}
                className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[120px] shrink-0"
                data-cy="guests-customer-filter"
              >
                <option value="">All Customers</option>
                <option value="true">Existing</option>
                <option value="false">New</option>
              </select>
              <select
                value={filters.hasDue}
                onChange={(e) => handleFilterChange('hasDue', e.target.value)}
                className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[110px] shrink-0"
                data-cy="guests-due-filter"
              >
                <option value="">Any Dues</option>
                <option value="true">Has Due</option>
                <option value="false">No Due</option>
              </select>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowMobileSummary(!showMobileSummary)}
                className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-xs font-medium flex items-center gap-1.5 shrink-0"
                title={showMobileSummary ? 'Hide Stats' : 'Show Stats'}
              >
                <Info className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">{showMobileSummary ? 'Hide' : 'Show'} Stats</span>
              </button>
              {(filters.search || filters.roomNumber || filters.existingCustomer || filters.hasDue) && (
                <button onClick={clearFilters} className="text-xs font-medium text-primary hover:text-primary/80 shrink-0 whitespace-nowrap" data-cy="guests-clear-filters">
                  Clear
                </button>
              )}
              <button
                onClick={handleAddNewGuest}
                className="shrink-0 h-9 px-4 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-1.5"
                data-cy="guests-add-new"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden lg:inline">Add Guest</span>
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-5 py-3 rounded-lg flex items-center justify-between mb-5">
            <span>{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:bg-destructive/10 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5 ${showMobileSummary ? '' : 'hidden'} md:grid`}>
          <div className="bg-blue-100/60 rounded-lg p-3 text-center">
            <div className="text-blue-700 text-xs font-semibold">Total Guests</div>
            <div className="text-xl font-bold text-blue-900">{totalGuests}</div>
          </div>
          <div className="bg-emerald-100/60 rounded-lg p-3 text-center">
            <div className="text-emerald-700 text-xs font-semibold">Currently Staying</div>
            <div className="text-xl font-bold text-emerald-900">{guests.filter((g: any) => !g.isCheckedOut).length}</div>
          </div>
          <div className="bg-muted/60 rounded-lg p-3 text-center">
            <div className="text-muted-foreground text-xs font-semibold">Checked Out</div>
            <div className="text-xl font-bold text-muted-foreground">{guests.filter((g: any) => g.isCheckedOut).length}</div>
          </div>
          <div className="bg-indigo-100/60 rounded-lg p-3 text-center">
            <div className="text-indigo-700 text-xs font-semibold">Available Rooms</div>
            <div className="text-xl font-bold text-indigo-900">{availableRooms.filter((r: any) => !r.isOccupied).length}</div>
          </div>
        </div>

        {loading && (
          <div className="bg-primary/5 border border-primary/20 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            Loading guests...
          </div>
        )}

        {/* Guest Form Modal */}
        {showForm && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto modal-overlay"
            onClick={(e) => {
              if (e.target === e.currentTarget) resetForm();
            }}
          >
            <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl my-2 sm:my-8 max-h-[98vh] sm:max-h-[90vh] overflow-y-auto relative modal-content modal-panel safe-bottom">
              <div className="sticky top-0 bg-card border-b px-4 sm:px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-lg sm:text-xl font-semibold">
                  {editingGuest ? "Edit Guest" : "Add New Guest"}
                </h2>
                <button
                  onClick={resetForm}
                  className="text-muted-foreground hover:text-gray-700 text-2xl font-semibold p-1 touch-target-sm"
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              
              <div className="p-4 sm:p-6 pb-8 sm:pb-6 safe-bottom">
                {existingGuest && (
                  <div className="bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 rounded p-4 mb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <p className="text-green-800 font-medium text-lg">
                          Existing Guest Found
                        </p>
                        <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                          {existingGuest.firstName} {existingGuest.lastName} - 
                          Previous stays: {existingGuest.checkouts?.length || 0} | 
                          Total spent: रु{existingGuest.totalSpent?.toLocaleString() || 0}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleViewPreviousStays(existingGuest)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm touch-target"
                        >
                          View Previous Stays
                        </button>
                        <button
                          type="button"
                          onClick={clearGuestSearch}
                          className="px-4 py-2 border border-green-600 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-green-50 text-sm touch-target"
                        >
                          Clear & Start New
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone[Search for old Guest] *</label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          onBlur={handlePhoneBlur}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          required
                          disabled={isSearchingGuest || !!editingGuest}
                          placeholder="Enter 10-digit phone number"
                          data-cy="guests-form-phone"
                        />
                        {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
                        {guestSearchMessage && (
                          <p className={`text-sm mt-1 ${existingGuest ? 'text-emerald-600 dark:text-emerald-400' :
                              isSearchingGuest ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                            {isSearchingGuest && (
                              <span className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></span>
                            )}
                            {guestSearchMessage}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">First Name *</label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          required
                          data-cy="guests-form-first-name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Last Name *</label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          required
                          data-cy="guests-form-last-name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          placeholder="Optional"
                          data-cy="guests-form-email"
                        />
                        {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Address</label>
                        <textarea
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base"
                          rows={2}
                          data-cy="guests-address"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Additional Information</h3>
                      <div>
                        <label className="block text-sm font-medium mb-1">ID Number</label>
                        <input
                          type="text"
                          value={formData.idNo}
                          onChange={(e) => setFormData({ ...formData, idNo: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          data-cy="guests-idno"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Occupation</label>
                        <input
                          type="text"
                          value={formData.occupation}
                          onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          data-cy="guests-occupation"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                        <input
                          type="text"
                          value={formData.vehicleNo}
                          onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          data-cy="guests-vehicleno"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Purpose of Stay</label>
                        <input
                          type="text"
                          value={formData.purposeOfStay}
                          onChange={(e) => setFormData({ ...formData, purposeOfStay: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          data-cy="guests-purpose"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Referrer</label>
                        <select
                          value={formData.referrer}
                          onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base max-w-full truncate touch-target"
                        >
                          <option value="">Select a referrer (optional)</option>
                          {loadingReferrers ? (
                            <option disabled>Loading referrers...</option>
                          ) : (
                            referrers.map((referrer) => (
                              <option key={referrer._id} value={referrer._id}>
                                {referrer.fullName} - {referrer.taxiNo || 'No taxi'}
                              </option>
                            ))
                          )}
                        </select>
                        {referrers.length === 0 && !loadingReferrers && (
                          <p className="text-sm text-muted-foreground mt-1">No referrers available. Add referrers first.</p>
                        )}
                      </div>
                      <div>
                        <label className="flex items-center text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={formData.existingCustomer}
                            onChange={(e) => setFormData({ ...formData, existingCustomer: e.target.checked })}
                            className="mr-2 h-4 w-4 border-input rounded touch-target"
                            data-cy="guests-existing-customer"
                          />
                          Existing Customer (Enable Due Management)
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold mb-3">Documents</h3>
                    <div className="space-y-3">
                      {guestDocuments.length > 0 ? (
                        <div className="space-y-2">
                          {guestDocuments.map(doc => (
                            <div key={doc._id} className="flex items-center justify-between bg-muted/30 rounded p-3 border gap-2">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium shrink-0 ${
                                  doc.documentType === 'passport' ? 'bg-blue-100 text-blue-800' :
                                  doc.documentType === 'license' ? 'bg-orange-100 text-orange-800' :
                                  doc.documentType === 'citizenship' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {doc.documentType}
                                </span>
                                <span className="text-sm truncate">{doc.fileName}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <button type="button" onClick={() => setPreviewDocument(doc)} className="px-2 py-1 text-xs text-primary hover:underline touch-target-sm">View</button>
                                {(user?.role === 'super_admin' || user?.role === 'manager') && (
                                  <button type="button" onClick={() => handleDeleteDocument(doc._id)} className="px-2 py-1 text-xs text-red-600 hover:underline touch-target-sm">Delete</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                      )}
                      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                        <div className="flex-1 w-full">
                          <label className="block text-sm font-medium mb-1">Upload Document</label>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                            className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 cursor-pointer touch-target"
                          />
                        </div>
                        <div className="w-full sm:w-32">
                          <label className="block text-sm font-medium mb-1">Type</label>
                          <select
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="w-full border border-input rounded px-3 py-2 text-sm touch-target"
                          >
                            <option value="passport">Passport</option>
                            <option value="license">License</option>
                            <option value="citizenship">Citizenship</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                        <button
                          type="button"
                          onClick={handleDocumentUpload}
                          disabled={!documentFile || documentUploading}
                          className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm touch-target"
                        >
                          {documentUploading ? "Uploading..." : "Upload"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                      <h3 className="text-lg font-semibold">Additional Guests</h3>
                      <button
                        type="button"
                        onClick={addAdditionalGuest}
                        className="w-full sm:w-auto px-3 py-1.5 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200 transition-colors touch-target"
                      >
                        + Add Guest
                      </button>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      Total additional guests: {(formData.additionalGuests || []).filter(
                        guest => guest != null &&
                          typeof guest === 'object' &&
                          (guest.name || '').trim() !== '' &&
                          (guest.relationship || '').trim() !== ''
                      ).length}
                    </div>
                    {(formData.additionalGuests || []).map((guest, index) => {
                      const safeGuest = guest || { name: '', gender: 'male', relationship: '' };
                      return (
                        <div key={index} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4 p-3 border rounded">
                          <div>
                            <label className="block text-sm font-medium mb-1">Name</label>
                            <input
                              type="text"
                              value={safeGuest.name || ''}
                              onChange={(e) => handleAdditionalGuestChange(index, 'name', e.target.value)}
                              className="w-full border border-input rounded px-3 py-2 text-sm touch-target"
                              placeholder="Guest name"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Gender</label>
                            <select
                              value={safeGuest.gender || 'male'}
                              onChange={(e) => handleAdditionalGuestChange(index, 'gender', e.target.value)}
                              className="w-full border border-input rounded px-3 py-2 text-sm max-w-full truncate touch-target"
                            >
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:col-span-1">
                            <div className="flex-1">
                              <label className="block text-sm font-medium mb-1">Relationship</label>
                              <input
                                type="text"
                                value={safeGuest.relationship || ''}
                                onChange={(e) => handleAdditionalGuestChange(index, 'relationship', e.target.value)}
                                className="w-full border border-input rounded px-3 py-2 text-sm touch-target"
                                placeholder="Relationship"
                              />
                            </div>
                            <div className="flex items-end sm:items-center pb-0.5">
                              <button
                                type="button"
                                onClick={() => removeAdditionalGuest(index)}
                                className="w-full sm:w-auto px-3 py-2 text-destructive hover:text-destructive/80 text-sm font-medium border border-destructive/20 rounded hover:bg-destructive/5 transition-colors touch-target"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Room Information</h3>
                      <div>
                        <label className="block text-sm font-medium mb-1">Select Rooms *</label>
                        <div className="border border-input rounded max-h-60 sm:max-h-72 overflow-y-auto">
                          {(editingGuest ? allRooms : availableRooms.filter(r => !r.isOccupied)).map((room) => {
                            const isSelected = formData.rooms.includes(room._id);
                            const isOccupiedElse = room.isOccupied && !formData.rooms.includes(room._id);
                            return (
                              <div
                                key={room._id}
                                onClick={() => {
                                  if (isOccupiedElse) return;
                                  setFormData(prev => ({
                                    ...prev,
                                    rooms: isSelected
                                      ? prev.rooms.filter(id => id !== room._id)
                                      : [...prev.rooms, room._id]
                                  }));
                                }}
                                data-cy="guests-rooms"
                                className={`flex items-center gap-2 sm:gap-3 px-3 py-2.5 sm:py-2.5 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors touch-target
                                  ${isSelected ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-muted/50'}
                                  ${isOccupiedElse ? 'text-gray-400 cursor-not-allowed' : ''}
                                `}
                              >
                                <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center flex-shrink-0
                                  ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}
                                  ${isOccupiedElse ? 'border-gray-200' : ''}
                                `}>
                                  {isSelected && (
                                    <svg className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-baseline gap-1.5 sm:gap-2 flex-wrap">
                                    <span className="font-semibold text-sm sm:text-base">#{room.roomNumber}</span>
                                    <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">{room.type}</span>
                                    <span className="text-xs sm:text-sm text-muted-foreground ml-auto">रु{room.rate}/night</span>
                                  </div>
                                  <div className="text-xs text-muted-foreground sm:hidden">{room.type}</div>
                                </div>
                                {isOccupiedElse && (
                                  <span className="text-xs text-gray-400 flex-shrink-0">Occupied</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {formErrors.rooms && <p className="text-red-500 text-sm">{formErrors.rooms}</p>}
                        <p className="text-sm text-muted-foreground mt-1">Click to select/deselect rooms</p>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {editingGuest && (
                            <p>
                              <span className="font-semibold">Note:</span> You can deselect rooms to de-allocate them from this guest.
                              Grayed out rooms are currently occupied by other guests.
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Room Discount (रु)</label>
                        <input
                          type="number"
                          value={formData.roomDiscount}
                          onChange={(e) => setFormData({ ...formData, roomDiscount: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          min="0"
                          step="0.01"
                          data-cy="guests-roomdiscount"
                        />
                        {formErrors.roomDiscount && <p className="text-red-500 text-sm">{formErrors.roomDiscount}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Advance Paid (रु)</label>
                        <input
                          type="number"
                          value={formData.advancePaid}
                          onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          min="0"
                          step="0.01"
                          data-cy="guests-advancepaid"
                        />
                        {formErrors.advancePaid && <p className="text-red-500 text-sm">{formErrors.advancePaid}</p>}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Stay Information</h3>
                      <div>
                        <label className="block text-sm font-medium mb-1">Check-in Date *</label>
                        <input
                          type="datetime-local"
                          value={formData.checkInDate}
                          onChange={handleCheckInDateChange}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          required
                          data-cy="guests-checkin"
                        />
                        {formErrors.checkInDate && <p className="text-red-500 text-sm">{formErrors.checkInDate}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Check-out Date</label>
                        <input
                          type="datetime-local"
                          value={formData.checkOutDate || ''}
                          onChange={handleCheckOutDateChange}
                          min={getMinCheckOutDateTime()}
                          className="w-full border border-input rounded px-3 py-2 text-sm sm:text-base touch-target"
                          data-cy="guests-checkout"
                        />
                        {formErrors.checkOutDate && <p className="text-red-500 text-sm">{formErrors.checkOutDate}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-4 border-t mt-4 sticky bottom-0 bg-card pb-2 sm:pb-0 safe-bottom">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 border border-input rounded-lg hover:bg-muted/30 transition-colors text-sm font-medium touch-target"
                      data-cy="guests-form-cancel"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={formLoading}
                      className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors text-sm font-medium touch-target"
                      data-cy="guests-form-submit"
                    >
                      {formLoading ? "Saving..." : editingGuest ? "Update Guest" : "Add Guest"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Document Preview */}
        {previewDocument && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[70] p-4 modal-overlay" onClick={() => setPreviewDocument(null)}>
            <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto modal-content" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-card z-10 flex items-center justify-between p-3 border-b">
                <span className="text-sm font-medium truncate">{previewDocument.fileName}</span>
                <button onClick={() => setPreviewDocument(null)} className="text-muted-foreground hover:text-foreground touch-target-sm">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 flex flex-col items-center gap-4">
                {previewDocument.mimeType?.startsWith('image/') ? (
                  <img
                    src={previewDocument.signedUrl || previewDocument.fileUrl}
                    alt={previewDocument.fileName}
                    className="max-w-full h-auto rounded border"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
                    <span className="text-4xl">📄</span>
                    <p>Preview not available for this file type</p>
                  </div>
                )}
                <a
                  href={previewDocument.signedUrl || previewDocument.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm touch-target"
                >
                  Open in new tab
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Previous Stay Modal */}
        {showPreviousStayModal && (
          <PreviousStayModal
            guest={selectedGuestForHistory}
            onClose={handleClosePreviousStayModal}
          />
        )}

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded shadow-elevated text-white transition-all ${
            notification.type === 'success' ? 'bg-green-600' : 
            notification.type === 'warning' ? 'bg-yellow-600' : 
            'bg-red-600'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Guests Table */}
        <div className="bg-card rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border" data-cy="guests-table">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Guest Details</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Additional Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Room</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Stay Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Referrer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Due Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Bill</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {guests.map((guest) => (
                  <React.Fragment key={guest._id}>
                  <tr className="hover:bg-muted/30" data-cy={`guests-row-${guest._id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-1">
                        <button
                          onClick={() => toggleRow(guest._id)}
                          className="p-0.5 rounded text-muted-foreground hover:text-foreground md:hidden shrink-0 mt-0.5"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-foreground break-words">
                            {guest.firstName} {guest.lastName}
                          </div>
                          {guest.address && (
                            <div className="text-sm text-muted-foreground break-words">{guest.address}</div>
                          )}
                          {guest.checkouts && guest.checkouts.length > 0 && (
                            <button
                              onClick={() => handleViewPreviousStays(guest)}
                              className="mt-1 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200"
                              data-cy={`guests-view-btn-${guest._id}`}
                            >
                              <span className="mr-1">📋</span>
                              {guest.checkouts.length} {guest.checkouts.length === 1 ? 'Stay' : 'Stays'} · रु{guest.totalSpent?.toLocaleString() || 0}
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div className="text-sm text-foreground">{guest.email}</div>
                      <div className="text-sm text-muted-foreground">{guest.phone}</div>
                    </td>
                    <td className="px-6 py-4 hidden lg:table-cell">
                      <div className="text-sm text-foreground">
                        {guest.occupation && <div>Occupation: {guest.occupation}</div>}
                        {guest.vehicleNo && <div>Vehicle: {guest.vehicleNo}</div>}
                        {guest.purposeOfStay && <div>Purpose: {guest.purposeOfStay}</div>}
                        {guest.noOfAdditionalGuests && guest.noOfAdditionalGuests > 0 && (
                          <div>Additional Guests: {guest.noOfAdditionalGuests}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      {guest.rooms && guest.rooms.length > 0 ? (
                        guest.rooms.map((roomId, idx) => {
                          const roomNumber = getRoomNumberFromGuest(guest, roomId);
                          return (
                            <span key={`${guest._id}-${roomId}-${roomNumber}-${idx}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 mr-1">
                              Room {roomNumber}
                            </span>
                          );
                        })
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground">No rooms</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground hidden md:table-cell">
                      <div>
                        <div>In: {format(new Date(guest.checkInDate), "MMM dd, yyyy HH:mm")}</div>
                        {guest.checkOutDate && (
                          <div>Out: {format(new Date(guest.checkOutDate), "MMM dd, yyyy HH:mm")}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground hidden md:table-cell">
                      {guest.referrer ? (
                        <div className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 px-2 py-1 rounded text-xs">
                          Referred
                          {guest.referralStatus && (
                            <span className="ml-1">({guest.referralStatus})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${guest.isCheckedOut
                          ? "bg-muted text-muted-foreground"
                          : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        }`}>
                        {guest.isCheckedOut ? "Checked Out" : "Currently Staying"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${guest.existingCustomer
                          ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                          : "bg-muted text-muted-foreground"
                        }`}>
                        {guest.existingCustomer ? "Existing" : "New"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground hidden md:table-cell">
                      {guest.dueAmount && guest.dueAmount > 0 ? (
                        <span className="text-destructive font-semibold">रु{guest.dueAmount.toLocaleString()}</span>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground hidden md:table-cell">
                      रु{guest.totalBill.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {guest.checkouts && guest.checkouts.length > 0 && (
                          <button onClick={() => handleViewPreviousStays(guest)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="View History" data-cy={`guests-view-btn-${guest._id}`}>
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => handleEdit(guest)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all" title="Edit" data-cy={`guests-edit-btn-${guest._id}`}>
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  {expandedRows[guest._id] && (
                    <tr className="md:hidden">
                      <td colSpan={11} className="px-4 py-3 bg-muted/20">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="break-words min-w-0"><span className="text-muted-foreground">Email:</span> {guest.email}</div>
                          <div className="break-words min-w-0"><span className="text-muted-foreground">Phone:</span> {guest.phone}</div>
                          <div className="break-words min-w-0"><span className="text-muted-foreground">Room:</span> {guest.rooms?.length ? guest.rooms.map((r: any) => getRoomNumberFromGuest(guest, r)).join(', ') : 'None'}</div>
                          <div className="break-words min-w-0"><span className="text-muted-foreground">Status:</span> {guest.isCheckedOut ? 'Checked Out' : 'Currently Staying'}</div>
                          <div className="break-words min-w-0"><span className="text-muted-foreground">In:</span> {format(new Date(guest.checkInDate), "MMM dd, yyyy HH:mm")}</div>
                          <div className="break-words min-w-0"><span className="text-muted-foreground">Out:</span> {guest.checkOutDate ? format(new Date(guest.checkOutDate), "MMM dd, yyyy HH:mm") : '-'}</div>
                          <div className="break-words min-w-0"><span className="text-muted-foreground">Due:</span> {(guest.dueAmount ?? 0) > 0 ? `रु${(guest.dueAmount ?? 0).toLocaleString()}` : 'None'}</div>
                          <div className="break-words min-w-0"><span className="text-muted-foreground">Bill:</span> रु{guest.totalBill.toLocaleString()}</div>
                          <div className="break-words min-w-0"><span className="text-muted-foreground">Customer:</span> {guest.existingCustomer ? 'Existing' : 'New'}</div>
                          <div className="break-words min-w-0"><span className="text-muted-foreground">Referrer:</span> {guest.referrer ? 'Referred' : 'None'}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
            disabled={loading}
          />

          {guests.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-muted-foreground">No guests found matching your criteria.</div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center gap-2 mb-3">
          <button
            onClick={() => setShowMobileSummary(!showMobileSummary)}
            className="h-8 px-3 bg-muted/50 border border-input rounded-lg text-xs font-medium flex items-center gap-1.5"
          >
            <Info className="w-3.5 h-3.5" />
            {showMobileSummary ? 'Hide Stats' : 'Show Stats'}
          </button>
        </div>
        <div className={`mt-2 grid grid-cols-1 md:grid-cols-4 gap-4 ${showMobileSummary ? '' : 'hidden'}`}>
          <div className="bg-card p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-primary">{totalGuests}</div>
            <div className="text-sm text-muted-foreground">Total Guests</div>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {guests.filter(g => !g.isCheckedOut).length}
            </div>
            <div className="text-sm text-muted-foreground">Currently Staying</div>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-muted-foreground">
              {guests.filter(g => g.isCheckedOut).length}
            </div>
            <div className="text-sm text-muted-foreground">Checked Out</div>
          </div>
          <div className="bg-card p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-indigo-600">
              {availableRooms.filter(r => !r.isOccupied).length}
            </div>
            <div className="text-sm text-muted-foreground">Available Rooms</div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}