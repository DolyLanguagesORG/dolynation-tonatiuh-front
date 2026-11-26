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
import { useImmersionDocumentLanguage } from "@/i18n";
import { formatReadingLanguageBadge, getDifficultyMeta } from "@/lib";

export interface EvaluationViewProps {
  readingId: string;
}

/**
 * Vista completa de evaluación de comprensión contextual (`/readings/[id]/evaluate` - Figma #07).
 */
export function EvaluationView({ readingId }: EvaluationViewProps) {
  const evaluation = useReadingEvaluation(readingId);

  useImmersionDocumentLanguage(evaluation.reading?.language);

  return (
    <RequireAuth>
      <Container size="lg" className="flex flex-col gap-6">
        {!evaluation.isValidId ? (
          <EmptyState
            icon="alert-triangle"
            title={evaluation.flowT.readings.invalidIdTitle}
            description={evaluation.flowT.readings.invalidIdDescription}
            actions={
              <ActionLink href="/readings" variant="primary" size="md">
                {evaluation.flowT.readings.backToReadings}
              </ActionLink>
            }
          />
        ) : evaluation.isLoading ? (
          <SkeletonCard
            lines={5}
            label={evaluation.flowT.readings.eval.loadingTitle}
          />
        ) : evaluation.loadError || !evaluation.reading ? (
          <Alert
            variant="error"
            title={evaluation.flowT.readings.eval.loadErrorTitle}
          >
            {evaluation.loadError ??
              evaluation.flowT.readings.eval.loadErrorFallback}
          </Alert>
        ) : evaluation.isAlreadyEvaluated ? (
          <SkeletonCard
            lines={4}
            label={evaluation.flowT.readings.eval.alreadyEvaluatedNotice}
          />
        ) : (
          <div
            lang={evaluation.readingLanguage}
            className="flex flex-col gap-6"
          >
            <PageHeader
              backHref={`/readings/${evaluation.reading.id}`}
              backLabel={evaluation.flowT.readings.eval.backToReading}
              eyebrow={evaluation.flowT.readings.eval.eyebrow}
              titleVariant="title"
              title={evaluation.flowT.readings.eval.title}
              subtitle={`${evaluation.flowT.readings.eval.readingPrefix} ${evaluation.reading.title}`}
              badges={
                <>
                  <Badge variant="primary">
                    {formatReadingLanguageBadge(
                      evaluation.reading.language,
                      evaluation.readingLanguage,
                    )}
                  </Badge>
                  <Badge variant="outline">
                    {
                      getDifficultyMeta(
                        evaluation.reading.difficulty,
                        evaluation.readingLanguage,
                      ).label
                    }
                  </Badge>
                </>
              }
            />

            <EvaluationCriteriaCard
              t={evaluation.flowT}
              suggestedTerms={evaluation.suggestedTerms}
              onInsertTerm={evaluation.insertSuggestedTerm}
            />

            <EvaluationEditorCard
              t={evaluation.flowT}
              readingLanguage={evaluation.readingLanguage}
              responseText={evaluation.responseText}
              wordCount={evaluation.wordCount}
              charCount={evaluation.charCount}
              wordProgress={evaluation.wordProgress}
              minWords={evaluation.minWords}
              maxWords={evaluation.maxWords}
              maxChars={evaluation.maxChars}
              isOverWordLimit={evaluation.isOverWordLimit}
              isOverCharLimit={evaluation.isOverCharLimit}
              validationError={evaluation.validationError}
              submitError={evaluation.submitError}
              draftNotice={evaluation.draftNotice}
              isSubmitting={evaluation.isSubmitting}
              onChangeText={evaluation.updateResponseText}
              onSaveDraft={evaluation.saveDraftNow}
              onSubmit={evaluation.handleSubmit}
            />

            <EvaluationRubricGrid t={evaluation.flowT} />
          </div>
        )}
      </Container>
    </RequireAuth>
  );
}
