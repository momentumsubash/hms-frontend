import { useState, useCallback } from 'react';

interface UsePaginationOptions {
  onPageChange?: (page: number) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
}

export function usePagination(
  initialPage: number = 1,
  initialLimit: number = 10,
  options?: UsePaginationOptions
) {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const goToPage = useCallback((newPage: number) => {
    setPage(newPage);
    options?.onPageChange?.(newPage);
  }, [options]);

  const goToFirstPage = useCallback(() => {
    goToPage(1);
  }, [goToPage]);

  const goToLastPage = useCallback(() => {
    goToPage(totalPages);
  }, [goToPage, totalPages]);

  const goToPreviousPage = useCallback(() => {
    if (page > 1) {
      goToPage(page - 1);
    }
  }, [page, goToPage]);

  const goToNextPage = useCallback(() => {
    if (page < totalPages) {
      goToPage(page + 1);
    }
  }, [page, totalPages, goToPage]);

  const resetPagination = useCallback(() => {
    setPage(initialPage);
    setLimit(initialLimit);
  }, [initialPage, initialLimit]);

  const updatePaginationInfo = useCallback((
    total: number,
    pages: number,
    currentPage?: number
  ) => {
    setTotalCount(total);
    setTotalPages(pages);
    if (currentPage !== undefined && currentPage !== page) {
      setPage(currentPage);
    }
  }, [page]);

  return {
    page,
    limit,
    totalPages,
    totalCount,
    setPage,
    setLimit,
    setTotalPages,
    setTotalCount,
    goToPage,
    goToFirstPage,
    goToLastPage,
    goToPreviousPage,
    goToNextPage,
    resetPagination,
    updatePaginationInfo,
    canGoPrevious: page > 1,
    canGoNext: page < totalPages,
  };
}
