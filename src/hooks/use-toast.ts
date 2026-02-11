import { useState, useCallback } from 'react';

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

let toastId = 0;
const listeners = new Set<(toast: Toast) => void>();

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(
    ({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
      const id = String(toastId++);
      const newToast = { id, title, description, variant };

      setToasts((prev) => [...prev, newToast]);

      // Notify all listeners
      listeners.forEach((listener) => listener(newToast));

      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);

      return id;
    },
    []
  );

  const dismiss = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  return { toast, toasts, dismiss };
}