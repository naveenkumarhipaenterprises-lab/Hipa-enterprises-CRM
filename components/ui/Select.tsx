import React from 'react';

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  icon?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  options,
  error,
  icon,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={selectId} className="block font-label-md text-label-md text-on-surface-variant uppercase text-[10px] tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`w-full bg-surface-bright border border-outline-variant rounded-md font-body-md text-on-surface focus:ring-1 focus:ring-primary focus:border-primary transition-colors hover:border-outline py-2 px-3 text-sm appearance-none pr-8 ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-error focus:ring-error focus:border-error' : ''} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-outline">
          <span className="material-symbols-outlined text-[18px]">expand_more</span>
        </div>
      </div>
      {error && <p className="text-xs text-error font-body-sm mt-1">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
