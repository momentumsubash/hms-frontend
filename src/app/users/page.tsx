"use client";
import { getUsers, createUser, updateUser, deleteUser, getUserById, getHotels } from "@/lib/api";
import { getDepartments } from "@/lib/hr";
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DashboardLayout } from "@/components/dashboard-layout";
import { Search, X, Edit, Trash2, Plus, SlidersHorizontal } from "lucide-react";
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
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [hotels, setHotels] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const [filters, setFilters] = useState({ role: "", active: "", search: "", department: "" });

  const [formData, setFormData] = useState({
    email: "", password: "", firstName: "", lastName: "", role: "staff",
    isActive: true, hotel: "", hasLoginCredentials: true,
    department: "", designation: "", phone: "", address: "",
    monthlySalary: "", joinDate: "", dateOfBirth: "",
    emergencyContact: "", emergencyPhone: "", notes: ""
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.firstName?.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName?.trim()) errors.lastName = 'Last name is required';
    if (formData.hasLoginCredentials) {
      if (!formData.email?.trim()) errors.email = 'Email is required';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Email is invalid';
      if (!currentUser && !formData.password?.trim()) errors.password = 'Password is required';
    }
    if (!formData.role) errors.role = 'Role is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  useEffect(() => {
    if (user?.role === 'super_admin') {
      getHotels().then(res => setHotels(res?.data || res || [])).catch(() => setHotels([]));
    }
  }, [user]);

  useEffect(() => {
    const hotelId = user?.role === 'super_admin' ? undefined : user?.hotel;
    getDepartments(hotelId).then(res => setDepartments(res?.data || [])).catch(() => setDepartments([]));
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { page: pagination.page, limit: pagination.limit };
      if (filters.role) params.role = filters.role;
      if (filters.department) params.department = filters.department;
      if (filters.search) params.search = filters.search;
      const res = await getUsers(params);
      setUsers(res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 10, total: 0, pages: 1 });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [filters, pagination.page]);

  const handleCreate = async () => {
    if (!validateForm()) { toast.error("Please fix validation errors"); return; }
    try {
      setLoading(true);
      const payload: any = { ...formData };
      if (!formData.hasLoginCredentials) { delete payload.email; delete payload.password; }
      if (formData.monthlySalary) payload.monthlySalary = parseFloat(formData.monthlySalary);
      await createUser(payload);
      toast.success("Staff created successfully");
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    if (!validateForm()) { toast.error("Please fix validation errors"); return; }
    try {
      setLoading(true);
      const payload: any = { ...formData };
      if (!formData.hasLoginCredentials) { delete payload.email; delete payload.password; }
      if (formData.monthlySalary) payload.monthlySalary = parseFloat(formData.monthlySalary);
      await updateUser(currentUser._id, payload);
      toast.success("Staff updated successfully");
      setShowModal(false);
      resetForm();
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm("Are you sure you want to deactivate this user?")) {
      try {
        await deleteUser(userId);
        toast.success("User deactivated");
        fetchUsers();
      } catch (e: any) { toast.error(e.message); }
    }
  };

  const openEditModal = async (userId: string) => {
    try {
      setLoading(true);
      const res = await getUserById(userId);
      const d = res?.data || res;
      setCurrentUser(d);
      setFormData({
        email: d.email || "", password: "",
        firstName: d.firstName || "", lastName: d.lastName || "",
        role: d.role || "staff", isActive: d.isActive ?? true,
        hotel: typeof d.hotel === 'object' ? d.hotel?._id : (d.hotel || ""),
        hasLoginCredentials: d.hasLoginCredentials !== false,
        department: typeof d.department === 'object' ? d.department?._id : (d.department || ""),
        designation: d.designation || "", phone: d.phone || "",
        address: d.address || "", monthlySalary: d.monthlySalary || "",
        joinDate: d.joinDate ? d.joinDate.split('T')[0] : "",
        dateOfBirth: d.dateOfBirth ? d.dateOfBirth.split('T')[0] : "",
        emergencyContact: d.emergencyContact || "",
        emergencyPhone: d.emergencyPhone || "", notes: d.notes || ""
      });
      setShowModal(true);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setCurrentUser(null);
    setFormData({
      email: "", password: "", firstName: "", lastName: "", role: "staff",
      isActive: true, hotel: user?.role === 'manager' ? (typeof user.hotel === 'object' ? user.hotel._id : user.hotel) : "",
      hasLoginCredentials: true, department: "", designation: "", phone: "",
      address: "", monthlySalary: "", joinDate: "", dateOfBirth: "",
      emergencyContact: "", emergencyPhone: "", notes: ""
    });
    setFormErrors({});
  };

  const openCreateModal = () => { resetForm(); setShowModal(true); };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors(prev => { const n = { ...prev }; delete n[name]; return n; });
  };

  const filteredUsers = users.filter((u: any) => {
    if (filters.active) {
      const isActive = filters.active === 'true';
      if (u.isActive !== isActive) return false;
    }
    return true;
  });

  const getAvailableRoles = () => {
    if (user?.role === 'super_admin') {
      return [{ value: 'staff', label: 'Staff' }, { value: 'manager', label: 'Manager' }, { value: 'kitchen_staff', label: 'Kitchen Staff' }, { value: 'super_admin', label: 'Super Admin' }];
    }
    return [{ value: 'staff', label: 'Staff' }, { value: 'kitchen_staff', label: 'Kitchen Staff' }];
  };

  if (loading && users.length === 0) return (
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
      <div className="px-4 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm px-5 py-3 rounded-lg flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError("")} className="p-1 hover:bg-destructive/10 rounded"><X className="w-4 h-4" /></button>
          </div>
        )}

        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-2 md:hidden">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input type="text" value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Search staff..." />
              {filters.search && (
                <button onClick={() => setFilters(prev => ({ ...prev, search: "" }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button onClick={() => setShowMobileFilters(!showMobileFilters)}
              className={`h-9 w-9 flex items-center justify-center rounded-lg border shrink-0 ${showMobileFilters ? 'bg-primary text-white border-primary' : 'bg-muted/50 border-input text-muted-foreground'}`}>
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button onClick={openCreateModal} className="shrink-0 h-9 px-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg text-sm">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {showMobileFilters && (
            <div className="mt-3 space-y-2 md:hidden">
              <select value={filters.role} onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm">
                <option value="">All Roles</option>
                {getAvailableRoles().map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
              <select value={filters.department} onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm">
                <option value="">All Departments</option>
                {departments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
              </select>
              <select value={filters.active} onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.value }))}
                className="w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm">
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          )}
          <div className="hidden md:flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input type="text" value={filters.search} onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Search staff..." />
              {filters.search && (
                <button onClick={() => setFilters(prev => ({ ...prev, search: "" }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground p-0.5">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select value={filters.role} onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm min-w-[110px]">
              <option value="">All Roles</option>
              {getAvailableRoles().map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
            <select value={filters.department} onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm min-w-[130px]">
              <option value="">All Departments</option>
              {departments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
            <select value={filters.active} onChange={(e) => setFilters(prev => ({ ...prev, active: e.target.value }))}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm min-w-[100px]">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {(filters.search || filters.role || filters.active || filters.department) && (
              <button onClick={() => setFilters({ role: "", active: "", search: "", department: "" })} className="text-xs font-medium text-primary hover:text-primary/80">Clear</button>
            )}
            <button onClick={openCreateModal}
              className="ml-auto shrink-0 h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:opacity-90 flex items-center gap-1.5 text-sm">
              <Plus className="w-4 h-4" /> New Staff
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Staff ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Login</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u: any) => (
                  <tr key={u._id} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium">
                      <div>{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{u.email || 'No email'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{u.staffId || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{u.department?.name || '-'}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                        u.role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        u.role === 'manager' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        u.role === 'kitchen_staff' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-muted text-muted-foreground border-border'
                      }`}>{u.role?.replace('_', ' ')}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                        u.hasLoginCredentials !== false ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                      }`}>{u.hasLoginCredentials !== false ? 'Yes' : 'No'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${u.isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                        {u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(u._id)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u._id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Delete">
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
              <p className="text-muted-foreground">No staff found.</p>
            </div>
          )}
          <PaginationControls currentPage={pagination.page} totalPages={pagination.pages}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))} disabled={loading} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Staff", value: pagination.total, gradient: "from-blue-500 to-cyan-500" },
            { label: "Active", value: users.filter((u: any) => u.isActive).length, gradient: "from-green-500 to-emerald-500" },
            { label: "With Login", value: users.filter((u: any) => u.hasLoginCredentials !== false).length, gradient: "from-purple-500 to-pink-500" },
            { label: "Without Login", value: users.filter((u: any) => u.hasLoginCredentials === false).length, gradient: "from-orange-500 to-amber-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl shadow-sm p-4">
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border px-6 py-4 sticky top-0 bg-card z-10">
                <h2 className="text-lg font-bold">{currentUser ? "Edit Staff" : "Add New Staff"}</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-5">
                <form onSubmit={currentUser ? (e) => { e.preventDefault(); handleUpdate(); } : (e) => { e.preventDefault(); handleCreate(); }} className="space-y-4">
                  {/* Login Credentials Toggle */}
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl border border-border">
                    <div>
                      <p className="text-sm font-medium">Login Credentials</p>
                      <p className="text-xs text-muted-foreground">Enable email/password login for this staff member</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" name="hasLoginCredentials" checked={formData.hasLoginCredentials} onChange={handleFormChange} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Email & Password (only when login enabled) */}
                  {formData.hasLoginCredentials && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">Email *</label>
                        <input type="email" name="email" value={formData.email} onChange={handleFormChange}
                          className={`w-full h-10 px-3.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.email ? 'border-destructive' : 'border-border'}`} />
                        {formErrors.email && <p className="text-destructive text-xs mt-1">{formErrors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1.5">{currentUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                        <input type="password" name="password" value={formData.password} onChange={handleFormChange}
                          className={`w-full h-10 px-3.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.password ? 'border-destructive' : 'border-border'}`} />
                        {formErrors.password && <p className="text-destructive text-xs mt-1">{formErrors.password}</p>}
                      </div>
                    </div>
                  )}

                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">First Name *</label>
                      <input type="text" name="firstName" value={formData.firstName} onChange={handleFormChange}
                        className={`w-full h-10 px-3.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.firstName ? 'border-destructive' : 'border-border'}`} />
                      {formErrors.firstName && <p className="text-destructive text-xs mt-1">{formErrors.firstName}</p>}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Last Name *</label>
                      <input type="text" name="lastName" value={formData.lastName} onChange={handleFormChange}
                        className={`w-full h-10 px-3.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.lastName ? 'border-destructive' : 'border-border'}`} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Phone</label>
                      <input type="text" name="phone" value={formData.phone} onChange={handleFormChange}
                        className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Role *</label>
                      <select name="role" value={formData.role} onChange={handleFormChange}
                        className={`w-full h-10 px-3.5 bg-secondary/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${formErrors.role ? 'border-destructive' : 'border-border'}`}>
                        {getAvailableRoles().map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Department & Designation */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Department</label>
                      <select name="department" value={formData.department} onChange={handleFormChange}
                        className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                        <option value="">Select Department</option>
                        {departments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Designation</label>
                      <input type="text" name="designation" value={formData.designation} onChange={handleFormChange}
                        placeholder="e.g. Front Desk, Housekeeping" className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>

                  {/* Salary & Join Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Monthly Salary</label>
                      <input type="number" name="monthlySalary" value={formData.monthlySalary} onChange={handleFormChange}
                        min="0" step="0.01" className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Join Date</label>
                      <input type="date" name="joinDate" value={formData.joinDate} onChange={handleFormChange}
                        className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Date of Birth</label>
                      <input type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleFormChange}
                        className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Hotel</label>
                      {user?.role === 'super_admin' ? (
                        <select name="hotel" value={formData.hotel} onChange={handleFormChange}
                          className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                          <option value="">Select Hotel</option>
                          {hotels.map((h: any) => <option key={h._id} value={h._id}>{h.name}</option>)}
                        </select>
                      ) : (
                        <input type="text" value={formData.hotel} className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm opacity-60" readOnly disabled />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Emergency Contact Name</label>
                      <input type="text" name="emergencyContact" value={formData.emergencyContact} onChange={handleFormChange}
                        className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1.5">Emergency Contact Phone</label>
                      <input type="text" name="emergencyPhone" value={formData.emergencyPhone} onChange={handleFormChange}
                        className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Address</label>
                    <input type="text" name="address" value={formData.address} onChange={handleFormChange}
                      className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
                    <textarea name="notes" value={formData.notes} onChange={handleFormChange} rows={2}
                      className="w-full px-3.5 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                  </div>

                  <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                    <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleFormChange}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary/30" />
                    <span>Active</span>
                  </label>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button type="button" onClick={() => setShowModal(false)}
                      className="h-10 px-5 text-sm font-medium text-muted-foreground bg-secondary/50 border border-border rounded-xl hover:bg-secondary">
                      Cancel
                    </button>
                    <button type="submit" disabled={loading}
                      className="h-10 px-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:opacity-90 text-sm disabled:opacity-50">
                      {loading ? "Saving..." : currentUser ? "Update Staff" : "Create Staff"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        <ToastContainer position="bottom-right" autoClose={5000} />
      </div>
    </DashboardLayout>
  );
}
