import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ComponentType<{ className?: string }>;
  status?: 'neutral' | 'success' | 'warning' | 'error' | 'brand' | 'info';
  badge?: React.ReactNode;
  badgeVariant?: 'neutral' | 'success' | 'warning' | 'error' | 'brand' | 'info';
  footer?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  status = 'neutral',
  badge,
  badgeVariant = 'neutral',
  footer,
  onClick,
  className,
}) => {
  const statusIconBg: Record<string, string> = {
    neutral: 'bg-surface-muted text-charcoal-600',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    error: 'bg-red-50 text-red-700',
    brand: 'bg-brand-50 text-brand-700',
    info: 'bg-blue-50 text-blue-700',
  };

  const badgeStyles: Record<string, string> = {
    neutral: 'bg-surface-muted text-charcoal-700 border-surface-border',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    brand: 'bg-brand-50 text-brand-800 border-brand-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
  };

  return (
    <div
      onClick={onClick}
      className={twMerge(
        clsx(
          'rounded border border-surface-border bg-surface-card p-3 shadow-xs transition-colors',
          onClick && 'cursor-pointer hover:border-surface-borderStrong hover:bg-surface-muted/30',
          className,
        ),
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500 truncate">
            {title}
          </p>
          <div className="text-base font-bold text-charcoal-900 tabular-nums font-mono">
            {value}
          </div>
          {subtitle && (
            <p className="text-[11px] text-charcoal-500 truncate font-normal">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {Icon && (
            <div
              className={clsx(
                'flex h-7 w-7 items-center justify-center rounded p-1.5 border border-transparent',
                statusIconBg[status],
              )}
            >
              <Icon className="h-4 w-4" />
            </div>
          )}

          {badge && (
            <span
              className={clsx(
                'px-1.5 py-0.2 rounded text-[10px] font-bold border tabular-nums',
                badgeStyles[badgeVariant],
              )}
            >
              {badge}
            </span>
          )}
        </div>
      </div>

      {footer && (
        <div className="mt-2.5 pt-2 border-t border-surface-border text-[11px] text-charcoal-500">
          {footer}
        </div>
      )}
    </div>
  );
};
