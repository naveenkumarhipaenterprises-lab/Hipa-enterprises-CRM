import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-label-md font-medium transition-all rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variantStyles = {
    primary: "bg-primary text-on-primary hover:bg-primary-container focus:ring-primary",
    secondary: "bg-secondary-container text-on-secondary-container hover:bg-secondary-fixed-dim focus:ring-secondary-container",
    outline: "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low focus:ring-primary",
    ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-low focus:ring-primary shadow-none",
    danger: "bg-error text-on-error hover:bg-on-error-container focus:ring-error",
  };

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-[18px]">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};
