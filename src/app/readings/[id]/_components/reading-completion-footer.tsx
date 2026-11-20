"use client";

import {
  ActionLink,
  Card,
  Divider,
  Icon,
  Text,
} from "@/components/ui";
import { type ReadingFlowDictionary } from "@/i18n";
import { type ReadingDto } from "@/lib";

export interface ReadingCompletionFooterProps {
  t: ReadingFlowDictionary;
  reading: ReadingDto;
}

/**
 * Pie interactivo de la lectura con estado y accesos a evaluación y navegación
 * (`06-detalle-de-lectura.png`).
 */
export function ReadingCompletionFooter({
  t,
  reading,
}: ReadingCompletionFooterProps) {
  const isCompleted =
    reading.status === "completed" && typeof reading.score === "number";

  return (
    <div className="flex flex-col gap-6 pt-2">
      <Divider />

      <Card
        variant="subtle"
        padding="md"
        className="flex flex-wrap items-center justify-between gap-4 border-brand/25"
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-default-medium bg-neutral-primary-soft text-heading">
            <Icon
              name={isCompleted ? "check-circle" : "badge-check"}
              size="md"
            />
          </span>
          <div className="flex flex-col">
            <Text variant="small" tone="heading" className="font-semibold">
              {isCompleted
                ? t.readings.readingStatusDone
                : t.readings.readingStatusPending}
            </Text>
            {isCompleted && (
              <Text variant="caption" tone="muted" className="font-mono">
                {t.readings.result.globalIndexLabel}: {reading.score}/100
              </Text>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <ActionLink href="/generate" variant="secondary" size="sm">
            {t.readings.backToConfigButton}
          </ActionLink>

          <ActionLink
            href="/"
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="home" size="xs" />}
          >
            {t.readings.goToHomeButton}
          </ActionLink>

          <ActionLink
            href="/readings"
            variant="ghost"
            size="sm"
            leftIcon={<Icon name="book-open" size="xs" />}
          >
            {t.readings.goToReadingsButton}
          </ActionLink>

          {isCompleted ? (
            <ActionLink
              href={`/readings/${reading.id}/result`}
              variant="primary"
              size="md"
              rightIcon={<Icon name="arrow-right" size="sm" />}
            >
              {t.home.feedbackButton}
            </ActionLink>
          ) : (
            <ActionLink
              href={`/readings/${reading.id}/evaluate`}
              variant="primary"
              size="md"
              rightIcon={<Icon name="arrow-right" size="sm" />}
            >
              {t.readings.continueEvaluationButton}
            </ActionLink>
          )}
        </div>
      </Card>
    </div>
  );
}
