"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ToastVariant = "success" | "error" | "warning" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastOptions {
  id?: string;
  variant?: ToastVariant;
  title?: string;
  message: string;
  /** Duración en milisegundos antes de cerrar automáticamente (`0` para persistente). */
  durationMs?: number;
  action?: ToastAction;
}

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  durationMs: number;
  createdAt: number;
  action?: ToastAction;
}

type ShorthandOptions = Omit<ToastOptions, "variant" | "message">;

export interface ToastContextValue {
  toasts: ToastItem[];
  showToast: (options: ToastOptions) => string;
  success: (message: string, options?: ShorthandOptions) => string;
  error: (message: string, options?: ShorthandOptions) => string;
  warning: (message: string, options?: ShorthandOptions) => string;
  info: (message: string, options?: ShorthandOptions) => string;
  dismiss: (id: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  clear: () => void;
}

const DEFAULT_DURATION_MS: Record<ToastVariant, number> = {
  success: 4500,
  info: 5000,
  warning: 6500,
  error: 7500,
};

const MAX_VISIBLE_TOASTS = 4;

const ToastContext = createContext<ToastContextValue | null>(null);

let toastSequence = 0;

function createToastId(): string {
  toastSequence += 1;
  return `toast-${Date.now()}-${toastSequence}`;
}

/**
 * Proveedor global de notificaciones toast para feedback inmediato de acciones y errores de API.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const toastsRef = useRef<ToastItem[]>([]);

  useEffect(() => {
    toastsRef.current = toasts;
  }, [toasts]);

  const clearTimer = useCallback((id: string): void => {
    const existing = timersRef.current.get(id);
    if (existing !== undefined) {
      clearTimeout(existing);
      timersRef.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: string): void => {
      clearTimer(id);
      setToasts((prev) => prev.filter((item) => item.id !== id));
    },
    [clearTimer],
  );

  const scheduleTimer = useCallback(
    (id: string, durationMs: number): void => {
      clearTimer(id);
      if (durationMs <= 0) {
        return;
      }
      const timer = setTimeout(() => {
        timersRef.current.delete(id);
        setToasts((prev) => prev.filter((item) => item.id !== id));
      }, durationMs);
      timersRef.current.set(id, timer);
    },
    [clearTimer],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, []);

  const showToast = useCallback(
    (options: ToastOptions): string => {
      const variant = options.variant ?? "info";
      const message = options.message.trim();
      const title = options.title?.trim() || undefined;
      const durationMs =
        options.durationMs !== undefined
          ? options.durationMs
          : DEFAULT_DURATION_MS[variant];

      const existingMatch = options.id
        ? toastsRef.current.find((item) => item.id === options.id)
        : toastsRef.current.find(
            (item) =>
              item.variant === variant &&
              item.message === message &&
              item.title === title,
          );

      const id = existingMatch?.id ?? options.id ?? createToastId();
      const nextItem: ToastItem = {
        id,
        variant,
        title,
        message,
        durationMs,
        createdAt: Date.now(),
        action: options.action,
      };

      setToasts((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        const next = [...filtered, nextItem];
        if (next.length > MAX_VISIBLE_TOASTS) {
          const evicted = next.slice(0, next.length - MAX_VISIBLE_TOASTS);
          for (const item of evicted) {
            clearTimer(item.id);
          }
          return next.slice(-MAX_VISIBLE_TOASTS);
        }
        return next;
      });

      scheduleTimer(id, durationMs);
      return id;
    },
    [clearTimer, scheduleTimer],
  );

  const success = useCallback(
    (message: string, options?: ShorthandOptions): string =>
      showToast({ ...options, variant: "success", message }),
    [showToast],
  );

  const error = useCallback(
    (message: string, options?: ShorthandOptions): string =>
      showToast({ ...options, variant: "error", message }),
    [showToast],
  );

  const warning = useCallback(
    (message: string, options?: ShorthandOptions): string =>
      showToast({ ...options, variant: "warning", message }),
    [showToast],
  );

  const info = useCallback(
    (message: string, options?: ShorthandOptions): string =>
      showToast({ ...options, variant: "info", message }),
    [showToast],
  );

  const pause = useCallback(
    (id: string): void => {
      clearTimer(id);
    },
    [clearTimer],
  );

  const resume = useCallback(
    (id: string): void => {
      const target = toastsRef.current.find((item) => item.id === id);
      if (target && target.durationMs > 0) {
        scheduleTimer(id, target.durationMs);
      }
    },
    [scheduleTimer],
  );

  const clear = useCallback((): void => {
    for (const timer of timersRef.current.values()) {
      clearTimeout(timer);
    }
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      showToast,
      success,
      error,
      warning,
      info,
      dismiss,
      pause,
      resume,
      clear,
    }),
    [toasts, showToast, success, error, warning, info, dismiss, pause, resume, clear],
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

const NOOP_TOAST_CONTEXT: ToastContextValue = {
  toasts: [],
  showToast: () => "noop",
  success: () => "noop",
  error: () => "noop",
  warning: () => "noop",
  info: () => "noop",
  dismiss: () => {},
  pause: () => {},
  resume: () => {},
  clear: () => {},
};

/**
 * Consume el servicio global de toasts. Devuelve un fallback seguro si se invoca en pruebas aisladas sin proveedor.
 */
export function useToast(): ToastContextValue {
  return useContext(ToastContext) ?? NOOP_TOAST_CONTEXT;
}
