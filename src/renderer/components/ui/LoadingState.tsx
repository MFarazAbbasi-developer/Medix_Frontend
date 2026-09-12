import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface LoadingStateProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  minHeight?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading data...',
  className,
  size = 'md',
  minHeight = 'min-h-[140px]',
}) => {
  const spinnerSizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3',
  };

  return (
    <div
      className={twMerge(
        clsx(
          'flex flex-col items-center justify-center gap-2.5 p-6 select-none',
          minHeight,
          className,
        ),
      )}
    >
      <div
        className={clsx(
          'animate-spin rounded-full border-brand-600 border-t-transparent',
          spinnerSizes[size],
        )}
      />
      {message && (
        <span className="text-xs font-medium text-charcoal-500 animate-pulse">
          {message}
        </span>
      )}
    </div>
  );
};
