"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, SlidersHorizontal } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  page?: number;
  totalPages?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  filters?: React.ReactNode;
  onClearFilters?: () => void;
  hasActiveFilters?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  page = 1,
  totalPages = 1,
  total = 0,
  onPageChange,
  filters,
  onClearFilters,
  hasActiveFilters = false,
  emptyMessage = "No data found",
}: DataTableProps<T>) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filters */}
      {filters && (
        <div className="bg-white rounded-2xl shadow-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Filters</h3>
            </div>
            {hasActiveFilters && onClearFilters && (
              <button
                onClick={onClearFilters}
                className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
          {filters}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card border border-border overflow-hidden">
        {loading && (
          <div className="px-6 py-3 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border flex items-center gap-2.5">
            <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[oklch(0.55_0.22_285/0.05)] to-[oklch(0.7_0.18_45/0.05)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr
                    key={item._id || index}
                    className="hover:bg-secondary/50 transition-colors"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`px-5 py-3.5 text-sm text-foreground/80 ${col.className || ""}`}
                      >
                        {col.render ? col.render(item) : item[col.key] ?? "-"}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-5 py-12 text-center text-muted-foreground"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-muted-foreground/40" />
                      <p>{emptyMessage}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && onPageChange && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 border-t border-border gap-3">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
              {total > 0 && (
                <span className="ml-1">({total} total)</span>
              )}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange(1)}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-1 px-2">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const start = Math.max(1, Math.min(page - 2, totalPages - 4));
                  const num = start + i;
                  if (num > totalPages) return null;
                  return (
                    <button
                      key={num}
                      onClick={() => onPageChange(num)}
                      className={`min-w-[32px] h-8 rounded-lg text-sm font-medium transition-all ${
                        page === num
                          ? "bg-gradient-brand text-white shadow-md shadow-primary/25"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {num}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPageChange(totalPages)}
                disabled={page >= totalPages}
                className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
