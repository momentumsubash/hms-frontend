"use client";

import { getGuests, getRooms, updateGuest, addGuest as createGuest, getMe, getAvailableRooms } from "@/lib/api";
import { useEffect, useState, useRef, useCallback } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { format } from "date-fns";
import { isAPIResponse } from "@/types/api";

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
  rooms: string[];
  checkInDate: string;
  checkOutDate?: string;
  isCheckedOut: boolean;
  totalBill: number;
  roomDiscount?: number;
  advancePaid?: number;
  createdBy: string;
  hotel: string;
  createdAt: string;
  updatedAt: string;
  checkouts?: {
    _id: string;
    rooms: {
      _id: string;
      roomNumber: string;
      type: string;
      isOccupied: boolean;
    }[];
  }[];
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
  rooms: string[];
  roomDiscount: string;
  advancePaid: string;
  checkInDate: string;
  checkOutDate?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// Update the getCurrentDateTimeLocal function to add 5-minute buffer
const getCurrentDateTimeLocal = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() + 5); // Add 5-minute buffer
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Add function to calculate default check-out time (12 hours after check-in)
const getDefaultCheckOutDateTime = (checkInDate: string) => {
  if (!checkInDate) return '';

  const checkIn = new Date(checkInDate);
  checkIn.setHours(checkIn.getHours() + 12); // Add 12 hours (1 night)

  const year = checkIn.getFullYear();
  const month = String(checkIn.getMonth() + 1).padStart(2, '0');
  const day = String(checkIn.getDate()).padStart(2, '0');
  const hours = String(checkIn.getHours()).padStart(2, '0');
  const minutes = String(checkIn.getMinutes()).padStart(2, '0');

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
      // Return the first matching guest
      return data.data[0];
    }

    return null;
  } catch (error) {
    console.error("Error searching guest:", error);
    return null;
  }
};

