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
  profitMarginBand?: string;
  comment?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface SortInfo {
  by: string;
  order: string;
}

interface ApiResponse {
  success: boolean;
  data: Item[];
  pagination: PaginationInfo;
  sort?: SortInfo;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export default function ItemsPage() {
  // Load hotel from localStorage
  const [hotel, setHotel] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hotel');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });
  // Listen for localStorage changes (e.g., nepaliLanguage toggle)
  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'hotel') {
        setHotel(event.newValue ? JSON.parse(event.newValue) : null);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
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
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

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

  // Debounce timer for search
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Function to fetch items with pagination and filters
  const fetchItems = async (pageNum: number = page, filterParams = filters) => {
    const token = getToken();
    if (!token) return;

    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: limit.toString()
      });
      
      // Add filters to query params
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

      const data: ApiResponse = await itemsRes.json();
      
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
        
        // Set pagination info from API response
        if (data.pagination) {
          setPagination(data.pagination);
        }
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
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
        // const meRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/me`, {
        //   headers: {
        //     Authorization: `Bearer ${token}`,
        //     Accept: "application/json",
        //   },
        // });
        // if (!meRes.ok) throw new Error("Not authenticated");
        // const meData = await meRes.json();
        // localStorage.setItem("user", JSON.stringify(meData.data || null));

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
          const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories?hotelId=${hotelId}`, {
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
    fetchItems(page, filters);
  }, [page, filters]);

  // Handle filter changes with debouncing for search
  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);

    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set a new timeout to debounce the API call for search
    if (filterKey === 'search') {
      setSearchTimeout(setTimeout(() => {
        setPage(1);
        fetchItems(1, newFilters);
      }, 500));
    } else {
      // For other filters, apply immediately
      setPage(1);
      fetchItems(1, newFilters);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    const clearedFilters = {
      category: "",
      search: "",
      isAvailable: ""
    };
    setFilters(clearedFilters);
    setPage(1);
    fetchItems(1, clearedFilters);
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages && newPage !== page) {
      setPage(newPage);
    }
  };

  const createItem = async () => {
    if (!validateForm()) {
      setError('Please fix validation errors');
      return;
    }

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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/items`, {
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

      const responseData = await res.json();

      if (!res.ok) {
        // Handle API validation errors
        if (responseData.details) {
          const errorDetails = responseData.details;
          const fieldMatch = errorDetails.match(/"(\w+)"/);
          if (fieldMatch) {
            const fieldName = fieldMatch[1];
            setFormErrors({ [fieldName]: errorDetails });
          }
          setError(responseData.message || 'Validation error');
        } else {
          setError(responseData.message || "Failed to create item");
        }
        return;
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
    if (!validateForm()) {
      setError('Please fix validation errors');
      return;
    }

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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/items/${selectedItem._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = ("/login");
        return;
      }

      const responseData = await res.json();

      if (!res.ok) {
        // Handle API validation errors
        if (responseData.details) {
          const errorDetails = responseData.details;
          const fieldMatch = errorDetails.match(/"(\w+)"/);
          if (fieldMatch) {
            const fieldName = fieldMatch[1];
            setFormErrors({ [fieldName]: errorDetails });
          }
          setError(responseData.message || 'Validation error');
        } else {
          setError(responseData.message || "Failed to update item");
        }
        return;
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/items/${selectedItem._id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = ("/login");
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
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = "Item name is required";
    } else if (formData.name.trim().length < 2) {
      errors.name = "Item name must be at least 2 characters long";
    }

    if (!formData.price) {
      errors.price = "Price is required";
    } else if (parseFloat(formData.price) <= 0) {
      errors.price = "Price must be greater than 0";
    }

    if (!formData.category) {
      errors.category = "Category must be selected";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openEditModal = async (item: Item) => {
    setSelectedItem(item);
    const token = getToken();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/items/${item._id}`, {
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
        profitMarginBand: item.profitMarginBand || "",
        comment: item.comment || ""
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

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  // Generate pagination buttons
  const generatePaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, pagination.page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.pages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First and previous buttons
    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => handlePageChange(1)}
          disabled={pagination.page === 1 || loading}
        >
          «
        </button>
      );
      
      buttons.push(
        <button
          key="prev"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1 || loading}
        >
          ‹
        </button>
      );
    }
    
    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`px-3 py-2 text-sm font-medium rounded-md ${
            pagination.page === i
              ? 'text-white bg-blue-600 border border-blue-600'
              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
          } disabled:opacity-50`}
          onClick={() => handlePageChange(i)}
          disabled={loading}
        >
          {i}
        </button>
      );
    }
    
    // Next and last buttons
    if (endPage < pagination.pages) {
      buttons.push(
        <button
          key="next"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.pages || loading}
        >
          ›
        </button>
      );
      
      buttons.push(
        <button
          key="last"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => handlePageChange(pagination.pages)}
          disabled={pagination.page === pagination.pages || loading}
        >
          »
        </button>
      );
    }
    
    return buttons;
  };

  if (loading && items.length === 0) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar
        user={user}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        logout={logout}
        nepaliFlag={hotel?.nepaliFlag}
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
              <label className="block text-sm font-medium mb-1">Search (Name)</label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                placeholder="Search items..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
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
                onChange={(e) => handleFilterChange('isAvailable', e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              >
                <option value="">All Items</option>
                <option value="true">Available</option>
                <option value="false">Unavailable</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading indicator for filter changes */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded mb-4 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700 mr-2"></div>
            Loading items...
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {/* Pagination Info */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-700">
                Showing {items.length} of {pagination.total} items (Page {pagination.page} of {pagination.pages})
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
                      <td className="px-6 py-4 whitespace-nowrap">रु{item.price}</td>
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
                      {loading ? 'Loading items...' : 'No items found matching your criteria.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gray-50 border-t gap-4">
              <div className="text-sm text-gray-700">
                Showing {items.length} items (Page {pagination.page} of {pagination.pages}, Total: {pagination.total})
              </div>
              <div className="flex items-center space-x-1">
                {generatePaginationButtons()}
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span>Go to page:</span>
                <input
                  type="number"
                  min="1"
                  max={pagination.pages}
                  value={page}
                  onChange={(e) => {
                    const newPage = Math.max(1, Math.min(pagination.pages, parseInt(e.target.value) || 1));
                    setPage(newPage);
                  }}
                  className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
                  disabled={loading}
                />
              </div>
            </div>
          )}
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{pagination.total}</div>
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
            <div className="text-2xl font-bold text-gray-600">{pagination.pages}</div>
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
                    className={`w-full border rounded px-3 py-2 ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {formErrors.name && <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (रु)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className={`w-full border rounded px-3 py-2 ${formErrors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {formErrors.price && <p className="text-red-600 text-sm mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full border rounded px-3 py-2 ${formErrors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {formErrors.category && <p className="text-red-600 text-sm mt-1">{formErrors.category}</p>}
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
                    className={`w-full border rounded px-3 py-2 ${formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {formErrors.name && <p className="text-red-600 text-sm mt-1">{formErrors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price (रु)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className={`w-full border rounded px-3 py-2 ${formErrors.price ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  />
                  {formErrors.price && <p className="text-red-600 text-sm mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className={`w-full border rounded px-3 py-2 ${formErrors.category ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  >
                    <option value="">Select Category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {formErrors.category && <p className="text-red-600 text-sm mt-1">{formErrors.category}</p>}
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