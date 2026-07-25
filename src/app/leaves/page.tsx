"use client";
import { getLeaves, createLeave, approveLeave, rejectLeave, deleteLeave, getLeaveBalance } from "@/lib/hr";
import { getUsers } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DashboardLayout } from "@/components/dashboard-layout";
import { Search, X, Plus, CheckCircle, XCircle, Trash2, Calendar } from "lucide-react";

const LEAVE_TYPES = [
  { value: 'sick', label: 'Sick Leave' },
  { value: 'casual', label: 'Casual Leave' },
  { value: 'paid', label: 'Paid Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'other', label: 'Other' },
];

export default function LeavesPage() {
  const [user] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [leaves, setLeaves] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [formData, setFormData] = useState({ staff: "", leaveType: "sick", startDate: "", endDate: "", reason: "" });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { limit: 200 };
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.leaveType = typeFilter;
      const res = await getLeaves(params);
      setLeaves(res?.data || []);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLeaves();
    getUsers({ limit: 200 }).then(res => setStaffList(res?.data || [])).catch(() => {});
  }, [statusFilter, typeFilter]);

  const handleCreate = async () => {
    if (!formData.leaveType || !formData.startDate || !formData.endDate) {
      toast.error("Please fill all required fields"); return;
    }
    try {
      await createLeave(formData);
      toast.success("Leave request created");
      setShowModal(false);
      setFormData({ staff: "", leaveType: "sick", startDate: "", endDate: "", reason: "" });
      fetchLeaves();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleApprove = async (id: string) => {
    try { await approveLeave(id); toast.success("Leave approved"); fetchLeaves(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection (optional):");
    try { await rejectLeave(id, reason || ""); toast.success("Leave rejected"); fetchLeaves(); }
    catch (e: any) { toast.error(e.message); }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Delete this leave record?")) {
      try { await deleteLeave(id); toast.success("Deleted"); fetchLeaves(); }
      catch (e: any) { toast.error(e.message); }
    }
  };

  const getDays = (start: string, end: string) => {
    const diff = Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return Math.max(1, diff);
  };

  const filtered = leaves.filter((l: any) => {
    if (!search) return true;
    const name = `${l.staff?.firstName} ${l.staff?.lastName} ${l.staff?.staffId}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const approvedCount = leaves.filter(l => l.status === 'approved').length;

  if (loading && leaves.length === 0) return (
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
            <h1 className="text-2xl font-bold">Leave Management</h1>
            <p className="text-sm text-muted-foreground">Track and manage staff leaves</p>
          </div>
          <button data-cy="leaves-add-btn" onClick={() => setShowModal(true)}
            className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:opacity-90 flex items-center gap-1.5 text-sm">
            <Plus className="w-4 h-4" /> New Leave
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Leaves", value: leaves.length, color: "text-blue-600" },
            { label: "Pending", value: pendingCount, color: "text-yellow-600" },
            { label: "Approved", value: approvedCount, color: "text-green-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl shadow-sm p-4">
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input data-cy="leaves-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Search staff..." />
              {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground p-0.5"><X className="w-4 h-4" /></button>}
            </div>
            <select data-cy="leaves-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <select data-cy="leaves-type-filter" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm">
              <option value="">All Types</option>
              {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Dates</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Days</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((l: any) => (
                  <tr key={l._id} data-cy={`leave-row-${l.staff?.staffId}`} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{l.staff?.firstName} {l.staff?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{l.staff?.department?.name || l.staff?.staffId}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-secondary text-secondary-foreground capitalize">{l.leaveType}</span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div>{new Date(l.startDate).toLocaleDateString()}</div>
                      <div className="text-xs text-muted-foreground">to {new Date(l.endDate).toLocaleDateString()}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-center font-medium">{getDays(l.startDate, l.endDate)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                        l.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        l.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                        'bg-yellow-50 text-yellow-700 border-yellow-200'
                      }`}>{l.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell max-w-[200px] truncate">{l.reason || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {l.status === 'pending' && (user?.role === 'manager' || user?.role === 'super_admin') && (
                          <>
                            <button data-cy={`leave-approve-${l.staff?.staffId}`} onClick={() => handleApprove(l._id)} className="p-1.5 rounded-md text-green-600 hover:bg-green-50" title="Approve">
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button data-cy={`leave-reject-${l.staff?.staffId}`} onClick={() => handleReject(l._id)} className="p-1.5 rounded-md text-red-600 hover:bg-red-50" title="Reject">
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        <button data-cy={`leave-delete-${l.staff?.staffId}`} onClick={() => handleDelete(l._id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="px-5 py-12 text-center"><p className="text-muted-foreground">No leave records found.</p></div>}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-lg font-bold">New Leave Request</h2>
                <button onClick={() => setShowModal(false)} className="p-1.5 rounded-xl text-muted-foreground hover:bg-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                {(user?.role === 'manager' || user?.role === 'super_admin') && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Staff *</label>
                    <select data-cy="leave-form-staff" value={formData.staff} onChange={(e) => setFormData(prev => ({ ...prev, staff: e.target.value }))}
                      className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm">
                      <option value="">Select Staff</option>
                      {staffList.map((s: any) => <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.staffId})</option>)}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Leave Type *</label>
                  <select data-cy="leave-form-type" value={formData.leaveType} onChange={(e) => setFormData(prev => ({ ...prev, leaveType: e.target.value }))}
                    className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm">
                    {LEAVE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Start Date *</label>
                    <input data-cy="leave-form-start" type="date" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">End Date *</label>
                    <input data-cy="leave-form-end" type="date" value={formData.endDate} onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Reason</label>
                  <textarea data-cy="leave-form-reason" value={formData.reason} onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))} rows={3}
                    className="w-full px-3.5 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button onClick={() => setShowModal(false)} className="h-10 px-5 text-sm font-medium text-muted-foreground bg-secondary/50 border border-border rounded-xl hover:bg-secondary">Cancel</button>
                  <button data-cy="leave-form-submit" onClick={handleCreate} className="h-10 px-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:opacity-90 text-sm">Submit</button>
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
