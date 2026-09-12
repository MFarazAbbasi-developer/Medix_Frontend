import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'An error occurred',
  message = 'Failed to load information. Please try again.',
  onRetry,
  className,
  compact = false,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'flex flex-col items-center justify-center text-center select-none rounded border border-status-error-border bg-status-error-bg/60',
          compact ? 'p-3 gap-2' : 'p-6 sm:p-8 gap-3',
          className,
        ),
      )}
      role="alert"
    >
      <div className="flex items-center justify-center p-2 rounded-full bg-status-error-bg text-status-error-dot">
        <AlertTriangle className={clsx(compact ? 'h-4 w-4' : 'h-6 w-6')} />
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className={clsx('font-bold text-status-error-text', compact ? 'text-xs' : 'text-sm')}>
          {title}
        </h4>
        {message && (
          <p className={clsx('text-charcoal-700 leading-relaxed font-medium', compact ? 'text-[11px]' : 'text-xs')}>
            {message}
          </p>
        )}
      </div>
      {onRetry && (
        <Button
          type="button"
          variant="outline"
          size={compact ? 'xs' : 'sm'}
          onClick={onRetry}
          className="mt-1 gap-1.5 border-status-error-border text-status-error-text hover:bg-status-error-bg"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry</span>
        </Button>
      )}
    </div>
  );
};
