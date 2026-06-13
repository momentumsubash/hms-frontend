"use client";
import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, X, Eye, Edit, Trash2, Package } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";

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
  inventory?: boolean;
  stock?: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface ApiResponse {
  success: boolean;
  data: Item[];
  pagination: PaginationInfo;
}

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || sessionStorage.getItem("token");
}

export default function ItemsPage() {
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
  
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    search: "",
    isAvailable: ""
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    category: "",
    isAvailable: true,
    inventory: false,
    stock: "0",
    profitMarginBand: "",
    comment: ""
  });

  const [categories, setCategories] = useState<CategoryObj[]>([]);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const fetchItems = async (pageNum: number = page, filterParams = filters) => {
    const token = getToken();
    if (!token) return;
    try {
      setLoading(true);
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL;
      const params = new URLSearchParams({ page: pageNum.toString(), limit: limit.toString() });
      if (filterParams.isAvailable) params.append("isAvailable", filterParams.isAvailable);
      if (filterParams.category) params.append("category", filterParams.category);
      if (filterParams.search) params.append("search", filterParams.search);
      const itemsRes = await fetch(`${apiBase}/items?${params.toString()}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
      });
      if (!itemsRes.ok) throw new Error("Failed to fetch items");
      const data: ApiResponse = await itemsRes.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
        if (data.pagination) setPagination(data.pagination);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      const token = getToken();
      if (!token) { setError("No authentication token"); setLoading(false); return; }
      try {
        const hotelRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/hotels/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        let hotelId = "";
        if (hotelRes.ok) {
          const hotelData = await hotelRes.json();
          localStorage.setItem("hotel", JSON.stringify(hotelData.data || null));
          hotelId = hotelData.data?._id;
        }
        if (hotelId) {
          const catRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/categories?hotelId=${hotelId}`, {
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" }
          });
          if (catRes.ok) {
            const catData = await catRes.json();
            setCategories(catData.data || []);
          }
        }
        await fetchItems(1, filters);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => { fetchItems(page, filters); }, [page, filters]);

  const handleFilterChange = (filterKey: string, value: string) => {
    const newFilters = { ...filters, [filterKey]: value };
    setFilters(newFilters);
    if (searchTimeout) clearTimeout(searchTimeout);
    if (filterKey === 'search') {
      setSearchTimeout(setTimeout(() => { setPage(1); fetchItems(1, newFilters); }, 500));
    } else {
      setPage(1);
      fetchItems(1, newFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters = { category: "", search: "", isAvailable: "" };
    setFilters(clearedFilters);
    setPage(1);
    fetchItems(1, clearedFilters);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages && newPage !== page) setPage(newPage);
  };

  const createItem = async () => {
    if (!validateForm()) { setError('Please fix validation errors'); return; }
    try {
      const token = getToken();
      const hotel = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('hotel') || '{}') : {};
      const hotelId = hotel?._id;
      const payload: any = {
        name: formData.name, price: parseFloat(formData.price), category: formData.category,
        isAvailable: formData.isAvailable, hotel: hotelId, inventory: formData.inventory,
        stock: formData.inventory ? formData.stock : 0
      };
      if (formData.profitMarginBand) payload.profitMarginBand = formData.profitMarginBand;
      if (formData.comment) payload.comment = formData.comment;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/items`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/login"; return; }
      const responseData = await res.json();
      if (!res.ok) {
        if (responseData.details) {
          const fieldMatch = responseData.details.match(/"(\w+)"/);
          if (fieldMatch) setFormErrors({ [fieldMatch[1]]: responseData.details });
          setError(responseData.message || 'Validation error');
        } else { setError(responseData.message || "Failed to create item"); }
        return;
      }
      setSuccess("Item created successfully!");
      setShowCreateModal(false);
      resetForm();
      await fetchItems(page, filters);
    } catch (e: any) { setError(e.message); }
  };

  const updateItem = async () => {
    if (!selectedItem) return;
    if (!validateForm()) { setError('Please fix validation errors'); return; }
    try {
      const token = getToken();
      const hotel = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('hotel') || '{}') : {};
      const hotelId = hotel?._id;
      const payload: any = {
        name: formData.name, price: parseFloat(formData.price), category: formData.category,
        isAvailable: formData.isAvailable, hotel: hotelId, inventory: formData.inventory,
        stock: formData.inventory ? formData.stock : 0
      };
      if (formData.profitMarginBand) payload.profitMarginBand = formData.profitMarginBand;
      if (formData.comment) payload.comment = formData.comment;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/items/${selectedItem._id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/login"; return; }
      const responseData = await res.json();
      if (!res.ok) {
        if (responseData.details) {
          const fieldMatch = responseData.details.match(/"(\w+)"/);
          if (fieldMatch) setFormErrors({ [fieldMatch[1]]: responseData.details });
          setError(responseData.message || 'Validation error');
        } else { setError(responseData.message || "Failed to update item"); }
        return;
      }
      setSuccess("Item updated successfully!");
      setShowEditModal(false);
      setSelectedItem(null);
      resetForm();
      await fetchItems(page, filters);
    } catch (e: any) { setError(e.message); }
  };

  const deleteItem = async () => {
    if (!selectedItem) return;
    try {
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/items/${selectedItem._id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) { localStorage.removeItem("token"); window.location.href = "/login"; return; }
      if (!res.ok) { const errorData = await res.json(); throw new Error(errorData.message || "Failed to delete item"); }
      setSuccess("Item deleted successfully!");
      setShowDeleteModal(false);
      setSelectedItem(null);
      if (items.length === 1 && page > 1) { setPage(page - 1); }
      else { await fetchItems(page, filters); }
    } catch (e: any) { setError(e.message); }
  };

  const resetForm = () => {
    setFormData({ name: "", price: "", category: "", isAvailable: true, profitMarginBand: "", comment: "", inventory: false, stock: "0" });
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!formData.name.trim()) errors.name = "Item name is required";
    else if (formData.name.trim().length < 2) errors.name = "Item name must be at least 2 characters";
    if (!formData.price) errors.price = "Price is required";
    else if (parseFloat(formData.price) <= 0) errors.price = "Price must be greater than 0";
    if (!formData.category) errors.category = "Category must be selected";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const openEditModal = async (item: Item) => {
    setSelectedItem(item);
    const token = getToken();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/items/${item._id}`, {
        headers: { Accept: "application/json", Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch item details");
      const data = await res.json();
      const details = data.data || data;
      setFormData({
        name: details.name || "", price: details.price?.toString() || "",
        category: typeof details.category === 'object' && details.category !== null ? details.category._id : details.category || "",
        isAvailable: details.isAvailable ?? true, profitMarginBand: details.profitMarginBand || "",
        comment: details.comment || "", inventory: details.inventory ?? false, stock: (details.stock ?? 0).toString()
      });
      setShowEditModal(true);
    } catch (e: any) {
      setFormData({
        name: item.name, price: item.price.toString(),
        category: typeof item.category === 'object' && item.category !== null ? item.category._id : item.category,
        isAvailable: item.isAvailable, profitMarginBand: item.profitMarginBand || "",
        comment: item.comment || "", inventory: item.inventory ?? false, stock: (item.stock ?? 0).toString()
      });
      setShowEditModal(true);
    }
  };

  const openDeleteModal = (item: Item) => { setSelectedItem(item); setShowDeleteModal(true); };

  useEffect(() => {
    if (error) { const timer = setTimeout(() => setError(""), 5000); return () => clearTimeout(timer); }
  }, [error]);
  useEffect(() => {
    if (success) { const timer = setTimeout(() => setSuccess(""), 5000); return () => clearTimeout(timer); }
  }, [success]);
  useEffect(() => {
    return () => { if (searchTimeout) clearTimeout(searchTimeout); };
  }, [searchTimeout]);

  const Modal = ({ show, onClose, title, children }: { show: boolean; onClose: () => void; title: string; children: React.ReactNode }) => show ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-card rounded-xl shadow-elevated animate-scale-in overflow-hidden border border-border">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  ) : null;

  if (loading && items.length === 0) return (
    <DashboardLayout>
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading items...</span>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1600px] mx-auto space-y-5">

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-5 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:bg-destructive/10 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}
        {success && (
          <div className="bg-emerald-100 border border-emerald-200 text-emerald-700 text-sm px-5 py-3 rounded-lg flex items-center justify-between">
            <span>{success}</span>
            <button onClick={() => setSuccess("")} className="p-1 hover:bg-emerald-200 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input type="text" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all" placeholder="Search items..." />
              {filters.search && (
                <button onClick={() => handleFilterChange('search', '')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[130px]">
              <option value="">All Categories</option>
              {categories.length === 0 ? <option disabled>Loading...</option> : categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
            </select>
            <select value={filters.isAvailable} onChange={(e) => handleFilterChange('isAvailable', e.target.value)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[120px]">
              <option value="">All Items</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
            </select>
            {(filters.search || filters.category || filters.isAvailable) && (
              <button onClick={clearFilters} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0">
                Clear
              </button>
            )}
            <Button onClick={() => { resetForm(); setShowCreateModal(true); }} className="ml-auto shrink-0">
              <Plus className="w-4 h-4" />
              Add New
            </Button>
          </div>
        </div>

        {loading && (
          <div className="bg-primary/5 border border-primary/10 rounded-lg px-5 py-3 flex items-center gap-2.5">
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading items...</span>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-5 py-3 border-b border-border bg-muted/50 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {items.length} of {pagination.total} items (Page {pagination.page} of {pagination.pages})
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Stock</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {Array.isArray(items) && items.length > 0 ? (
                  items.map((item: Item) => (
                    <tr key={item._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">{item.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge variant="secondary" className="text-xs rounded px-2 py-0.5 font-normal">
                          {typeof item.category === 'object' && item.category !== null ? item.category.name : item.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">रु{item.price}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.inventory ? (
                          <Badge variant={((item.stock ?? 0) <= 5) ? "destructive" : "default"} className="text-xs rounded px-2 py-0.5 font-normal">
                            {item.stock ?? 0} in stock
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs rounded px-2 py-0.5 font-normal">N/A</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {item.isAvailable ? (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">Available</span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-destructive/10 text-destructive border border-destructive/20">Unavailable</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button onClick={() => openEditModal(item)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => openDeleteModal(item)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-muted-foreground/40" />
                        <p className="text-muted-foreground">{loading ? 'Loading items...' : 'No items found matching your criteria.'}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationControls
            currentPage={page}
            totalPages={pagination.pages}
            onPageChange={handlePageChange}
            disabled={loading}
          />
        </div>


      </div>

      <Modal show={showCreateModal} onClose={() => setShowCreateModal(false)} title="Add New Item">
        <form onSubmit={(e) => { e.preventDefault(); createItem(); }} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all ${formErrors.name ? 'border-destructive bg-destructive/5' : 'border-input'}`} />
            {formErrors.name && <p className="text-destructive text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Price (रु)</label>
              <input type="number" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all ${formErrors.price ? 'border-destructive bg-destructive/5' : 'border-input'}`} />
              {formErrors.price && <p className="text-destructive text-xs mt-1">{formErrors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
              <select required value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all ${formErrors.category ? 'border-destructive bg-destructive/5' : 'border-input'}`}>
                <option value="">Select</option>
                {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              {formErrors.category && <p className="text-destructive text-xs mt-1">{formErrors.category}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Profit Margin</label>
            <input type="text" value={formData.profitMarginBand} onChange={(e) => setFormData(prev => ({ ...prev, profitMarginBand: e.target.value }))}
              className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all" placeholder="e.g. High, Medium, Low" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Comment</label>
            <input type="text" value={formData.comment} onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all" placeholder="Optional comment" />
          </div>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input type="checkbox" checked={formData.inventory} onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.checked }))}
              className="w-4 h-4 rounded border-input text-primary focus:ring-ring/30" />
            <span>Enable Inventory Tracking</span>
          </label>
          {formData.inventory && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Initial Stock</label>
              <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all" />
            </div>
          )}
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
              className="w-4 h-4 rounded border-input text-primary focus:ring-ring/30" />
            <span>Available</span>
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)}>Cancel</Button>
            <Button type="submit">Create Item</Button>
          </div>
        </form>
      </Modal>

      <Modal show={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Item">
        <form onSubmit={(e) => { e.preventDefault(); updateItem(); }} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
            <input type="text" required value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all ${formErrors.name ? 'border-destructive bg-destructive/5' : 'border-input'}`} />
            {formErrors.name && <p className="text-destructive text-xs mt-1">{formErrors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Price (रु)</label>
              <input type="number" required min="0" step="0.01" value={formData.price} onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all ${formErrors.price ? 'border-destructive bg-destructive/5' : 'border-input'}`} />
              {formErrors.price && <p className="text-destructive text-xs mt-1">{formErrors.price}</p>}
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Category</label>
              <select required value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className={`w-full h-9 px-3 bg-muted/50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all ${formErrors.category ? 'border-destructive bg-destructive/5' : 'border-input'}`}>
                <option value="">Select</option>
                {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
              </select>
              {formErrors.category && <p className="text-destructive text-xs mt-1">{formErrors.category}</p>}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Profit Margin</label>
            <input type="text" value={formData.profitMarginBand} onChange={(e) => setFormData(prev => ({ ...prev, profitMarginBand: e.target.value }))}
              className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Comment</label>
            <input type="text" value={formData.comment} onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all" />
          </div>
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input type="checkbox" checked={formData.inventory} onChange={(e) => setFormData(prev => ({ ...prev, inventory: e.target.checked }))}
              className="w-4 h-4 rounded border-input text-primary focus:ring-ring/30" />
            <span>Enable Inventory Tracking</span>
          </label>
          {formData.inventory && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Current Stock</label>
              <input type="number" min="0" value={formData.stock} onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all" />
            </div>
          )}
          <label className="flex items-center gap-2.5 text-sm cursor-pointer">
            <input type="checkbox" checked={formData.isAvailable} onChange={(e) => setFormData(prev => ({ ...prev, isAvailable: e.target.checked }))}
              className="w-4 h-4 rounded border-input text-primary focus:ring-ring/30" />
            <span>Available</span>
          </label>
          <div className="flex justify-end gap-3 pt-2 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button type="submit">Update Item</Button>
          </div>
        </form>
      </Modal>

      <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Item">
        <div className="p-5">
          <div className="flex items-start gap-3 mb-6 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
            <Trash2 className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-foreground/80">Are you sure you want to delete <strong>{selectedItem?.name}</strong>? This cannot be undone.</p>
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
            <Button variant="destructive" onClick={deleteItem}>Delete Item</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
