"use client";
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from "@/lib/hr";
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DashboardLayout } from "@/components/dashboard-layout";
import { Search, X, Edit, Trash2, Plus, Building2 } from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ name: "", description: "" });

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await getDepartments();
      setDepartments(res?.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDepartments(); }, []);

  const handleSave = async () => {
    if (!formData.name.trim()) { toast.error("Department name is required"); return; }
    try {
      if (editDept) {
        await updateDepartment(editDept._id, formData);
        toast.success("Department updated");
      } else {
        await createDepartment(formData);
        toast.success("Department created");
      }
      setShowModal(false);
      setEditDept(null);
      setFormData({ name: "", description: "" });
      fetchDepartments();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this department?")) {
      try { await deleteDepartment(id); toast.success("Deleted"); fetchDepartments(); }
      catch (e: any) { toast.error(e.message); }
    }
  };

  const openEdit = (dept: any) => {
    setEditDept(dept);
    setFormData({ name: dept.name, description: dept.description || "" });
    setShowModal(true);
  };

  const filtered = departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-12">
        <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Departments</h1>
            <p className="text-sm text-muted-foreground">{departments.length} departments</p>
          </div>
          <button data-cy="departments-add-btn" onClick={() => { setEditDept(null); setFormData({ name: "", description: "" }); setShowModal(true); }}
            className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:opacity-90 flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> Add Department
          </button>
        </div>

        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input data-cy="departments-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Search..." />
          {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground p-0.5"><X className="w-4 h-4" /></button>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((dept: any) => (
            <div key={dept._id} data-cy={`department-card-${dept.name}`} className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{dept.name}</h3>
                    <p className="text-xs text-muted-foreground">{dept.staffCount || 0} staff</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button data-cy={`department-edit-${dept.name}`} onClick={() => openEdit(dept)} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10"><Edit className="w-4 h-4" /></button>
                  <button data-cy={`department-delete-${dept.name}`} onClick={() => handleDelete(dept._id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              {dept.description && <p className="text-xs text-muted-foreground mt-3 line-clamp-2">{dept.description}</p>}
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No departments found.</p>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-lg font-bold">{editDept ? "Edit" : "Add"} Department</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl text-muted-foreground hover:bg-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Name *</label>
                  <input data-cy="department-form-name" type="text" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="e.g. Housekeeping" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Description</label>
                  <textarea data-cy="department-form-description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} rows={3}
                    className="w-full px-3.5 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button onClick={() => setShowModal(false)} className="h-10 px-5 text-sm font-medium text-muted-foreground bg-secondary/50 border border-border rounded-xl hover:bg-secondary">Cancel</button>
                  <button data-cy="department-form-submit" onClick={handleSave} className="h-10 px-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:opacity-90 text-sm">{editDept ? "Update" : "Create"}</button>
                </div>
              </div>
            </div>
          </div>
        )}
        <ToastContainer position="bottom-right" autoClose={5000} />
      </div>
    </DashboardLayout>
  );
}
