import React from 'react';
import { clsx } from 'clsx';

export interface ShortcutBadgeProps {
  shortcut: string;
  label?: string;
  onClick?: () => void;
  className?: string;
  size?: 'xs' | 'sm';
  variant?: 'brand' | 'neutral' | 'dark';
}

/**
 * Standardized badge for keyboard shortcuts.
 * Visually indicates keyboard acceleration without distracting non-technical operators.
 * Optionally clickable so mouse-only users can trigger the action directly.
 */
export const ShortcutBadge: React.FC<ShortcutBadgeProps> = ({
  shortcut,
  label,
  onClick,
  className,
  size = 'xs',
  variant = 'neutral',
}) => {
  const isInteractive = Boolean(onClick);

  const variantStyles = {
    neutral: 'bg-surface-muted text-charcoal-600 border-surface-borderStrong hover:border-charcoal-400',
    brand: 'bg-brand-50 text-brand-700 border-brand-200 hover:bg-brand-100',
    dark: 'bg-charcoal-800 text-white border-charcoal-700 hover:bg-charcoal-900',
  };

  const sizeStyles = {
    xs: 'px-1.5 py-0.5 text-[9.5px]',
    sm: 'px-2 py-0.5 text-[11px]',
  };

  const badgeContent = (
    <kbd
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      title={label ? `${label} (${shortcut})` : `Shortcut: ${shortcut}`}
      aria-label={label ? `${label}, shortcut key ${shortcut}` : `Shortcut key ${shortcut}`}
      className={clsx(
        'inline-flex items-center gap-1 font-mono font-bold rounded border shadow-2xs transition-colors select-none',
        variantStyles[variant],
        sizeStyles[size],
        isInteractive && 'cursor-pointer active:scale-95',
        className,
      )}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <span>{shortcut}</span>
    </kbd>
  );

  return badgeContent;
};