export default function GuestsPage() {
  // Notification state
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalGuests, setTotalGuests] = useState(0);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Checkouts", href: "/checkouts" },
    { label: "Guests", href: "/guests" },
    { label: "Hotels", href: "/hotels" },
    { label: "Items", href: "/items" },
    { label: "Orders", href: "/orders" },
    { label: "Rooms", href: "/rooms" },
    { label: "Users", href: "/users" },
  ];

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
    rooms: [],
    roomDiscount: "0",
    advancePaid: "0",
    checkInDate: "",
    checkOutDate: ""
  });
  const [formLoading, setFormLoading] = useState(false);

  // User info for nav bar
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Form validation errors
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  // Filters with debouncing
  const [filters, setFilters] = useState({
    isCheckedOut: "",
    roomNumber: "",
    search: ""
  });
  const [searchDebounce, setSearchDebounce] = useState<NodeJS.Timeout | null>(null);

  // Guest search states
  const [isSearchingGuest, setIsSearchingGuest] = useState(false);
  const [existingGuest, setExistingGuest] = useState<Guest | null>(null);
  const [guestSearchMessage, setGuestSearchMessage] = useState("");

  // Helper function to get standard headers
  const getRequestHeaders = (token: string) => {
    return {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Function to fetch referrers
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

  // Load data with server-side filtering and pagination
  const loadData = useCallback(async (resetPage = false, customFilters?: typeof filters) => {
    try {
      setLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");

      // Use custom filters if provided, otherwise use current filters
      const currentFilters = customFilters || filters;
      const currentPage = resetPage ? 1 : page;

      // Build query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', limit.toString());

      // Add filters if they exist
      if (currentFilters.search) queryParams.append('search', currentFilters.search);
      if (currentFilters.roomNumber) queryParams.append('roomNumber', currentFilters.roomNumber);
      if (currentFilters.isCheckedOut !== "") queryParams.append('isCheckedOut', currentFilters.isCheckedOut);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/guests?${queryParams.toString()}`, {
        headers: getRequestHeaders(token),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch guests');
      }

      const data = await response.json();

      // Handle the expected response structure
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

  // Handle filter changes with debouncing
  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);

    // Clear existing timeout
    if (searchDebounce) {
      clearTimeout(searchDebounce);
    }

    // Set a new timeout to debounce the API call for search inputs
    if (filterKey === 'search' || filterKey === 'roomNumber') {
      setSearchDebounce(setTimeout(() => {
        loadData(true, newFilters);
      }, 500));
    } else {
      // For other filters, apply immediately
      loadData(true, newFilters);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      isCheckedOut: "",
      roomNumber: "",
      search: ""
    };
    setFilters(clearedFilters);
    loadData(true, clearedFilters);
  };

  // Hide notification after 3s
  useEffect(() => {
    if (notification) {
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
  }, [notification]);

  // Initial data load
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("No authentication token");
        setLoading(false);
        return;
      }
      try {
        // Load guests with initial filters
        await loadData();
        // Load referrers
        await fetchReferrers();
      } catch (e: any) {
        setError(e.message);
      }
    };
    fetchInitialData();
  }, []);

  // Load data when page changes
  useEffect(() => {
    loadData(false);
  }, [page, loadData]);

  // Clean up debounce timeout
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
      rooms: [],
      roomDiscount: "0",
      advancePaid: "0",
      checkInDate: getCurrentDateTimeLocal(),
      checkOutDate: ""
    });
    setEditingGuest(null);
    setExistingGuest(null);
    setGuestSearchMessage("");
    setShowForm(false);
    setFormErrors({});
  };

  // Phone search functionality
  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setFormData({ ...formData, phone });

    // Clear existing guest when phone changes
    if (existingGuest) {
      setExistingGuest(null);
      setGuestSearchMessage("");
    }

    // Search when phone number is complete (e.g., 10 digits)
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

          // Auto-populate form with existing guest data
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
            // Don't auto-populate room selection as it might be different
          }));
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

          // Auto-populate form
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
          }));
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
    // Keep the phone number but reset other fields
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

  // Validation function
  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const now = new Date();

    if (!formData.checkInDate) {
      errors.checkInDate = "Check-in date is required";
    } else {
      const originalDate = new Date(formData.checkInDate);
      const checkInDate = new Date(originalDate.getTime() + (5 * 60 * 1000));
      if (!editingGuest && checkInDate < now) {
        errors.checkInDate = "Check-in date cannot be in the past";
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

    // Handle undefined/null email values safely
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

      // FIXED: Completely safe additional guests filtering
      const validAdditionalGuests: AdditionalGuest[] = [];

      // Safely iterate through additional guests
      if (formData.additionalGuests && Array.isArray(formData.additionalGuests)) {
        for (const guest of formData.additionalGuests) {
          // Check if guest exists and has the required properties
          if (guest && typeof guest === 'object') {
            const name = guest.name || '';
            const relationship = guest.relationship || '';

            // Only include if both name and relationship are not empty after trimming
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
        const storedUser = localStorage.getItem('user');
        let hotelId = '';

        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            hotelId = userData.hotel._id || user?.hotel._id || '';
          } catch (e) {
            console.error('Error parsing user data from localStorage:', e);
            hotelId = user?.hotel._id || '';
          }
        } else {
          hotelId = user?.hotel._id || '';
        }

        if (!hotelId) {
          throw new Error("Hotel ID is required. Please contact your administrator.");
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
          rooms: roomNumbers,
          hotel: hotelId,
          checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined,
          roomDiscount: parseFloat(formData.roomDiscount || '0') || 0,
          advancePaid: parseFloat(formData.advancePaid || '0') || 0,
        };

        // Handle email safely - only include if not empty
        const emailValue = formData.email || '';
        if (emailValue.trim() !== '') {
          updatePayload.email = emailValue;
        }

        resp = await updateGuest(editingGuest._id, updatePayload);
      } else {
        const roomNumbers = formData.rooms.map(resolveRoomNumberFromId);
        const storedUser = localStorage.getItem('user');
        let hotelId = '';

        if (storedUser) {
          try {
            const userData = JSON.parse(storedUser);
            hotelId = userData.hotel || user?.hotel || '';
          } catch (e) {
            console.error('Error parsing user data from localStorage:', e);
            hotelId = user?.hotel || '';
          }
        } else {
          hotelId = user?.hotel || '';
        }

        if (!hotelId) {
          throw new Error("Hotel ID is required. Please contact your administrator.");
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
          rooms: roomNumbers,
          hotel: hotelId,
          checkInDate: new Date(formData.checkInDate).toISOString(),
          checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined,
          roomDiscount: parseFloat(formData.roomDiscount || '0') || 0,
          advancePaid: parseFloat(formData.advancePaid || '0') || 0,
        };

        // Always include email, use "noemail@gmail.com" if empty
        const emailValue = formData.email || '';
        createPayload.email = emailValue.trim() !== '' ? emailValue : 'noemail@gmail.com';

        resp = await createGuest(createPayload);
      }

      // Refresh guests data
      await loadData(true);
      resetForm();
      setNotification({ type: 'success', message: resp?.message || 'Operation successful' });
    } catch (e: any) {
      // Handle API validation errors
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

      // Normalize room IDs for this guest
      const normalizedRooms = normalizeGuestRoomIds(guest);

      // Basic guest info with safe email handling
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

      // FIXED: Handle additional guests safely
      const additionalGuests = guest.additionalGuests || [];
      const noOfAdditionalGuests = additionalGuests.length.toString();

      setFormData(prev => ({
        ...prev,
        ...formDataUpdate,
        noOfAdditionalGuests,
        additionalGuests,
      }));

      setFormErrors({});

      // Fetch ALL rooms (not just available ones) for editing
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

      // Fetch referrers for the dropdown
      await fetchReferrers();

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
      rooms: [],
      roomDiscount: "0",
      advancePaid: "0",
      checkInDate: getCurrentDateTimeLocal(),
      checkOutDate: ""
    });
    setFormErrors({});
    setExistingGuest(null);
    setGuestSearchMessage("");
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) throw new Error("No authentication token");
      
      // Fetch available rooms
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/rooms?page=1&limit=100&isoccupied=false`, {
        headers: getRequestHeaders(token),
      });
      if (!res.ok) throw new Error("Failed to fetch available rooms");
      const response = await res.json();

      let availableRoomsData: Room[] = [];
      if (response && isAPIResponse<Room[]>(response)) {
        availableRoomsData = Array.isArray(response.data) ? response.data : [];
      } else if (Array.isArray(response)) {
        availableRoomsData = response;
      }
      setAvailableRooms(availableRoomsData);

      // Fetch referrers
      await fetchReferrers();
    } catch (e) {
      setAvailableRooms([]);
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

    // Ensure the array is long enough
    while (updatedGuests.length <= index) {
      updatedGuests.push({ name: '', gender: 'male', relationship: '' });
    }

    // Ensure the guest object exists
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

  const getRoomNumbersFromIds = (roomIds: string[]): string[] => {
    return roomIds.map(roomId => {
      const room = allRooms.find(r => r._id === roomId);
      return room ? room.roomNumber : roomId;
    });
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

  // Generate pagination buttons
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
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setPage(1)}
          disabled={page === 1 || loading}
        >
          «
        </button>
      );

      buttons.push(
        <button
          key="prev"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setPage(page - 1)}
          disabled={page === 1 || loading}
        >
          ‹
        </button>
      );
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`px-3 py-2 text-sm font-medium rounded-md ${page === i
              ? 'text-white bg-blue-600 border border-blue-600'
              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
            } disabled:opacity-50`}
          onClick={() => setPage(i)}
          disabled={loading}
        >
          {i}
        </button>
      );
    }

    if (endPage < totalPages) {
      buttons.push(
        <button
          key="next"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages || loading}
        >
          ›
        </button>
      );

      buttons.push(
        <button
          key="last"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages || loading}
        >
          »
        </button>
      );
    }

    return buttons;
  };

  if (loading && guests.length === 0) return <div className="flex justify-center items-center h-64">Loading...</div>;

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
          <h1 className="text-3xl font-bold">Guests Management</h1>
          <button
            onClick={handleAddNewGuest}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add New Guest
          </button>
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

        {/* Summary Section */}
        <div className="flex gap-8 mb-6">
          <div className="bg-blue-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-blue-700 text-sm font-semibold">Total Guests</div>
            <div className="text-2xl font-bold text-blue-900">{totalGuests}</div>
          </div>
          <div className="bg-green-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-green-700 text-sm font-semibold">Current Page</div>
            <div className="text-2xl font-bold text-green-900">{guests.length}</div>
          </div>
          <div className="bg-purple-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-purple-700 text-sm font-semibold">Total Pages</div>
            <div className="text-2xl font-bold text-purple-900">{totalPages}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Clear All Filters
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search (Name, Email, Phone)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search guests..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Room Number</label>
              <input
                type="text"
                value={filters.roomNumber}
                onChange={(e) => handleFilterChange('roomNumber', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Filter by room..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Check-out Status</label>
              <select
                value={filters.isCheckedOut}
                onChange={(e) => handleFilterChange('isCheckedOut', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Guests</option>
                <option value="false">Currently Staying</option>
                <option value="true">Checked Out</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading indicator for filter changes */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            Loading guests...
          </div>
        )}

        {/* Guest Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingGuest ? "Edit Guest" : "Add New Guest"}
              </h2>

              {/* Existing Guest Notification */}
              {existingGuest && (
                <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-green-800 font-medium">Existing Guest Found</p>
                      <p className="text-green-600 text-sm">
                        {existingGuest.firstName} {existingGuest.lastName} -
                        Previous stays: {existingGuest.checkouts?.length || 0}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearGuestSearch}
                      className="text-green-600 hover:text-green-800 text-sm underline"
                    >
                      Clear & Start New
                    </button>
                  </div>
                </div>
              )}

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Basic Information</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1">Phone[Search for old Guest] *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                        disabled={isSearchingGuest || !!editingGuest}
                        placeholder="Enter 10-digit phone number"
                      />
                      {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}

                      {/* Guest search status message */}
                      {guestSearchMessage && (
                        <p className={`text-sm mt-1 ${existingGuest ? 'text-green-600' :
                            isSearchingGuest ? 'text-blue-600' : 'text-gray-600'
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
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Last Name *</label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Optional"
                      />
                      {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        rows={2}
                      />
                    </div>
                  </div>

                  {/* Optional Fields */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Additional Information</h3>

                    <div>
                      <label className="block text-sm font-medium mb-1">ID Number</label>
                      <input
                        type="text"
                        value={formData.idNo}
                        onChange={(e) => setFormData({ ...formData, idNo: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Occupation</label>
                      <input
                        type="text"
                        value={formData.occupation}
                        onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Vehicle Number</label>
                      <input
                        type="text"
                        value={formData.vehicleNo}
                        onChange={(e) => setFormData({ ...formData, vehicleNo: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Purpose of Stay</label>
                      <input
                        type="text"
                        value={formData.purposeOfStay}
                        onChange={(e) => setFormData({ ...formData, purposeOfStay: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>

                    {/* Referrer Field */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Referrer</label>
                      <select
                        value={formData.referrer}
                        onChange={(e) => setFormData({ ...formData, referrer: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
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
                        <p className="text-sm text-gray-500 mt-1">No referrers available. Add referrers first.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Guests Section */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">Additional Guests</h3>
                    <button
                      type="button"
                      onClick={addAdditionalGuest}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                    >
                      + Add Guest
                    </button>
                  </div>

                  <div className="text-sm text-gray-500 mb-2">
                    Total additional guests: {(formData.additionalGuests || []).filter(
                      guest => guest != null &&
                        typeof guest === 'object' &&
                        (guest.name || '').trim() !== '' &&
                        (guest.relationship || '').trim() !== ''
                    ).length}
                  </div>

                  {(formData.additionalGuests || []).map((guest, index) => {
                    // Ensure guest object exists and has required properties
                    const safeGuest = guest || { name: '', gender: 'male', relationship: '' };
                    return (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-3 border rounded">
                        <div>
                          <label className="block text-sm font-medium mb-1">Name</label>
                          <input
                            type="text"
                            value={safeGuest.name || ''}
                            onChange={(e) => handleAdditionalGuestChange(index, 'name', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Guest name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Gender</label>
                          <select
                            value={safeGuest.gender || 'male'}
                            onChange={(e) => handleAdditionalGuestChange(index, 'gender', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                          >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium mb-1">Relationship</label>
                          <input
                            type="text"
                            value={safeGuest.relationship || ''}
                            onChange={(e) => handleAdditionalGuestChange(index, 'relationship', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2"
                            placeholder="Relationship to main guest"
                          />
                        </div>

                        <div className="md:col-span-3 flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeAdditionalGuest(index)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Room and Stay Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Room Information</h3>

                    <div>
                      <label className="block text-sm font-medium mb-1">Select Rooms *</label>
                      <select
                        multiple
                        value={formData.rooms}
                        onChange={(e) => {
                          const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                          setFormData({ ...formData, rooms: selectedOptions });
                        }}
                        className="w-full border border-gray-300 rounded px-3 py-2 h-32"
                        required
                      >
                        {/* Show all rooms when editing, available rooms when creating */}
                        {(editingGuest ? allRooms : availableRooms).map((room) => (
                          <option
                            key={room._id}
                            value={room._id}
                            className={room.isOccupied && !formData.rooms.includes(room._id) ? 'text-gray-400' : ''}
                          >
                            {room.roomNumber} - {room.type} (रु{room.rate}/night)
                            {room.isOccupied && !formData.rooms.includes(room._id) && ' - Occupied'}
                            {formData.rooms.includes(room._id) && ' - Selected'}
                          </option>
                        ))}
                      </select>
                      {formErrors.rooms && <p className="text-red-500 text-sm">{formErrors.rooms}</p>}
                      <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple rooms</p>

                      {/* Show room status information */}
                      <div className="mt-2 text-sm text-gray-600">
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
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        min="0"
                        step="0.01"
                      />
                      {formErrors.roomDiscount && <p className="text-red-500 text-sm">{formErrors.roomDiscount}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Advance Paid (रु)</label>
                      <input
                        type="number"
                        value={formData.advancePaid}
                        onChange={(e) => setFormData({ ...formData, advancePaid: e.target.value })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        min="0"
                        step="0.01"
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
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
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
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                      {formErrors.checkOutDate && <p className="text-red-500 text-sm">{formErrors.checkOutDate}</p>}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={formLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {formLoading ? "Saving..." : editingGuest ? "Update Guest" : "Add Guest"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded shadow-lg text-white transition-all ${notification.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {notification.message}
          </div>
        )}

        {/* Guests Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Guest Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Additional Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stay Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Referrer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {guests.map((guest) => (
                  <tr key={guest._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {guest.firstName} {guest.lastName}
                        </div>
                        {guest.address && (
                          <div className="text-sm text-gray-500">{guest.address}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guest.email}</div>
                      <div className="text-sm text-gray-500">{guest.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {guest.idNo && <div>ID: {guest.idNo}</div>}
                        {guest.occupation && <div>Occupation: {guest.occupation}</div>}
                        {guest.vehicleNo && <div>Vehicle: {guest.vehicleNo}</div>}
                        {guest.purposeOfStay && <div>Purpose: {guest.purposeOfStay}</div>}
                        {guest.noOfAdditionalGuests && guest.noOfAdditionalGuests > 0 && (
                          <div>Additional Guests: {guest.noOfAdditionalGuests}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {guest.rooms && guest.rooms.length > 0 ? (
                        guest.rooms.map((roomId, idx) => {
                          const roomNumber = getRoomNumberFromGuest(guest, roomId);
                          return (
                            <span key={`${guest._id}-${roomId}-${roomNumber}-${idx}`} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                              Room {roomNumber}
                            </span>
                          );
                        })
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No rooms</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div>In: {format(new Date(guest.checkInDate), "MMM dd, yyyy HH:mm")}</div>
                        {guest.checkOutDate && (
                          <div>Out: {format(new Date(guest.checkOutDate), "MMM dd, yyyy HH:mm")}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {guest.referrer ? (
                        <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                          Referred
                          {guest.referralStatus && (
                            <span className="ml-1">({guest.referralStatus})</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${guest.isCheckedOut
                          ? "bg-gray-100 text-gray-800"
                          : "bg-green-100 text-green-800"
                        }`}>
                        {guest.isCheckedOut ? "Checked Out" : "Currently Staying"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      रु{guest.totalBill.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleEdit(guest)}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => {/* Add view orders functionality */ }}
                        className="text-green-600 hover:text-green-900"
                      >
                        View Orders
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gray-50 border-t gap-4">
              <div className="text-sm text-gray-700">
                Showing {guests.length} of {totalGuests} guests (Page {page} of {totalPages})
              </div>
              <div className="flex items-center space-x-1">
                {generatePaginationButtons()}
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span>Go to page:</span>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  value={page}
                  onChange={(e) => {
                    const newPage = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
                    setPage(newPage);
                  }}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          {guests.length === 0 && !loading && (
            <div className="text-center py-12">
              <div className="text-gray-500">No guests found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{totalGuests}</div>
            <div className="text-sm text-gray-600">Total Guests</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {guests.filter(g => !g.isCheckedOut).length}
            </div>
            <div className="text-sm text-gray-600">Currently Staying</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">
              {guests.filter(g => g.isCheckedOut).length}
            </div>
            <div className="text-sm text-gray-600">Checked Out</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-indigo-600">
              {availableRooms.filter(r => !r.isOccupied).length}
            </div>
            <div className="text-sm text-gray-600">Available Rooms</div>
          </div>
        </div>
      </div>
    </div>
  );
}