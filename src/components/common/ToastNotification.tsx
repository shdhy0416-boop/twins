import React from 'react';
import { CheckCircle2, AlertCircle, Info, X, Bookmark, Zap } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'bookmark' | 'action';
  message: string;
}

interface ToastNotificationProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({
  toasts,
  onDismiss,
}) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-sm px-4 pointer-events-none">
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 size={16} className="text-[#10B981] shrink-0" />
          ) : toast.type === 'error' ? (
            <AlertCircle size={16} className="text-red-500 shrink-0" />
          ) : toast.type === 'bookmark' ? (
            <Bookmark size={16} className="text-[#D4AF37] fill-[#D4AF37] shrink-0" />
          ) : toast.type === 'action' ? (
            <Zap size={16} className="text-[#34D399] fill-[#34D399] shrink-0" />
          ) : (
            <Info size={16} className="text-[#D4AF37] shrink-0" />
          );

        return (
          <div
            key={toast.id}
            className="
              pointer-events-auto w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl
              bg-[#1E293B]/95 text-white dark:bg-black/90 backdrop-blur-md border border-white/10
              shadow-[0_8px_24px_rgba(0,0,0,0.25)] text-xs font-bold animate-fade-in
            "
          >
            <div className="flex items-center gap-2.5">
              {icon}
              <span>{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
