import React from 'react';

export interface LoadingStateProps {
  message?: string;
  height?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading CRM data...",
  height = "min-h-[300px]",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${height} bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm`}>
      <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
      <h4 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{message}</h4>
      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Please wait while we retrieve the latest records.</p>
    </div>
  );
};
