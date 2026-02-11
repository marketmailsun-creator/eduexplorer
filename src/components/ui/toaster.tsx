'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

const toasts: Toast[] = [];
const listeners = new Set<(toasts: Toast[]) => void>();

function addToast(toast: Omit<Toast, 'id'>) {
  const id = Math.random().toString(36).substr(2, 9);
  const newToast = { ...toast, id };
  toasts.push(newToast);
  listeners.forEach((listener) => listener([...toasts]));

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    removeToast(id);
  }, 5000);
}

function removeToast(id: string) {
  const index = toasts.findIndex((t) => t.id === id);
  if (index !== -1) {
    toasts.splice(index, 1);
    listeners.forEach((listener) => listener([...toasts]));
  }
}

export function Toaster() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setCurrentToasts);
    return () => {
      listeners.delete(setCurrentToasts);
    };
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
      {currentToasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-lg shadow-lg p-4 flex items-start gap-3 animate-in slide-in-from-bottom-2 ${
            toast.variant === 'destructive'
              ? 'bg-red-500 text-white'
              : 'bg-white border border-gray-200'
          }`}
        >
          <div className="flex-1">
            {toast.title && (
              <p className="font-semibold text-sm mb-1">{toast.title}</p>
            )}
            {toast.description && (
              <p
                className={`text-sm ${
                  toast.variant === 'destructive'
                    ? 'text-white/90'
                    : 'text-gray-600'
                }`}
              >
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className={`p-1 rounded hover:bg-black/10 ${
              toast.variant === 'destructive' ? 'text-white' : 'text-gray-500'
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// Export the toast function
export const toast = addToast;