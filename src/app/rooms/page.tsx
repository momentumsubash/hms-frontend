
"use client";

import { getRooms, updateRoom } from "@/lib/api";
import { useEffect, useState } from "react";

export default function RoomsPage() {
  const { logout } = require("@/components/ui/auth-provider").useAuth();
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [user, setUser] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  useEffect(() => {
    // Fetch user info using token from localStorage
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => setUser(data.data || null))
      .catch(() => setUser(null));
  }, []);
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
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    type: "",
    occupied: "",
    search: ""
  });
  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editRoom, setEditRoom] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({
    type: "",
    rate: 0,
    description: "",
    amenities: [],
    isOccupied: false,
    capacity: 1,
  });
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getRooms();
      setRooms(res?.data || res || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter rooms
  const filteredRooms = rooms.filter((room: any) => {
    const matchesType = filters.type === "" || room.type === filters.type;
    const matchesOccupied = filters.occupied === "" || (filters.occupied === "true" ? room.isOccupied : !room.isOccupied);
    const matchesSearch = filters.search === "" ||
      (room.roomNumber && room.roomNumber.toLowerCase().includes(filters.search.toLowerCase()));
    return matchesType && matchesOccupied && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRooms.length / limit);
  const paginatedRooms = filteredRooms.slice((page - 1) * limit, page * limit);

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
            <div className="flex space-x-4 flex-1">
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
            {/* User button in nav bar */}
            <div className="relative">
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
                      await logout();
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
          <h1 className="text-3xl font-bold">Rooms Management</h1>
        </div>

        {/* Summary Section */}
        <div className="flex gap-8 mb-6">
          <div className="bg-blue-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-blue-700 text-sm font-semibold">Total Rooms</div>
            <div className="text-2xl font-bold text-blue-900">{rooms.length}</div>
          </div>
          <div className="bg-green-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-green-700 text-sm font-semibold">Available</div>
            <div className="text-2xl font-bold text-green-900">{rooms.filter((r) => !r.isOccupied).length}</div>
          </div>
          <div className="bg-red-100 rounded-lg shadow p-4 flex-1 text-center">
            <div className="text-red-700 text-sm font-semibold">Occupied</div>
            <div className="text-2xl font-bold text-red-900">{rooms.filter((r) => r.isOccupied).length}</div>
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

        {/* Filters */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <h3 className="text-lg font-semibold mb-3">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search (Room #)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search rooms..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <input
                type="text"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Filter by type..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Occupied</label>
              <select
                value={filters.occupied}
                onChange={(e) => setFilters(prev => ({ ...prev, occupied: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All</option>
                <option value="true">Occupied</option>
                <option value="false">Available</option>
              </select>
            </div>
          </div>
        </div>


        {/* Rooms Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room #</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amenities</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupied</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedRooms.map((room: any) => (
                  <tr key={room._id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">{room.roomNumber}</td>
                    <td className="px-4 py-4 whitespace-nowrap capitalize">{room.type}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{room.description}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {room.amenities && room.amenities.length > 0 ? (
                        <ul className="flex flex-wrap gap-1">
                          {room.amenities.map((a: string, i: number) => (
                            <li key={i} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">{a}</li>
                          ))}
                        </ul>
                      ) : "-"}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{room.capacity}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{room.hotel?.name || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{room.guestName || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{room.guestPhone || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">₹{room.rate}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {room.isOccupied ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-800 text-xs">Occupied</span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs">Available</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">{room.maintanenceStatus || '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{room.createdAt ? new Date(room.createdAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">{room.updatedAt ? new Date(room.updatedAt).toLocaleString() : '-'}</td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        className="text-blue-600 hover:underline text-sm"
                        onClick={() => {
                          setEditRoom(room);
                          setEditForm({
                            type: room.type,
                            rate: room.rate,
                            description: room.description,
                            amenities: room.amenities || [],
                            isOccupied: room.isOccupied,
                            capacity: room.capacity,
                          });
                          setShowEdit(true);
                        }}
                      >Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Edit Room Modal */}
            {showEdit && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-4">Edit Room {editRoom?.roomNumber}</h2>
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setEditLoading(true);
                      try {
                        await updateRoom(editRoom.roomNumber, {
                          type: editForm.type,
                          rate: Number(editForm.rate),
                          description: editForm.description,
                          amenities: Array.isArray(editForm.amenities)
                            ? editForm.amenities.filter((a: string) => a.trim() !== "")
                            : [],
                          isOccupied: editForm.isOccupied,
                          capacity: Number(editForm.capacity),
                        });
                        setShowEdit(false);
                        setEditRoom(null);
                        await loadData();
                      } catch (e: any) {
                        setError(e.message);
                      } finally {
                        setEditLoading(false);
                      }
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        value={editForm.type}
                        onChange={e => setEditForm((f: any) => ({ ...f, type: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      >
                        <option value="">Select Type</option>
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="suite">Suite</option>
                        <option value="deluxe">Deluxe</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Rate</label>
                      <input
                        type="number"
                        value={editForm.rate}
                        onChange={e => setEditForm((f: any) => ({ ...f, rate: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={editForm.description}
                        onChange={e => setEditForm((f: any) => ({ ...f, description: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        rows={2}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Amenities (comma separated)</label>
                      <input
                        type="text"
                        value={Array.isArray(editForm.amenities) ? editForm.amenities.join(", ") : ""}
                        onChange={e => setEditForm((f: any) => ({ ...f, amenities: e.target.value.split(",").map((a: string) => a.trim()) }))}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Occupied</label>
                      <select
                        value={editForm.isOccupied ? "true" : "false"}
                        onChange={e => setEditForm((f: any) => ({ ...f, isOccupied: e.target.value === "true" }))}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                      >
                        <option value="false">No</option>
                        <option value="true">Yes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Capacity</label>
                      <input
                        type="number"
                        value={editForm.capacity}
                        onChange={e => setEditForm((f: any) => ({ ...f, capacity: e.target.value }))}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
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
                      >{editLoading ? "Saving..." : "Update Room"}</button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded border ${page === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'}`}
                  onClick={() => setPage(i + 1)}
                >{i + 1}</button>
              ))}
              <button
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >Next</button>
            </div>
          )}
          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4">
              <button
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >Prev</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  className={`px-3 py-1 rounded border ${page === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'}`}
                  onClick={() => setPage(i + 1)}
                >{i + 1}</button>
              ))}
              <button
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >Next</button>
            </div>
          )}
          {filteredRooms.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No rooms found matching your criteria.</div>
            </div>
          )}
        </div>

  {/* Removed duplicate summary stats section */}
      </div>
    </div>
  );
}
