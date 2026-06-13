"use client";

import { Search, X } from "lucide-react";
import { InputHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

interface FilterFieldProps {
  label?: string;
  error?: string;
  children: ReactNode;
}

export function FilterField({ label, error, children }: FilterFieldProps) {
  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-destructive text-xs mt-1">{error}</p>}
    </div>
  );
}

interface FilterInputProps extends InputHTMLAttributes<HTMLInputElement> {
  showSearchIcon?: boolean;
  onClear?: () => void;
}

export function FilterInput({
  showSearchIcon = true,
  onClear,
  className = "",
  value,
  onChange,
  placeholder,
  ...props
}: FilterInputProps) {
  const hasValue = typeof value === "string" && value.length > 0;

  return (
    <div className="relative">
      {showSearchIcon && (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      )}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full h-9 ${showSearchIcon ? "pl-9" : "pl-3"} pr-8 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all ${className}`}
        {...props}
      />
      {hasValue && onClear && (
        <button
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

interface FilterSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function FilterSelect({
  options,
  placeholder = "All",
  className = "",
  ...props
}: FilterSelectProps) {
  return (
    <select
      className={`w-full h-9 px-3 bg-muted/50 border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
