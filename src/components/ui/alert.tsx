"use client";

import { Alert as FlowbiteAlert } from "flowbite-react";
import { type HTMLAttributes, type ReactNode } from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";

export type AlertVariant = "info" | "success" | "warning" | "error";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  /**
   * Código técnico opcional (p. ej. `error.code` del backend o referencia editorial).
   */
  code?: string;
  /**
   * Bloque de cita o sugerencia destacada en recuadro interior blanco,
   * siguiendo el patrón de retroalimentación académica de los wireframes.
   */
  quote?: ReactNode;
  quoteLabel?: string;
  onDismiss?: () => void;
  dismissLabel?: string;
}

const VARIANT_TO_FLOWBITE: Record<
  AlertVariant,
  {
    color: "info" | "success" | "warning" | "failure";
    titleClass: string;
    badgeClass: string;
  }
> = {
  info: {
    color: "info",
    titleClass: "text-heading",
    badgeClass: "bg-neutral-primary-soft text-heading border-brand",
  },
  success: {
    color: "success",
    titleClass: "text-fg-success",
    badgeClass: "bg-neutral-primary-soft text-fg-success border-success-subtle",
  },
  warning: {
    color: "warning",
    titleClass: "text-fg-warning",
    badgeClass: "bg-neutral-primary-soft text-fg-warning border-warning-subtle",
  },
  error: {
    color: "failure",
    titleClass: "text-fg-danger",
    badgeClass: "bg-neutral-primary-soft text-fg-danger border-danger-subtle",
  },
};

function AlertIcon({ variant }: { variant: AlertVariant }) {
  switch (variant) {
    case "error":
    case "warning":
      return (
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      );
    case "success":
      return (
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
            clipRule="evenodd"
          />
        </svg>
      );
    default:
      return (
        <svg
          aria-hidden="true"
          className="h-4 w-4 shrink-0"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

/**
 * Componente de alerta semántica basado en `Alert` de `flowbite-react` y el recurso
 * `flowbite://components/alert`, adaptado al formato editorial de observaciones CEFR.
 *
 * La variante `info` es estrictamente blanco y negro; `success`, `warning` y `error`
 * mantienen colores semánticos dinámicos.
 */
export function Alert({
  variant = "info",
  title,
  code,
  quote,
  quoteLabel = "SUGERENCIA DE INTEGRACIÓN:",
  onDismiss,
  dismissLabel = "Cerrar alerta",
  className = "",
  children,
  ...rest
}: AlertProps) {
  const mapped = VARIANT_TO_FLOWBITE[variant];
  const isUrgent = variant === "error" || variant === "warning";

  return (
    <FlowbiteAlert
      theme={dolyFlowbiteTheme.alert}
      applyTheme={{ color: "replace" }}
      color={mapped.color}
      role={isUrgent ? "alert" : "status"}
      aria-live={isUrgent ? "assertive" : "polite"}
      className={className}
      {...rest}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          {(title || code) && (
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-bold tracking-wider uppercase ${mapped.titleClass}`}
              >
                <AlertIcon variant={variant} />
                {title && <span>{title}</span>}
              </span>
              {code && (
                <code
                  className={`rounded-base border px-1.5 py-0.5 font-mono text-[11px] ${mapped.badgeClass}`}
                >
                  {code}
                </code>
              )}
            </div>
          )}

          {children && (
            <div className="font-serif text-sm leading-relaxed text-heading">
              {children}
            </div>
          )}

          {quote && (
            <div className="mt-2 border-l-2 border-brand bg-neutral-primary-soft p-3 text-xs leading-relaxed text-heading">
              <p className="mb-1 font-sans text-[10px] font-bold tracking-wider text-body uppercase">
                {quoteLabel}
              </p>
              <div className="font-serif italic">{quote}</div>
            </div>
          )}
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="inline-flex min-h-7 min-w-7 items-center justify-center rounded-base p-1 text-body transition-colors enabled:hover:bg-neutral-primary-soft enabled:hover:text-heading"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
    </FlowbiteAlert>
  );
}
