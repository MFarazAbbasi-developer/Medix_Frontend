import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type ToastType = 'success' | 'warning' | 'info' | 'error';

export interface ToastOptions {
  id?: string;
  title?: string;
  duration?: number; // duration in ms, 0 means persist until dismissed
}

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  duration: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  show: (type: ToastType, message: string, options?: ToastOptions) => string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let globalToastHandler: ToastContextValue | null = null;

/**
 * Imperative toast API that can be used outside React component render trees.
 */
export const toast = {
  success: (message: string, options?: ToastOptions) =>
    globalToastHandler?.success(message, options) || '',
  error: (message: string, options?: ToastOptions) =>
    globalToastHandler?.error(message, options) || '',
  warning: (message: string, options?: ToastOptions) =>
    globalToastHandler?.warning(message, options) || '',
  info: (message: string, options?: ToastOptions) =>
    globalToastHandler?.info(message, options) || '',
  dismiss: (id: string) => globalToastHandler?.dismiss(id),
  clear: () => globalToastHandler?.clear(),
};

export interface ToastProviderProps {
  children: React.ReactNode;
  maxToasts?: number;
  position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

export const ToastProvider: React.FC<ToastProviderProps> = ({
  children,
  maxToasts = 5,
  position = 'top-right',
}) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const show = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const id = options?.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = options?.duration !== undefined ? options.duration : 4000;

      const newToast: ToastItem = {
        id,
        type,
        message,
        title: options?.title,
        duration,
      };

      setToasts((prev) => {
        const filtered = prev.filter((t) => t.id !== id);
        const updated = [newToast, ...filtered];
        return updated.slice(0, maxToasts);
      });

      return id;
    },
    [maxToasts],
  );

  const success = useCallback(
    (message: string, options?: ToastOptions) => show('success', message, options),
    [show],
  );
  const error = useCallback(
    (message: string, options?: ToastOptions) => show('error', message, options),
    [show],
  );
  const warning = useCallback(
    (message: string, options?: ToastOptions) => show('warning', message, options),
    [show],
  );
  const info = useCallback(
    (message: string, options?: ToastOptions) => show('info', message, options),
    [show],
  );

  const contextValue: ToastContextValue = {
    toasts,
    show,
    success,
    error,
    warning,
    info,
    dismiss,
    clear,
  };

  globalToastHandler = contextValue;

  const positionClasses = {
    'top-right': 'top-4 right-4 items-end',
    'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    'bottom-right': 'bottom-4 right-4 items-end',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2 items-center',
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      {typeof document !== 'undefined' &&
        createPortal(
          <div
            className={twMerge(
              clsx(
                'fixed z-[9999] flex flex-col gap-2 pointer-events-none max-w-sm w-full p-2 select-none',
                positionClasses[position],
              ),
            )}
            role="region"
            aria-label="Notifications"
          >
            {toasts.map((item) => (
              <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastCardProps {
  item: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ item, onDismiss }) => {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback(() => {
    if (item.duration > 0) {
      timerRef.current = setTimeout(() => {
        onDismiss();
      }, item.duration);
    }
  }, [item.duration, onDismiss]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    startTimer();
    return () => clearTimer();
  }, [startTimer, clearTimer]);

  const typeConfig: Record<
    ToastType,
    {
      container: string;
      icon: React.ReactNode;
      titleColor: string;
    }
  > = {
    success: {
      container: 'bg-status-success-bg border-status-success-border text-charcoal-900',
      icon: <CheckCircle2 className="h-4 w-4 text-status-success-dot shrink-0 mt-0.5" />,
      titleColor: 'text-status-success-text',
    },
    error: {
      container: 'bg-status-error-bg border-status-error-border text-charcoal-900',
      icon: <AlertCircle className="h-4 w-4 text-status-error-dot shrink-0 mt-0.5" />,
      titleColor: 'text-status-error-text',
    },
    warning: {
      container: 'bg-status-warning-bg border-status-warning-border text-charcoal-900',
      icon: <AlertTriangle className="h-4 w-4 text-status-warning-dot shrink-0 mt-0.5" />,
      titleColor: 'text-status-warning-text',
    },
    info: {
      container: 'bg-status-info-bg border-status-info-border text-charcoal-900',
      icon: <Info className="h-4 w-4 text-status-info-dot shrink-0 mt-0.5" />,
      titleColor: 'text-status-info-text',
    },
  };

  const current = typeConfig[item.type];

  return (
    <div
      onMouseEnter={clearTimer}
      onMouseLeave={startTimer}
      className={twMerge(
        clsx(
          'pointer-events-auto w-full rounded border p-3 shadow-md flex items-start justify-between gap-2.5 text-xs transition-all duration-200 animate-in fade-in slide-in-from-top-2',
          current.container,
        ),
      )}
      role="alert"
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        {current.icon}
        <div className="space-y-0.5 min-w-0 flex-1">
          {item.title && (
            <p className={clsx('font-bold text-xs', current.titleColor)}>
              {item.title}
            </p>
          )}
          <p className="text-[11px] leading-relaxed break-words font-medium">
            {item.message}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        title="Dismiss notification"
        className="rounded p-0.5 text-charcoal-400 opacity-60 hover:opacity-100 hover:text-charcoal-700 transition-opacity focus:outline-none focus:ring-1 focus:ring-brand-500 shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
