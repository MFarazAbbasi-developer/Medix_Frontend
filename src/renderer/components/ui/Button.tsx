import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'sm',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50 select-none';

    const variants = {
      primary:
        'bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 shadow-xs border border-transparent',
      secondary:
        'bg-surface-card text-charcoal-800 border border-surface-border hover:bg-surface-muted active:bg-surface-muted shadow-xs',
      outline:
        'border border-surface-borderStrong text-charcoal-700 hover:bg-surface-muted active:bg-surface-muted',
      ghost:
        'text-charcoal-700 hover:bg-surface-muted active:bg-surface-muted',
      danger:
        'bg-status-error-text text-white hover:bg-red-700 active:bg-red-800 shadow-xs border border-transparent',
    };

    const sizes = {
      xs: 'h-6 px-2 text-xs rounded',
      sm: 'h-8 px-3 text-xs rounded',
      md: 'h-9 px-3.5 text-sm rounded',
      lg: 'h-10 px-4 text-sm rounded',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={twMerge(
          clsx(baseStyles, variants[variant], sizes[size], className),
        )}
        {...props}
      >
        {isLoading && (
          <span className="mr-1.5 inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
