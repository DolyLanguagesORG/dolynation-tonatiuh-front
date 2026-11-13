"use client";

import {
  ActionLink,
  Badge,
  Card,
  Eyebrow,
  Heading,
  Icon,
  Text,
} from "@/components/ui";
import { type Dictionary, type Locale } from "@/i18n";

export interface QuickGenerateCardProps {
  t: Dictionary;
  locale: Locale;
}

/**
 * Panel compacto de acceso directo al configurador de generación IA desde `/`.
 */
export function QuickGenerateCard({ t, locale }: QuickGenerateCardProps) {
  return (
    <Card padding="md" as="section" className="border-default bg-surface">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <Icon name="sparkles" size="sm" className="text-heading" />
            <Eyebrow as="span" tone="heading">
              {t.home.generateSectionTitle}
            </Eyebrow>
            <Badge variant="outline">CEFR / ACTFL</Badge>
          </div>
          <Heading as="h2" variant="subsection">
            {locale === "es"
              ? "Prepara una nueva sesión de lectura adaptada con IA"
              : "Prepare a new AI-tailored reading session"}
          </Heading>
          <Text variant="small" tone="muted">
            {t.home.estimatedTime}
          </Text>
        </div>

        <ActionLink
          href="/generate"
          variant="primary"
          size="md"
          leftIcon={<Icon name="sparkles" size="sm" />}
          rightIcon={<Icon name="arrow-right" size="sm" />}
          className="shrink-0 normal-case tracking-normal"
        >
          {t.home.generateButton}
        </ActionLink>
      </div>
    </Card>
  );
}
