import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  className,
  header,
  footer,
  children,
  ...props
}) => {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded border border-surface-border bg-surface-card shadow-2xs',
          className,
        ),
      )}
      {...props}
    >
      {header && (
        <div className="border-b border-surface-border px-4 py-2.5 bg-surface-muted/40 font-semibold text-xs text-charcoal-800">
          {header}
        </div>
      )}
      <div className="p-4">{children}</div>
      {footer && (
        <div className="border-t border-surface-border px-4 py-2.5 bg-surface-muted/30 text-xs text-charcoal-600">
          {footer}
        </div>
      )}
    </div>
  );
};
