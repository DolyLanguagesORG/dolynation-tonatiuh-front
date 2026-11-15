import { type ReactNode } from "react";

import { ActionLink } from "@/components/ui/action-link";
import { Icon } from "@/components/ui/icon";
import { Eyebrow, Heading, Text } from "@/components/ui/typography";

export interface PageHeaderProps {
  /** Navegación superior hacia atrás (p. ej. `VOLVER A LECTURAS`). */
  backHref?: string;
  backLabel?: string;
  /** Etiqueta o miga de pan superior (`[EXPEDIENTE ACADÉMICO] / PERFIL`). */
  eyebrow?: string;
  /** Título principal de la vista (`id="main-heading"` automático). */
  title: ReactNode;
  /** Subtítulo editorial bajo el encabezado. */
  subtitle?: ReactNode;
  /** Insignias o metadata inmediatamente debajo/encima del título. */
  badges?: ReactNode;
  /** Controles o acciones alineados a la derecha en escritorio. */
  actions?: ReactNode;
  /** Escala tipográfica del título principal. */
  titleVariant?: "display" | "title" | "section";
  className?: string;
}

/**
 * Cabecera estandarizada de vista del sistema DolyNation con soporte integrado
 * de miga de pan, retorno editorial, insignia de estado y destino `#main-heading`.
 */
export function PageHeader({
  backHref,
  backLabel,
  eyebrow,
  title,
  subtitle,
  badges,
  actions,
  titleVariant = "display",
  className = "",
}: PageHeaderProps) {
  return (
    <header className={`flex flex-col gap-3 ${className}`.trim()}>
      {(backHref || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {backHref && backLabel ? (
            <ActionLink
              href={backHref}
              variant="ghost"
              size="xs"
              leftIcon={<Icon name="arrow-left" size="xs" />}
              className="-ml-2.5 text-muted hover:text-heading"
            >
              {backLabel}
            </ActionLink>
          ) : (
            <span />
          )}
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>
      )}

      {eyebrow && <Eyebrow tone="muted">{eyebrow}</Eyebrow>}

      {badges && (
        <div className="flex flex-wrap items-center gap-2">{badges}</div>
      )}

      <div className="flex flex-col gap-1.5">
        <Heading as="h1" variant={titleVariant} mainHeading>
          {title}
        </Heading>
        {subtitle && (
          <Text variant="lead" tone="muted" className="max-w-3xl">
            {subtitle}
          </Text>
        )}
      </div>
    </header>
  );
}
