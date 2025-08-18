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

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export default function ItemsPage() {
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: limit,
    hasNextPage: false,
    hasPrevPage: false,
  });

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

  // Function to fetch items with pagination
  const fetchItems = async (pageNum: number = page, filterParams = filters) => {
    const token = getToken();
    if (!token) return;

    try {
      const apiBase = "http://localhost:3000/api";
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString()
      });
      
      if (filterParams.isAvailable) params.append("isAvailable", filterParams.isAvailable);
      if (filterParams.category) params.append("category", filterParams.category);
      if (filterParams.search) params.append("search", filterParams.search);

      const itemsRes = await fetch(`${apiBase}/items?${params.toString()}`, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`
        }
      });

      if (!itemsRes.ok) {
        throw new Error("Failed to fetch items");
      }

      const data = await itemsRes.json();
      
      // Handle different response structures
      let itemsData: Item[] = [];
      let paginationData: PaginationInfo = {
        currentPage: pageNum,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: limit,
        hasNextPage: false,
        hasPrevPage: false,
      };

      if (data.data && Array.isArray(data.data)) {
        itemsData = data.data;
        // If pagination info is provided in response
        if (data.pagination) {
          paginationData = {
            currentPage: data.pagination.currentPage || pageNum,
            totalPages: data.pagination.totalPages || 1,
            totalItems: data.pagination.totalItems || itemsData.length,
            itemsPerPage: data.pagination.itemsPerPage || limit,
            hasNextPage: data.pagination.hasNextPage || false,
            hasPrevPage: data.pagination.hasPrevPage || false,
          };
        } else {
          // Calculate pagination info if not provided
          paginationData.totalItems = itemsData.length;
          paginationData.totalPages = Math.ceil(itemsData.length / limit);
          paginationData.hasNextPage = pageNum < paginationData.totalPages;
          paginationData.hasPrevPage = pageNum > 1;
        }
      } else if (Array.isArray(data)) {
        itemsData = data;
        paginationData.totalItems = itemsData.length;
        paginationData.totalPages = Math.ceil(itemsData.length / limit);
        paginationData.hasNextPage = pageNum < paginationData.totalPages;
        paginationData.hasPrevPage = pageNum > 1;
      }

      // Apply client-side search filter if needed (when API doesn't support search)
      if (filterParams.search && !params.has("search")) {
        itemsData = itemsData.filter((item: Item) =>
          item.name && item.name.toLowerCase().includes(filterParams.search.toLowerCase())
        );
        // Recalculate pagination for client-side filtering
        paginationData.totalItems = itemsData.length;
        paginationData.totalPages = Math.ceil(itemsData.length / limit);
        paginationData.hasNextPage = pageNum < paginationData.totalPages;
        paginationData.hasPrevPage = pageNum > 1;
      }

      setItems(itemsData);
      setPagination(paginationData);
    } catch (e: any) {
      setError(e.message);
    }
  };

  // Fetch initial data
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

        // 4. Fetch items with pagination
        await fetchItems(1, filters);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  // Refetch items when page changes
  useEffect(() => {
    if (!loading) {
      fetchItems(page, filters);
    }
  }, [page]);

  // Reset to page 1 and refetch when filters change
  useEffect(() => {
    if (!loading) {
      setPage(1);
      fetchItems(1, filters);
    }
  }, [filters.category, filters.search, filters.isAvailable]);

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && newPage !== page) {
      setPage(newPage);
    }
  };

  const createItem = async () => {
    try {
      const token = getToken();
      const hotel = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('hotel') || '{}') : {};
      const hotelId = hotel?._id;

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
      // Refresh current page
      await fetchItems(page, filters);
    } catch (e: any) {
      setError(e.message);
    }
  };

  const updateItem = async () => {
    if (!selectedItem) return;
    try {
      const token = getToken();
      const hotel = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('hotel') || '{}') : {};
      const hotelId = hotel?._id;

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
      // Refresh current page
      await fetchItems(page, filters);
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
      
      // If we're on the last page and it becomes empty, go back one page
      if (items.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        // Refresh current page
        await fetchItems(page, filters);
      }
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

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const { currentPage, totalPages } = pagination;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    return pages;
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
                  categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))
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
          {/* Pagination Info */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {pagination.totalItems > 0 ? ((pagination.currentPage - 1) * pagination.itemsPerPage) + 1 : 0} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} items
              </div>
              <div className="text-sm text-gray-700">
                Page {pagination.currentPage} of {pagination.totalPages}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
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
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-gray-500">
                      No items found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    pagination.hasPrevPage
                      ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      : 'text-gray-400 bg-gray-200 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  Previous
                </button>

                <div className="flex space-x-1">
                  {pagination.currentPage > 3 && pagination.totalPages > 5 && (
                    <>
                      <button
                        onClick={() => handlePageChange(1)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        1
                      </button>
                      {pagination.currentPage > 4 && (
                        <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
                      )}
                    </>
                  )}

                  {getPageNumbers().map((pageNum) => (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        pageNum === pagination.currentPage
                          ? 'text-blue-600 bg-blue-50 border border-blue-300'
                          : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}

                  {pagination.currentPage < pagination.totalPages - 2 && pagination.totalPages > 5 && (
                    <>
                      {pagination.currentPage < pagination.totalPages - 3 && (
                        <span className="px-3 py-2 text-sm font-medium text-gray-500">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(pagination.totalPages)}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                      >
                        {pagination.totalPages}
                      </button>
                    </>
                  )}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    pagination.hasNextPage
                      ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                      : 'text-gray-400 bg-gray-200 border border-gray-200 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{pagination.totalItems}</div>
            <div className="text-sm text-gray-600">Total Items</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{items.filter((i: Item) => i.isAvailable).length}</div>
            <div className="text-sm text-gray-600">Available (Current Page)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{items.filter((i: Item) => !i.isAvailable).length}</div>
            <div className="text-sm text-gray-600">Unavailable (Current Page)</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-600">{pagination.totalPages}</div>
            <div className="text-sm text-gray-600">Total Pages</div>
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