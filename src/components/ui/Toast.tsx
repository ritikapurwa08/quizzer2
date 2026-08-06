"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, Info, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "info" | "warning";
}

interface ToastContextType {
  showToast: (message: string, type?: "success" | "info" | "warning") => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: string, type: "success" | "info" | "warning" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto flex items-center gap-3 p-3.5 rounded-lg border shadow-lg text-sm font-semibold transition-all transform translate-y-0 animate-in fade-in slide-in-from-bottom-5 duration-200",
              toast.type === "success" && "bg-card border-success/40 text-foreground ring-1 ring-success/20",
              toast.type === "info" && "bg-card border-primary/40 text-foreground ring-1 ring-primary/20",
              toast.type === "warning" && "bg-card border-amber-500/40 text-foreground ring-1 ring-amber-500/20"
            )}
          >
            {toast.type === "success" && <CheckCircle2 className="h-5 w-5 text-success shrink-0" />}
            {toast.type === "info" && <Info className="h-5 w-5 text-primary shrink-0" />}
            {toast.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />}
            <span className="flex-1 text-xs sm:text-sm">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted shrink-0"
            >
              <X className="h-4 w-4" />
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
    // Fallback if rendered outside provider
    return {
      showToast: (msg: string) => console.log("Toast:", msg),
    };
  }
  return context;
}
