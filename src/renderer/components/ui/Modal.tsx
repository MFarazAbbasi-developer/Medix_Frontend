import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useScrollLock } from '../../hooks/useScrollLock';

export type ModalSize =
  | 'xs'
  | 'sm'
  | 'md'
  | 'lg'
  | 'xl'
  | '2xl'
  | '3xl'
  | '4xl'
  | '5xl'
  | 'full';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: ModalSize;
  closeOnEscape?: boolean;
  closeOnClickOutside?: boolean;
  showCloseButton?: boolean;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  initialFocusRef?: React.RefObject<HTMLElement | null>;
}

const sizeClasses: Record<ModalSize, string> = {
  xs: 'max-w-xs',
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-[96vw] max-h-[96vh]',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnEscape = true,
  closeOnClickOutside = true,
  showCloseButton = true,
  className,
  bodyClassName,
  headerClassName,
  footerClassName,
  initialFocusRef,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useScrollLock(isOpen);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      if (initialFocusRef?.current) {
        initialFocusRef.current.focus();
      } else {
        modalRef.current?.focus();
      }
    }
  }, [isOpen, initialFocusRef]);

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

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-charcoal-950/60 backdrop-blur-xs select-none"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className={twMerge(
          clsx(
            'w-full flex flex-col rounded border border-surface-border bg-surface-card shadow-sm text-charcoal-800 outline-none max-h-[92vh] overflow-hidden',
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
                'flex items-center justify-between border-b border-surface-border bg-surface-muted/50 px-4 py-2.5 shrink-0',
                headerClassName,
              ),
            )}
          >
            <div className="space-y-0.5 pr-2">
              {title && (
                <h3
                  id="modal-title"
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
    ? createPortal(modalContent, document.body)
    : modalContent;
};
