"use client";

import { EvaluationCriteriaCard } from "@/app/readings/[id]/evaluate/_components/evaluation-criteria-card";
import { EvaluationEditorCard } from "@/app/readings/[id]/evaluate/_components/evaluation-editor-card";
import { EvaluationRubricGrid } from "@/app/readings/[id]/evaluate/_components/evaluation-rubric-grid";
import { useReadingEvaluation } from "@/app/readings/[id]/evaluate/_hooks/use-reading-evaluation";
import { RequireAuth } from "@/components/auth";
import {
  ActionLink,
  Alert,
  Badge,
  Container,
  EmptyState,
  PageHeader,
  SkeletonCard,
} from "@/components/ui";
import { useLocale } from "@/i18n";
import { formatReadingLanguageBadge, getDifficultyMeta } from "@/lib";

export interface EvaluationViewProps {
  readingId: string;
}

/**
 * Vista completa de evaluación de comprensión contextual (`/readings/[id]/evaluate` - Figma #07).
 */
export function EvaluationView({ readingId }: EvaluationViewProps) {
  const { locale, t } = useLocale();
  const evaluation = useReadingEvaluation(readingId);

  return (
    <RequireAuth>
      <Container size="lg" className="flex flex-col gap-6">
        {!evaluation.isValidId ? (
          <EmptyState
            icon="alert-triangle"
            title={
              locale === "es"
                ? "Lectura no válida para evaluación"
                : "Invalid reading for evaluation"
            }
            description={
              locale === "es"
                ? "Regresa al historial y selecciona una lectura válida."
                : "Go back to history and select a valid reading."
            }
            actions={
              <ActionLink href="/readings" variant="primary" size="md">
                {t.readings.backToReadings}
              </ActionLink>
            }
          />
        ) : evaluation.isLoading ? (
          <SkeletonCard
            lines={5}
            label={
              locale === "es"
                ? "Preparando módulo de evaluación"
                : "Preparing evaluation module"
            }
          />
        ) : evaluation.loadError || !evaluation.reading ? (
          <Alert
            variant="error"
            title={
              locale === "es"
                ? "Error al cargar evaluación"
                : "Failed to load evaluation"
            }
          >
            {evaluation.loadError ??
              (locale === "es"
                ? "No se pudo abrir la lectura para evaluación."
                : "Could not open reading for evaluation.")}
          </Alert>
        ) : (
          <>
            <PageHeader
              backHref={`/readings/${evaluation.reading.id}`}
              backLabel={t.readings.eval.backToReading}
              eyebrow={t.readings.eval.eyebrow}
              titleVariant="title"
              title={t.readings.eval.title}
              subtitle={`${t.readings.eval.readingPrefix} ${evaluation.reading.title}`}
              badges={
                <>
                  <Badge variant="primary">
                    {formatReadingLanguageBadge(
                      evaluation.reading.language,
                      locale,
                    )}
                  </Badge>
                  <Badge variant="outline">
                    {
                      getDifficultyMeta(evaluation.reading.difficulty, locale)
                        .cefrBadge
                    }
                  </Badge>
                </>
              }
              actions={
                <Badge variant="secondary" className="font-mono">
                  {t.readings.eval.activeSessionBadge} • {evaluation.elapsedLabel}
                </Badge>
              }
            />

            <EvaluationCriteriaCard
              t={t}
              suggestedTerms={evaluation.suggestedTerms}
              onInsertTerm={evaluation.insertSuggestedTerm}
            />

            <EvaluationEditorCard
              t={t}
              locale={locale}
              responseText={evaluation.responseText}
              wordCount={evaluation.wordCount}
              charCount={evaluation.charCount}
              wordProgress={evaluation.wordProgress}
              validationError={evaluation.validationError}
              submitError={evaluation.submitError}
              draftNotice={evaluation.draftNotice}
              isSubmitting={evaluation.isSubmitting}
              onChangeText={evaluation.updateResponseText}
              onSaveDraft={evaluation.saveDraftNow}
              onSubmit={evaluation.handleSubmit}
            />

            <EvaluationRubricGrid t={t} />
          </>
        )}
      </Container>
    </RequireAuth>
  );
}
