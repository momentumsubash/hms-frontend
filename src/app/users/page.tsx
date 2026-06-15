"use client";
import { getUsers, createUser, updateUser, deleteUser, getUserById, getHotels } from "@/lib/api";
import { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DashboardLayout } from "@/components/dashboard-layout";
import { Search, X, Eye, Edit, Trash2, Plus } from "lucide-react";
import { PaginationControls } from "@/components/ui/pagination-controls";

export default function UsersPage() {
  const [user, setUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1
  });

  const [filters, setFilters] = useState({
    role: "",
    active: "",
    search: ""
  });

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "staff",
    isActive: true,
    hotel: ""
  });

  // Form errors state
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Reset form errors
  const resetFormErrors = () => setFormErrors({});

  // Validation function
  const validateForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!formData.email || formData.email.trim() === '') {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!formData.firstName || formData.firstName.trim() === '') {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.trim().length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }

    if (!formData.lastName || formData.lastName.trim() === '') {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.trim().length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }

    if (!currentUser && (!formData.password || formData.password.trim() === '')) {
      errors.password = 'Password is required for new users';
    }

    if (!formData.role) {
      errors.role = 'Role is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // For super admin: list of hotels
  const [hotels, setHotels] = useState<any[]>([]);

  // Fetch hotels for super admin
  useEffect(() => {
    if (user?.role === 'super_admin') {
      getHotels().then(res => {
        setHotels(res?.data || res || []);
      }).catch(() => setHotels([]));
    }
  }, [user]);

  useEffect(() => {
    const fetchAll = async () => {
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
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
        // 2. Fetch users
        setLoading(true);
        const res = await getUsers();
        setUsers(res?.data || []);
        setPagination(res?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        });
      } catch (e: any) {
        setError(e.message);
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [filters, pagination.page]);

  const handleCreate = async () => {
    if (!validateForm()) {
      toast.error("Please fix validation errors");
      setError("Please fix validation errors");
      return;
    }

    try {
      setLoading(true);
      setError(""); // Clear previous errors
      console.log("Creating user with data:", formData);
      await createUser(formData);
      toast.success("User created successfully");
      setShowModal(false);
      resetFormErrors();
      // Refresh users list
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await getUsers();
        setUsers(res?.data || []);
        setPagination(res?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        });
      }
    } catch (e: any) {
      console.error("Error creating user:", e);
      console.error("Error message:", e.message);
      const errorMessage = e.message || "An error occurred while creating the user";
      
      // Set error in state for display
      setError(errorMessage);
      
      // Also show toast
      console.log("Showing error toast with message:", errorMessage);
      toast.error(errorMessage);
      
      // Parse API validation errors
      if (errorMessage && errorMessage.includes('details')) {
        const fieldMatch = errorMessage.match(/"(\w+)"/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          setFormErrors({ [fieldName]: errorMessage });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!validateForm()) {
      const msg = "Please fix validation errors";
      toast.error(msg);
      setError(msg);
      return;
    }

    try {
      setLoading(true);
      setError(""); // Clear previous errors
      await updateUser(currentUser._id, formData);
      toast.success("User updated successfully");
      setShowModal(false);
      resetFormErrors();
      // Refresh users list
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await getUsers();
        setUsers(res?.data || []);
        setPagination(res?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        });
      }
    } catch (e: any) {
      const errorMessage = e.message || "An error occurred while updating the user";
      
      // Set error in state for display
      setError(errorMessage);
      
      // Also show toast
      toast.error(errorMessage);
      
      // Parse API validation errors
      if (errorMessage && errorMessage.includes('details')) {
        const fieldMatch = errorMessage.match(/"(\w+)"/);
        if (fieldMatch) {
          const fieldName = fieldMatch[1];
          setFormErrors({ [fieldName]: errorMessage });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        setLoading(true);
        await deleteUser(userId);
        toast.success("User deleted successfully");
        // Refresh users list
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (token) {
          const res = await getUsers();
          setUsers(res?.data || []);
          setPagination(res?.pagination || {
            page: 1,
            limit: 10,
            total: 0,
            pages: 1
          });
        }
      } catch (e: any) {
        toast.error(e.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleToggleStatus = async (user: any) => {
    try {
      setLoading(true);
      await updateUser(user._id, { isActive: !user.isActive });
      toast.success(`User ${!user.isActive ? "activated" : "deactivated"} successfully`);
      // Refresh users list
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (token) {
        const res = await getUsers();
        setUsers(res?.data || []);
        setPagination(res?.pagination || {
          page: 1,
          limit: 10,
          total: 0,
          pages: 1
        });
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async (userId: string) => {
    try {
      setLoading(true);
      const res = await getUserById(userId);
      const userData = res?.data || res;
      setCurrentUser(userData);
      setFormData({
        email: userData.email || "",
        password: "",
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        role: userData.role || "staff",
        isActive: userData.isActive ?? true,
        hotel: userData.hotel || ""
      });
      setShowModal(true);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setCurrentUser(null);
    
    // Set default hotel for managers
    let defaultHotel = "";
    if (user?.role === 'manager' && user?.hotel) {
      defaultHotel = typeof user.hotel === 'object' ? user.hotel._id : user.hotel;
    }
    
    setFormData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      role: "staff",
      isActive: true,
      hotel: defaultHotel
    });
    setShowModal(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Filter users on client side if needed (though we're doing server-side now)
  const filteredUsers = users.filter((user: any) => {
    const matchesRole = filters.role === "" || user.role === filters.role;
    const matchesActive = filters.active === "" || (filters.active === "true" ? user.isActive : !user.isActive);
    const matchesSearch = filters.search === "" ||
      (`${user.firstName} ${user.lastName}`.toLowerCase().includes(filters.search.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(filters.search.toLowerCase()));
    return matchesRole && matchesActive && matchesSearch;
  });

  // Get available roles based on current user's role
  const getAvailableRoles = () => {
    if (user?.role === 'super_admin') {
      return [
        { value: 'staff', label: 'Staff' },
        { value: 'manager', label: 'Manager' },
        { value: 'kitchen_staff', label: 'Kitchen Staff' },
        { value: 'super_admin', label: 'Super Admin' }
      ];
    } else if (user?.role === 'manager') {
      return [
        { value: 'staff', label: 'Staff' },
        { value: 'kitchen_staff', label: 'Kitchen Staff' }
      ];
    }
    return [
      { value: 'staff', label: 'Staff' },
      { value: 'kitchen_staff', label: 'Kitchen Staff' }
    ];
  };

  if (loading) return (
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
      <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-5">

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-5 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:bg-destructive/10 rounded transition-colors"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input type="text" value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all" placeholder="Search users..." />
              {filters.search && (
                <button onClick={() => setFilters(prev => ({ ...prev, search: "" }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select value={filters.role} onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[110px]">
              <option value="">All Roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="manager">Manager</option>
              <option value="staff">Staff</option>
              <option value="kitchen_staff">Kitchen Staff</option>
            </select>
            <select value={filters.active} onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.value }))}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all min-w-[100px]">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {(filters.search || filters.role || filters.active) && (
              <button onClick={() => setFilters({ role: "", active: "", search: "" })} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors shrink-0">
                Clear
              </button>
            )}
            <button
              onClick={openCreateModal}
              className="ml-auto shrink-0 h-9 px-4 bg-gradient-brand text-white font-medium rounded-lg hover:opacity-90 transition-all shadow-elevated shadow-primary/25 flex items-center gap-1.5 text-sm"
            >
              <Plus className="w-4 h-4" />
              New User
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((user: any) => (
                  <tr key={user._id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm font-medium">{user.firstName} {user.lastName}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap text-sm text-muted-foreground">{user.email}</td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${
                        user.role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' :
                        user.role === 'manager' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' :
                        user.role === 'kitchen_staff' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' :
                        'bg-muted text-muted-foreground border-border'
                      }`}>
                        {user.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${user.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(user._id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all"
                          title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleStatus(user)}
                          className={`p-1.5 rounded-md transition-all ${user.isActive ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30' : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'}`}
                          title={user.isActive ? "Deactivate" : "Activate"}>
                          {user.isActive ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          )}
                        </button>
                        <button onClick={() => handleDelete(user._id)}
                          className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                          title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredUsers.length === 0 && !loading && (
            <div className="px-5 py-12 text-center">
              <div className="flex flex-col items-center gap-2">
                <svg className="w-8 h-8 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                <p className="text-muted-foreground">No users found matching your criteria.</p>
              </div>
            </div>
          )}

          {/* Pagination */}
          <PaginationControls
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            disabled={loading}
          />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: pagination.total, gradient: "from-blue-500 to-cyan-500" },
            { label: "Active", value: users.filter((u: any) => u.isActive).length, gradient: "from-green-500 to-emerald-500" },
            { label: "Kitchen Staff", value: users.filter((u: any) => u.role === 'kitchen_staff').length, gradient: "from-orange-500 to-amber-500" },
            { label: "Inactive", value: users.filter((u: any) => !u.isActive).length, gradient: "from-red-500 to-pink-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl shadow-sm p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg`}>
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" /></svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* User Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl shadow-elevated w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card z-10">
              <h2 className="text-lg font-bold text-foreground">{currentUser ? "Edit User" : "Add New User"}</h2>
              <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-all">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="px-6 py-5">
              {error && (
                <div className="mb-4 p-3.5 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2.5">
                  <svg className="w-5 h-5 text-destructive shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <div>
                    <p className="text-sm font-semibold text-destructive">Error</p>
                    <p className="text-sm text-destructive/80">{error}</p>
                  </div>
                </div>
              )}
              <form onSubmit={currentUser ? (e) => { e.preventDefault(); handleUpdate(); } : (e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name *</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleFormChange}
                      className={`w-full h-10 px-3.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${formErrors.firstName ? 'border-destructive bg-destructive/5' : 'border-border'}`} required />
                    {formErrors.firstName && <p className="text-destructive text-xs mt-1">{formErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name *</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleFormChange}
                      className={`w-full h-10 px-3.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${formErrors.lastName ? 'border-destructive bg-destructive/5' : 'border-border'}`} required />
                    {formErrors.lastName && <p className="text-destructive text-xs mt-1">{formErrors.lastName}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email *</label>
                    <input type="email" name="email" value={formData.email} onChange={handleFormChange}
                      className={`w-full h-10 px-3.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${formErrors.email ? 'border-destructive bg-destructive/5' : 'border-border'}`} required disabled={!!currentUser} />
                    {formErrors.email && <p className="text-destructive text-xs mt-1">{formErrors.email}</p>}
                  </div>
                  {!currentUser && (
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Password *</label>
                      <input type="password" name="password" value={formData.password} onChange={handleFormChange}
                        className={`w-full h-10 px-3.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${formErrors.password ? 'border-destructive bg-destructive/5' : 'border-border'}`} required />
                      {formErrors.password && <p className="text-destructive text-xs mt-1">{formErrors.password}</p>}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role *</label>
                  <select name="role" value={formData.role} onChange={handleFormChange}
                    className={`w-full h-10 px-3.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all ${formErrors.role ? 'border-destructive bg-destructive/5' : 'border-border'}`} required>
                    {getAvailableRoles().map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
                  </select>
                  {formErrors.role && <p className="text-destructive text-xs mt-1">{formErrors.role}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {user?.role === 'super_admin' ? 'Hotel *' : 'Hotel'}
                  </label>
                  {user?.role === 'super_admin' ? (
                    <select name="hotel" value={formData.hotel} onChange={handleFormChange}
                      className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" required>
                      <option value="">Select Hotel</option>
                      {hotels.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
                    </select>
                  ) : (
                    <input type="text" name="hotel" value={formData.hotel}
                      className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm cursor-not-allowed opacity-60" readOnly disabled />
                  )}
                </div>
                <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleFormChange}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                  <span>Active</span>
                </label>
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                  <button type="button" onClick={() => setShowModal(false)}
                    className="h-10 px-5 text-sm font-medium text-muted-foreground bg-secondary/50 border border-border rounded-xl hover:bg-secondary transition-all">
                    Cancel
                  </button>
                  <button type="submit"
                    className="h-10 px-5 bg-gradient-brand text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-lg shadow-primary/25 text-sm disabled:opacity-50"
                    disabled={loading}>
                    {loading ? (currentUser ? "Updating..." : "Creating...") : currentUser ? "Update User" : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ToastContainer 
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ zIndex: 9999 }}
      />
    </DashboardLayout>
  );
}