"use client";
import { getUsers } from "@/lib/api";
import { getDepartments } from "@/lib/hr";
import React, { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { Search, X, Users, Building2, DollarSign, UserX } from "lucide-react";

export default function StaffPage() {
  const [user] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  });

  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [view, setView] = useState<"grid" | "list">("list");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [staffRes, deptRes] = await Promise.all([
          getUsers({ limit: 200 }),
          getDepartments()
        ]);
        setStaff(staffRes?.data || []);
        setDepartments(deptRes?.data || []);
      } catch (e: any) {
        console.error(e);
      } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const filtered = staff.filter((s: any) => {
    const matchSearch = !search || `${s.firstName} ${s.lastName} ${s.email} ${s.staffId} ${s.designation}`.toLowerCase().includes(search.toLowerCase());
    const matchDept = !deptFilter || (s.department?._id || s.department) === deptFilter;
    return matchSearch && matchDept;
  });

  const totalMonthlyPayroll = filtered.reduce((sum: number, s: any) => sum + (s.monthlySalary || 0), 0);
  const deptCount = new Set(staff.map((s: any) => s.department?._id || s.department).filter(Boolean)).size;

  if (loading) return (
    <DashboardLayout>
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-sm text-muted-foreground">Loading staff...</span>
        </div>
      </div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Staff Directory</h1>
            <p className="text-sm text-muted-foreground">Human Resource Management</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Staff", value: staff.length, icon: Users, gradient: "from-blue-500 to-cyan-500" },
            { label: "Departments", value: deptCount, icon: Building2, gradient: "from-purple-500 to-pink-500" },
            { label: "Monthly Payroll", value: `₹${totalMonthlyPayroll.toLocaleString()}`, icon: DollarSign, gradient: "from-green-500 to-emerald-500" },
            { label: "No Login", value: staff.filter((s: any) => s.hasLoginCredentials === false).length, icon: UserX, gradient: "from-orange-500 to-amber-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input data-cy="staff-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Search staff..." />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground p-0.5">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <select data-cy="staff-dept-filter" value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm min-w-[130px]">
              <option value="">All Departments</option>
              {departments.map((d: any) => <option key={d._id} value={d._id}>{d.name}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden lg:table-cell">Designation</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Phone</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Salary</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s: any) => (
                  <tr key={s._id} data-cy={`staff-row-${s.staffId}`} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {s.firstName?.[0]}{s.lastName?.[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                          <p className="text-xs text-muted-foreground md:hidden">{s.email || 'No email'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{s.staffId || '-'}</td>
                    <td className="px-4 py-3 text-sm hidden lg:table-cell">{s.department?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{s.designation || '-'}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{s.phone || '-'}</td>
                    <td className="px-4 py-3 text-sm font-medium">₹{(s.monthlySalary || 0).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${s.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-destructive/10 text-destructive border-destructive/30'}`}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && (
            <div className="px-5 py-12 text-center">
              <p className="text-muted-foreground">No staff found.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
