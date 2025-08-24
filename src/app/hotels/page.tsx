"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";
import { getHotels, addHotel, updateHotel, updateHotelBalance } from "@/lib/api";
import { createExpenditure, getExpenditures, approveExpenditure, rejectExpenditure } from "@/lib/expenditure";
import { Hotel } from "@/types/hotel";
import { Expenditure, ExpenditureFilters } from "@/types/expenditure";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { PlusIcon, PencilIcon } from "@heroicons/react/24/outline";

export default function HotelsPage() {
  // Hotel state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBalanceModal, setShowBalanceModal] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [showExpenditureModal, setShowExpenditureModal] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState(0);

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
  
  const [newHotel, setNewHotel] = useState<Hotel>({
    name: "",
    description: "",
    location: "",
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
    createdAt: new Date().toISOString()
  });

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
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    name: "",
    city: "",
    search: ""
  });

  useEffect(() => {
    loadData();
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

  // Filter hotels
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
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Hotels Management</h1>
          {user?.role === 'super_admin' && (
            <Button onClick={() => setShowCreateModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white">
              Add New Hotel
            </Button>
          )}
        </div>

        {/* Create Hotel Modal - Only for super_admin */}
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
                  // Reset form
                  setNewHotel({
                    name: "",
                    description: "",
                    location: "",
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
                    createdAt: new Date().toISOString()
                  });
                } catch (e: any) {
                  setError(e.message);
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

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistics</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredHotels.map((hotel: Hotel) => (
                  <tr key={hotel._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium">{hotel.name}</div>
                      <div className="text-sm text-gray-500">{hotel.description}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{hotel.address?.city}</div>
                      <div className="text-sm text-gray-500">{hotel.address?.street}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{hotel.contact?.phone || hotel.phone}</div>
                      <div className="text-sm text-gray-500">{hotel.contact?.email}</div>
                    </td>
                    <td className="px-6 py-4">
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
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        Created: {hotel.createdAt ? new Date(hotel.createdAt).toLocaleDateString() : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 space-y-2">
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

        {/* Edit Hotel Modal */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Hotel</DialogTitle>
            </DialogHeader>
            {selectedHotel && (
              <form onSubmit={async (e) => {
                e.preventDefault();
                if (!selectedHotel._id) return;
                try {
                  await updateHotel(selectedHotel._id, selectedHotel);
                  setShowEditModal(false);
                  loadData();
                } catch (e: any) {
                  setError(e.message);
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
                      value={selectedHotel.contact?.phone || selectedHotel.phone}
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
                      value={selectedHotel.roomCount}
                      onChange={(e) => setSelectedHotel({...selectedHotel, roomCount: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Floors</label>
                    <input
                      type="number"
                      value={selectedHotel.floors}
                      onChange={(e) => setSelectedHotel({...selectedHotel, floors: parseInt(e.target.value) || 0})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Established Year</label>
                    <input
                      type="number"
                      value={selectedHotel.established}
                      onChange={(e) => setSelectedHotel({...selectedHotel, established: parseInt(e.target.value) || new Date().getFullYear()})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">VAT Number</label>
                    <input
                      type="text"
                      value={selectedHotel.vatNumber}
                      onChange={(e) => setSelectedHotel({...selectedHotel, vatNumber: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Company Name</label>
                    <input
                      type="text"
                      value={selectedHotel.companyName}
                      onChange={(e) => setSelectedHotel({...selectedHotel, companyName: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">VAT Address</label>
                    <input
                      type="text"
                      value={selectedHotel.vatAddress}
                      onChange={(e) => setSelectedHotel({...selectedHotel, vatAddress: e.target.value})}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={selectedHotel.description}
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
                      value={selectedHotel.address?.street}
                      onChange={(e) => setSelectedHotel({
                        ...selectedHotel, 
                        address: { ...selectedHotel.address, street: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Street"
                    />
                    <input
                      type="text"
                      value={selectedHotel.address?.area}
                      onChange={(e) => setSelectedHotel({
                        ...selectedHotel, 
                        address: { ...selectedHotel.address, area: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Area"
                    />
                    <input
                      type="text"
                      value={selectedHotel.address?.city}
                      onChange={(e) => setSelectedHotel({
                        ...selectedHotel, 
                        address: { ...selectedHotel.address, city: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="City"
                    />
                    <input
                      type="text"
                      value={selectedHotel.address?.state}
                      onChange={(e) => setSelectedHotel({
                        ...selectedHotel, 
                        address: { ...selectedHotel.address, state: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="State"
                    />
                    <input
                      type="text"
                      value={selectedHotel.address?.zip}
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
                      value={selectedHotel.contact?.phone}
                      onChange={(e) => setSelectedHotel({
                        ...selectedHotel, 
                        contact: { ...selectedHotel.contact, phone: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Phone"
                    />
                    <input
                      type="text"
                      value={selectedHotel.contact?.reception}
                      onChange={(e) => setSelectedHotel({
                        ...selectedHotel, 
                        contact: { ...selectedHotel.contact, reception: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Reception"
                    />
                    <input
                      type="email"
                      value={selectedHotel.contact?.email}
                      onChange={(e) => setSelectedHotel({
                        ...selectedHotel, 
                        contact: { ...selectedHotel.contact, email: e.target.value }
                      })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      placeholder="Email"
                    />
                    <input
                      type="url"
                      value={selectedHotel.contact?.website}
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
                    value={selectedHotel.locationMap}
                    onChange={(e) => setSelectedHotel({...selectedHotel, locationMap: e.target.value})}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="https://maps.google.com/..."
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Update Hotel
                  </Button>
                </div>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Update Balance Modal */}
        <Dialog open={showBalanceModal} onOpenChange={setShowBalanceModal}>
          <DialogContent>
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
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowBalanceModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateBalance} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Update Balance
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowExpenditureModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
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
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowRejectModal(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                      Reject
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
        {/* <div className="flex justify-between items-center mb-6">
  <Button 
    onClick={() => {
      if (user?.role === 'super_admin') {
        setShowCreateModal(true);
      } else {
        setError("Only super administrators can create new hotels");
      }
    }} 
    className="bg-blue-600 hover:bg-blue-700 text-white"
  >
    <PlusIcon className="w-5 h-5 mr-2" />
    Add New Hotel
  </Button>
</div> */}
      </div>
      

    </div>
  );
}