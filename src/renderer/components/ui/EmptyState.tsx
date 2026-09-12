import React from 'react';
import { Inbox } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'No records found',
  description,
  action,
  className,
  compact = false,
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'flex flex-col items-center justify-center text-center select-none',
          compact ? 'p-4 gap-2' : 'p-8 sm:p-12 gap-3',
          className,
        ),
      )}
    >
      <div className="flex items-center justify-center text-charcoal-400">
        {icon || <Inbox className={clsx(compact ? 'h-6 w-6' : 'h-10 w-10', 'text-charcoal-300')} />}
      </div>
      <div className="space-y-1 max-w-sm">
        <h4 className={clsx('font-bold text-charcoal-700', compact ? 'text-xs' : 'text-sm')}>
          {title}
        </h4>
        {description && (
          <p className={clsx('text-charcoal-500 leading-relaxed', compact ? 'text-[11px]' : 'text-xs')}>
            {description}
          </p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
};
