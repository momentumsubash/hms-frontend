
"use client";
import { getCheckouts } from "@/lib/api";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/ui/auth-provider";

export default function CheckoutsPage() {
  // Pagination state
  const [page, setPage] = useState(1);
  const limit = 10;
  const { user, loading: userLoading } = useAuth();
  const navLinks = [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Checkouts", href: "/checkouts" },
    { label: "Guests", href: "/guests" },
    { label: "Hotels", href: "/hotels", superAdminOnly: true },
    { label: "Items", href: "/items" },
    { label: "Orders", href: "/orders" },
    { label: "Rooms", href: "/rooms" },
    { label: "Users", href: "/users" },
  ];

  const [checkouts, setCheckouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    search: ""
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1, totalCount: 0 });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const params: any = { page, limit };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      const res = await getCheckouts(params);
      setCheckouts(res?.data || []);
      setPagination(res?.pagination || { page: 1, limit: 10, totalPages: 1, totalCount: 0 });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset page to 1 on filter change
  useEffect(() => { setPage(1); }, [filters]);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow mb-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex h-16 items-center space-x-6">
            <span className="font-bold text-xl text-primary">Hotel HMS</span>
            <div className="flex space-x-4">
              {(!userLoading && user) && navLinks.filter(link => !link.superAdminOnly || user.role === "super_admin").map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-gray-700 hover:text-primary font-medium px-3 py-2 rounded transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </nav>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Checkouts Management</h1>
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
        <div className="bg-white rounded-lg shadow overflow-hidden mt-6">
          <div className="overflow-x-auto">
            {checkouts.length > 0 ? (
              <>
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bill</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {checkouts.map((checkout: any) => (
                      <tr key={checkout._id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          {checkout.guest ? `${checkout.guest.firstName} ${checkout.guest.lastName}` : "-"}
                          <div className="text-xs text-gray-500">{checkout.guest?.email}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {checkout.room ? `#${checkout.room.roomNumber} (${checkout.room.type})` : "-"}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap capitalize">{checkout.status}</td>
                        <td className="px-4 py-4 whitespace-nowrap font-semibold">₹{checkout.totalBill}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-xs">{checkout.createdAt ? new Date(checkout.createdAt).toLocaleString() : ""}</td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {/* Details button removed */}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex justify-center items-center gap-2 mt-4">
                    <button
                      className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                      onClick={() => setPage(page - 1)}
                      disabled={pagination.page === 1}
                    >Prev</button>
                    {Array.from({ length: pagination.totalPages }, (_, i) => (
                      <button
                        key={i}
                        className={`px-3 py-1 rounded border ${pagination.page === i + 1 ? 'bg-blue-500 text-white' : 'bg-white'}`}
                        onClick={() => setPage(i + 1)}
                      >{i + 1}</button>
                    ))}
                    <button
                      className="px-3 py-1 rounded border bg-white disabled:opacity-50"
                      onClick={() => setPage(page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >Next</button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500">No checkouts found matching your criteria.</div>
              </div>
            )}
          </div>
        </div>
  {/* Checkout Details Modal removed */}
      </div>
    </div>
  );
}

