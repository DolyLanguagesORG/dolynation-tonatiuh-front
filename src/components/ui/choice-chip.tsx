"use client";

import { type ButtonHTMLAttributes } from "react";

import { Icon } from "@/components/ui/icon";

export interface ChoiceChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Marca la opción como seleccionada (fondo negro editorial). */
  selected?: boolean;
  /** Código breve antepuesto al texto (p. ej. `[EN]`). */
  codePrefix?: string;
  /** Indicador semántico automático (`check`, `plus` cuando no está seleccionado, o ninguno). */
  indicator?: "check" | "plus-check" | "none";
  /** Tamaño visual compacto o regular. */
  size?: "sm" | "md";
  /** Rol de accesibilidad para grupos excluyentes (`radio`) o conmutables (`checkbox`/`button`). */
  selectionRole?: "toggle" | "radio";
}

/**
 * Pastilla interactiva estandarizada para idiomas, temáticas de estudio,
 * intereses favoritos y filtros rápidos en todo DolyNation.
 */
export function ChoiceChip({
  selected = false,
  codePrefix,
  indicator = "none",
  size = "md",
  selectionRole = "toggle",
  disabled,
  className = "",
  children,
  ...rest
}: ChoiceChipProps) {
  const sizeClass =
    size === "sm"
      ? "min-h-8 px-2.5 py-1 text-[11px] tracking-wider"
      : "min-h-9 px-3.5 py-1.5 text-xs tracking-wide";

  const surfaceClass = selected
    ? "border-brand bg-brand text-white"
    : "border-default-medium bg-neutral-primary-soft text-heading hover:border-brand hover:bg-neutral-secondary-soft";

  return (
    <button
      type="button"
      role={selectionRole === "radio" ? "radio" : undefined}
      aria-checked={selectionRole === "radio" ? selected : undefined}
      aria-pressed={selectionRole === "toggle" ? selected : undefined}
      disabled={disabled}
      className={[
        "inline-flex items-center gap-1.5 rounded-base border font-semibold uppercase transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring disabled:cursor-not-allowed disabled:opacity-45",
        sizeClass,
        surfaceClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {codePrefix && (
        <span
          className={`font-mono text-[10px] font-bold ${
            selected ? "text-white/80" : "text-body-subtle"
          }`}
        >
          {codePrefix}
        </span>
      )}
      <span>{children}</span>
      {indicator === "check" && selected && <Icon name="check" size="xs" />}
      {indicator === "plus-check" && (
        <Icon name={selected ? "check" : "plus"} size="xs" />
      )}
    </button>
  );
}
