interface FilterFieldProps {
  type: 'text' | 'select';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  options?: { value: string; label: string }[];
}

export function FilterField({
  type,
  value,
  onChange,
  placeholder,
  className = "",
  options = []
}: FilterFieldProps) {
  if (type === 'select') {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full border border-gray-300 rounded px-3 py-2 ${className}`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full border border-gray-300 rounded px-3 py-2 ${className}`}
      placeholder={placeholder}
    />
  );
}
