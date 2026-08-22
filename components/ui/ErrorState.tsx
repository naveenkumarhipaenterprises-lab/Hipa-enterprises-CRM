import React from 'react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Something went wrong",
  message = "Failed to load data from server. Please check your network connection and try again.",
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-error-container/20 border border-error/30 rounded-xl min-h-[280px]">
      <div className="w-14 h-14 rounded-full bg-error-container flex items-center justify-center text-on-error-container mb-3">
        <span className="material-symbols-outlined text-[28px]">error</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-error-container font-semibold">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-1 mb-6">{message}</p>
      {onRetry && (
        <Button variant="outline" icon="refresh" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
};
