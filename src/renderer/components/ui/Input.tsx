import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-charcoal-700"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={twMerge(
            clsx(
              'flex h-8 w-full rounded border bg-surface-card px-2.5 py-1 text-xs text-charcoal-900 placeholder:text-charcoal-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-charcoal-400 shadow-sm transition-colors',
              error
                ? 'border-red-500 focus-visible:ring-red-500'
                : 'border-surface-border hover:border-surface-borderStrong',
              className,
            ),
          )}
          {...props}
        />
        {error && <p className="text-[11px] text-red-600 font-medium">{error}</p>}
        {helperText && !error && (
          <p className="text-[11px] text-charcoal-500">{helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
