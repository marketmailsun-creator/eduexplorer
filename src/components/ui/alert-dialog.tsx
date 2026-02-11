'use client';

import * as React from 'react';
import { X } from 'lucide-react';

interface AlertDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  const [isOpen, setIsOpen] = React.useState(open ?? false);

  React.useEffect(() => {
    if (open !== undefined) {
      setIsOpen(open);
    }
  }, [open]);

  const handleOpenChange = (newOpen: boolean) => {
    setIsOpen(newOpen);
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialogContext.Provider value={{ isOpen, setIsOpen: handleOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

const AlertDialogContext = React.createContext<{
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}>({
  isOpen: false,
  setIsOpen: () => {},
});

export function AlertDialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode;
  asChild?: boolean;
}) {
  const { setIsOpen } = React.useContext(AlertDialogContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => setIsOpen(true),
    } as any);
  }

  return <button onClick={() => setIsOpen(true)}>{children}</button>;
}

export function AlertDialogContent({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = React.useContext(AlertDialogContext);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => setIsOpen(false)}
      />
      <div className="relative bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function AlertDialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2 mb-4">{children}</div>;
}

export function AlertDialogTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-lg font-semibold">{children}</h2>;
}

export function AlertDialogDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-gray-600">{children}</div>;
}

export function AlertDialogFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-end gap-3 mt-6">{children}</div>;
}

export function AlertDialogCancel({
  children,
  disabled,
}: {
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const { setIsOpen } = React.useContext(AlertDialogContext);
  return (
    <button
      onClick={() => setIsOpen(false)}
      disabled={disabled}
      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({
  children,
  onClick,
  disabled,
  className = '',
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}