"use client";

import { type ButtonHTMLAttributes, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";

export interface ChoiceCardProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "title"> {
  /** Marca la tarjeta como opción seleccionada. */
  selected?: boolean;
  /** Variación visual cuando está seleccionada: contorno marcado (`outline`) o fondo negro invertido (`filled`). */
  emphasis?: "outline" | "filled";
  /** Título editorial o de nivel de opción. */
  title: ReactNode;
  /** Subtítulo técnico o badge derecho (p. ej. `[B1-B2]`, `GRATIS`, `$9/MES`). */
  meta?: ReactNode;
  /** Etiqueta breve superior opcional. */
  badge?: string;
  /** Descripción concisa o lista de características de la opción. */
  description?: ReactNode;
  /** Pie de tarjeta opcional (precio, duración o metadata extra). */
  footer?: ReactNode;
  /** Estilo de selección como tarjeta de radio o checkbox. */
  selectionRole?: "radio" | "toggle";
  /** Muestra el cuadro indicador de selección en la esquina. */
  showSelectionIndicator?: boolean;
}

/**
 * Tarjeta interactiva estandarizada para seleccionar planes de suscripción,
 * niveles de complejidad lingüística o longitudes de lectura.
 */
export function ChoiceCard({
  selected = false,
  emphasis = "outline",
  title,
  meta,
  badge,
  description,
  footer,
  selectionRole = "radio",
  showSelectionIndicator = true,
  disabled,
  className = "",
  children,
  ...rest
}: ChoiceCardProps) {
  const isFilled = selected && emphasis === "filled";

  const surfaceClass = isFilled
    ? "border-brand bg-brand text-white ring-1 ring-brand"
    : selected
      ? "border-brand bg-neutral-primary-soft text-heading ring-1 ring-brand"
      : "border-default-medium bg-neutral-primary-soft text-heading hover:border-brand hover:bg-neutral-secondary-soft";

  return (
    <button
      type="button"
      role={selectionRole === "radio" ? "radio" : undefined}
      aria-checked={selectionRole === "radio" ? selected : undefined}
      aria-pressed={selectionRole === "toggle" ? selected : undefined}
      disabled={disabled}
      className={[
        "flex w-full flex-col gap-2.5 rounded-base border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-50",
        surfaceClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          {badge && (
            <Badge
              variant={isFilled ? "outline" : selected ? "primary" : "secondary"}
              className="w-fit text-[10px]"
            >
              {badge}
            </Badge>
          )}
          <span
            className={`font-sans text-sm font-bold ${
              isFilled ? "text-white" : "text-heading"
            }`}
          >
            {title}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {meta && (
            <span
              className={`font-mono text-[11px] font-semibold uppercase ${
                isFilled ? "text-white/80" : "text-muted"
              }`}
            >
              {meta}
            </span>
          )}
          {showSelectionIndicator && (
            <span
              aria-hidden="true"
              className={[
                "inline-flex h-4 w-4 items-center justify-center rounded-xxs border transition-colors",
                isFilled
                  ? "border-white bg-white text-brand"
                  : selected
                    ? "border-brand bg-brand text-white"
                    : "border-default-medium bg-neutral-primary-soft text-transparent",
              ].join(" ")}
            >
              <Icon name="check" size="xs" strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>

      {description && (
        <div
          className={`text-xs leading-relaxed ${
            isFilled ? "text-white/90" : "text-body"
          }`}
        >
          {description}
        </div>
      )}

      {children}

      {footer && (
        <div
          className={`mt-auto border-t pt-2.5 text-xs font-medium ${
            isFilled
              ? "border-white/20 text-white/80"
              : "border-default text-muted"
          }`}
        >
          {footer}
        </div>
      )}
    </button>
  );
}
