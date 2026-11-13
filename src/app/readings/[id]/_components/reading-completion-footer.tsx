"use client";

import {
  ActionLink,
  Card,
  ChoiceChip,
  Divider,
  Eyebrow,
  Icon,
  Text,
} from "@/components/ui";
import { type Dictionary } from "@/i18n";
import { type ReadingDto } from "@/lib";

export interface ReadingCompletionFooterProps {
  t: Dictionary;
  reading: ReadingDto;
  vocabularyTerms: readonly string[];
  savedTerms: readonly string[];
  selectedWord: string | null;
  onSelectTerm: (term: string) => void;
}

/**
 * Pie interactivo de la lectura con llamado a evaluación contextual IA
 * y rejilla de vocabulario detectado (`06-detalle-de-lectura.png`).
 */
export function ReadingCompletionFooter({
  t,
  reading,
  vocabularyTerms,
  savedTerms,
  selectedWord,
  onSelectTerm,
}: ReadingCompletionFooterProps) {
  const isCompleted =
    reading.status === "completed" && typeof reading.score === "number";

  const combinedTerms = Array.from(
    new Set([...vocabularyTerms, ...savedTerms]),
  );

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

      {combinedTerms.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Eyebrow tone="muted">{t.readings.detectedVocabularyTitle}</Eyebrow>
            <Text variant="caption" tone="muted" className="font-mono">
              {combinedTerms.length} {t.readings.termsSuffix}
            </Text>
          </div>

          <div className="flex flex-wrap gap-2">
            {combinedTerms.map((term) => {
              const isSelected =
                selectedWord?.toLowerCase() === term.toLowerCase();
              const isSaved = savedTerms.some(
                (item) => item.toLowerCase() === term.toLowerCase(),
              );

              return (
                <ChoiceChip
                  key={term}
                  size="sm"
                  selected={isSelected}
                  indicator={isSaved ? "check" : "none"}
                  onClick={() => onSelectTerm(term)}
                >
                  {term}
                </ChoiceChip>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
