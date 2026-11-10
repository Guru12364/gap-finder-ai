'use client';

import * as React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  type?: ToastType;
  duration?: number;
}

export type ToastOptions = Omit<ToastItem, 'id'>;

interface ToastContextType {
  toasts: ToastItem[];
  toast: {
    (options: ToastOptions): string;
    success: (message: string, options?: Partial<ToastOptions>) => string;
    error: (message: string, options?: Partial<ToastOptions>) => string;
    info: (message: string, options?: Partial<ToastOptions>) => string;
    warning: (message: string, options?: Partial<ToastOptions>) => string;
  };
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const addToast = React.useCallback(
    (options: ToastOptions) => {
      const id = Math.random().toString(36).substring(2, 9);
      const duration = options.duration ?? 4500;

      const newToast: ToastItem = {
        id,
        type: options.type || 'info',
        title: options.title,
        description: options.description,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss]
  );

  const toast = React.useMemo(() => {
    const fn = (options: ToastOptions) => addToast(options);

    fn.success = (message: string, options?: Partial<ToastOptions>) =>
      addToast({
        title: message,
        type: 'success',
        ...options,
      });

    fn.error = (message: string, options?: Partial<ToastOptions>) =>
      addToast({
        title: message,
        type: 'error',
        ...options,
      });

    fn.info = (message: string, options?: Partial<ToastOptions>) =>
      addToast({
        title: message,
        type: 'info',
        ...options,
      });

    fn.warning = (message: string, options?: Partial<ToastOptions>) =>
      addToast({
        title: message,
        type: 'warning',
        ...options,
      });

    return fn;
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      {/* Toast viewport container at bottom-right */}
      <div
        aria-live="polite"
        className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full max-w-sm sm:max-w-md flex-col gap-2 p-4 pointer-events-none"
      >
        {toasts.map((item) => (
          <ToastCard key={item.id} item={item} onDismiss={() => dismiss(item.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />,
    error: <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />,
    info: <Info className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />,
  };

  const borderStyles = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    warning: 'border-amber-500/30',
    info: 'border-cyan-500/30',
  };

  const type = item.type || 'info';

  return (
    <div
      role="alert"
      className={cn(
        'pointer-events-auto flex w-full items-start gap-3 rounded-xl border bg-navy-900/95 p-4 text-white shadow-2xl backdrop-blur-xl transition-all duration-300 animate-slide-in',
        borderStyles[type]
      )}
    >
      {icons[type]}

      <div className="flex-1 space-y-1">
        {item.title && (
          <div className="text-sm font-semibold text-white leading-tight">
            {item.title}
          </div>
        )}
        {item.description && (
          <div className="text-xs text-gray-400 leading-relaxed">
            {item.description}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onDismiss}
        className="rounded-lg p-1 text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
        aria-label="Dismiss toast"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
