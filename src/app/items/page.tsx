"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";
import { NavBar } from "@/components/ui/NavBar";

interface CategoryObj {
  _id: string;
  name: string;
  description?: string;
  createdBy?: string;
  hotel?: string;
  createdAt?: string;
  updatedAt?: string;
  __v?: number;
}

interface Item {
  _id: string;
  name: string;
  description: string;
  price: number;
  category: string | CategoryObj;
  isAvailable: boolean;
  hotel?: { name: string };
  createdAt: string;
  updatedAt: string;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export default function ItemsPage() {
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Checkouts", href: "/checkouts" },
    { label: "Guests", href: "/guests" },
    { label: "Hotels", href: "/hotels" },
    { label: "Items", href: "/items" },
    { label: "Orders", href: "/orders" },
    { label: "Rooms", href: "/rooms" },
    { label: "Stats", href: "/stats" },
    { label: "Users", href: "/users" },
  ];
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    isAvailable: ""
  });

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    isAvailable: true,
    profitMarginBand: "",
    comment: ""
  });


  // Categories state
  const [categories, setCategories] = useState<CategoryObj[]>([]);

  // Fetch /auth/me, /hotels/me, and /items on page load
  useEffect(() => {
    const fetchInitialData = async () => {
      const token = getToken();
      if (!token) {
        setError("No authentication token");
        setLoading(false);
        return;
      }
      try {
        // 1. Fetch /auth/me
        const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        if (!meRes.ok) throw new Error("Not authenticated");
        const meData = await meRes.json();
        localStorage.setItem("user", JSON.stringify(meData.data || null));

        // 2. Fetch /hotels/me
        const hotelRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hotels/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });
        let hotelId = "";
        if (hotelRes.ok) {
          const hotelData = await hotelRes.json();
          localStorage.setItem("hotel", JSON.stringify(hotelData.data || null));
          hotelId = hotelData.data?._id;
        }

        // 3. Fetch categories for this hotel
        if (hotelId) {
          const catRes = await fetch(`http://localhost:3000/api/categories?hotelId=${hotelId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json"
            }
          });
          if (catRes.ok) {
            const catData = await catRes.json();
            setCategories(catData.data || []);
          }
        }

        // 4. Fetch items
        const apiBase = "http://localhost:3000/api";
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString()
        });
        if (filters.isAvailable) params.append("isAvailable", filters.isAvailable);
        if (filters.category) params.append("category", filters.category);
        const itemsRes = await fetch(`${apiBase}/items?${params.toString()}`, {
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`
          }
        });
        const data = await itemsRes.json();
        let itemsData = data.data || data || [];
        if (filters.search) {
          itemsData = itemsData.filter((item: Item) =>
            item.name && item.name.toLowerCase().includes(filters.search.toLowerCase())
          );
        }
        setItems(itemsData);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createItem = async () => {
    try {
      const token = getToken();
      // Get hotelId from localStorage
      const hotel = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('hotel') || '{}') : {};
      const hotelId = hotel?._id;
      // Build payload as per new requirements
      const payload: any = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        isAvailable: formData.isAvailable,
        hotel: hotelId
      };
      if (formData.profitMarginBand) payload.profitMarginBand = formData.profitMarginBand;
      if (formData.comment) payload.comment = formData.comment;
      const res = await fetch("http://localhost:3000/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to create item");
      }
      setSuccess("Item created successfully!");
      setShowCreateModal(false);
      resetForm();
      // Refresh items
      const apiBase = "http://localhost:3000/api";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (filters.isAvailable) params.append("isAvailable", filters.isAvailable);
      if (filters.category) params.append("category", filters.category);
      const itemsRes = await fetch(`${apiBase}/items?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await itemsRes.json();
      let itemsData = data.data || data || [];
      if (filters.search) {
        itemsData = itemsData.filter((item: Item) =>
          item.name && item.name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      setItems(itemsData);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateItem = async () => {
    if (!selectedItem) return;
    try {
      const token = getToken();
      // Get hotelId from localStorage
      const hotel = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('hotel') || '{}') : {};
      const hotelId = hotel?._id;
      // Build payload as per new requirements
      const payload: any = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        isAvailable: formData.isAvailable,
        hotel: hotelId
      };
      if (formData.profitMarginBand) payload.profitMarginBand = formData.profitMarginBand;
      if (formData.comment) payload.comment = formData.comment;
      const res = await fetch(`http://localhost:3000/api/items/${selectedItem._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update item");
      }
      setSuccess("Item updated successfully!");
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      // Refresh items
      const apiBase = "http://localhost:3000/api";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (filters.isAvailable) params.append("isAvailable", filters.isAvailable);
      if (filters.category) params.append("category", filters.category);
      const itemsRes = await fetch(`${apiBase}/items?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await itemsRes.json();
      let itemsData = data.data || data || [];
      if (filters.search) {
        itemsData = itemsData.filter((item: Item) =>
          item.name && item.name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      setItems(itemsData);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const deleteItem = async () => {
    if (!selectedItem) return;
    try {
      const token = getToken();
      const res = await fetch(`http://localhost:3000/api/items/${selectedItem._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to delete item");
      }
      setSuccess("Item deleted successfully!");
      setShowDeleteModal(false);
      setSelectedItem(null);
      // Refresh items
      const apiBase = "http://localhost:3000/api";
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      if (filters.isAvailable) params.append("isAvailable", filters.isAvailable);
      if (filters.category) params.append("category", filters.category);
      const itemsRes = await fetch(`${apiBase}/items?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      const data = await itemsRes.json();
      let itemsData = data.data || data || [];
      if (filters.search) {
        itemsData = itemsData.filter((item: Item) =>
          item.name && item.name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }
      setItems(itemsData);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: "",
      category: "",
      isAvailable: true,
      profitMarginBand: "",
      comment: ""
    });
  };

  const openEditModal = async (item: Item) => {
    setSelectedItem(item);
    const token = getToken();
    try {
      const res = await fetch(`http://localhost:3000/api/items/${item._id}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch item details");
      const data = await res.json();
      const details = data.data || data;
      setFormData({
        name: details.name || "",
        price: details.price?.toString() || "",
        category: typeof details.category === 'object' && details.category !== null ? details.category._id : details.category || "",
        isAvailable: details.isAvailable ?? true,
        profitMarginBand: details.profitMarginBand || "",
        comment: details.comment || ""
      });
      setShowEditModal(true);
    } catch (e: any) {
      setFormData({
        name: item.name,
        price: item.price.toString(),
        category: typeof item.category === 'object' && item.category !== null ? item.category._id : item.category,
        isAvailable: item.isAvailable,
        profitMarginBand: (item as any).profitMarginBand || "",
        comment: (item as any).comment || ""
      });
      setShowEditModal(true);
    }
  };

  const openDeleteModal = (item: Item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  // Reset page to 1 on filter change
  useEffect(() => { setPage(1); }, [filters]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

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
          <h1 className="text-3xl font-bold">Items Management</h1>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Add New Item
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

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {success}
            <button 
              onClick={() => setSuccess("")} 
              className="float-right text-green-700 hover:text-green-900"
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
              <label className="block text-sm font-medium mb-1">Search (Name)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search items..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Categories</option>
                {categories.length === 0 ? (
                  <option disabled>Loading...</option>
                ) : (
                  categories.map((cat, idx) => {
                    let key = typeof cat === 'string' ? cat : JSON.stringify(cat) + '-' + idx;
                    return <option key={key} value={typeof cat === 'string' ? cat : ''}>{typeof cat === 'string' ? cat : JSON.stringify(cat)}</option>;
                  })
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Availability</label>
              <select
                value={filters.isAvailable}
                onChange={(e) => setFilters(prev => ({ ...prev, isAvailable: e.target.value }))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Items</option>
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Array.isArray(items) && items.length > 0 ? (
                  items.map((item: Item) => (
                    <tr key={item._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{item.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {typeof item.category === 'object' && item.category !== null ? item.category.name : item.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">₹{item.price}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          item.isAvailable 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{item.hotel?.name || "-"}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(item)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : items && typeof items === 'object' && Object.keys(items).length > 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-red-500">Invalid items data received. Please check the API response.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500">No items found matching your criteria.</div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{items.length}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{items.filter((i: Item) => i.isAvailable).length}</div>
            <div className="text-sm text-gray-600">Available</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{items.filter((i: Item) => !i.isAvailable).length}</div>
            <div className="text-sm text-gray-600">Unavailable</div>
          </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Item</h2>
            <form onSubmit={(e) => { e.preventDefault(); createItem(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                {/* Description field removed as per requirements */}
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Profit Margin Band</label>
                  <input
                    type="text"
                    value={formData.profitMarginBand}
                    onChange={(e) => setFormData(prev => ({ ...prev, profitMarginBand: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g. High, Medium, Low"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Comment</label>
                  <input
                    type="text"
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Optional comment"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="mr-2"
                    />
                    Available
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Item</h2>
            <form onSubmit={(e) => { e.preventDefault(); updateItem(); }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                {/* Description field removed as per requirements */}
                <div>
                  <label className="block text-sm font-medium mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Profit Margin Band</label>
                  <input
                    type="text"
                    value={formData.profitMarginBand}
                    onChange={(e) => setFormData(prev => ({ ...prev, profitMarginBand: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="e.g. High, Medium, Low"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Comment</label>
                  <input
                    type="text"
                    value={formData.comment}
                    onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    placeholder="Optional comment"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.isAvailable}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
                      className="mr-2"
                    />
                    Available
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Update Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Item</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedItem.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteItem}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}