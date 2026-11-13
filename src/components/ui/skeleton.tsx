import { type HTMLAttributes } from "react";

import { Card } from "@/components/ui/card";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Variante de forma básica del bloque animado. */
  shape?: "line" | "box" | "circle";
}

/**
 * Marcador de carga monocromático estandarizado (`animate-pulse`) para sustituir
 * placeholders ad-hoc en rutas, guardias y tarjetas asíncronas.
 */
export function Skeleton({
  shape = "line",
  className = "",
  ...rest
}: SkeletonProps) {
  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "box"
        ? "rounded-base"
        : "rounded-xs";

  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-neutral-secondary-medium ${shapeClass} ${className}`.trim()}
      {...rest}
    />
  );
}

/**
 * Esqueleto compuesto dentro de `Card` para estados de carga de módulos o vistas.
 */
export function SkeletonCard({
  lines = 3,
  label = "Cargando contenido",
  className = "",
}: {
  lines?: number;
  label?: string;
  className?: string;
}) {
  return (
    <Card
      variant="default"
      padding="lg"
      role="status"
      aria-live="polite"
      aria-label={label}
      className={className}
    >
      <div className="flex flex-col gap-3">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-8 w-64 max-w-full" />
        {Array.from({ length: lines }, (_, index) => (
          <Skeleton
            key={index}
            className={`h-4 ${index === lines - 1 ? "w-3/4" : "w-full"}`}
          />
        ))}
      </div>
    </Card>
  );
}
