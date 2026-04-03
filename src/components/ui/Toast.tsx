"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Info,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "info" | "success" | "warning" | "error";

export type ToastInput =
  | string
  | {
      title: string;
      message?: string;
      variant?: ToastVariant;
      duration?: number;
    };

type ToastItem = {
  id: string;
  title: string;
  message?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toasts: ToastItem[];
  setToast: (toast: ToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATION = 4000;
const MAX_VISIBLE_TOASTS = 5;

function createToastId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

const TOAST_STYLES: Record<
  ToastVariant,
  {
    wrapper: string;
    iconBg: string;
    iconColor: string;
    accent: string;
    iconComponent: LucideIcon;
  }
> = {
  info: {
    wrapper: "border-sky-200 bg-sky-50 text-slate-900",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-600",
    accent: "from-sky-500 to-blue-500",
    iconComponent: Info,
  },
  success: {
    wrapper: "border-emerald-200 bg-emerald-50 text-slate-900",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-600",
    accent: "from-emerald-500 to-teal-500",
    iconComponent: CheckCircle2,
  },
  warning: {
    wrapper: "border-amber-200 bg-amber-50 text-slate-900",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    accent: "from-amber-500 to-orange-500",
    iconComponent: TriangleAlert,
  },
  error: {
    wrapper: "border-red-200 bg-red-50 text-slate-900",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    accent: "from-red-500 to-rose-500",
    iconComponent: AlertCircle,
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const setToast = useCallback(
    (toast: ToastInput) => {
      const nextToast: ToastItem =
        typeof toast === "string"
          ? {
              id: createToastId(),
              title: toast,
              variant: "info",
            }
          : {
              id: createToastId(),
              title: toast.title,
              message: toast.message,
              variant: toast.variant ?? "info",
            };

      setToasts((current) => [nextToast, ...current].slice(0, MAX_VISIBLE_TOASTS));

      const duration =
        typeof toast === "string" ? DEFAULT_DURATION : toast.duration ?? DEFAULT_DURATION;
      const timer = setTimeout(() => dismissToast(nextToast.id), duration);
      timersRef.current.set(nextToast.id, timer);

      return nextToast.id;
    },
    [dismissToast],
  );

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
      timersRef.current.clear();
    };
  }, []);

  const value = useMemo(
    () => ({ toasts, setToast, dismissToast, clearToasts }),
    [toasts, setToast, dismissToast, clearToasts],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const style = TOAST_STYLES[toast.variant];
            const Icon = style.iconComponent;

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: -12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "pointer-events-auto overflow-hidden rounded-2xl border shadow-lg backdrop-blur-xl",
                  style.wrapper,
                )}
              >
                <div className={cn("h-1 w-full bg-gradient-to-r", style.accent)} />
                <div className="flex items-start gap-3 p-4">
                  <div
                    className={cn(
                      "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      style.iconBg,
                    )}
                  >
                    <Icon className={cn("h-5 w-5", style.iconColor)} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                    {toast.message ? (
                      <p className="mt-1 text-sm leading-5 text-slate-600">{toast.message}</p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-700"
                    aria-label="Dismiss toast"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }

  return context;
}