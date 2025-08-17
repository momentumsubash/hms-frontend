import { useState, useEffect, useCallback, useRef } from 'react';

interface UseFiltersOptions {
  onFilterChange: (filters: Record<string, string>) => Promise<void>;
  debounceTime?: number;
  immediateFields?: string[];
}

export function useFilters<T extends Record<string, string>>(
  initialFilters: T,
  options: UseFiltersOptions
) {
  const [filters, setFilters] = useState<T>(initialFilters);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const debounceTimer = useRef<NodeJS.Timeout | undefined>(undefined);
  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Handle filter changes with proper debouncing
  const handleFilterChange = useCallback((key: keyof T, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setIsInitialLoad(false);
  }, []);

  // Effect to handle filter updates
  useEffect(() => {
    if (isInitialLoad) {
      return;
    }

    // Clear any existing timeout
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Determine if the changed field should be immediate
    const changedField = Object.keys(filters).find(key => filters[key] !== initialFilters[key]);
    const isImmediate = changedField && options.immediateFields?.includes(changedField);

    // Set the timeout
    debounceTimer.current = setTimeout(
      async () => {
        if (isMounted.current) {
          await options.onFilterChange(filters);
        }
      },
      isImmediate ? 0 : (options.debounceTime ?? 500)
    );

  }, [filters, initialFilters, options, isInitialLoad]);

  // Function to clear all filters
  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    setIsInitialLoad(false);
  }, [initialFilters]);

  return {
    filters,
    handleFilterChange,
    clearFilters,
    isInitialLoad
  };
}
