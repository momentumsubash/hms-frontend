import React from 'react';

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  loading?: boolean;
  onPageChange: (page: number) => void;
  showInput?: boolean;
  maxVisiblePages?: number;
}

export function PaginationControls({
  page,
  totalPages,
  loading = false,
  onPageChange,
  showInput = true,
  maxVisiblePages = 5
}: PaginationControlsProps) {
  const generatePaginationButtons = () => {
    const buttons = [];
    
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // First and previous buttons
    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => onPageChange(1)}
          disabled={page === 1 || loading}
        >
          «
        </button>
      );
      
      buttons.push(
        <button
          key="prev"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1 || loading}
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
            page === i
              ? 'text-white bg-blue-600 border border-blue-600'
              : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
          } disabled:opacity-50`}
          onClick={() => onPageChange(i)}
          disabled={loading}
        >
          {i}
        </button>
      );
    }
    
    // Next and last buttons
    if (endPage < totalPages) {
      buttons.push(
        <button
          key="next"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages || loading}
        >
          ›
        </button>
      );
      
      buttons.push(
        <button
          key="last"
          className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages || loading}
        >
          »
        </button>
      );
    }
    
    return buttons;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-gray-50 border-t gap-4">
      <div className="text-sm text-gray-700">
        Page {page} of {totalPages}
      </div>
      <div className="flex items-center space-x-1">
        {generatePaginationButtons()}
      </div>
      {showInput && (
        <div className="flex items-center space-x-2 text-sm">
          <span>Go to page:</span>
          <input
            type="number"
            min="1"
            max={totalPages}
            value={page}
            onChange={(e) => {
              const newPage = Math.max(1, Math.min(totalPages, parseInt(e.target.value) || 1));
              onPageChange(newPage);
            }}
            className="w-16 border border-gray-300 rounded px-2 py-1 text-center"
            disabled={loading}
          />
        </div>
      )}
    </div>
  );
}
