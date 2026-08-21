import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  helperText,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1">
      {label && (
        <label htmlFor={inputId} className="block font-label-md text-label-md text-on-surface-variant uppercase text-[10px] tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full bg-surface-bright border border-outline-variant rounded-md font-body-md text-on-surface placeholder:text-outline focus:ring-1 focus:ring-primary focus:border-primary transition-colors hover:border-outline py-2 px-3 text-sm ${
            icon ? 'pl-10' : ''
          } ${error ? 'border-error focus:ring-error focus:border-error' : ''} ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-error font-body-sm mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-on-surface-variant/70 font-body-sm mt-1">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
