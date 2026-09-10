'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none" dir="ltr">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-300 ${
              toast.type === 'success'
                ? 'border-emerald-500/40 bg-[#0a0a0a]/95 text-white shadow-[0_0_25px_rgba(16,185,129,0.15)]'
                : toast.type === 'error'
                ? 'border-red-500/40 bg-[#0a0a0a]/95 text-white shadow-[0_0_25px_rgba(239,68,68,0.15)]'
                : 'border-amber-500/40 bg-[#0a0a0a]/95 text-white shadow-[0_0_25px_rgba(245,158,11,0.15)]'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />}
            {toast.type === 'error' && <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />}
            {toast.type === 'info' && <Info className="h-4 w-4 text-amber-400 shrink-0" />}
            <span className="text-xs font-sans font-medium text-white">{toast.message}</span>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="ml-2 p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition shrink-0 cursor-pointer"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
