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
      container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-600',
    },
    warning: {
      container: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-600',
    },
    error: {
      container: 'bg-red-50 text-red-800 border-red-200',
      dot: 'bg-red-600',
    },
    info: {
      container: 'bg-blue-50 text-blue-800 border-blue-200',
      dot: 'bg-blue-600',
    },
    neutral: {
      container: 'bg-gray-100 text-gray-700 border-gray-200',
      dot: 'bg-gray-500',
    },
  };

  const currentVariant = variants[variant];

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border tabular-nums',
          currentVariant.container,
          className,
        ),
      )}
      {...props}
    >
      {dot && (
        <span
          className={clsx('h-1.5 w-1.5 rounded-full', currentVariant.dot)}
        />
      )}
      {children}
    </span>
  );
};
