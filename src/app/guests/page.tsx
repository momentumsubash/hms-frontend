"use client";

import { getGuests, getRooms, updateGuest, addGuest as createGuest, getMe } from "@/lib/api";
import { useEffect, useState, useRef } from "react";
import { format } from "date-fns";

interface Guest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  rooms: string[];
  checkInDate: string;
  checkOutDate?: string;
  isCheckedOut: boolean;
  totalBill: number;
  createdBy: string;
  hotel: string;
  createdAt: string;
  updatedAt: string;
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
  rooms: string[];
  checkInDate: string;
  checkOutDate: string;
}

export default function GuestsPage() {
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
    rooms: [],
    checkInDate: "",
    checkOutDate: ""
  });
  // User info for nav bar
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    isCheckedOut: "",
    roomNumber: "",
    search: ""
  });


  useEffect(() => {
    loadData();
    getMe().then(setUser).catch(() => setUser(null));
    // Close user menu on outside click
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [guestsRes, roomsRes] = await Promise.all([
        getGuests(),
        getRooms()
      ]);
      setGuests(guestsRes?.data || guestsRes || []);
      setRooms(roomsRes?.data || roomsRes || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      rooms: [],
      checkInDate: "",
      checkOutDate: ""
    });
    setEditingGuest(null);
    setShowForm(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    
    try {
      const guestData = {
        ...formData,
        checkInDate: new Date(formData.checkInDate).toISOString(),
        checkOutDate: formData.checkOutDate ? new Date(formData.checkOutDate).toISOString() : undefined
      };
      if (editingGuest) {
        await updateGuest(editingGuest._id, guestData);
      } else {
        await createGuest(guestData);
      }
      await loadData();
      resetForm();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (guest: Guest) => {
    setEditingGuest(guest);
    setFormData({
      firstName: guest.firstName,
      lastName: guest.lastName,
      email: guest.email,
      phone: guest.phone,
      address: guest.address || "",
      rooms: guest.rooms || [],
      checkInDate: guest.checkInDate ? format(new Date(guest.checkInDate), "yyyy-MM-dd'T'HH:mm") : "",
      checkOutDate: guest.checkOutDate ? format(new Date(guest.checkOutDate), "yyyy-MM-dd'T'HH:mm") : ""
    });
    setShowForm(true);
  };

  // Get available rooms (not occupied)
  const availableRooms = rooms.filter(room => !room.isOccupied || (formData.rooms && formData.rooms.includes(room.roomNumber)));

  // Filter guests based on search criteria
  const filteredGuests = guests.filter(guest => {
    const matchesCheckedOut = filters.isCheckedOut === "" || 
      guest.isCheckedOut.toString() === filters.isCheckedOut;
    const matchesRoom = filters.roomNumber === "" || 
      (guest.rooms && guest.rooms.some(r => r.toLowerCase().includes(filters.roomNumber.toLowerCase())));
    const matchesSearch = filters.search === "" || 
      `${guest.firstName} ${guest.lastName}`.toLowerCase().includes(filters.search.toLowerCase()) ||
      guest.email.toLowerCase().includes(filters.search.toLowerCase()) ||
      guest.phone.includes(filters.search);
    return matchesCheckedOut && matchesRoom && matchesSearch;
  });

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-6">
              <span className="font-bold text-xl text-primary">Hotel HMS</span>
              <div className="flex space-x-4">
                {navLinks.map((link) => (
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
            {/* User info at right */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <button
                  className="flex items-center space-x-2 px-3 py-2 rounded hover:bg-gray-100 border border-gray-200"
                  onClick={() => setShowUserMenu((v) => !v)}
                >
                  <span className="font-medium text-gray-700">{user.firstName} {user.lastName}</span>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                </button>
              ) : (
                <span className="text-gray-400">Not logged in</span>
              )}
              {showUserMenu && user && (
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded shadow z-50">
                  <button
                    className="block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
                    onClick={async () => {
                      setShowUserMenu(false);
                    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001/api";
                    await fetch(`${apiBase}/auth/logout`, {
                      method: "POST",
                      headers: {
                        Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4OWRiMjQ5N2M2NzMzMjVlODNjMzcwOSIsInJvbGUiOiJtYW5hZ2VyIiwiaWF0IjoxNzU1MTc0NTE1LCJleHAiOjE3NTUyNjA5MTV9.jCJC1S4lDBM9a_c0ocZwgMNFf2TNr2UBDvXLXxHi3R4"
                      }
                    });
                      window.location.href = "/login";
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Guests Management</h1>
        <button
          onClick={() => setShowForm(true)}
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h3 className="text-lg font-semibold mb-3">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Search (Name, Email, Phone)</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Search guests..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Room Number</label>
            <input
              type="text"
              value={filters.roomNumber}
              onChange={(e) => setFilters(prev => ({ ...prev, roomNumber: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
              placeholder="Filter by room..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Check-out Status</label>
            <select
              value={filters.isCheckedOut}
              onChange={(e) => setFilters(prev => ({ ...prev, isCheckedOut: e.target.value }))}
              className="w-full border border-gray-300 rounded px-3 py-2"
            >
              <option value="">All Guests</option>
              <option value="false">Currently Staying</option>
              <option value="true">Checked Out</option>
            </select>
          </div>
        </div>
      </div>

      {/* Guest Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">
              {editingGuest ? "Edit Guest" : "Add New Guest"}
            </h2>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rooms *</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-300 rounded px-3 py-2">
                  {availableRooms.map(room => (
                    <label key={room._id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        value={room.roomNumber}
                        checked={formData.rooms.includes(room.roomNumber)}
                        onChange={e => {
                          const checked = e.target.checked;
                          setFormData(prev => {
                            let newRooms = prev.rooms || [];
                            if (checked) {
                              newRooms = [...newRooms, room.roomNumber];
                            } else {
                              newRooms = newRooms.filter(r => r !== room.roomNumber);
                            }
                            return { ...prev, rooms: newRooms };
                          });
                        }}
                        className="form-checkbox"
                      />
                      <span>
                        Room {room.roomNumber} - {room.type} (₹{room.rate}/night) - Capacity: {room.capacity}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="text-xs text-gray-500 mt-1">Select one or more rooms for the guest.</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Check-in Date *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.checkInDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkInDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Check-out Date</label>
                  <input
                    type="datetime-local"
                    value={formData.checkOutDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, checkOutDate: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
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
                  Room
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stay Period
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
              {filteredGuests.map((guest) => (
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {guest.rooms && guest.rooms.length > 0 ? (
                      guest.rooms.map((room, idx) => (
                        <span key={room} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                          Room {room}
                        </span>
                      ))
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      guest.isCheckedOut 
                        ? "bg-gray-100 text-gray-800" 
                        : "bg-green-100 text-green-800"
                    }`}>
                      {guest.isCheckedOut ? "Checked Out" : "Currently Staying"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₹{guest.totalBill.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(guest)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {/* Add view orders functionality */}}
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

        {filteredGuests.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">No guests found matching your criteria.</div>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-2xl font-bold text-blue-600">{guests.length}</div>
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
            {rooms.filter(r => !r.isOccupied).length}
          </div>
          <div className="text-sm text-gray-600">Available Rooms</div>
        </div>
      </div>
      </div>
    </div>
  );
}