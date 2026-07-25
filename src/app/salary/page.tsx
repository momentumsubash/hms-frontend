"use client";
import { getSalaries, generatePayroll, paySalary, updateSalary, deleteSalary } from "@/lib/hr";
import { getUsers } from "@/lib/api";
import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { DashboardLayout } from "@/components/dashboard-layout";
import { Search, X, DollarSign, CheckCircle, Clock, AlertCircle, Edit, Trash2, CreditCard, ChevronDown } from "lucide-react";

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function SalaryPage() {
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(2026);

  useEffect(() => {
    const now = new Date();
    setMonth(now.getMonth() + 1);
    setYear(now.getFullYear());
  }, []);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showPayModal, setShowPayModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSalary, setSelectedSalary] = useState<any>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [editForm, setEditForm] = useState({ allowances: "0", deductions: "0", bonus: "0", notes: "" });

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { month, year, limit: 200 };
      if (statusFilter) params.paymentStatus = statusFilter;
      const res = await getSalaries(params);
      setSalaries(res?.data || []);
      setSummary(res?.summary || {});
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSalaries(); }, [month, year, statusFilter]);

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await generatePayroll({ month, year });
      toast.success(res?.message || "Payroll generated");
      fetchSalaries();
    } catch (e: any) { toast.error(e.message); }
    finally { setGenerating(false); }
  };

  const handlePay = async () => {
    if (!selectedSalary || !payAmount) return;
    try {
      await paySalary(selectedSalary._id, { amountPaid: parseFloat(payAmount), paymentMethod: payMethod });
      toast.success("Payment recorded");
      setShowPayModal(false);
      setSelectedSalary(null);
      setPayAmount("");
      fetchSalaries();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleEditSalary = async () => {
    if (!selectedSalary) return;
    try {
      await updateSalary(selectedSalary._id, {
        allowances: parseFloat(editForm.allowances) || 0,
        deductions: parseFloat(editForm.deductions) || 0,
        bonus: parseFloat(editForm.bonus) || 0,
        notes: editForm.notes
      });
      toast.success("Salary updated");
      setShowEditModal(false);
      setSelectedSalary(null);
      fetchSalaries();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleDeleteSalary = async (id: string) => {
    if (window.confirm("Delete this salary record?")) {
      try { await deleteSalary(id); toast.success("Deleted"); fetchSalaries(); }
      catch (e: any) { toast.error(e.message); }
    }
  };

  const filtered = salaries.filter((s: any) => {
    if (!search) return true;
    const name = `${s.staff?.firstName} ${s.staff?.lastName} ${s.staff?.staffId}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const formatCurrency = (n: number) => `₹${(n || 0).toLocaleString()}`;

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 py-6 max-w-[1600px] mx-auto space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Salary Management</h1>
            <p className="text-sm text-muted-foreground">Monthly payroll and salary tracking</p>
          </div>
          <button data-cy="salary-generate-btn" onClick={handleGenerate} disabled={generating}
            className="h-9 px-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-lg hover:opacity-90 flex items-center gap-1.5 text-sm disabled:opacity-50">
            {generating ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CreditCard className="w-4 h-4" />}
            Generate Payroll
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Payroll", value: formatCurrency(summary.totalNetSalary), gradient: "from-blue-500 to-cyan-500" },
            { label: "Total Paid", value: formatCurrency(summary.totalPaid), gradient: "from-green-500 to-emerald-500" },
            { label: "Pending", value: formatCurrency(summary.totalLeft), gradient: "from-orange-500 to-amber-500" },
            { label: "Staff Count", value: summary.count || 0, gradient: "from-purple-500 to-pink-500" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-xl shadow-sm p-4">
              <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-card rounded-xl border border-border p-3">
          <div className="flex items-center gap-3 flex-wrap">
            <select data-cy="salary-month-filter" value={month} onChange={(e) => setMonth(parseInt(e.target.value))}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm">
              {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select data-cy="salary-year-filter" value={year} onChange={(e) => setYear(parseInt(e.target.value))}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm">
              {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select data-cy="salary-status-filter" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm">
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="partial">Partial</option>
              <option value="paid">Paid</option>
            </select>
            <div className="relative flex-1 min-w-[160px] max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input data-cy="salary-search" type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30" placeholder="Search staff..." />
              {search && <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground p-0.5"><X className="w-4 h-4" /></button>}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Staff</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Dept</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Base</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Allow.</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Deduct.</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Net</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">Paid</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Left</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((s: any) => (
                  <tr key={s._id} data-cy={`salary-row-${s.staff?.staffId}`} className="hover:bg-secondary/50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">{s.staff?.firstName} {s.staff?.lastName}</p>
                      <p className="text-xs text-muted-foreground">{s.staff?.staffId}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">{s.staff?.department?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right">{formatCurrency(s.baseSalary)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 hidden md:table-cell">+{formatCurrency(s.allowances)}</td>
                    <td className="px-4 py-3 text-sm text-right text-red-600 hidden md:table-cell">-{formatCurrency(s.deductions)}</td>
                    <td className="px-4 py-3 text-sm text-right font-semibold">{formatCurrency(s.netSalary)}</td>
                    <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(s.amountPaid)}</td>
                    <td className="px-4 py-3 text-sm text-right text-orange-600 hidden md:table-cell">{formatCurrency(s.amountLeft)}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium border ${
                        s.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        s.paymentStatus === 'partial' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>{s.paymentStatus}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {s.paymentStatus !== 'paid' && (
                          <button data-cy={`salary-pay-${s.staff?.staffId}`} onClick={() => { setSelectedSalary(s); setPayAmount(String(s.amountLeft)); setShowPayModal(true); }}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-green-600 hover:bg-green-50" title="Record Payment">
                            <CreditCard className="w-4 h-4" />
                          </button>
                        )}
                        <button data-cy={`salary-edit-${s.staff?.staffId}`} onClick={() => {
                          setSelectedSalary(s);
                          setEditForm({ allowances: String(s.allowances || 0), deductions: String(s.deductions || 0), bonus: String(s.bonus || 0), notes: s.notes || "" });
                          setShowEditModal(true);
                        }} className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10" title="Edit">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button data-cy={`salary-delete-${s.staff?.staffId}`} onClick={() => handleDeleteSalary(s._id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length === 0 && <div className="px-5 py-12 text-center"><p className="text-muted-foreground">No salary records for this period.</p></div>}
        </div>

        {showPayModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-lg font-bold">Record Payment</h2>
                <button onClick={() => setShowPayModal(false)} className="p-1.5 rounded-xl text-muted-foreground hover:bg-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <p className="text-sm text-muted-foreground">Paying: <strong>{selectedSalary?.staff?.firstName} {selectedSalary?.staff?.lastName}</strong></p>
                <p className="text-sm">Net Salary: <strong>{formatCurrency(selectedSalary?.netSalary)}</strong> | Remaining: <strong className="text-orange-600">{formatCurrency(selectedSalary?.amountLeft)}</strong></p>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Amount *</label>
                  <input data-cy="salary-pay-amount" type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} min="0" step="0.01"
                    className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Payment Method</label>
                  <select data-cy="salary-pay-method" value={payMethod} onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm">
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button onClick={() => setShowPayModal(false)} className="h-10 px-5 text-sm font-medium text-muted-foreground bg-secondary/50 border border-border rounded-xl hover:bg-secondary">Cancel</button>
                  <button data-cy="salary-pay-submit" onClick={handlePay} className="h-10 px-5 bg-gradient-to-r from-green-600 to-green-500 text-white font-medium rounded-xl hover:opacity-90 text-sm">Record Payment</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showEditModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md">
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-lg font-bold">Edit Salary</h2>
                <button onClick={() => setShowEditModal(false)} className="p-1.5 rounded-xl text-muted-foreground hover:bg-secondary"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Allowances</label>
                    <input type="number" value={editForm.allowances} onChange={(e) => setEditForm(prev => ({ ...prev, allowances: e.target.value }))} min="0"
                      className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5">Deductions</label>
                    <input type="number" value={editForm.deductions} onChange={(e) => setEditForm(prev => ({ ...prev, deductions: e.target.value }))} min="0"
                      className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Bonus</label>
                  <input type="number" value={editForm.bonus} onChange={(e) => setEditForm(prev => ({ ...prev, bonus: e.target.value }))} min="0"
                    className="w-full h-10 px-3.5 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">Notes</label>
                  <textarea value={editForm.notes} onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))} rows={2}
                    className="w-full px-3.5 py-2 bg-secondary/50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none" />
                </div>
                <div className="flex justify-end gap-3 pt-3 border-t border-border">
                  <button onClick={() => setShowEditModal(false)} className="h-10 px-5 text-sm font-medium text-muted-foreground bg-secondary/50 border border-border rounded-xl hover:bg-secondary">Cancel</button>
                  <button onClick={handleEditSalary} className="h-10 px-5 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium rounded-xl hover:opacity-90 text-sm">Update</button>
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
