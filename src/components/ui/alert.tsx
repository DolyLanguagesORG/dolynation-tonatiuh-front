"use client";

import { Alert as FlowbiteAlert } from "flowbite-react";
import { type HTMLAttributes, type ReactNode } from "react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";
import { Icon, type IconName } from "@/components/ui/icon";
import { IconButton } from "@/components/ui/icon-button";

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

const VARIANT_ICON: Record<AlertVariant, IconName> = {
  info: "info",
  success: "check-circle",
  warning: "alert-triangle",
  error: "alert-circle",
};

function AlertIcon({ variant }: { variant: AlertVariant }) {
  return <Icon name={VARIANT_ICON[variant]} size="md" />;
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
          <IconButton
            icon="close"
            size="xs"
            variant="ghost"
            onClick={onDismiss}
            aria-label={dismissLabel}
            className="text-body enabled:hover:bg-neutral-primary-soft enabled:hover:text-heading"
          />
        )}
      </div>
    </FlowbiteAlert>
  );
}
