"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { 
  getHotels, addHotel, updateHotel, updateHotelBalance,
  uploadHotelLogo, uploadHotelImages, uploadHotelGallery,
  getHotelLicense, updateHotelLicense,
  getNotificationSettings, updateNotificationSettings,
  addNotificationRecipient, removeNotificationRecipient,
  toggleNotificationRecipient, testNotification,
  getEmailServiceStatus, updateHotelWebsite, 
  addHotelDomain, removeHotelDomain
} from "@/lib/api";
import { getHotel } from "@/lib/api";
import { createExpenditure, getExpenditures, approveExpenditure, rejectExpenditure } from "@/lib/expenditure";
import { Expenditure, ExpenditureFilters } from "@/types/expenditure";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { format } from "date-fns";
import Image from "next/image";
import { PhotoIcon, PlusIcon, XMarkIcon, BellIcon, ClockIcon, DocumentTextIcon, EnvelopeIcon, GlobeAltIcon } from "@heroicons/react/24/outline";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from 'sonner';
import WebsiteContentManager from "@/components/WebsiteContentManager";
import { Hotel } from "@/types/hotel";

export default function HotelsPage() {
  // Hotel state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [showExpenditureModal, setShowExpenditureModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  
  // Domain management state
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [domainType, setDomainType] = useState<"whitelistedDomains" | "customDomains">("whitelistedDomains");
  
  // Notification and License state
  const [showNotificationSettingsModal, setShowNotificationSettingsModal] = useState(false);
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [showTestNotificationModal, setShowTestNotificationModal] = useState(false);
  const [emailServiceStatus, setEmailServiceStatus] = useState<any>(null);

  // Expenditure state
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [expenditureFilters, setExpenditureFilters] = useState<ExpenditureFilters>({});
  const [newExpenditure, setNewExpenditure] = useState<Partial<Expenditure>>({
    amount: 0,
    category: "supplies",
    description: "",
    date: new Date().toISOString(),
    notes: ""
  });
  const [selectedExpenditure, setSelectedExpenditure] = useState<Expenditure | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    dailyReport: {
      enabled: true,
      time: "18:00",
      recipients: []
    },
    licenseExpiryAlerts: {
      enabled: true,
      recipients: [],
      daysBefore: [30, 15, 7, 1]
    }
  });

  // License state
  const [licenseInfo, setLicenseInfo] = useState({
    licenseNumber: "",
    expiryDate: "",
    licenseDocument: "",
    status: "active"
  });

  // Test notification state
  const [testNotificationData, setTestNotificationData] = useState({
    type: "daily_report",
    testEmail: "",
    date: new Date().toISOString().split('T')[0]
  });

  // New recipient state
  const [newRecipient, setNewRecipient] = useState({
    email: "",
    name: "",
    role: "manager"
  });

  // Website content modal state
  const [showWebsiteModal, setShowWebsiteModal] = useState(false);

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
  
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    city: "",
    search: ""
  });

