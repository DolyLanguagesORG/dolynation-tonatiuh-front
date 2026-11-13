"use client";

import { StudyParametersForm } from "@/components/study";
import { Badge, Container, PageHeader } from "@/components/ui";
import { useLocale } from "@/i18n";

/**
 * Vista interactiva de configuración y generación de lecturas (`/generate`).
 */
export function GenerateView() {
  const { t } = useLocale();

  return (
    <Container size="lg" className="flex max-w-5xl flex-col gap-6">
      <PageHeader
        badges={<Badge variant="outline">{t.study.pageBadge}</Badge>}
        title={t.study.pageTitle}
        subtitle={t.study.pageSubtitle}
        titleVariant="title"
      />

      <StudyParametersForm variant="standalone" />
    </Container>
  );
}
