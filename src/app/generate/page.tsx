"use client";

import { StudyParametersForm } from "@/components/study";
import { Badge, Container } from "@/components/ui";
import { useLocale } from "@/i18n";

export default function GeneratePage() {
  const { t } = useLocale();

  return (
    <Container size="lg" className="flex flex-col gap-6 max-w-5xl">
      {/* Cabecera descriptiva de la pantalla de configuración */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{t.study.pageBadge}</Badge>
        </div>
        <h1
          id="main-heading"
          tabIndex={-1}
          className="font-serif text-2xl font-normal tracking-tight text-ink sm:text-3xl"
        >
          {t.study.pageTitle}
        </h1>
        <p className="max-w-3xl text-xs leading-relaxed text-muted sm:text-sm">
          {t.study.pageSubtitle}
        </p>
      </div>

      {/* Formulario interactivo de parámetros de estudio */}
      <StudyParametersForm variant="standalone" />
    </Container>
  );
}
