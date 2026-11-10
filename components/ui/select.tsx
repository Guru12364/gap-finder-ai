import * as React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options?: (SelectOption | string)[];
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  onValueChange?: (value: string) => void;
  error?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      className,
      options,
      placeholder,
      children,
      error,
      disabled,
      value,
      onChange,
      onValueChange,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e);
      onValueChange?.(e.target.value);
    };

    return (
      <div className="relative w-full">
        <select
          ref={ref}
          value={value}
          disabled={disabled}
          onChange={handleChange}
          className={cn(
            'flex h-10 w-full appearance-none rounded-lg border border-white/10 bg-navy-900/90 px-3 py-2 pr-10 text-sm text-white placeholder:text-gray-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-navy-950 text-gray-500">
              {placeholder}
            </option>
          )}
          {options
            ? options.map((option) => {
                if (typeof option === 'string') {
                  return (
                    <option
                      key={option}
                      value={option}
                      className="bg-navy-950 text-white py-1"
                    >
                      {option}
                    </option>
                  );
                }
                return (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    className="bg-navy-950 text-white py-1 disabled:text-gray-500"
                  >
                    {option.label}
                  </option>
                );
              })
            : children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
          <ChevronDown className="h-4 w-4 transition-transform duration-200" />
        </div>
      </div>
    );
  }
);
Select.displayName = 'Select';

export { Select };
