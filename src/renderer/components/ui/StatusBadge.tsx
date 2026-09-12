import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  dot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  className,
  variant = 'neutral',
  dot = true,
  children,
  ...props
}) => {
  const variants = {
    success: {
      container: 'bg-status-success-bg text-status-success-text border-status-success-border',
      dot: 'bg-status-success-dot',
    },
    warning: {
      container: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
      dot: 'bg-status-warning-dot',
    },
    error: {
      container: 'bg-status-error-bg text-status-error-text border-status-error-border',
      dot: 'bg-status-error-dot',
    },
    info: {
      container: 'bg-status-info-bg text-status-info-text border-status-info-border',
      dot: 'bg-status-info-dot',
    },
    neutral: {
      container: 'bg-surface-muted text-charcoal-700 border-surface-border',
      dot: 'bg-charcoal-500',
    },
  };

  const currentVariant = variants[variant];

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border tabular-nums select-none',
          currentVariant.container,
          className,
        ),
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx('h-1.5 w-1.5 rounded-full shrink-0', currentVariant.dot)}
        />
      )}
      {children}
    </span>
  );
};
