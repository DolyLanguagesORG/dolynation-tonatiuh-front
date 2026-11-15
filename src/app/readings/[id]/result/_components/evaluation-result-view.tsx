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
import { useImmersionDocumentLanguage } from "@/i18n";

export interface EvaluationResultViewProps {
  readingId: string;
}

/**
 * Vista de Resultados y Retroalimentación de Comprensión (`/readings/[id]/result` - Figma #08).
 */
export function EvaluationResultView({
  readingId,
}: EvaluationResultViewProps) {
  const result = useEvaluationResult(readingId);

  useImmersionDocumentLanguage(result.reading?.language);

  return (
    <RequireAuth>
      <Container size="lg" className="flex flex-col gap-6">
        {!result.isValidId ? (
          <EmptyState
            icon="alert-triangle"
            title={result.flowT.readings.invalidIdTitle}
            description={result.flowT.readings.invalidIdDescription}
            actions={
              <ActionLink href="/readings" variant="primary" size="md">
                {result.flowT.readings.backToReadings}
              </ActionLink>
            }
          />
        ) : result.isLoading ? (
          <SkeletonCard
            lines={5}
            label={result.flowT.readings.result.loadingTitle}
          />
        ) : result.errorMessage || !result.reading ? (
          <Alert
            variant="error"
            title={result.flowT.readings.result.loadErrorTitle}
          >
            {result.errorMessage ?? result.flowT.readings.result.loadErrorFallback}
          </Alert>
        ) : !result.isEvaluated ? (
          <div lang={result.readingLanguage}>
            <EmptyState
              icon="pencil"
              badge={result.flowT.readings.result.pendingBadge}
              title={result.reading.title}
              description={result.flowT.readings.result.pendingDescription}
              actions={
                <>
                  <ActionLink
                    href={`/readings/${result.reading.id}/evaluate`}
                    variant="primary"
                    size="md"
                  >
                    {result.flowT.readings.result.pendingActionButton}
                  </ActionLink>
                  <ActionLink
                    href={`/readings/${result.reading.id}`}
                    variant="secondary"
                    size="md"
                  >
                    {result.flowT.readings.rereadAction}
                  </ActionLink>
                </>
              }
            />
          </div>
        ) : (
          <div lang={result.readingLanguage} className="flex flex-col gap-6">
            <PageHeader
              backHref="/readings"
              backLabel={result.flowT.readings.backToReadings}
              titleVariant="title"
              title={result.reading.title}
              subtitle={result.flowT.readings.result.subtitle}
              badges={
                <Badge variant="primary">
                  {result.flowT.readings.result.completedBadge}
                </Badge>
              }
            />

            <ResultScoreHero
              t={result.flowT}
              displayLanguage={result.readingLanguage}
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
              t={result.flowT}
              feedback={result.reading.feedback}
              userResponse={result.reading.userResponse}
              passed={result.passed}
              keyTerms={result.keyTerms}
            />

            <ResultActionsFooter t={result.flowT} readingId={result.reading.id} />
          </div>
        )}
      </Container>
    </RequireAuth>
  );
}