// Update your newHotel state initialization to include all required properties:
const [newHotel, setNewHotel] = useState<Hotel>({
  name: "",
  description: "",
  phone: "",
  logo: "",
  images: [],
  vatNumber: "",
  companyName: "",
  vatAddress: "",
  type: "",
  roomCount: 0,
  floors: 0,
  established: new Date().getFullYear(),
  amenities: [],
  gallery: [],
  contact: {
    phone: "",
    reception: "",
    email: "",
    website: ""
  },
  address: {
    street: "",
    area: "",
    city: "",
    state: "",
    zip: ""
  },
  locationMap: "",
  nearby: [],
  notes: [],
  initialAmount: 0,
  currentBalance: 0,
  createdAt: new Date().toISOString(),
  whitelistedDomains: [],
  customDomains: [],
  website: {
    heroTitle: "",
    heroSubtitle: "",
    heroImage: "",
    aboutDescription: "",
    amenitiesDescription: "",
    experiencesDescription: "",
    testimonialsDescription: "",
    footerDescription: "",
    rooms: [],
    amenities: [],
    testimonials: [],
    contactInfo: {
      phone: "",
      email: "",
      address: ""
    }
  },
  seo: {
    title: "",
    description: "",
    keywords: []
  }
});

  useEffect(() => {
    loadData();
    checkEmailServiceStatus();
  }, []);

  useEffect(() => {
    if (user && ["manager", "staff"].includes(user.role)) {
      loadExpenditures();
    }
  }, [user, expenditureFilters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getHotels();
      setHotels(response.data || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExpenditures = async () => {
    try {
      const res = await getExpenditures(expenditureFilters);
      setExpenditures(res?.data || []);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const checkEmailServiceStatus = async () => {
    try {
      const response = await getEmailServiceStatus();
      setEmailServiceStatus(response.data);
    } catch (e: any) {
      console.error("Failed to get email service status:", e.message);
      setEmailServiceStatus({
        global: {
          postmark: false,
          defaultEmail: false,
          serviceAvailable: false,
          fromAddress: 'not configured'
        },
        hotels: []
      });
    }
  };

  // Domain management functions
  const handleAddDomain = async () => {
    if (!selectedHotel?._id || !newDomain) return;
    
    try {
      // Validate domain format
      if (!isValidDomain(newDomain)) {
        toast.error("Invalid Domain: Please enter a valid domain name (e.g., example.com)");
        return;
      }
      
      // Add the domain
      await addHotelDomain(selectedHotel._id, domainType, newDomain);
      
      // Update the local state
      setHotels(prev => prev.map(hotel => 
        hotel._id === selectedHotel._id 
          ? { 
              ...hotel, 
              [domainType]: [...(hotel[domainType] || []), newDomain] 
            } 
          : hotel
      ));
      
      if (selectedHotel) {
        setSelectedHotel(prev => prev ? { 
          ...prev, 
          [domainType]: [...(prev[domainType] || []), newDomain] 
        } : null);
      }
      
      setNewDomain("");
      toast.success(`Domain ${newDomain} has been added successfully.`);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || "Failed to add domain");
    }
  };

  const handleRemoveDomain = async (domain: string, type: "whitelistedDomains" | "customDomains") => {
    if (!selectedHotel?._id) return;
    
    try {
      await removeHotelDomain(selectedHotel._id, type, domain);
      
      // Update the local state
      setHotels(prev => prev.map(hotel => 
        hotel._id === selectedHotel._id 
          ? { 
              ...hotel, 
              [type]: hotel[type]?.filter(d => d !== domain) || [] 
            } 
          : hotel
      ));
      
      if (selectedHotel) {
        setSelectedHotel(prev => prev ? { 
          ...prev, 
          [type]: prev[type]?.filter(d => d !== domain) || [] 
        } : null);
      }
      
      toast.success(`Domain ${domain} has been removed successfully.`);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message || "Failed to remove domain");
    }
  };

  const isValidDomain = (domain: string) => {
    // Simple domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain);
  };

  const handleCreateExpenditure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createExpenditure({
        ...newExpenditure,
        hotel: selectedHotel?._id || "",
      } as any);
      setShowExpenditureModal(false);
      loadExpenditures();
      setNewExpenditure({
        amount: 0,
        category: "supplies",
        description: "",
        date: new Date().toISOString(),
        notes: ""
      });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleApproveExpenditure = async (id: string) => {
    try {
      await approveExpenditure(id);
      loadExpenditures();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleRejectExpenditure = async (id: string) => {
    try {
      await rejectExpenditure(id, rejectReason);
      setRejectReason("");
      loadExpenditures();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedHotel?._id) return;
    try {
      await updateHotelBalance(selectedHotel._id, balanceAmount);
      setShowBalanceModal(false);
      loadData();
      setBalanceAmount(0);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleOpenNotificationSettings = async (hotel: Hotel) => {
    try {
      setSelectedHotel(hotel);
      const response = await getNotificationSettings(hotel._id!);
      
      const settings = response.data || {
        dailyReport: {
          enabled: true,
          time: "18:00",
          recipients: []
        },
        licenseExpiryAlerts: {
          enabled: true,
          recipients: [],
          daysBefore: [30, 15, 7, 1]
        }
      };
      
      if (!settings.licenseExpiryAlerts.daysBefore || !Array.isArray(settings.licenseExpiryAlerts.daysBefore)) {
        settings.licenseExpiryAlerts.daysBefore = [30, 15, 7, 1];
      }
      
      setNotificationSettings(settings);
      setShowNotificationSettingsModal(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleOpenLicenseModal = async (hotel: Hotel) => {
    try {
      setSelectedHotel(hotel);
      const response = await getHotelLicense(hotel._id!);
      setLicenseInfo(response.data || {
        licenseNumber: "",
        expiryDate: "",
        licenseDocument: "",
        status: "active"
      });
      setShowLicenseModal(true);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleSaveNotificationSettings = async () => {
    if (!selectedHotel?._id) return;
    try {
      await updateNotificationSettings(selectedHotel._id, notificationSettings);
      setShowNotificationSettingsModal(false);
      toast.success("Notification settings updated successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to update notification settings");
    }
  };

  const handleSaveLicenseInfo = async () => {
    if (!selectedHotel?._id) return;
    try {
      await updateHotelLicense(selectedHotel._id, licenseInfo);
      setShowLicenseModal(false);
      toast.success("License information updated successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to update license information");
    }
  };

  const handleAddRecipient = async () => {
    if (!selectedHotel?._id || !newRecipient.email) return;
    try {
      await addNotificationRecipient(selectedHotel._id, newRecipient);
      const response = await getNotificationSettings(selectedHotel._id);
      setNotificationSettings(response.data);
      setNewRecipient({ email: "", name: "", role: "manager" });
      toast.success("Recipient added successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to add recipient");
    }
  };

  const handleRemoveRecipient = async (email: string) => {
    if (!selectedHotel?._id) return;
    try {
      await removeNotificationRecipient(selectedHotel._id, email);
      const response = await getNotificationSettings(selectedHotel._id);
      setNotificationSettings(response.data);
      toast.success("Recipient removed successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to remove recipient");
    }
  };

  const handleToggleRecipient = async (email: string) => {
    if (!selectedHotel?._id) return;
    try {
      await toggleNotificationRecipient(selectedHotel._id, email);
      const response = await getNotificationSettings(selectedHotel._id);
      setNotificationSettings(response.data);
      toast.success("Recipient status updated");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to update recipient status");
    }
  };

  const handleTestNotification = async () => {
    if (!selectedHotel?._id) return;
    try {
      const response = await testNotification(
        selectedHotel._id, 
        testNotificationData.type, 
        testNotificationData.testEmail,
        testNotificationData.date
      );
      
      if (response.success) {
        toast.success(`Test notification sent successfully: ${response.message}`);
        setShowTestNotificationModal(false);
      } else {
        setError(`Failed to send test notification: ${response.message}`);
        toast.error(`Failed to send test notification: ${response.message}`);
      }
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to send test notification");
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>, hotelId: string) => {
    if (!e.target.files?.[0]) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      const file = e.target.files[0] as File;
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const formData = new FormData();
      formData.append('logo', file);
      
      const response = await uploadHotelLogo(hotelId, formData);
      setUploadProgress(100);
      
      setHotels(prev => prev.map(hotel => 
        hotel._id === hotelId ? { ...hotel, logo: response.url } : hotel
      ));
      
      if (selectedHotel?._id === hotelId) {
        setSelectedHotel(prev => prev ? { ...prev, logo: response.url } : null);
      }
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
      
      toast.success("Logo uploaded successfully");
    } catch (e: any) {
      setError(e.message);
      setUploading(false);
      setUploadProgress(0);
      toast.error("Failed to upload logo");
    }
  };

  const handleUploadImages = async (e: React.ChangeEvent<HTMLInputElement>, hotelId: string, type: 'images' | 'gallery') => {
    if (!e.target.files?.length) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      const files = Array.from(e.target.files) as File[];
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      const formData = new FormData();
      files.forEach(file => formData.append(type, file));
      
      const response = type === 'images' 
        ? await uploadHotelImages(hotelId, formData)
        : await uploadHotelGallery(hotelId, formData);
      
      setUploadProgress(100);
      
      setHotels(prev => prev.map(hotel => 
        hotel._id === hotelId ? { ...hotel, [type]: [...(hotel[type] || []), ...response.urls] } : hotel
      ));
      
      if (selectedHotel?._id === hotelId) {
        setSelectedHotel(prev => prev ? { 
          ...prev, 
          [type]: [...(prev[type] || []), ...response.urls] 
        } : null);
      }
      
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
      
      toast.success(`${files.length} ${type} uploaded successfully`);
    } catch (e: any) {
      setError(e.message);
      setUploading(false);
      setUploadProgress(0);
      toast.error(`Failed to upload ${type}`);
    }
  };

  const handleRemoveImage = async (hotelId: string, imageUrl: string, type: 'logo' | 'images' | 'gallery') => {
    try {
      setHotels(prev => prev.map(hotel => {
        if (hotel._id === hotelId) {
          if (type === 'logo') {
            return { ...hotel, logo: '' };
          } else {
            return { ...hotel, [type]: hotel[type]?.filter(img => img !== imageUrl) || [] };
          }
        }
        return hotel;
      }));
      
      if (selectedHotel?._id === hotelId) {
        if (type === 'logo') {
          setSelectedHotel(prev => prev ? { ...prev, logo: '' } : null);
        } else {
          setSelectedHotel(prev => prev ? { 
            ...prev, 
            [type]: prev[type]?.filter(img => img !== imageUrl) || [] 
          } : null);
        }
      }
      
      toast.success("Image removed successfully");
    } catch (e: any) {
      setError(e.message);
      toast.error("Failed to remove image");
    }
  };

  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const filteredHotels = hotels.filter((hotel: Hotel) => {
    const matchesName = filters.name === "" || (hotel.name && hotel.name.toLowerCase().includes(filters.name.toLowerCase()));
    const matchesCity = filters.city === "" || (hotel.address?.city && hotel.address.city.toLowerCase().includes(filters.city.toLowerCase()));
    const matchesSearch = filters.search === "" ||
      (hotel.name && hotel.name.toLowerCase().includes(filters.search.toLowerCase())) ||
      (hotel.address?.city && hotel.address.city.toLowerCase().includes(filters.search.toLowerCase()));
    return matchesName && matchesCity && matchesSearch;
  });

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
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Hotels Management</h1>
          {user?.role === 'super_admin' && (
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add New Hotel
            </Button>
          )}
        </div>

        {/* Create Hotel Modal */}
        {user?.role === 'super_admin' && (
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Hotel</DialogTitle>
              </DialogHeader>
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await addHotel(newHotel);
                  setShowCreateModal(false);
                  loadData();
// In the create hotel modal onSubmit handler, update the reset function:
setNewHotel({
  name: "",
  description: "",
  phone: "",
  logo: "",
  images: [],
  vatNumber: "",
  companyName: "",
  vatAddress: "",
  type: "",
  roomCount: 0,
  floors: 0,
  established: new Date().getFullYear(),
  amenities: [],
  gallery: [],
  contact: {
    phone: "",
    reception: "",
    email: "",
    website: ""
  },
  address: {
    street: "",
    area: "",
    city: "",
    state: "",
    zip: ""
  },
  locationMap: "",
  nearby: [],
  notes: [],
  initialAmount: 0,
  currentBalance: 0,
  createdAt: new Date().toISOString(),
  whitelistedDomains: [],
  customDomains: [],
  website: {
    heroTitle: "",
    heroSubtitle: "",
    heroImage: "",
    aboutDescription: "",
    amenitiesDescription: "",
    experiencesDescription: "",
    testimonialsDescription: "",
    footerDescription: "",
    rooms: [],
    amenities: [],
    testimonials: [],
    contactInfo: {
      phone: "",
      email: "",
      address: ""
    }
  },
  seo: {
    title: "",
    description: "",
    keywords: []
  }
});
                  toast.success("Hotel created successfully");
                } catch (e: any) {
                  setError(e.message);
                  toast.error("Failed to create hotel");
                }
              }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Hotel Name *</label>
                    <input
                      type="text"
                      value={newHotel.name}
                      onChange={(e) => setNewHotel({...newHotel, name: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Type</label>
                    <input
                      type="text"
                      value={newHotel.type}
                      onChange={(e) => setNewHotel({...newHotel, type: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="e.g., 5-Star Luxury Hotel"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="text"
                      value={newHotel.phone}
                      onChange={(e) => setNewHotel({...newHotel, phone: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="+1-555-123-4567"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Room Count</label>
                    <input
                      type="number"
                      value={newHotel.roomCount}
                      onChange={(e) => setNewHotel({...newHotel, roomCount: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Floors</label>
                    <input
                      type="number"
                      value={newHotel.floors}
                      onChange={(e) => setNewHotel({...newHotel, floors: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Established Year</label>
                    <input
                      type="number"
                      value={newHotel.established}
                      onChange={(e) => setNewHotel({...newHotel, established: parseInt(e.target.value) || new Date().getFullYear()})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">VAT Number</label>
                    <input
                      type="text"
                      value={newHotel.vatNumber}
                      onChange={(e) => setNewHotel({...newHotel, vatNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name</label>
                    <input
                      type="text"
                      value={newHotel.companyName}
                      onChange={(e) => setNewHotel({...newHotel, companyName: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">VAT Address</label>
                    <input
                      type="text"
                      value={newHotel.vatAddress}
                      onChange={(e) => setNewHotel({...newHotel, vatAddress: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Initial Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newHotel.initialAmount}
                      onChange={(e) => setNewHotel({...newHotel, initialAmount: parseFloat(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={newHotel.description}
                    onChange={(e) => setNewHotel({...newHotel, description: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    rows={3}
                    placeholder="A brief description of the hotel..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newHotel.address?.street}
                      onChange={(e) => setNewHotel({...newHotel, address: {...newHotel.address, street: e.target.value}})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Street"
                    />
                    <input
                      type="text"
                      value={newHotel.address?.area}
                      onChange={(e) => setNewHotel({...newHotel, address: {...newHotel.address, area: e.target.value}})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Area"
                    />
                    <input
                      type="text"
                      value={newHotel.address?.city}
                      onChange={(e) => setNewHotel({...newHotel, address: {...newHotel.address, city: e.target.value}})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={newHotel.address?.state}
                      onChange={(e) => setNewHotel({...newHotel, address: {...newHotel.address, state: e.target.value}})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      value={newHotel.address?.zip}
                      onChange={(e) => setNewHotel({...newHotel, address: {...newHotel.address, zip: e.target.value}})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Contact Information</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={newHotel.contact?.phone}
                      onChange={(e) => setNewHotel({...newHotel, contact: {...newHotel.contact, phone: e.target.value}})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Phone"
                    />
                    <input
                      type="text"
                      value={newHotel.contact?.reception}
                      onChange={(e) => setNewHotel({...newHotel, contact: {...newHotel.contact, reception: e.target.value}})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Reception"
                    />
                    <input
                      type="email"
                      value={newHotel.contact?.email}
                      onChange={(e) => setNewHotel({...newHotel, contact: {...newHotel.contact, email: e.target.value}})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Email"
                    />
                    <input
                      type="url"
                      value={newHotel.contact?.website}
                      onChange={(e) => setNewHotel({...newHotel, contact: {...newHotel.contact, website: e.target.value}})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Website URL"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Amenities (comma-separated)</label>
                  <input
                    type="text"
                    value={newHotel.amenities?.join(", ")}
                    onChange={(e) => setNewHotel({...newHotel, amenities: e.target.value.split(",").map(item => item.trim())})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="WiFi, Pool, Gym, Spa, Restaurant"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Nearby Attractions (comma-separated)</label>
                  <input
                    type="text"
                    value={newHotel.nearby?.join(", ")}
                    onChange={(e) => setNewHotel({...newHotel, nearby: e.target.value.split(",").map(item => item.trim())})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Central Park, Shopping Mall, Museum"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location Map URL</label>
                  <input
                    type="url"
                    value={newHotel.locationMap}
                    onChange={(e) => setNewHotel({...newHotel, locationMap: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} className="w-full sm:w-auto">
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                    Create Hotel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

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

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search (Name, City)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search hotels..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={filters.name}
                onChange={(e) => setFilters(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Filter by name..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Filter by city..."
              />
            </div>
          </div>
        </div>

        {/* Hotels Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistics</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHotels.map((hotel: Hotel) => (
                  <tr key={hotel._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <div className="font-medium">{hotel.name}</div>
                      <div className="text-sm text-gray-500">{hotel.description}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{hotel.address?.city}</div>
                      <div className="text-sm text-gray-500">{hotel.address?.street}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{hotel.contact?.phone || hotel.phone}</div>
                      <div className="text-sm text-gray-500">{hotel.contact?.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div>{hotel.roomCount} Total Rooms</div>
                      <div className="text-sm text-gray-500">
                        {hotel.amenities?.length || 0} Amenities
                      </div>
                      <div className="text-sm text-gray-500">
                        {hotel.type || 'N/A'} Type
                      </div>
                      {hotel.currentBalance !== undefined && (
                        <div className="text-sm text-green-600 font-medium">
                          Balance: ${hotel.currentBalance.toFixed(2)}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm">
                        Created: {hotel.createdAt ? new Date(hotel.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {hotel.license ? (
                        <Badge 
                          variant={hotel.license.status === 'active' ? 'default' : 'destructive'}
                          className={`capitalize ${hotel.license.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : ''}`}
                        >
                          {hotel.license.status}
                          {hotel.license.expiryDate && (
                            <span className="ml-1">
                              ({new Date(hotel.license.expiryDate).toLocaleDateString()})
                            </span>
                          )}
                        </Badge>
                      ) : (
                        <Badge variant="outline">No License</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4 space-y-2">
                      <Button
                        onClick={() => {
                          setSelectedHotel(hotel);
                          setShowEditModal(true);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Edit
                      </Button>
                      {(user?.role === 'manager' || user?.role === 'super_admin') && (
                        <Button
                          onClick={() => {
                            setSelectedHotel(hotel);
                            setBalanceAmount(hotel.initialAmount || 0);
                            setShowBalanceModal(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full bg-green-100 text-green-800 hover:bg-green-200"
                        >
                          Update Balance
                        </Button>
                      )}
                      {user?.role === 'super_admin' && (
                        <>
                          <Button
                            onClick={() => handleOpenNotificationSettings(hotel)}
                            variant="outline"
                            size="sm"
                            className="w-full bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            <BellIcon className="w-4 h-4 mr-1" />
                            Notifications
                          </Button>
                          <Button
                            onClick={() => handleOpenLicenseModal(hotel)}
                            variant="outline"
                            size="sm"
                            className="w-full bg-purple-100 text-purple-800 hover:bg-purple-200"
                          >
                            <DocumentTextIcon className="w-4 h-4 mr-1" />
                            License
                          </Button>
              <Button
                            onClick={async () => {
                              try {
                                // Load full hotel including website/seo before opening modal
                                const res = await getHotel(hotel._id!);
                                if (res?.success && res.data) {
                                  setSelectedHotel(res.data);
                                } else {
                                  setSelectedHotel(hotel);
                                }
                              } catch (e) {
                                setSelectedHotel(hotel);
                              } finally {
                                setShowWebsiteModal(true);
                              }
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full bg-teal-100 text-teal-800 hover:bg-teal-200"
                          >
                            <GlobeAltIcon className="w-4 h-4 mr-1" />
                            Website Content
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedHotel(hotel);
                              setShowDomainModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            className="w-full bg-orange-100 text-orange-800 hover:bg-orange-200"
                          >
                            <GlobeAltIcon className="w-4 h-4 mr-1" />
                            Domains
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredHotels.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No hotels found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Edit Hotel Modal with Image Uploads */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Hotel - {selectedHotel?.name}</DialogTitle>
            </DialogHeader>
            {selectedHotel && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hotel Details Form */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Hotel Details</h3>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    if (!selectedHotel._id) return;
                    try {
                      await updateHotel(selectedHotel._id, selectedHotel);
                      setShowEditModal(false);
                      loadData();
                      toast.success("Hotel updated successfully");
                    } catch (e: any) {
                      setError(e.message);
                      toast.error("Failed to update hotel");
                    }
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Hotel Name *</label>
                        <input
                          type="text"
                          value={selectedHotel.name}
                          onChange={(e) => setSelectedHotel({...selectedHotel, name: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Type</label>
                        <input
                          type="text"
                          value={selectedHotel.type}
                          onChange={(e) => setSelectedHotel({...selectedHotel, type: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="e.g., 5-Star Luxury Hotel"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Phone</label>
                        <input
                          type="text"
                          value={selectedHotel.contact?.phone || selectedHotel.phone || ""}
                          onChange={(e) => setSelectedHotel({
                            ...selectedHotel, 
                            contact: { ...selectedHotel.contact, phone: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="+1-555-123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Room Count</label>
                        <input
                          type="number"
                          value={selectedHotel.roomCount || ""}
                          onChange={(e) => setSelectedHotel({...selectedHotel, roomCount: parseInt(e.target.value) || 0})}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Floors</label>
                        <input
                          type="number"
                          value={selectedHotel.floors || ""}
                          onChange={(e) => setSelectedHotel({...selectedHotel, floors: parseInt(e.target.value) || 0})}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Established Year</label>
                        <input
                          type="number"
                          value={selectedHotel.established || ""}
                          onChange={(e) => setSelectedHotel({...selectedHotel, established: parseInt(e.target.value) || new Date().getFullYear()})}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">VAT Number</label>
                        <input
                          type="text"
                          value={selectedHotel.vatNumber || ""}
                          onChange={(e) => setSelectedHotel({...selectedHotel, vatNumber: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Company Name</label>
                        <input
                          type="text"
                          value={selectedHotel.companyName || ""}
                          onChange={(e) => setSelectedHotel({...selectedHotel, companyName: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">VAT Address</label>
                        <input
                          type="text"
                          value={selectedHotel.vatAddress || ""}
                          onChange={(e) => setSelectedHotel({...selectedHotel, vatAddress: e.target.value})}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={selectedHotel.description || ""}
                        onChange={(e) => setSelectedHotel({...selectedHotel, description: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        rows={3}
                        placeholder="A brief description of the hotel..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Address</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={selectedHotel.address?.street || ""}
                          onChange={(e) => setSelectedHotel({
                            ...selectedHotel, 
                            address: { ...selectedHotel.address, street: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="Street"
                        />
                        <input
                          type="text"
                          value={selectedHotel.address?.area || ""}
                          onChange={(e) => setSelectedHotel({
                            ...selectedHotel, 
                            address: { ...selectedHotel.address, area: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="Area"
                        />
                        <input
                          type="text"
                          value={selectedHotel.address?.city || ""}
                          onChange={(e) => setSelectedHotel({
                            ...selectedHotel, 
                            address: { ...selectedHotel.address, city: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="City"
                        />
                        <input
                          type="text"
                          value={selectedHotel.address?.state || ""}
                          onChange={(e) => setSelectedHotel({
                            ...selectedHotel, 
                            address: { ...selectedHotel.address, state: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="State"
                        />
                        <input
                          type="text"
                          value={selectedHotel.address?.zip || ""}
                          onChange={(e) => setSelectedHotel({
                            ...selectedHotel, 
                            address: { ...selectedHotel.address, zip: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="ZIP Code"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Contact Information</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={selectedHotel.contact?.phone || ""}
                          onChange={(e) => setSelectedHotel({
                            ...selectedHotel, 
                            contact: { ...selectedHotel.contact, phone: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="Phone"
                        />
                        <input
                          type="text"
                          value={selectedHotel.contact?.reception || ""}
                          onChange={(e) => setSelectedHotel({
                            ...selectedHotel, 
                            contact: { ...selectedHotel.contact, reception: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="Reception"
                        />
                        <input
                          type="email"
                          value={selectedHotel.contact?.email || ""}
                          onChange={(e) => setSelectedHotel({
                            ...selectedHotel, 
                            contact: { ...selectedHotel.contact, email: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="Email"
                        />
                        <input
                          type="url"
                          value={selectedHotel.contact?.website || ""}
                          onChange={(e) => setSelectedHotel({
                            ...selectedHotel, 
                            contact: { ...selectedHotel.contact, website: e.target.value }
                          })}
                          className="w-full border border-gray-300 rounded px-3 py-2"
                          placeholder="Website URL"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Amenities (comma-separated)</label>
                      <input
                        type="text"
                        value={selectedHotel.amenities?.join(", ") || ""}
                        onChange={(e) => setSelectedHotel({
                          ...selectedHotel, 
                          amenities: e.target.value.split(",").map(item => item.trim())
                        })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="WiFi, Pool, Gym, Spa, Restaurant"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Nearby Attractions (comma-separated)</label>
                      <input
                        type="text"
                        value={selectedHotel.nearby?.join(", ") || ""}
                        onChange={(e) => setSelectedHotel({
                          ...selectedHotel, 
                          nearby: e.target.value.split(",").map(item => item.trim())
                        })}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="Central Park, Shopping Mall, Museum"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Location Map URL</label>
                      <input
                        type="url"
                        value={selectedHotel.locationMap || ""}
                        onChange={(e) => setSelectedHotel({...selectedHotel, locationMap: e.target.value})}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        placeholder="https://maps.google.com/..."
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="w-full sm:w-auto">
                        Cancel
                      </Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                        Update Hotel
                      </Button>
                    </div>
                  </form>
                </div>

                {/* Image Management Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Image Management</h3>
                  
                  {/* Logo Upload */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Hotel Logo</h4>
                    {selectedHotel.logo && isValidUrl(selectedHotel.logo) ? (
                      <div className="relative">
                        <img
                          src={selectedHotel.logo}
                          alt="Hotel Logo"
                          width={120}
                          height={120}
                          className="rounded-lg object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                        <button
                          onClick={() => handleRemoveImage(selectedHotel._id!, selectedHotel.logo!, 'logo')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-2">No logo uploaded</p>
                        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded text-sm">
                          Upload Logo
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleUploadLogo(e, selectedHotel._id!)}
                          />
                        </label>
                      </div>
                    )}
                  </div>

                  {/* Main Images Upload */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Main Images</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {selectedHotel.images?.filter(url => isValidUrl(url)).map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Hotel image ${index + 1}`}
                            width={100}
                            height={100}
                            className="rounded-lg object-cover w-full h-24"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <button
                            onClick={() => handleRemoveImage(selectedHotel._id!, image, 'images')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded text-sm">
                      <PlusIcon className="w-4 h-4 inline mr-1" />
                      Add Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleUploadImages(e, selectedHotel._id!, 'images')}
                      />
                    </label>
                  </div>

                  {/* Gallery Images Upload */}
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-3">Gallery Images</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {selectedHotel.gallery?.filter(url => isValidUrl(url)).map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Gallery image ${index + 1}`}
                            width={100}
                            height={100}
                            className="rounded-lg object-cover w-full h-24"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                          <button
                            onClick={() => handleRemoveImage(selectedHotel._id!, image, 'gallery')}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded text-sm">
                      <PlusIcon className="w-4 h-4 inline mr-1" />
                      Add Gallery Images
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={(e) => handleUploadImages(e, selectedHotel._id!, 'gallery')}
                      />
                    </label>
                  </div>

                  {/* Upload Progress */}
                  {uploading && (
                    <div className="fixed bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                        <div>
                          <p className="text-sm font-medium">Uploading...</p>
                          <div className="w-32 h-2 bg-gray-200 rounded-full mt-1">
                            <div 
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Balance Modal */}
        <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Hotel Balance</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Initial Amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(parseFloat(e.target.value) || 0)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowBalanceModal(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button onClick={handleUpdateBalance} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                  Update Balance
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Domain Management Modal */}
        <Dialog open={showDomainModal} onOpenChange={setShowDomainModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Domain Management - {selectedHotel?.name}</DialogTitle>
              <DialogDescription>
                Manage domains for this hotel. Whitelisted domains are used for CORS and domain-based routing.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="domain-type">Domain Type</Label>
                <Select
                  value={domainType}
                  onValueChange={(value: "whitelistedDomains" | "customDomains") => setDomainType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select domain type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whitelistedDomains">Whitelisted Domains</SelectItem>
                    <SelectItem value="customDomains">Custom Domains</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="new-domain">Add New Domain</Label>
                <div className="flex space-x-2">
                  <Input
                    id="new-domain"
                    placeholder="example.com"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                  />
                  <Button onClick={handleAddDomain} disabled={!newDomain}>
                    Add
                  </Button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Enter domain without protocol (e.g., example.com)
                </p>
              </div>

              <div>
                <Label className="mb-2 block">Current Domains</Label>
                <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                  {selectedHotel && selectedHotel[domainType] && selectedHotel[domainType]!.length > 0 ? (
                    <div className="space-y-2">
                      {selectedHotel[domainType]!.map((domain, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="font-medium">{domain}</div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveDomain(domain, domainType)}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 py-4">
                      No {domainType === "whitelistedDomains" ? "whitelisted" : "custom"} domains configured
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDomainModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Notification Settings Modal */}
        <Dialog open={showNotificationSettingsModal} onOpenChange={setShowNotificationSettingsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Notification Settings - {selectedHotel?.name}</DialogTitle>
              <DialogDescription>
                Configure notification preferences and recipients for this hotel.
              </DialogDescription>
            </DialogHeader>

            {emailServiceStatus && (
              <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex items-center">
                  <EnvelopeIcon className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="font-medium">Email Service Status:</span>
                  <Badge 
                    variant="outline"
                    className={`ml-2 ${emailServiceStatus.global.serviceAvailable ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {emailServiceStatus.global.serviceAvailable ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                {emailServiceStatus.global.fromAddress && (
                  <div className="text-sm text-blue-700 mt-1">
                    From: {emailServiceStatus.global.fromAddress}
                  </div>
                )}
                {emailServiceStatus.hotels.length > 0 && (
                  <div className="mt-2 text-sm text-blue-700">
                    Monitoring {emailServiceStatus.hotels.length} hotels
                  </div>
                )}
              </div>
            )}

            <Tabs defaultValue="daily">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="daily">Daily Reports</TabsTrigger>
                <TabsTrigger value="license">License Alerts</TabsTrigger>
              </TabsList>

              <TabsContent value="daily" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="daily-reports-enabled" className="flex flex-col space-y-1">
                    <span>Enable Daily Reports</span>
                    <span className="font-normal text-sm text-gray-500">
                      Send daily financial reports via email
                    </span>
                  </Label>
                  <Switch
                    id="daily-reports-enabled"
                    checked={notificationSettings.dailyReport.enabled}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      dailyReport: {
                        ...notificationSettings.dailyReport,
                        enabled: checked
                      }
                    })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="report-time">Report Time</Label>
                  <Input
                    id="report-time"
                    type="time"
                    value={notificationSettings.dailyReport.time}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      dailyReport: {
                        ...notificationSettings.dailyReport,
                        time: e.target.value
                      }
                    })}
                  />
                  <p className="text-sm text-gray-500">
                    Time when daily reports will be sent (24-hour format)
                  </p>
                </div>

                <div>
                  <Label className="mb-2 block">Recipients</Label>
                  <div className="space-y-2">
                    {notificationSettings.dailyReport.recipients.map((recipient: any, index) => (
                      <div key={index} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">{recipient.name || recipient.email}</div>
                          {recipient.name && (
                            <div className="text-sm text-gray-500">{recipient.email}</div>
                          )}
                          {recipient.role && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {recipient.role}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={recipient.active}
                            onCheckedChange={() => handleToggleRecipient(recipient.email)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveRecipient(recipient.email)}
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">Add New Recipient</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newRecipient.email}
                        onChange={(e) => setNewRecipient({...newRecipient, email: e.target.value})}
                      />
                      <Input
                        placeholder="Name (optional)"
                        value={newRecipient.name}
                        onChange={(e) => setNewRecipient({...newRecipient, name: e.target.value})}
                      />
                      <Select
                        value={newRecipient.role}
                        onValueChange={(value) => setNewRecipient({...newRecipient, role: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="owner">Owner</SelectItem>
                          <SelectItem value="accountant">Accountant</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button 
                      className="mt-2" 
                      onClick={handleAddRecipient}
                      disabled={!newRecipient.email}
                    >
                      Add Recipient
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="license" className="space-y-4 mt-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="license-alerts-enabled" className="flex flex-col space-y-1">
                    <span>Enable License Expiry Alerts</span>
                    <span className="font-normal text-sm text-gray-500">
                      Send alerts when license is about to expire
                    </span>
                  </Label>
                  <Switch
                    id="license-alerts-enabled"
                    checked={notificationSettings.licenseExpiryAlerts.enabled}
                    onCheckedChange={(checked) => setNotificationSettings({
                      ...notificationSettings,
                      licenseExpiryAlerts: {
                        ...notificationSettings.licenseExpiryAlerts,
                        enabled: checked
                      }
                    })}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Alert Before Expiry (days)</Label>
                  <div className="flex flex-wrap gap-2">
                    {[30, 15, 7, 1].map((days) => {
                      const daysBeforeArray = Array.isArray(notificationSettings.licenseExpiryAlerts.daysBefore) 
                        ? notificationSettings.licenseExpiryAlerts.daysBefore 
                        : [];
                      
                      const isSelected = daysBeforeArray.includes(days);
                      
                      return (
                        <Badge
                          key={days}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            const currentDays = daysBeforeArray;
                            const newDays = isSelected
                              ? currentDays.filter(d => d !== days)
                              : [...currentDays, days].sort((a, b) => b - a);
                            
                            setNotificationSettings({
                              ...notificationSettings,
                              licenseExpiryAlerts: {
                                ...notificationSettings.licenseExpiryAlerts,
                                daysBefore: newDays
                              }
                            });
                          }}
                        >
                          {days} day{days !== 1 ? 's' : ''}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowTestNotificationModal(true)}
                disabled={false}
                className={!emailServiceStatus?.global?.serviceAvailable ? "opacity-70" : ""}
              >
                Test Notification
                {!emailServiceStatus?.global?.serviceAvailable && (
                  <span className="ml-2 text-xs">(Email may not be configured)</span>
                )}
              </Button>
              <Button variant="outline" onClick={() => setShowNotificationSettingsModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNotificationSettings}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* License Management Modal */}
        <Dialog open={showLicenseModal} onOpenChange={setShowLicenseModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>License Management - {selectedHotel?.name}</DialogTitle>
              <DialogDescription>
                Manage hotel license information and expiry dates.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="license-number">License Number</Label>
                <Input
                  id="license-number"
                  value={licenseInfo.licenseNumber}
                  onChange={(e) => setLicenseInfo({...licenseInfo, licenseNumber: e.target.value})}
                  placeholder="Enter license number"
                />
              </div>

              <div>
                <Label htmlFor="expiry-date">Expiry Date</Label>
                <Input
                  id="expiry-date"
                  type="date"
                  value={licenseInfo.expiryDate ? new Date(licenseInfo.expiryDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setLicenseInfo({...licenseInfo, expiryDate: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="license-document">License Document URL (optional)</Label>
                <Input
                  id="license-document"
                  type="url"
                  value={licenseInfo.licenseDocument}
                  onChange={(e) => setLicenseInfo({...licenseInfo, licenseDocument: e.target.value})}
                  placeholder="https://example.com/license.pdf"
                />
              </div>

              {licenseInfo.expiryDate && (
                <div className="p-3 rounded-lg bg-gray-100">
                  <div className="flex items-center">
                    <span className="font-medium">Status:</span>
                    <Badge 
                      variant={new Date(licenseInfo.expiryDate) > new Date() ? 'default' : 'destructive'}
                      className={`ml-2 ${new Date(licenseInfo.expiryDate) > new Date() ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}`}
                    >
                      {new Date(licenseInfo.expiryDate) > new Date() ? "Active" : "Expired"}
                    </Badge>
                  </div>
                  {new Date(licenseInfo.expiryDate) > new Date() && (
                    <div className="text-sm text-gray-600 mt-1">
                      Expires in {Math.ceil((new Date(licenseInfo.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowLicenseModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveLicenseInfo}>
                Save License Info
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Test Notification Modal */}
        <Dialog open={showTestNotificationModal} onOpenChange={setShowTestNotificationModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Test Notification</DialogTitle>
              <DialogDescription>
                Send a test notification to verify your settings.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="test-type">Notification Type</Label>
                <Select
                  value={testNotificationData.type}
                  onValueChange={(value) => setTestNotificationData({...testNotificationData, type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily_report">Daily Report</SelectItem>
                    <SelectItem value="license_expiry">License Expiry Alert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testNotificationData.testEmail}
                  onChange={(e) => setTestNotificationData({...testNotificationData, testEmail: e.target.value})}
                  placeholder="test@example.com"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leave empty to use your account email
                </p>
              </div>

              {testNotificationData.type === 'daily_report' && (
                <div>
                  <Label htmlFor="test-date">Report Date</Label>
                  <Input
                    id="test-date"
                    type="date"
                    value={testNotificationData.date}
                    onChange={(e) => setTestNotificationData({...testNotificationData, date: e.target.value})}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Date for the test report (default: today)
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTestNotificationModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleTestNotification}>
                Send Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Website Content Modal */}
        <Dialog open={showWebsiteModal} onOpenChange={setShowWebsiteModal}>
          <DialogContent className="max-w-4xl h-[90vh]">
            <DialogHeader>
              <DialogTitle>Website Content - {selectedHotel?.name}</DialogTitle>
            </DialogHeader>
            {selectedHotel && (
              <WebsiteContentManager
                hotel={selectedHotel as any}
                onSave={async (content: { website: any; seo: any }) => {
                  try {
                    await updateHotelWebsite(selectedHotel._id!, content);
                    loadData();
                    toast.success("Website content updated successfully");
                  } catch (error: any) {
                    toast.error("Failed to update website content: " + error.message);
                  }
                }}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{hotels.length}</div>
            <div className="text-sm text-gray-600">Total Hotels</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">
              {hotels.reduce((sum, hotel) => sum + (hotel.roomCount || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Rooms</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">
              {hotels.reduce((sum, hotel) => sum + (hotel.amenities?.length || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">Total Amenities</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {hotels.filter(h => h.license && h.license.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Licenses</div>
          </div>
        </div>

        {/* Expenditures Section (Only visible to staff and managers) */}
        {user && ["manager", "staff"].includes(user.role) && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Expenditures</h2>
              {selectedHotel && (
                <Button onClick={() => setShowExpenditureModal(true)} className="bg-green-600 hover:bg-green-700 text-white">
                  Add Expenditure
                </Button>
              )}
            </div>

            {/* Expenditure Filters */}
            <div className="bg-white p-4 rounded-lg shadow mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={expenditureFilters.startDate?.split('T')[0]}
                    onChange={(e) => setExpenditureFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={expenditureFilters.endDate?.split('T')[0]}
                    onChange={(e) => setExpenditureFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={expenditureFilters.category}
                    onChange={(e) => setExpenditureFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">All Categories</option>
                    <option value="supplies">Supplies</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="utilities">Utilities</option>
                    <option value="salaries">Salaries</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    value={expenditureFilters.status}
                    onChange={(e) => setExpenditureFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Expenditures Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {expenditures.map((expenditure) => (
                      <tr key={expenditure._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {format(new Date(expenditure.date), 'dd/MM/yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap capitalize">{expenditure.category}</td>
                        <td className="px-6 py-4">{expenditure.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap">${expenditure.amount.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            expenditure.status === 'approved' ? 'bg-green-100 text-green-800' :
                            expenditure.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {expenditure.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.role === 'manager' && expenditure.status === 'pending' && (
                            <div className="flex space-x-2">
                              <Button
                                onClick={() => handleApproveExpenditure(expenditure._id)}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => {
                                  setSelectedExpenditure(expenditure);
                                  setShowRejectModal(true);
                                }}
                                size="sm"
                                className="bg-red-600 hover:bg-red-700 text-white"
                              >
                                Reject
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add Expenditure Modal */}
            <Dialog open={showExpenditureModal} onOpenChange={setShowExpenditureModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Expenditure</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateExpenditure} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newExpenditure.amount}
                      onChange={(e) => setNewExpenditure(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <select
                      required
                      value={newExpenditure.category}
                      onChange={(e) => setNewExpenditure(prev => ({ ...prev, category: e.target.value as any }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="supplies">Supplies</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="utilities">Utilities</option>
                      <option value="salaries">Salaries</option>
                      <option value="marketing">Marketing</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      required
                      value={newExpenditure.description}
                      onChange={(e) => setNewExpenditure(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={new Date(newExpenditure.date || "").toISOString().split('T')[0]}
                      onChange={(e) => setNewExpenditure(prev => ({ ...prev, date: new Date(e.target.value).toISOString() }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                    <textarea
                      value={newExpenditure.notes}
                      onChange={(e) => setNewExpenditure(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowExpenditureModal(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                      Create Expenditure
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={showRejectModal} onOpenChange={setShowRejectModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Expenditure</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (selectedExpenditure) {
                    handleRejectExpenditure(selectedExpenditure._id);
                    setShowRejectModal(false);
                  }
                }} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Reason for Rejection</label>
                    <textarea
                      required
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowRejectModal(false)} className="w-full sm:w-auto">
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto">
                      Reject
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

          </div>
          
        )}
      </div>
    </div>
  );
}