import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'info' | 'error' | 'neutral' | 'maroon' | 'gold';
  size?: 'sm' | 'md';
  icon?: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
}) => {
  const variantStyles = {
    success: 'bg-[#e6f4ea] text-[#137333] border border-[#ceead6]',
    warning: 'bg-secondary-fixed/30 text-on-secondary-fixed-variant border border-secondary-fixed',
    info: 'bg-blue-50 text-blue-800 border border-blue-200',
    error: 'bg-error-container text-on-error-container border border-error/20',
    neutral: 'bg-surface-container-highest text-on-surface-variant border border-outline-variant/50',
    maroon: 'bg-primary/10 text-primary border border-primary/20',
    gold: 'bg-secondary-container/20 text-on-secondary-container border border-secondary-container/40',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-label-md font-medium',
    md: 'px-2.5 py-1 text-xs font-label-md font-medium',
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {icon && <span className="material-symbols-outlined text-[14px]">{icon}</span>}
      {children}
    </span>
  );
};
