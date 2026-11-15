"use client";

import { Container, Skeleton, SkeletonCard } from "@/components/ui";
import { useLocale } from "@/i18n";

/**
 * Vista de carga reactiva al idioma de interfaz para el límite global de App Router.
 */
export function LocalizedLoadingView() {
  const { t } = useLocale();
  const label = t.meta.loadingAcademicContent;

  return (
    <Container size="lg" className="py-6">
      <div
        role="status"
        aria-label={label}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="h-5 w-96 max-w-full" />
        </div>

        <SkeletonCard lines={3} label={label} />
      </div>
    </Container>
  );
}
