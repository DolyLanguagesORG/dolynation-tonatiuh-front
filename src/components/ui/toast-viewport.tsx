"use client";

import { Icon, type IconName } from "@/components/ui/icon";
import { type ToastVariant, useToast } from "@/context/toast-context";
import { useLocale } from "@/i18n";

const VARIANT_STYLES: Record<
  ToastVariant,
  {
    container: string;
    iconName: IconName;
    iconClass: string;
    titleClass: string;
  }
> = {
  success: {
    container:
      "border-status-success/40 border-l-4 border-l-status-success bg-surface",
    iconName: "check-circle",
    iconClass: "text-status-success",
    titleClass: "text-status-success",
  },
  error: {
    container:
      "border-status-error/45 border-l-4 border-l-status-error bg-surface",
    iconName: "alert-circle",
    iconClass: "text-status-error",
    titleClass: "text-status-error",
  },
  warning: {
    container:
      "border-status-warning/45 border-l-4 border-l-status-warning bg-surface",
    iconName: "alert-triangle",
    iconClass: "text-status-warning",
    titleClass: "text-status-warning",
  },
  info: {
    container: "border-strong border-l-4 border-l-ink bg-surface",
    iconName: "info",
    iconClass: "text-heading",
    titleClass: "text-heading",
  },
};

/**
 * Contenedor flotante de notificaciones globales (`ToastProvider`).
 */
export function ToastViewport() {
  const { toasts, dismiss, pause, resume } = useToast();
  const { t } = useLocale();

  if (toasts.length === 0) {
    return null;
  }

  return (
    <section
      aria-label={t.meta.notificationsAria}
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[calc(100vw-2rem)] max-w-md flex-col gap-2.5 sm:right-6 sm:bottom-6"
    >
      {toasts.map((toast) => {
        const style = VARIANT_STYLES[toast.variant];
        return (
          <div
            key={toast.id}
            role={toast.variant === "error" ? "alert" : "status"}
            aria-live={toast.variant === "error" ? "assertive" : "polite"}
            onMouseEnter={() => pause(toast.id)}
            onMouseLeave={() => resume(toast.id)}
            onFocusCapture={() => pause(toast.id)}
            onBlurCapture={() => resume(toast.id)}
            className={`pointer-events-auto flex items-start gap-3 rounded-base border p-3.5 shadow-lg transition-all ${style.container}`}
          >
            <Icon
              name={style.iconName}
              size="md"
              className={`mt-0.5 shrink-0 ${style.iconClass}`}
            />

            <div className="min-w-0 flex-1">
              {toast.title && (
                <p
                  className={`font-mono text-[11px] font-semibold tracking-wider uppercase ${style.titleClass}`}
                >
                  {toast.title}
                </p>
              )}
              <p className="mt-0.5 text-sm leading-snug text-heading">
                {toast.message}
              </p>

              {toast.action && (
                <button
                  type="button"
                  onClick={() => {
                    toast.action?.onClick();
                    dismiss(toast.id);
                  }}
                  className="mt-2 inline-flex items-center font-mono text-[11px] font-semibold tracking-wider text-heading uppercase underline underline-offset-4 transition-opacity hover:opacity-75"
                >
                  {toast.action.label}
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label={t.meta.dismissNotificationAria}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-base text-muted transition-colors hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <Icon name="close" size="xs" />
            </button>
          </div>
        );
      })}
    </section>
  );
}
