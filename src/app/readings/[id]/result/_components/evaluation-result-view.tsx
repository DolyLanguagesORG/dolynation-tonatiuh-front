"use client";

import { ResultActionsFooter } from "@/app/readings/[id]/result/_components/result-actions-footer";
import { ResultAnalysisSections } from "@/app/readings/[id]/result/_components/result-analysis-sections";
import { ResultScoreHero } from "@/app/readings/[id]/result/_components/result-score-hero";
import { useEvaluationResult } from "@/app/readings/[id]/result/_hooks/use-evaluation-result";
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

export interface EvaluationResultViewProps {
  readingId: string;
}

/**
 * Vista de Resultados y Retroalimentación de Comprensión (`/readings/[id]/result` - Figma #08).
 */
export function EvaluationResultView({
  readingId,
}: EvaluationResultViewProps) {
  const { locale, t } = useLocale();
  const result = useEvaluationResult(readingId);

  return (
    <RequireAuth>
      <Container size="lg" className="flex flex-col gap-6">
        {!result.isValidId ? (
          <EmptyState
            icon="alert-triangle"
            title={
              locale === "es"
                ? "Resultado de lectura no válido"
                : "Invalid reading result"
            }
            description={
              locale === "es"
                ? "Regresa al historial y selecciona una lectura válida."
                : "Go back to history and pick a valid reading."
            }
            actions={
              <ActionLink href="/readings" variant="primary" size="md">
                {t.readings.backToReadings}
              </ActionLink>
            }
          />
        ) : result.isLoading ? (
          <SkeletonCard
            lines={5}
            label={
              locale === "es"
                ? "Cargando resultados de evaluación"
                : "Loading evaluation results"
            }
          />
        ) : result.errorMessage || !result.reading ? (
          <Alert
            variant="error"
            title={
              locale === "es"
                ? "Error al cargar resultados"
                : "Failed to load results"
            }
          >
            {result.errorMessage ??
              (locale === "es"
                ? "No encontramos los resultados de esta lectura."
                : "Could not find evaluation results for this reading.")}
          </Alert>
        ) : !result.isEvaluated ? (
          <EmptyState
            icon="pencil"
            badge={locale === "es" ? "PENDIENTE" : "PENDING"}
            title={result.reading.title}
            description={
              locale === "es"
                ? "Esta lectura aún no cuenta con una evaluación enviada. Redacta tu resumen para recibir retroalimentación e índice de comprensión."
                : "This reading has not been evaluated yet. Submit your comprehension summary to receive AI feedback and your score."
            }
            actions={
              <>
                <ActionLink
                  href={`/readings/${result.reading.id}/evaluate`}
                  variant="primary"
                  size="md"
                >
                  {t.readings.continueEvaluationButton}
                </ActionLink>
                <ActionLink
                  href={`/readings/${result.reading.id}`}
                  variant="secondary"
                  size="md"
                >
                  {t.readings.rereadAction}
                </ActionLink>
              </>
            }
          />
        ) : (
          <>
            <PageHeader
              backHref="/readings"
              backLabel={t.readings.backToReadings}
              titleVariant="title"
              title={result.reading.title}
              subtitle={t.readings.result.subtitle}
              badges={<Badge variant="primary">{t.readings.result.completedBadge}</Badge>}
            />

            <ResultScoreHero
              t={t}
              locale={locale}
              reading={result.reading}
              score={result.score}
              passed={result.passed}
              responseWordCount={result.responseWordCount}
              responseTargetPct={result.responseTargetPct}
              matchedTermsCount={result.matchedCount}
              totalTermsCount={result.keyTerms.length}
              lexicalCoveragePct={result.lexicalCoveragePct}
            />

            <ResultAnalysisSections
              t={t}
              locale={locale}
              feedback={result.reading.feedback}
              userResponse={result.reading.userResponse}
              passed={result.passed}
              keyTerms={result.keyTerms}
            />

            <ResultActionsFooter t={t} readingId={result.reading.id} />
          </>
        )}
      </Container>
    </RequireAuth>
  );
}
