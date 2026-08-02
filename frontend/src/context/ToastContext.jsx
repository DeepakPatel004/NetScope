import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${
              item.type === 'success'
                ? 'bg-slate-900/90 border-emerald-500/30 text-emerald-300 shadow-emerald-950/40'
                : item.type === 'error'
                ? 'bg-slate-900/90 border-rose-500/30 text-rose-300 shadow-rose-950/40'
                : 'bg-slate-900/90 border-indigo-500/30 text-indigo-300 shadow-indigo-950/40'
            }`}
          >
            <div className="flex items-center gap-3">
              {item.type === 'success' && <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />}
              {item.type === 'error' && <AlertTriangle size={18} className="text-rose-400 shrink-0" />}
              {item.type === 'info' && <Info size={18} className="text-indigo-400 shrink-0" />}
              <span className="text-xs font-mono font-medium text-slate-100 leading-snug">{item.message}</span>
            </div>
            <button
              onClick={() => removeToast(item.id)}
              className="text-slate-500 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
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
