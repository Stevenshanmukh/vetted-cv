'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  showToast: (type: ToastType, message: string | Error | unknown, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, message: string | Error | unknown, duration?: number) => {
    // Safely convert message to string, handling Event objects and other types
    let safeMessage: string;
    if (typeof message === 'string') {
      safeMessage = message;
    } else if (message instanceof Error) {
      safeMessage = message.message || 'An error occurred';
    } else if (message && typeof message === 'object' && 'type' in message && 'target' in message) {
      // It's an Event object
      safeMessage = 'An unexpected event error occurred';
    } else if (message && typeof message === 'object' && 'message' in message) {
      safeMessage = String((message as any).message) || 'An error occurred';
    } else {
      safeMessage = String(message) || 'An error occurred';
    }

    const id = Math.random().toString(36).slice(2);
    const defaultDurations: Record<ToastType, number> = {
      success: 4000,
      error: 0, // Persistent
      info: 4000,
      warning: 6000,
    };

    const toastDuration = duration ?? defaultDurations[type];
    const toast: Toast = {
      id,
      type,
      message: safeMessage,
      duration: toastDuration,
    };

    setToasts((prev) => [...prev, toast]);

    if (toastDuration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, toastDuration);
    }
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast Container Component
function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const icons: Record<ToastType, string> = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning',
  };

  const colors: Record<ToastType, string> = {
    success: 'bg-success text-white',
    error: 'bg-error text-white',
    info: 'bg-info text-white',
    warning: 'bg-warning text-white',
  };

  return (
    <div
      role="alert"
      className={cn(
        'flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg animate-slide-in',
        colors[toast.type]
      )}
    >
      <span className="material-symbols-outlined">{icons[toast.type]}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 hover:bg-white/20 rounded transition-colors"
        aria-label="Dismiss"
      >
        <span className="material-symbols-outlined text-lg">close</span>
      </button>
    </div>
  );
}

