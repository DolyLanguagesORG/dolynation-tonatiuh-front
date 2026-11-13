"use client";

import { Progress as FlowbiteProgress } from "flowbite-react";

import { dolyFlowbiteTheme } from "@/components/ui/flowbite-theme";

export interface ProgressBarProps {
  /** Valor porcentual acotado entre 0 y 100. */
  value: number;
  label?: string;
  valueLabel?: string;
  size?: "sm" | "md" | "lg";
  color?: "default" | "green" | "yellow" | "red" | "gray";
  className?: string;
}

/**
 * Barra de progreso lineal basada en `Progress` de `flowbite-react` con tema
 * monocromático editorial (objetivo diario, conteo de palabras, métricas de rúbrica).
 */
export function ProgressBar({
  value,
  label,
  valueLabel,
  size = "md",
  color = "default",
  className = "",
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      {(label || valueLabel) && (
        <div className="flex items-center justify-between gap-2 text-xs">
          {label && <span className="font-semibold text-heading">{label}</span>}
          {valueLabel && (
            <span className="font-mono font-bold text-heading tabular-nums">
              {valueLabel}
            </span>
          )}
        </div>
      )}
      <FlowbiteProgress
        progress={clamped}
        size={size}
        color={color}
        theme={dolyFlowbiteTheme.progress}
        applyTheme={{ color: "replace", size: "replace" }}
        aria-label={label ?? "Progreso"}
      />
    </div>
  );
}

export interface SegmentedMeterProps {
  /** Cantidad de segmentos activos. */
  activeCount: number;
  /** Total de segmentos a mostrar. */
  total?: number;
  /** Etiqueta de estado alineada a la derecha. */
  statusLabel?: string;
  /** Etiqueta descriptiva alineada a la izquierda. */
  caption?: string;
  /** Variante cromática cuando refleja calidad/fuerza. */
  tone?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const TONE_ACTIVE_CLASS: Record<NonNullable<SegmentedMeterProps["tone"]>, string> = {
  default: "bg-brand",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

const TONE_TEXT_CLASS: Record<NonNullable<SegmentedMeterProps["tone"]>, string> = {
  default: "text-heading",
  success: "text-fg-success",
  warning: "text-fg-warning",
  danger: "text-fg-danger",
};

/**
 * Medidor segmentado horizontal (por ejemplo indicador de fortaleza de contraseña
 * de 3 barras en el registro DolyNation).
 */
export function SegmentedMeter({
  activeCount,
  total = 3,
  statusLabel,
  caption,
  tone = "default",
  className = "",
}: SegmentedMeterProps) {
  const segments = Array.from({ length: total }, (_, index) => index < activeCount);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`.trim()}>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {segments.map((isActive, idx) => (
          <span
            key={idx}
            className={`h-1 flex-1 rounded-xxs transition-colors ${
              isActive ? TONE_ACTIVE_CLASS[tone] : "bg-neutral-secondary-medium"
            }`}
          />
        ))}
      </div>
      {(caption || statusLabel) && (
        <div className="flex items-center justify-between gap-2 text-[11px]">
          {caption && <span className="text-muted">{caption}</span>}
          {statusLabel && (
            <span
              className={`font-mono font-bold tracking-wider uppercase ${TONE_TEXT_CLASS[tone]}`}
            >
              {statusLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
