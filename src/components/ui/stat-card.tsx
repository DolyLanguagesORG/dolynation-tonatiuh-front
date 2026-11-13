import { type ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Eyebrow, Text } from "@/components/ui/typography";

export interface StatCardProps {
  /** Rótulo superior en mayúsculas (p. ej. `LECTURAS TOTALES`, `COBERTURA`). */
  label: string;
  /** Valor numérico o principal destacado. */
  value: ReactNode;
  /** Unidad o sufijo junto al valor (`textos`, `horas`, `/ 100`). */
  unit?: string;
  /** Título o explicación secundaria opcional dentro de la tarjeta. */
  subtitle?: ReactNode;
  /** Descripción breve bajo el valor. */
  description?: ReactNode;
  /** Porcentaje opcional para mostrar barra de progreso superior (Figma #08). */
  progress?: number;
  /** Valor textual alineado a la derecha del rótulo superior (p. ej. `95%`). */
  topMeta?: ReactNode;
  /** Pie informativo con ícono opcional. */
  footer?: ReactNode;
  footerIcon?: IconName;
  /** Modo sin borde exterior para filas integradas dentro de otro `Card` (Figma #04). */
  variant?: "card" | "inline";
  className?: string;
}

/**
 * Bloque estandarizado de indicador clave (KPI) para racha, perfil de estudiante
 * y desglose de métricas de evaluación.
 */
export function StatCard({
  label,
  value,
  unit,
  subtitle,
  description,
  progress,
  topMeta,
  footer,
  footerIcon,
  variant = "card",
  className = "",
}: StatCardProps) {
  const body = (
    <div className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <Eyebrow tone="muted" className="text-[10px]">
          {label}
        </Eyebrow>
        {topMeta && (
          <span className="font-mono text-xs font-bold text-heading tabular-nums">
            {topMeta}
          </span>
        )}
      </div>

      {typeof progress === "number" && (
        <ProgressBar value={progress} size="sm" />
      )}

      <div className="flex items-baseline gap-1.5">
        <span className="font-sans text-2xl font-bold tracking-tight text-heading tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-muted">{unit}</span>
        )}
      </div>

      {subtitle && (
        <p className="font-sans text-sm font-bold text-heading">{subtitle}</p>
      )}

      {description && (
        <Text variant="small" tone="body" className="flex-1">
          {description}
        </Text>
      )}

      {footer && (
        <div className="mt-auto flex items-center gap-1.5 border-t border-default pt-2.5 text-[11px] font-medium text-muted">
          {footerIcon && <Icon name={footerIcon} size="xs" />}
          <span>{footer}</span>
        </div>
      )}
    </div>
  );

  if (variant === "inline") {
    return <div className={className}>{body}</div>;
  }

  return (
    <Card padding="sm" className={`h-full ${className}`.trim()}>
      {body}
    </Card>
  );
}
