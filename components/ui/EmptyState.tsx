import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = "folder_open",
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-lowest border border-dashed border-outline rounded-xl min-h-[320px]">
      <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant mb-4">
        <span className="material-symbols-outlined text-[32px]">{icon}</span>
      </div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">{title}</h3>
      <p className="font-body-md text-body-md text-on-surface-variant max-w-md mt-1 mb-6">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" icon="add" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
