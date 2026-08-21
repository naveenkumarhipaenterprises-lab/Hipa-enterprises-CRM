import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  title,
  subtitle,
  headerAction,
  footer,
  padding = 'md',
}) => {
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  return (
    <div className={`bg-surface-container-lowest border border-outline-variant rounded-xl shadow-[0_4px_12px_rgba(51,51,51,0.04)] hover:shadow-[0_8px_16px_rgba(51,51,51,0.06)] transition-shadow overflow-hidden ${className}`}>
      {(title || headerAction) && (
        <div className="px-4 py-3 md:px-6 md:py-4 border-b border-outline-variant flex justify-between items-center bg-surface-bright">
          <div>
            {title && <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{title}</h3>}
            {subtitle && <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={paddingStyles[padding]}>{children}</div>
      {footer && (
        <div className="px-4 py-3 md:px-6 border-t border-outline-variant bg-surface-bright">{footer}</div>
      )}
    </div>
  );
};
