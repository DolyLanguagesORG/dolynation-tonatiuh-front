import { type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, type CardVariant } from "@/components/ui/card";
import { Icon, type IconName } from "@/components/ui/icon";
import { Heading, Text } from "@/components/ui/typography";

export interface EmptyStateProps {
  /** Ícono editorial opcional encima del título. */
  icon?: IconName;
  /** Etiqueta de clasificación opcional (`BECA / REQUISITO`, `SIN REGISTROS`). */
  badge?: string;
  title: ReactNode;
  description: ReactNode;
  /** Acciones primarias o secundarias (botón o `ActionLink`). */
  actions?: ReactNode;
  variant?: CardVariant;
  className?: string;
}

/**
 * Estado vacío o aviso de puerta de acceso estandarizado para mantener consistencia
 * editorial cuando faltan registros, filtros o pasos de configuración.
 */
export function EmptyState({
  icon,
  badge,
  title,
  description,
  actions,
  variant = "subtle",
  className = "",
}: EmptyStateProps) {
  return (
    <Card
      as="section"
      variant={variant}
      padding="lg"
      className={`flex flex-col items-start gap-4 border-brand/30 ${className}`.trim()}
    >
      {(icon || badge) && (
        <div className="flex flex-wrap items-center gap-2">
          {icon && (
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-base border border-default-medium bg-neutral-primary-soft text-heading">
              <Icon name={icon} size="md" />
            </span>
          )}
          {badge && <Badge variant="primary">{badge}</Badge>}
        </div>
      )}

      <div className="flex max-w-2xl flex-col gap-1.5">
        <Heading as="h2" variant="subsection">
          {title}
        </Heading>
        <Text variant="body" tone="body">
          {description}
        </Text>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div>
      )}
    </Card>
  );
}
