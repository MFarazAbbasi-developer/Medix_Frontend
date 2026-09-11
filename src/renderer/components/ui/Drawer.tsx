import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useScrollLock } from '../../hooks/useScrollLock';

export type DrawerSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type DrawerPosition = 'left' | 'right';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: DrawerSize;
  position?: DrawerPosition;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
  showCloseButton?: boolean;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
}

const sizeClasses: Record<DrawerSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  full: 'max-w-full',
};

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  position = 'right',
  closeOnEscape = true,
  closeOnClickOutside = true,
  showCloseButton = true,
  className,
  bodyClassName,
  headerClassName,
  footerClassName,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);

  useScrollLock(isOpen);

  // Escape key handler
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && closeOnClickOutside) {
      onClose();
    }
  };

  const drawerContent = (
    <div
      className={twMerge(
        clsx(
          'fixed inset-0 z-50 flex bg-charcoal-950/60 backdrop-blur-xs select-none transition-opacity duration-200',
          position === 'right' ? 'justify-end' : 'justify-start',
        ),
      )}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      <div
        ref={drawerRef}
        tabIndex={-1}
        className={twMerge(
          clsx(
            'h-full w-full flex flex-col bg-surface-card shadow-2xl border-surface-border text-charcoal-800 outline-none animate-in duration-200',
            position === 'right'
              ? 'border-l slide-in-from-right'
              : 'border-r slide-in-from-left',
            sizeClasses[size],
            className,
          ),
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={twMerge(
              clsx(
                'flex items-center justify-between border-b border-surface-border bg-surface-muted/50 px-4 py-3 shrink-0',
                headerClassName,
              ),
            )}
          >
            <div className="space-y-0.5 pr-2">
              {title && (
                <h3
                  id="drawer-title"
                  className="text-xs font-bold text-charcoal-900 tracking-tight"
                >
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-[11px] text-charcoal-500 font-normal">
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                title="Close (Esc)"
                className="rounded p-1 text-charcoal-400 hover:bg-surface-muted hover:text-charcoal-700 transition-colors focus:outline-none focus:ring-1 focus:ring-brand-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          className={twMerge(
            clsx(
              'flex-1 overflow-y-auto p-4 text-xs select-text',
              bodyClassName,
            ),
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={twMerge(
              clsx(
                'flex items-center justify-end gap-2 border-t border-surface-border bg-surface-muted/30 px-4 py-2.5 shrink-0',
                footerClassName,
              ),
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(drawerContent, document.body)
    : drawerContent;
};
